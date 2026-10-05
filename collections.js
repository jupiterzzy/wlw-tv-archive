const field=document.querySelector("#collection-field");
const template=document.querySelector("#collection-template");

[...window.WLW_COLLECTIONS].sort((a,b)=>a.label.localeCompare(b.label,"en",{sensitivity:"base"})).forEach(collection=>{
  const node=template.content.cloneNode(true);const button=node.querySelector(".region-crystal");
  button.href=`./collection.html?collection=${encodeURIComponent(collection.slug)}`;
  button.setAttribute("aria-label",collection.label);
  button.querySelector(".country-code").textContent=collection.label;
  field.appendChild(node);
});

function addShards(button){const shapes=["polygon(50% 0,100% 100%,10% 72%)","polygon(0 0,100% 18%,64% 100%,8% 68%)","polygon(26% 0,100% 42%,68% 100%,0 73%)","polygon(0 20%,76% 0,100% 78%,30% 100%)"];for(let index=0;index<8;index+=1){const angle=Math.PI*2*index/8;const distance=95+(index%3)*25;const shard=document.createElement("span");shard.className="crystal-shard";shard.style.setProperty("--shard-shape",shapes[index%shapes.length]);shard.style.setProperty("--shard-x",`${Math.cos(angle)*distance-50}%`);shard.style.setProperty("--shard-y",`${Math.sin(angle)*distance-50}%`);shard.style.setProperty("--shard-rotation",`${index%2?-95:110}deg`);shard.style.setProperty("--shard-delay",`${index*12}ms`);button.appendChild(shard);}}
field.addEventListener("click",event=>{const button=event.target.closest(".region-crystal");if(!button||button.classList.contains("is-shattering"))return;event.preventDefault();const destination=button.href;if(matchMedia("(prefers-reduced-motion: reduce)").matches){location.href=destination;return;}addShards(button);button.classList.add("is-shattering");setTimeout(()=>{location.href=destination;},620);});
window.addEventListener("pageshow",()=>{field.querySelectorAll(".region-crystal").forEach(button=>{button.classList.remove("is-shattering");button.querySelectorAll(".crystal-shard").forEach(shard=>shard.remove());});});