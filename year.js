const params = new URLSearchParams(location.search);

const sort =
  params.get("sort") === "desc"
    ? "desc"
    : "asc";

const requestedPage = Math.max(
  1,
  Number.parseInt(params.get("page") || "1", 10) || 1
);

let fromYear = Number.parseInt(params.get("from") || "", 10);
let toYear = Number.parseInt(params.get("to") || "", 10);

if (!Number.isFinite(fromYear)) {
  fromYear = null;
}

if (!Number.isFinite(toYear)) {
  toYear = null;
}

if (
  fromYear !== null &&
  toYear !== null &&
  fromYear > toYear
) {
  [fromYear, toYear] = [toYear, fromYear];
}

const desktopLayout = matchMedia(
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
);

const pageSize = desktopLayout.matches ? 36 : 20;

desktopLayout.addEventListener?.(
  "change",
  () => location.reload()
);

const ascending = document.querySelector("#ascending");
const descending = document.querySelector("#descending");

document
  .querySelector(sort === "asc" ? "#ascending" : "#descending")
  .classList.add("active");

const rangeForm = document.querySelector("#year-range-form");
const fromInput = document.querySelector("#year-from");
const toInput = document.querySelector("#year-to");

if (fromYear !== null) {
  fromInput.value = fromYear;
}

if (toYear !== null) {
  toInput.value = toYear;
}

function makeSortHref(nextSort) {
  const nextParams = new URLSearchParams();

  nextParams.set("sort", nextSort);

  if (fromYear !== null) {
    nextParams.set("from", fromYear);
  }

  if (toYear !== null) {
    nextParams.set("to", toYear);
  }

  return `./year.html?${nextParams.toString()}`;
}

ascending.href = makeSortHref("asc");
descending.href = makeSortHref("desc");

rangeForm.addEventListener("submit", event => {
  event.preventDefault();

  const nextFrom = Number.parseInt(fromInput.value, 10);
  const nextTo = Number.parseInt(toInput.value, 10);

  const nextParams = new URLSearchParams();

  nextParams.set("sort", sort);

  if (Number.isFinite(nextFrom)) {
    nextParams.set("from", nextFrom);
  }

  if (Number.isFinite(nextTo)) {
    nextParams.set("to", nextTo);
  }

  location.href = `./year.html?${nextParams.toString()}`;
});

let movies = Object.values(window.WLW_CATALOG)
  .flatMap(group =>
    group.movies.map(movie => ({
      ...movie,
      group: group.code
    }))
  );

if (fromYear !== null) {
  movies = movies.filter(
    movie => Number(window.getWLWFirstAirYear(movie)) >= fromYear
  );
}

if (toYear !== null) {
  movies = movies.filter(
    movie => Number(window.getWLWFirstAirYear(movie)) <= toYear
  );
}

movies.sort((a, b) => {
  const yearDifference = window.getWLWFirstAirYear(a) - window.getWLWFirstAirYear(b);

  const titleDifference = a.title.localeCompare(
    b.title,
    "en",
    { sensitivity: "base" }
  );

  return sort === "asc"
    ? (yearDifference || titleDifference)
    : (-yearDifference || titleDifference);
});

const totalPages = Math.max(
  1,
  Math.ceil(movies.length / pageSize)
);

const page = Math.min(
  requestedPage,
  totalPages
);

const grid = document.querySelector("#listing-grid");
const template = document.querySelector("#listing-card-template");

grid.classList.add("desktop-six-by-six");

movies
  .slice(
    (page - 1) * pageSize,
    page * pageSize
  )
  .forEach(movie => {
    const node = template.content.cloneNode(true);

    node.querySelector("h3 a").textContent = movie.title;

    const genres = window.getFullWLWGenres(movie.title).slice(0, 2);
    node.querySelector(".movie-meta").innerHTML =
      `<span class="movie-year">${window.getWLWFirstAirYear(movie)}</span>` +
      (genres.length ? `<span class="movie-genres">${genres.join(" • ")}</span>` : "");

    window.applyWLWPoster(node, movie);

    grid.appendChild(node);
  });

window.makePagination(
  document.querySelector("#listing-pagination"),
  totalPages,
  page,
  value => {
    const pageParams = new URLSearchParams();

    pageParams.set("sort", sort);
    pageParams.set("page", value);

    if (fromYear !== null) {
      pageParams.set("from", fromYear);
    }

    if (toYear !== null) {
      pageParams.set("to", toYear);
    }

    return `./year.html?${pageParams.toString()}`;
  }
);
