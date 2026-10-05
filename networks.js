const series = Object.values(window.WLW_CATALOG || {})
  .flatMap(group => group.movies || [])
  .filter((item, index, list) => list.findIndex(other => other.title === item.title) === index);

const networkMap = new Map();
series.forEach(show => {
  const details = window.getWLWDetails(show.title);
  const records = details.networks || [];
  const manual = window.getWLWMetadata(show.title).networks || [];
  records.forEach(record => {
    const name = typeof record === "string" ? record : record.name;
    if (!name) return;
    const current = networkMap.get(name) || { name, logoPath: "", count: 0 };
    current.logoPath ||= typeof record === "object" ? record.logoPath || "" : "";
    current.count += 1;
    networkMap.set(name, current);
  });
  manual.filter(name => !records.some(record => (record.name || record) === name)).forEach(name => {
    const current = networkMap.get(name) || { name, logoPath: "", count: 0 };
    current.count += 1;
    networkMap.set(name, current);
  });
});

const directory = document.querySelector("#network-directory");
const networks = [...networkMap.values()].sort((a, b) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" })
);

if (!networks.length) {
  directory.innerHTML = '<p class="empty-listing">Networks will appear here after TV series are added and the TMDB workflow has run.</p>';
}

networks.forEach(network => {
  const link = document.createElement("a");
  link.className = "network-button";
  link.href = `./network.html?name=${encodeURIComponent(network.name)}`;
  if (network.logoPath) {
    const image = document.createElement("img");
    image.src = `https://image.tmdb.org/t/p/w300${network.logoPath}`;
    image.alt = "";
    image.loading = "lazy";
    link.appendChild(image);
  }
  const name = document.createElement("span");
  name.textContent = network.name;
  link.appendChild(name);
  const count = document.createElement("small");
  count.textContent = `${network.count} ${network.count === 1 ? "series" : "series"}`;
  link.appendChild(count);
  directory.appendChild(link);
});
