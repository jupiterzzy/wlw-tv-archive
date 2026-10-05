// ================================================================
// HERO IMAGES — ADD YOUR FIVE IMAGES HERE LATER.
// Put them in dist/assets/hero/ and keep or replace these paths.
// ================================================================
const heroImages=["./assets/hero/hero-1.jpg","./assets/hero/hero-2.jpg","./assets/hero/hero-3.jpg","./assets/hero/hero-4.jpg","./assets/hero/hero-5.jpg"];

// CATALOG STANDARD FOR FUTURE ADDITIONS
// 1. Add each new series ONCE inside its country/region in catalog-data.js.
// 2. Required fields: title, four-digit year, poster filename.
// 3. Add its genres in movie-data-utils.js and original/translated titles below.
// 4. A–Z pages are generated automatically. A leading "The" is ignored for
//    both letter assignment and alphabetical sorting. Each letter shows EVERY
//    matching series on one page; there is deliberately no per-letter page limit.
const titleAliases={};

const allMovies=Object.values(window.WLW_CATALOG).flatMap(group=>group.movies).map(movie=>({
  ...movie,
  aliases:[...(titleAliases[movie.title]||[]),...window.getWLWAliases(movie.title)],
  genres:window.getWLWGenres(movie.title)
}));
const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const params=new URLSearchParams(location.search);
const requestedLetter=(params.get("letter")||"A").toUpperCase();
const currentLetter=alphabet.includes(requestedLetter)?requestedLetter:"A";

function sortableTitle(title){return title.replace(/^the\s+/i,"").trim();}
function letterFor(title){return sortableTitle(title).charAt(0).toUpperCase();}
function compareTitles(a,b){return sortableTitle(a.title).localeCompare(sortableTitle(b.title),"en",{sensitivity:"base",numeric:true});}
function hasDetailPage(){return true;}
function navigationHref(movie){
  return `./tv.html?title=${encodeURIComponent(movie.title)}`;
}
const movies=allMovies.filter(movie=>letterFor(movie.title)===currentLetter).sort(compareTitles);
const hero=document.querySelector("#hero");
const slideCount=document.querySelector("#slide-count");
const slideProgress=document.querySelector("#slide-progress");
const movieGrid=document.querySelector("#movie-grid");
const cardTemplate=document.querySelector("#movie-card-template");
const searchForm=document.querySelector("#search-form");
const searchInput=document.querySelector("#tv-search");
const searchResults=document.querySelector("#search-results");

document.querySelector("#catalog-title").textContent=currentLetter;
document.title=`${currentLetter} · WLW TV Archive`;

const placeholderPoster=title=>{const initials=title.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join("").toUpperCase();const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#241d26"/><circle cx="480" cy="120" r="150" fill="#f05278" opacity=".78"/><path d="M0 480L320 160l280 280v160H0z" fill="#493243"/><text x="48" y="540" fill="#f7f3ee" font-size="92" font-family="Arial" font-weight="700">${initials}</text></svg>`;return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;};

function renderMovies(){
  const fragment=document.createDocumentFragment();
  if(!movies.length){const empty=document.createElement("p");empty.className="empty-letter";empty.textContent="该字母下暂无剧集";movieGrid.appendChild(empty);return;}
  movies.forEach(movie=>{const card=cardTemplate.content.cloneNode(true);const poster=card.querySelector(".poster");const titleLink=card.querySelector("h3 a");
    card.querySelectorAll("a").forEach(link=>{
  link.href=navigationHref(movie);
  link.setAttribute("aria-label",`查看 ${movie.title} 详情`);
});
    poster.src=window.getWLWPoster(movie);poster.alt=`${movie.title} 电视剧海报`;poster.addEventListener("error",()=>{poster.src=placeholderPoster(movie.title);},{once:true});
    titleLink.textContent=movie.title;titleLink.title=movie.title;const meta=card.querySelector(".movie-meta");meta.innerHTML=`<span class="movie-year">${window.getWLWFirstAirYear(movie)}</span>${movie.genres.length?`<span class="movie-genres">${movie.genres.slice(0,2).join(" • ")}</span>`:""}`;fragment.appendChild(card);
  });
  movieGrid.appendChild(fragment);
}

function renderAlphabet(){
  const track=document.querySelector("#alphabet-track");
  alphabet.forEach(letter=>{const link=document.createElement("a");link.className=`letter-button${letter===currentLetter?" active":""}`;link.href=letter==="A"?"./alphabet.html":`./alphabet.html?letter=${letter}`;link.textContent=letter;if(letter===currentLetter)link.setAttribute("aria-current","page");track.appendChild(link);});
  requestAnimationFrame(()=>{const active=track.querySelector(".active");if(!active)return;track.scrollLeft=active.offsetLeft-(track.clientWidth-active.clientWidth)/2;});
}

function normalizeSearchText(value){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&|\band\b/g," and ").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");}
function matchesQuery(movie,query){return [movie.title,...movie.aliases].map(normalizeSearchText).some(name=>name.includes(query));}
function showSearchResults(rawQuery){const query=normalizeSearchText(rawQuery);searchResults.replaceChildren();if(!query){searchResults.hidden=true;searchInput.setAttribute("aria-expanded","false");return[];}const results=allMovies.filter(movie=>matchesQuery(movie,query)).slice(0,8);if(!results.length){const empty=document.createElement("p");empty.className="empty-result";empty.textContent="没有找到匹配的电视剧";searchResults.appendChild(empty);}else{results.forEach(movie=>{const result=document.createElement("a");result.className="search-result";result.href=navigationHref(movie);result.setAttribute("role","option");result.innerHTML=`<span>${movie.title}</span><span>${window.getWLWFirstAirYear(movie)}</span>`;searchResults.appendChild(result);});}searchResults.hidden=false;searchInput.setAttribute("aria-expanded","true");return results;}
searchInput.addEventListener("input",event=>showSearchResults(event.target.value));
searchForm.addEventListener("submit",event=>{event.preventDefault();const results=showSearchResults(searchInput.value);if(results.length===1)location.href=navigationHref(results[0]);});
document.addEventListener("click",event=>{if(!searchForm.contains(event.target)){searchResults.hidden=true;searchInput.setAttribute("aria-expanded","false");}});

let currentSlide=0;let slideTimer;
function setHeroImage(index,direction=null){currentSlide=(index+heroImages.length)%heroImages.length;hero.classList.remove("is-swipe-left","is-swipe-right");if(direction){void hero.offsetWidth;hero.classList.add(direction==="next"?"is-swipe-left":"is-swipe-right");}hero.style.backgroundImage=`linear-gradient(180deg,rgba(19,17,24,.08),rgba(19,17,24,.18)),url("${heroImages[currentSlide]}")`;slideCount.textContent=`${String(currentSlide+1).padStart(2,"0")} / ${String(heroImages.length).padStart(2,"0")}`;slideProgress.style.transform=`scaleX(${currentSlide+1})`;}
function restartSlideshow(){clearInterval(slideTimer);if(!matchMedia("(prefers-reduced-motion: reduce)").matches)slideTimer=setInterval(()=>setHeroImage(currentSlide+1),5000);}
function moveSlide(direction){setHeroImage(currentSlide+(direction==="next"?1:-1),direction);restartSlideshow();}
setHeroImage(0);restartSlideshow();let pointerStart=null;
hero.addEventListener("pointerdown",event=>{if(event.target.closest(".search"))return;pointerStart={x:event.clientX,y:event.clientY};hero.setPointerCapture?.(event.pointerId);});
hero.addEventListener("pointerup",event=>{if(!pointerStart)return;const deltaX=event.clientX-pointerStart.x;const deltaY=event.clientY-pointerStart.y;pointerStart=null;if(Math.abs(deltaX)<45||Math.abs(deltaX)<=Math.abs(deltaY))return;moveSlide(deltaX<0?"next":"previous");});
hero.addEventListener("pointercancel",()=>{pointerStart=null;});hero.addEventListener("keydown",event=>{if(event.key==="ArrowLeft")moveSlide("previous");if(event.key==="ArrowRight")moveSlide("next");});hero.tabIndex=0;

renderMovies();renderAlphabet();
