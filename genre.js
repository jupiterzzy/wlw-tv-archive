const params = new URLSearchParams(location.search);

const requested = params.get("genre") || "drama";

const definition = window.WLW_LETTERBOXD_GENRES.find(
  item => item.slug === requested
);

const desktopLayout = matchMedia(
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
);

const pageSize = desktopLayout.matches ? 36 : 20;

desktopLayout.addEventListener?.("change", () => location.reload());

const requestedPage = Math.max(
  1,
  Number.parseInt(params.get("page") || "1", 10) || 1
);

const title = document.querySelector("#listing-title");
title.classList.add("compact-category-title");
const grid = document.querySelector("#listing-grid");
const template = document.querySelector("#listing-card-template");
const pagination = document.querySelector("#listing-pagination");

grid.classList.add("desktop-six-by-six");


if (!definition) {

  title.textContent = "未找到";

  grid.innerHTML =
    '<p class="empty-listing">没有找到这个体裁。</p>';

} else {

  title.textContent = definition.label;

  document.title =
    `${definition.label} · WLW TV Archive`;


  const rank = new Map(
    (window.WLW_POPULARITY_ORDER || [])
      .map((name, index) => [name, index])
  );


  const movies = Object.values(window.WLW_CATALOG)

    .flatMap(group => group.movies)

    .filter(movie => {

      const genres =
        typeof window.getFullWLWGenres === "function"
          ? window.getFullWLWGenres(movie.title)
          : window.getWLWGenres(movie.title) || [];

      return genres
        .map(genre => String(genre).toLowerCase())
        .includes(String(definition.tmdb).toLowerCase());

    })

    .sort((a, b) =>

      (rank.get(a.title) ?? 9999) -
      (rank.get(b.title) ?? 9999)

      ||

      a.title.localeCompare(
        b.title,
        "en",
        { sensitivity: "base" }
      )

    );


  const totalPages = Math.max(
    1,
    Math.ceil(movies.length / pageSize)
  );

  const page = Math.min(
    requestedPage,
    totalPages
  );


  movies
    .slice(
      (page - 1) * pageSize,
      page * pageSize
    )
    .forEach(movie => {

      const node =
        template.content.cloneNode(true);

      node.querySelector("h3 a").textContent =
        movie.title;

      const genres =
        typeof window.getFullWLWGenres === "function"
          ? window.getFullWLWGenres(movie.title)
          : window.getWLWGenres(movie.title) || [];

      const meta=node.querySelector(".movie-meta");
      const shownGenres=genres.slice(0,2);
      meta.innerHTML=`<span class="movie-year">${window.getWLWFirstAirYear(movie)}</span>${shownGenres.length?`<span class="movie-genres">${shownGenres.join(" • ")}</span>`:""}`;

      window.applyWLWPoster(node, movie);

      grid.appendChild(node);

    });


  if (!movies.length) {

    grid.innerHTML =
      '<p class="empty-listing">当前清单中暂无该体裁剧集。</p>';

  }


  window.makePagination(

    pagination,

    totalPages,

    page,

    value =>
      `./genre.html?genre=${encodeURIComponent(definition.slug)}&page=${value}`

  );

}
