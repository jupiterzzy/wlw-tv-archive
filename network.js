const params = new URLSearchParams(location.search);
const requested = params.get("name") || "";
const requestedPage = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
const desktop = matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)");
const pageSize = desktop.matches ? 40 : 20;
desktop.addEventListener?.("change", () => location.reload());

const title = document.querySelector("#listing-title");
const grid = document.querySelector("#listing-grid");
const template = document.querySelector("#listing-card-template");
const pagination = document.querySelector("#listing-pagination");
title.classList.add("compact-category-title");
title.textContent = requested || "Network not found";
document.title = `${requested || "Network"} · WLW TV Archive`;

const series = Object.values(window.WLW_CATALOG || {}).flatMap(group => group.movies || [])
  .filter((item, index, list) => list.findIndex(other => other.title === item.title) === index)
  .filter(show => window.getWLWNetworks(show.title).includes(requested))
  .sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));

const totalPages = Math.max(1, Math.ceil(series.length / pageSize));
const page = Math.min(requestedPage, totalPages);
series.slice((page - 1) * pageSize, page * pageSize).forEach(show => {
  const node = template.content.cloneNode(true);
  node.querySelector("h3 a").textContent = show.title;
  const genres = window.getFullWLWGenres(show.title).slice(0, 2);
  node.querySelector(".movie-meta").innerHTML =
    `<span class="movie-year">${window.getWLWFirstAirYear(show)}</span>` +
    (genres.length ? `<span class="movie-genres">${genres.join(" • ")}</span>` : "");
  window.applyWLWPoster(node, show);
  grid.appendChild(node);
});

if (!series.length) grid.innerHTML = '<p class="empty-listing">No series found for this network.</p>';
window.makePagination(pagination, totalPages, page, value =>
  `./network.html?name=${encodeURIComponent(requested)}&page=${value}`
);
