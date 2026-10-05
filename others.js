const requestedPage = Math.max(1, Number.parseInt(new URLSearchParams(location.search).get("page") || "1", 10) || 1);
const desktopLayout = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
const pageSize = desktopLayout.matches ? 40 : 20;
desktopLayout.addEventListener?.("change", () => location.reload());

const sortableTitle = title => String(title || "").replace(/^the\s+/i, "").trim();
const series = [...(window.WLW_OTHERS || [])].sort((a, b) =>
  sortableTitle(a.title).localeCompare(sortableTitle(b.title), "en", { sensitivity: "base", numeric: true })
);

const grid = document.querySelector("#listing-grid");
const template = document.querySelector("#listing-card-template");
const pagination = document.querySelector("#listing-pagination");
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

if (!series.length) {
  grid.innerHTML = '<p class="empty-listing">这里暂时还没有电视剧。以后把非 WLW 电视剧添加到 others-data.js 即可。</p>';
}

window.makePagination(pagination, totalPages, page, value => `./others.html?page=${value}`);
