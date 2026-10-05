(function () {
  const requestedTitle = new URLSearchParams(location.search).get("title") || "";
  const catalog = Object.values(window.WLW_CATALOG || {}).flatMap(group =>
    (group.movies || []).map(series => ({ ...series, catalogGroup: group.title, catalogType: group.type }))
  );
  (window.WLW_OTHERS || []).forEach(series => {
    catalog.push({ ...series, catalogGroup: "Others", catalogType: "others" });
  });
  const series = catalog.find(item => item.title === requestedTitle);
  const loading = document.querySelector("#detail-loading");
  const article = document.querySelector("#detail-article");
  const error = document.querySelector("#detail-error");
  const errorMessage = document.querySelector("#detail-error-message");

  function showError(message) {
    loading.hidden = true;
    article.hidden = true;
    errorMessage.textContent = message;
    error.hidden = false;
  }

  if (!series) {
    showError("没有找到这部电视剧。请从电视剧列表重新进入详情页。");
    return;
  }

  const metadata = window.getWLWMetadata(series.title);
  const details = window.getWLWDetails(series.title);
  document.title = `${series.title} · WLW TV Archive`;

  const poster = document.querySelector("#detail-poster");
  poster.src = window.getWLWPoster(series);
  poster.alt = `${series.title} 电视剧海报`;
  poster.addEventListener("error", () => { poster.src = window.getWLWPlaceholderPoster(series.title); }, { once: true });
  document.querySelector("#detail-title").textContent = series.title;
  document.querySelector("#detail-years").textContent = window.getWLWRunningYears(series);

  const back = document.querySelector(".detail-back");
  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === location.origin) {
        back.addEventListener("click", event => { event.preventDefault(); history.back(); });
      }
    } catch {}
  }

  const genres = window.getFullWLWGenres(series.title);
  const networks = window.getWLWNetworks(series.title);
  const meta = document.querySelector("#detail-meta");
  if (networks.length) {
    const network = document.createElement("span");
    network.className = "detail-network";
    network.textContent = networks.join(" / ");
    meta.appendChild(network);
  }
  if (genres.length) {
    const genre = document.createElement("span");
    genre.className = "detail-genres";
    genre.textContent = genres.join(" • ");
    meta.appendChild(genre);
  }

  const synopsis = document.querySelector("#synopsis");
  const english = document.createElement("p");
  english.className = "synopsis-en";
  english.lang = "en";
  english.textContent = details.overview || "No English synopsis is currently available from TMDB.";
  synopsis.appendChild(english);
  const translation = (window.WLW_SYNOPSIS_TRANSLATIONS || {})[String(details.tmdbId)] ||
    (window.WLW_SYNOPSIS_TRANSLATIONS || {})[series.title];
  if (details.originalLanguage === "en" && translation) {
    const chinese = document.createElement("p");
    chinese.className = "synopsis-zh";
    chinese.lang = "zh-CN";
    chinese.textContent = translation;
    synopsis.appendChild(chinese);
  }

  function renderResources() {
    const section = document.querySelector("#resource-information");
    const list = document.querySelector("#resource-list");
    const resources = (window.WLW_MOVIE_RESOURCES || {})[series.title];
    const baidu = resources?.baidu;
    const item = document.createElement("div");
    item.className = "resource-item";
    const info = document.createElement("div");
    info.className = "resource-info";
    const provider = document.createElement("span");
    provider.className = "resource-provider";
    provider.textContent = baidu?.url ? "百度网盘" : "资源待添加";
    const code = document.createElement("span");
    code.className = "resource-code";
    code.textContent = `提取码：${baidu?.code || "yuri"}`;
    info.append(provider, code);
    item.appendChild(info);
    if (baidu?.url) {
      const link = document.createElement("a");
      link.className = "resource-link";
      link.href = baidu.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "获取资源";
      item.appendChild(link);
    }
    list.appendChild(item);
    section.hidden = false;
  }

  function formatDate(value) {
    if (!value) return "TBA";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.valueOf())
      ? value
      : new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(date);
  }

  function renderSeasons() {
    const list = document.querySelector("#season-list");
    const seasons = (details.seasons || []).filter(season => Number(season.seasonNumber) > 0);
    if (!seasons.length) {
      list.innerHTML = '<p class="tab-empty">Season information will appear after the TMDB workflow runs.</p>';
      return;
    }
    seasons.forEach(season => {
      const card = document.createElement("article");
      card.className = "season-card";
      const image = document.createElement("img");
      image.className = "season-poster";
      image.src = season.posterPath
        ? `https://image.tmdb.org/t/p/w300${season.posterPath}`
        : window.getWLWPlaceholderPoster(`${series.title} ${season.name}`);
      image.alt = `${season.name} poster`;
      image.loading = "lazy";
      const copy = document.createElement("div");
      copy.className = "season-copy";
      const heading = document.createElement("button");
      heading.className = "season-toggle";
      heading.type = "button";
      heading.setAttribute("aria-expanded", "false");
      heading.textContent = season.name || `Season ${season.seasonNumber}`;
      const info = document.createElement("p");
      info.textContent = `${formatDate(season.airDate)} • ${season.episodeCount || 0} episodes`;
      copy.append(heading, info);
      card.append(image, copy);

      const episodes = document.createElement("div");
      episodes.className = "episode-list";
      episodes.hidden = true;
      (season.episodes || []).forEach(episode => {
        const row = document.createElement("div");
        row.className = "episode-row";
        row.innerHTML = `<span>${episode.episodeNumber}</span><strong>${episode.name || "Untitled"}</strong><small>${formatDate(episode.airDate)}</small>`;
        episodes.appendChild(row);
      });
      if ((season.episodes || []).length) {
        heading.addEventListener("click", () => {
          const open = heading.getAttribute("aria-expanded") === "true";
          heading.setAttribute("aria-expanded", String(!open));
          episodes.hidden = open;
        });
        card.appendChild(episodes);
      } else {
        heading.disabled = true;
      }
      list.appendChild(card);
    });
  }

  function addDetail(term, value) {
    if (!value) return;
    const list = document.querySelector("#series-details");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    list.append(dt, dd);
  }

  function renderDetails() {
    addDetail("Status", details.status);
    addDetail("Networks", networks.join(" / "));
    addDetail("Genres", genres.join(" • "));
    addDetail("First aired", formatDate(details.firstAirDate));
    addDetail("Last aired", details.lastAirDate ? formatDate(details.lastAirDate) : "—");
    addDetail("Seasons", details.numberOfSeasons);
    addDetail("Episodes", details.numberOfEpisodes);
    addDetail("Country", (details.originCountries || []).join(" / ") || series.catalogGroup);
    addDetail("Original language", details.originalLanguage?.toUpperCase());
  }

  function personCard(person, type) {
    const link = document.createElement("a");
    link.className = "person-card";
    const jobs = person.jobs || [person.job].filter(Boolean);
    const role = type === "cast" ? "cast" : "crew";
    link.href = `./person.html?id=${encodeURIComponent(person.id)}&role=${role}`;
    const image = document.createElement(person.profilePath ? "img" : "div");
    image.className = `person-photo${person.profilePath ? "" : " person-photo-placeholder"}`;
    if (person.profilePath) {
      image.src = `https://image.tmdb.org/t/p/w342${person.profilePath}`;
      image.alt = person.name;
      image.loading = "lazy";
    }
    const name = document.createElement("strong");
    name.textContent = person.name;
    const credit = document.createElement("span");
    credit.textContent = type === "cast" ? (person.character || "—") : (jobs.join(" • ") || "Crew");
    link.append(image, name, credit);
    return link;
  }

  function renderPeople() {
    const override = (window.WLW_CAST_OVERRIDES || {})[series.title] || {};
    const excluded = new Set((override.exclude || []).map(String));
    const cast = [...(details.femaleCast || []), ...(override.include || [])]
      .filter(person => !excluded.has(String(person.id)))
      .filter((person, index, list) => list.findIndex(item => String(item.id) === String(person.id)) === index)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    const crew = details.crew || [];
    const castList = document.querySelector("#cast-list");
    const crewList = document.querySelector("#crew-list");
    cast.forEach(person => castList.appendChild(personCard(person, "cast")));
    crew.forEach(person => crewList.appendChild(personCard(person, "crew")));
    if (!cast.length) castList.innerHTML = '<p class="tab-empty">Cast information is not available yet.</p>';
    if (!crew.length) crewList.innerHTML = '<p class="tab-empty">Crew information is not available yet.</p>';
  }

  function wireTabs() {
    const tabs = [...document.querySelectorAll(".detail-tab")];
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        tabs.forEach(item => {
          const active = item === tab;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", String(active));
          const panel = document.querySelector(`#panel-${item.dataset.panel}`);
          panel.hidden = !active;
          panel.classList.toggle("active", active);
        });
      });
      tab.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        tabs[(index + direction + tabs.length) % tabs.length].focus();
      });
    });
  }

  renderResources();
  renderSeasons();
  renderDetails();
  renderPeople();
  wireTabs();
  loading.hidden = true;
  article.hidden = false;
})();
