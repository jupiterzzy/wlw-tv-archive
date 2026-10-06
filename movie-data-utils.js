(function () {
  const metadata = window.WLW_MOVIE_METADATA || {};
  const detailsByTitle = () => window.WLW_TMDB_DETAILS || {};

  window.getWLWMetadata = title => metadata[title] || {};
  window.getWLWAliases = title => {
    const record = window.getWLWDetails(title);
    return [...new Set([
      ...(metadata[title]?.aliases || []),
      ...(record.alternativeTitles || []),
      ...(record.translatedTitles || [])
    ].filter(value => value && value !== title))];
  };
  window.getWLWDetails = title => detailsByTitle()[title] || {};

  window.getWLWPoster = series => {
    const record = window.getWLWDetails(series.title);
    return metadata[series.title]?.poster ||
      (record.posterPath ? `https://image.tmdb.org/t/p/w500${record.posterPath}` : "") ||
      (series.poster ? `./assets/posters/${series.poster}` : "") ||
      window.getWLWPlaceholderPoster(series.title);
  };

  window.getWLWGenres = title => metadata[title]?.genres || [];
  window.getFullWLWGenres = title => {
    const manual = window.getWLWGenres(title);
    const automatic = (window.getWLWDetails(title).genres || []).map(item =>
      typeof item === "string" ? item : item.name
    );
    return [...new Set([...manual, ...automatic].filter(Boolean))];
  };
  window.getWLWNetworks = title => {
    const manual = metadata[title]?.networks || [];
    const automatic = (window.getWLWDetails(title).networks || []).map(item =>
      typeof item === "string" ? item : item.name
    );
    return [...new Set([...manual, ...automatic].filter(Boolean))];
  };

  window.getWLWFirstAirYear = series => {
    const date = window.getWLWDetails(series.title).firstAirDate || "";
    return Number.parseInt(date.slice(0, 4), 10) || Number(series.year) || "";
  };

  window.getWLWRunningYears = series => {
    const details = window.getWLWDetails(series.title);
    const first = window.getWLWFirstAirYear(series);
    if (!first) return "";
    const seasons = Number(details.numberOfSeasons || 0);
    if (seasons <= 1) return String(first);
    const ended = ["Ended", "Canceled", "Cancelled"].includes(details.status);
    const last = Number.parseInt(String(details.lastAirDate || "").slice(0, 4), 10);
    if (ended && last === first) return String(first);
    return ended && last ? `${first}–${last}` : `${first}–`;
  };

  function placeholderPoster(title) {
    const initials = String(title || "?").split(/\s+/).filter(Boolean).slice(0, 2)
      .map(word => word[0]).join("").toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><rect width="600" height="900" fill="#111015"/><circle cx="485" cy="145" r="150" fill="#a76891" opacity=".18"/><path d="M0 720L320 390l280 280v230H0z" fill="#1f4157" opacity=".42"/><text x="44" y="815" fill="#f1ece7" font-size="78" font-family="Arial" font-weight="700">${initials}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  window.getWLWPlaceholderPoster = placeholderPoster;

  window.applyWLWPoster = (root, series) => {
    const href = `./tv.html?title=${encodeURIComponent(series.title)}`;
    root.querySelectorAll(".poster-link,h3 a").forEach(anchor => {
      anchor.href = href;
      anchor.setAttribute("aria-label", `查看 ${series.title} 详情`);
    });
    const link = root.querySelector(".poster-link");
    if (!link) return;
    let image = link.querySelector(".poster");
    if (!image) {
      image = document.createElement("img");
      image.className = "poster";
      link.prepend(image);
    }
    image.src = window.getWLWPoster(series);
    image.alt = `${series.title} 电视剧海报`;
    image.loading = "lazy";
    image.addEventListener("error", () => { image.src = placeholderPoster(series.title); }, { once: true });
  };

  window.makePagination = function (container, total, current, makeHref) {
    container.replaceChildren();
    if (total <= 1) return;
    const values = total <= 7
      ? Array.from({ length: total }, (_, index) => index + 1)
      : [1, ...(current > 3 ? ["…"] : []), ...[current - 1, current, current + 1]
          .filter(value => value > 1 && value < total), ...(current < total - 2 ? ["…"] : []), total];
    values.forEach(value => {
      if (value === "…") {
        const gap = document.createElement("span");
        gap.className = "pagination-gap";
        gap.textContent = "…";
        container.appendChild(gap);
        return;
      }
      const link = document.createElement("a");
      link.className = `letter-button${value === current ? " active" : ""}`;
      link.href = makeHref(value);
      link.textContent = value;
      if (value === current) link.setAttribute("aria-current", "page");
      container.appendChild(link);
    });
  };
})();
