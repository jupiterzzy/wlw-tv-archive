const countryFlags = {
  AUS:"au", AUT:"at", BEL:"be", BRA:"br", CAN:"ca", DEN:"dk", ESP:"es",
  FIN:"fi", FRA:"fr", GEO:"ge", GER:"de", GRE:"gr", IRE:"ie", ITA:"it",
  JPN:"jp", MEX:"mx", NED:"nl", NOR:"no", NZL:"nz", POR:"pt", RUS:"ru",
  SLO:"si", SUI:"ch", SWE:"se", UK:"gb", USA:"us"
};

const countries = Object.values(window.WLW_CATALOG || {})
  .filter(group => group.type === "country" && (group.movies || []).length)
  .map(group => ({
    code: group.code,
    label: group.title || group.code,
    count: group.movies.length,
    flag: group.flag || countryFlags[group.code] || ""
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

const field = document.querySelector("#country-field");
const template = document.querySelector("#country-template");
const sizeClass = count => count <= 5 ? "size-small" : count <= 20 ? "size-medium" : "size-large";

if (!countries.length) {
  const empty = document.createElement("p");
  empty.className = "country-empty";
  empty.textContent = "国家列表将在添加电视剧后显示。";
  field.appendChild(empty);
}

countries.forEach((country, index) => {
  const node = template.content.cloneNode(true);
  const button = node.querySelector(".country-orb");
  button.href = `./country.html?code=${encodeURIComponent(country.code)}`;
  button.classList.add(sizeClass(country.count));
  button.setAttribute("aria-label", country.label);
  if (country.flag) {
    button.style.setProperty("--flag-image", `url("https://flagcdn.com/w640/${country.flag}.png")`);
  }
  button.style.setProperty("--sway-duration", `${6.8 + (index % 5) * .42}s`);
  button.querySelector(".country-code").textContent = country.label;
  field.appendChild(node);
});

field.addEventListener("click", event => {
  const button = event.target.closest(".country-orb");
  if (!button || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  event.preventDefault();
  button.classList.add("is-shattering");
  setTimeout(() => { location.href = button.href; }, 420);
});

window.addEventListener("pageshow", () => {
  field.querySelectorAll(".country-orb").forEach(button => button.classList.remove("is-shattering"));
});
