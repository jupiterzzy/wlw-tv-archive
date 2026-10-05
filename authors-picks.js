const AUTHOR_PICKS = [
  "But I'm a Cheerleader",
  "D.E.B.S.",
  "Saving Face",
  "Intermission",
  "When Night Is Falling",
  "Imagine Me & You",
  "Sister My Sister",
  "The Celluloid Closet",
  "Aimée & Jaguar"
];

const grid = document.querySelector("#listing-grid");
const template = document.querySelector("#listing-card-template");

const catalogMovies = Object.values(window.WLW_CATALOG)
  .flatMap(group => group.movies);

const byTitle = new Map(
  catalogMovies.map(movie => [movie.title, movie])
);

AUTHOR_PICKS
  .map(title => byTitle.get(title))
  .filter(Boolean)
  .forEach(movie => {
    const node = template.content.cloneNode(true);
    node.querySelector("h3 a").textContent = movie.title;

    const genres = window.getWLWGenres(movie.title) || [];
    const meta = node.querySelector(".movie-meta");
    meta.innerHTML =
      `<span class="movie-year">${window.getWLWFirstAirYear(movie)}</span>` +
      (genres.length
        ? `<span class="movie-genres">${genres.slice(0, 2).join(" • ")}</span>`
        : "");

    window.applyWLWPoster(node, movie);
    grid.appendChild(node);
  });
