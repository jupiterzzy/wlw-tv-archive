// TV-specific genres, alphabetized exactly as displayed on the homepage.
window.WLW_LETTERBOXD_GENRES = [
  { slug: "action-adventure", label: "ACTION & ADVENTURE", tmdb: "Action & Adventure" },
  { slug: "animation", label: "ANIMATION", tmdb: "Animation" },
  { slug: "comedy", label: "COMEDY", tmdb: "Comedy" },
  { slug: "crime", label: "CRIME", tmdb: "Crime" },
  { slug: "documentary", label: "DOCUMENTARY", tmdb: "Documentary" },
  { slug: "drama", label: "DRAMA", tmdb: "Drama" },
  { slug: "family", label: "FAMILY", tmdb: "Family" },
  { slug: "mystery", label: "MYSTERY", tmdb: "Mystery" },
  { slug: "romance", label: "ROMANCE", tmdb: "Romance" },
  { slug: "sci-fi-fantasy", label: "SCI-FI & FANTASY", tmdb: "Sci-Fi & Fantasy" },
  { slug: "soap", label: "SOAP", tmdb: "Soap" },
  { slug: "sports", label: "SPORTS", tmdb: "Sports" },
  { slug: "thriller", label: "THRILLER", tmdb: "Thriller" },
  { slug: "war-politics", label: "WAR & POLITICS", tmdb: "War & Politics" }
];


window.WLW_GENRE_EXTRAS={};
window.WLW_POPULARITY_ORDER=[];
window.getFullWLWGenres = title => {
  const manual = window.getWLWGenres(title);
  const details = (window.WLW_TMDB_DETAILS || {})[title] || {};
  const automatic = (details.genres || []).map(item =>
    typeof item === "string" ? item : item.name
  );
  return [...new Set([...manual, ...automatic].filter(Boolean))];
};
