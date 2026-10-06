(function () {
  const allSeries = [
    ...Object.values(window.WLW_CATALOG || {}).flatMap(group => group.movies || []),
    ...(window.WLW_OTHERS || [])
  ]
    .filter((series, index, list) =>
      list.findIndex(item => item.title === series.title) === index
    )
    .map(series => ({ ...series, aliases: window.getWLWAliases(series.title) }));

  const hero = document.querySelector("#hero");
  hero.style.backgroundImage =
    "radial-gradient(circle at 78% 20%,rgba(167,104,145,.32),transparent 34%),linear-gradient(145deg,#251d28,#0d0c10 68%)";

  const form = document.querySelector("#search-form");
  const input = document.querySelector("#tv-search");
  const resultsBox = document.querySelector("#search-results");

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  function detailHref(series) {
    return `./tv.html?title=${encodeURIComponent(series.title)}`;
  }

  function showResults() {
    const query = normalize(input.value);
    resultsBox.replaceChildren();
    if (!query) {
      resultsBox.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return [];
    }

    const matches = allSeries.filter(series =>
      [series.title, ...series.aliases].some(value => normalize(value).includes(query))
    ).slice(0, 8);

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "empty-result";
      empty.textContent = "没有找到匹配的电视剧";
      resultsBox.appendChild(empty);
    }

    matches.forEach(series => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = detailHref(series);
      const year = window.getWLWFirstAirYear(series) || "";
      const chineseTitle = series.aliases.find(value => /[\u3400-\u9fff]/u.test(value));
      link.innerHTML = `<span>${series.title}${chineseTitle ? `<small>${chineseTitle}</small>` : ""}</span><span>${year}</span>`;
      resultsBox.appendChild(link);
    });

    resultsBox.hidden = false;
    input.setAttribute("aria-expanded", "true");
    return matches;
  }

  input.addEventListener("input", showResults);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const first = showResults()[0];
    if (first) location.href = detailHref(first);
  });
  document.addEventListener("click", event => {
    if (!form.contains(event.target)) {
      resultsBox.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });
})();
