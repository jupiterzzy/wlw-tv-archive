(function () {
  const params =
    new URLSearchParams(
      location.search
    );

  const personId =
    params.get("id") || "";

  const requestedRole =
    params.get("role") || "cast";

  const role =
    ["cast", "director", "writer", "crew"]
      .includes(requestedRole)
      ? requestedRole
      : "cast";

  const personName =
    document.querySelector(
      "#person-name"
    );

  const personSummary =
    document.querySelector(
      "#person-summary"
    );

  const personError =
    document.querySelector(
      "#person-error"
    );

  const movieContainer =
    document.querySelector(
      "#person-movies"
    );

  const template =
    document.querySelector(
      "#person-movie-template"
    );

  const back =
    document.querySelector(
      "#person-back"
    );

  if (
    document.referrer &&
    document.referrer.startsWith(
      location.origin
    )
  ) {
    back.addEventListener(
      "click",
      event => {
        event.preventDefault();
        history.back();
      }
    );
  }

  const WRITING_JOBS =
    new Set([
      "Screenplay",
      "Writer",
      "Story",
      "Teleplay",
      "Adaptation"
    ]);

  function getCrewJobs(person) {
    if (Array.isArray(person.jobs)) {
      return person.jobs;
    }

    return person.job
      ? [person.job]
      : [];
  }

  function showError(message) {
    personName.textContent =
      "人物";

    personSummary.hidden =
      true;

    movieContainer.replaceChildren();

    personError.textContent =
      message;

    personError.hidden =
      false;
  }

  if (!personId) {
    showError(
      "没有提供人物 ID。"
    );
    return;
  }

  const detailsByTitle =
    window.WLW_TMDB_DETAILS || {};

  const entries =
    Object.entries(
      detailsByTitle
    );

  const hasRequiredData =
    role === "cast"
      ? entries.some(
          ([, details]) =>
            Array.isArray(details.cast)
        )
      : entries.some(
          ([, details]) =>
            Array.isArray(details.crew)
        );

  if (!hasRequiredData) {
    showError(
      "人物索引尚未生成。请先运行 Update TMDB detail data 工作流程。"
    );
    return;
  }

  function matchesRole(details) {
    if (role === "cast") {
      return (details.cast || []).some(
        person =>
          String(person.id) ===
          String(personId)
      );
    }

    return (details.crew || []).some(
      person => {
        if (
          String(person.id) !==
          String(personId)
        ) {
          return false;
        }

        if (role === "crew") {
          return true;
        }

        const jobs =
          getCrewJobs(person);

        if (role === "director") {
          return jobs.includes(
            "Director"
          );
        }

        return jobs.some(
          job =>
            WRITING_JOBS.has(job)
        );
      }
    );
  }

  const matches =
    entries.filter(
      ([, details]) =>
        matchesRole(details)
    );

  if (!matches.length) {
    showError(
      "这个人物目前没有匹配到本 Archive 中的电视剧。"
    );
    return;
  }

  let matchedPerson =
    null;

  for (const [, details] of matches) {
    const source =
      role === "cast"
        ? details.cast || []
        : details.crew || [];

    matchedPerson =
      source.find(
        person =>
          String(person.id) ===
          String(personId)
      );

    if (matchedPerson) {
      break;
    }
  }

  const displayName =
    matchedPerson?.name ||
    "人物";

  personName.textContent =
    displayName;

  document.title =
    `${displayName} · WLW TV Archive`;

  if (matches.length > 1) {
    personSummary.textContent =
      `More with ${displayName}`;
  } else if (role === "director") {
    personSummary.textContent =
      `${displayName}目前没有导过更多作品`;
  } else if (role === "writer") {
    personSummary.textContent =
      `${displayName}目前没有写过更多作品`;
  } else if (role === "crew") {
    personSummary.textContent =
      `目前没有${displayName}的更多主创作品`;
  } else {
    personSummary.textContent =
      `目前没有${displayName}的更多电视剧`;
  }

  personSummary.hidden =
    false;

  const catalogMovieByTitle =
    new Map();

  Object.values(
    window.WLW_CATALOG || {}
  )
    .flatMap(
      group =>
        group.movies || []
    )
    .forEach(movie => {
      if (
        !catalogMovieByTitle.has(
          movie.title
        )
      ) {
        catalogMovieByTitle.set(
          movie.title,
          movie
        );
      }
    });

  matches.forEach(
    ([title, details]) => {
      const movie =
        catalogMovieByTitle.get(
          title
        );

      if (!movie) {
        return;
      }

      const card =
        template.content
          .firstElementChild
          .cloneNode(true);

      const titleLink =
        card.querySelector(
          "h3 a"
        );

      const meta =
        card.querySelector(
          ".movie-meta"
        );

      titleLink.textContent =
        movie.title;

      const genres =
        (details.genres || [])
          .map(item =>
            typeof item === "string"
              ? item
              : item.name
          )
          .filter(Boolean);

      meta.textContent =
        [
          window.getWLWFirstAirYear(movie),
          ...genres
        ]
          .filter(Boolean)
          .join(" • ");

      window.applyWLWPoster(
        card,
        movie
      );

      movieContainer.appendChild(
        card
      );
    }
  );
})();
