const field=document.querySelector("#genre-field");
const template=document.querySelector("#genre-template");
window.WLW_LETTERBOXD_GENRES.forEach(genre=>{
  const node=template.content.cloneNode(true);const button=node.querySelector(".region-crystal");
  button.href=`./genre.html?genre=${encodeURIComponent(genre.slug)}`;button.setAttribute("aria-label",genre.label);
  button.querySelector(".country-code").textContent=genre.label;field.appendChild(node);
});

function addShards(button){const shapes=["polygon(50% 0,100% 100%,10% 72%)","polygon(0 0,100% 18%,64% 100%,8% 68%)","polygon(26% 0,100% 42%,68% 100%,0 73%)","polygon(0 20%,76% 0,100% 78%,30% 100%)"];for(let index=0;index<8;index+=1){const angle=Math.PI*2*index/8;const distance=95+(index%3)*25;const shard=document.createElement("span");shard.className="crystal-shard";shard.style.setProperty("--shard-shape",shapes[index%shapes.length]);shard.style.setProperty("--shard-x",`${Math.cos(angle)*distance-50}%`);shard.style.setProperty("--shard-y",`${Math.sin(angle)*distance-50}%`);shard.style.setProperty("--shard-rotation",`${index%2?-95:110}deg`);shard.style.setProperty("--shard-delay",`${index*12}ms`);button.appendChild(shard);}}
field.addEventListener("click",event=>{const button=event.target.closest(".region-crystal");if(!button||button.classList.contains("is-shattering"))return;event.preventDefault();const destination=button.href;if(matchMedia("(prefers-reduced-motion: reduce)").matches){location.href=destination;return;}addShards(button);button.classList.add("is-shattering");setTimeout(()=>{location.href=destination;},620);});
function resetGenreButtons() {

  document
    .querySelectorAll(".region-crystal")
    .forEach(button => {

      button.classList.remove(
        "is-shattering",
        "is-dragging",
        "is-returning",
        "is-displaced",
        "is-settling"
      );

      button
        .querySelectorAll(".crystal-shard")
        .forEach(shard => shard.remove());

    });

}

window.addEventListener(
  "pageshow",
  resetGenreButtons
);

window.addEventListener(
  "pagehide",
  resetGenreButtons
);
