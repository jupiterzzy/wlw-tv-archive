import fs from "node:fs";
import vm from "node:vm";

const apiKey = process.env.TMDB_API_KEY;
if (!apiKey) throw new Error("TMDB_API_KEY is missing. Add it as a GitHub Actions repository secret.");

const root = new URL("./", import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(read("catalog-data.js"), context);
vm.runInContext(read("movie-metadata.js"), context);
vm.runInContext(read("others-data.js"), context);

const catalog = context.window.WLW_CATALOG || {};
const metadata = context.window.WLW_MOVIE_METADATA || {};
const shows = [...Object.values(catalog).flatMap(group => group.movies || []), ...(context.window.WLW_OTHERS || [])]
  .filter((show, index, list) => list.findIndex(item => item.title === show.title) === index)
  .sort((a, b) => sortable(a.title).localeCompare(sortable(b.title), "en"));

function sortable(title) { return title.replace(/^the\s+/i, "").trim(); }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function tmdb(path, parameters = {}, allowNotFound = false) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", apiKey);
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (response.status === 404 && allowNotFound) return null;
    if (response.status === 429 && attempt < 3) { await delay((attempt + 1) * 1000); continue; }
    if (!response.ok) throw new Error(`TMDB ${response.status} for ${path}: ${(await response.text()).slice(0, 240)}`);
    return response.json();
  }
  throw new Error(`TMDB rate limit persisted for ${path}`);
}

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function firstYear(record) { return Number.parseInt(String(record.first_air_date || "").slice(0, 4), 10) || 0; }

async function resolveShow(show) {
  const knownId = metadata[show.title]?.tmdbId;
  if (knownId) {
    const known = await tmdb(`/tv/${knownId}`, { language: "en-US", append_to_response: "aggregate_credits" }, true);
    if (known) return known;
  }
  const aliases = metadata[show.title]?.aliases || [];
  const candidates = new Map();
  for (const query of [show.title, ...aliases]) {
    const response = await tmdb("/search/tv", {
      query, language: "en-US", include_adult: false, first_air_date_year: show.year
    });
    (response.results || []).forEach(candidate => candidates.set(candidate.id, candidate));
  }
  const wanted = normalize(show.title);
  const winner = [...candidates.values()].map(candidate => {
    const names = [candidate.name, candidate.original_name].map(normalize);
    let score = names.includes(wanted) ? 100 : names.some(name => name.includes(wanted) || wanted.includes(name)) ? 45 : 0;
    if (firstYear(candidate) === Number(show.year)) score += 40;
    score += Math.min(Number(candidate.popularity || 0), 20) / 20;
    return { candidate, score };
  }).sort((a, b) => b.score - a.score)[0];
  if (!winner || winner.score < 60) throw new Error(`No confident TV match for ${show.title} (${show.year})`);
  return tmdb(`/tv/${winner.candidate.id}`, { language: "en-US", append_to_response: "aggregate_credits" });
}

function castPerson(person) {
  return {
    id: person.id,
    name: person.name,
    character: (person.roles || []).map(role => role.character).filter(Boolean).join(" / "),
    order: person.order ?? 9999,
    profilePath: person.profile_path || ""
  };
}

function selectedCrew(details) {
  const important = new Set(["Creator", "Showrunner", "Executive Producer", "Director", "Writer", "Screenplay", "Teleplay", "Story"]);
  const people = [];
  const add = person => {
    const jobs = person.jobs || [person.job].filter(Boolean);
    const existing = people.find(item => String(item.id) === String(person.id));
    if (existing) {
      jobs.forEach(job => { if (job && !existing.jobs.includes(job)) existing.jobs.push(job); });
      return;
    }
    people.push({ id: person.id, name: person.name, profilePath: person.profile_path || "", jobs: jobs.filter(Boolean) });
  };
  (details.created_by || []).forEach(person => add({ ...person, job: "Creator" }));
  (details.aggregate_credits?.crew || []).forEach(person => {
    const jobs = (person.jobs || []).map(job => job.job).filter(job => important.has(job));
    if (jobs.length) add({ ...person, jobs });
  });
  return people;
}

async function seasonRecord(seriesId, season) {
  const detail = await tmdb(`/tv/${seriesId}/season/${season.season_number}`, { language: "en-US" }, true);
  return {
    id: season.id,
    name: season.name,
    seasonNumber: season.season_number,
    airDate: season.air_date || "",
    episodeCount: season.episode_count || detail?.episodes?.length || 0,
    overview: season.overview || detail?.overview || "",
    posterPath: season.poster_path || detail?.poster_path || "",
    episodes: (detail?.episodes || []).map(episode => ({
      id: episode.id,
      episodeNumber: episode.episode_number,
      name: episode.name,
      airDate: episode.air_date || "",
      runtime: episode.runtime || null,
      overview: episode.overview || "",
      stillPath: episode.still_path || ""
    }))
  };
}

async function serialize(show, details) {
  const cast = [...(details.aggregate_credits?.cast || [])].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  const seasons = [];
  for (const season of details.seasons || []) {
    if (season.season_number === 0) continue;
    seasons.push(await seasonRecord(details.id, season));
    await delay(80);
  }
  return {
    tmdbId: details.id,
    mediaType: "tv",
    matchedTitle: details.name || show.title,
    firstAirDate: details.first_air_date || "",
    lastAirDate: details.last_air_date || "",
    status: details.status || "",
    numberOfSeasons: details.number_of_seasons || seasons.length,
    numberOfEpisodes: details.number_of_episodes || seasons.reduce((sum, season) => sum + season.episodeCount, 0),
    genres: (details.genres || []).map(genre => genre.name),
    networks: (details.networks || []).map(network => ({
      id: network.id, name: network.name, logoPath: network.logo_path || "", originCountry: network.origin_country || ""
    })),
    overview: details.overview || "",
    originalLanguage: details.original_language || "",
    originCountries: details.origin_country || [],
    posterPath: details.poster_path || "",
    backdropPath: details.backdrop_path || "",
    seasons,
    cast: cast.map(castPerson),
    femaleCast: cast.filter(person => person.gender === 1).map(castPerson),
    unclassifiedCast: cast.filter(person => person.gender === 0 || person.gender == null).map(castPerson),
    crew: selectedCrew(details),
    tmdbUrl: `https://www.themoviedb.org/tv/${details.id}`,
    fetchedAt: new Date().toISOString()
  };
}

const byTitle = {};
const byId = {};
const review = {};
for (const [index, show] of shows.entries()) {
  process.stdout.write(`[${index + 1}/${shows.length}] ${show.title}\n`);
  const details = await resolveShow(show);
  const record = await serialize(show, details);
  byTitle[show.title] = record;
  byId[String(record.tmdbId)] = record;
  if (record.unclassifiedCast.length) review[show.title] = { tmdbId: record.tmdbId, candidates: record.unclassifiedCast };
  await delay(100);
}

const banner = "// Generated from TMDB TV endpoints. Do not edit this file by hand.\n";
fs.writeFileSync(new URL("tmdb-details.generated.js", root),
  `${banner}window.WLW_TMDB_DETAILS = ${JSON.stringify(byTitle, null, 2)};\nwindow.WLW_TMDB_DETAILS_BY_ID = ${JSON.stringify(byId, null, 2)};\n`);
fs.writeFileSync(new URL("tmdb-cast-review.json", root), `${JSON.stringify({ generatedAt: new Date().toISOString(), titles: review }, null, 2)}\n`);
console.log(`Generated TV details for ${shows.length} series.`);
