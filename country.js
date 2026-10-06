const params=new URLSearchParams(location.search);

let code=(params.get("code")||"").toUpperCase();

/* 只在手机端启用 fallback。
   电脑和平板仍然完全使用原来的 URL query。 */
if(
  !code &&
  matchMedia("(max-width: 38rem)").matches
){
  code=(
    sessionStorage.getItem("wlw-mobile-country-code")||
    ""
  ).toUpperCase();
}

const group=window.WLW_CATALOG[code];const requestedPage=Math.max(1,Number.parseInt(params.get("page")||"1",10)||1);const desktopLayout=matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");const pageSize=desktopLayout.matches?40:20;desktopLayout.addEventListener?.("change",()=>location.reload());

const title=document.querySelector("#listing-title"),grid=document.querySelector("#listing-grid"),template=document.querySelector("#listing-card-template"),pagination=document.querySelector("#listing-pagination");
title.classList.add("compact-category-title");
grid.classList.add("desktop-six-by-six");
if(!group||group.type!=="country"){title.textContent="未找到";grid.innerHTML='<p class="empty-listing">没有找到这个国家。请返回目录重新选择。</p>';}
else{
  document.title=`${group.title} · WLW TV Archive`;
  title.textContent=group.title;

  const totalPages=Math.max(
    1,
    Math.ceil(group.movies.length/pageSize)
  );

  const page=Math.min(
    requestedPage,
    totalPages
  );

  group.movies
    .slice()
    .sort((a,b)=>{
      const sortable=value=>String(value||"").replace(/^the\s+/i,"").trim();
      return sortable(a.title).localeCompare(sortable(b.title),"en",{sensitivity:"base"});
    })
    .slice(
      (page-1)*pageSize,
      page*pageSize
    )
    .forEach(movie=>{
      const node=
        template.content.cloneNode(true);

      node.querySelector("h3 a").textContent=
        movie.title;

      const genres=
        window.getFullWLWGenres?.(movie.title) || window.getWLWGenres(movie.title);

      const meta=
        node.querySelector(".movie-meta");

      meta.innerHTML=
        `<span class="movie-year">${window.getWLWFirstAirYear(movie)}</span>`+
        `${genres.length
          ? `<span class="movie-genres">${genres.slice(0,2).join(" • ")}</span>`
          : ""
        }`;

      window.applyWLWPoster(
        node,
        movie
      );

      grid.appendChild(node);
    });

  window.makePagination(
    pagination,
    totalPages,
    page,
    value =>
      `./country.html?code=${encodeURIComponent(code)}&page=${value}`
  );
}
