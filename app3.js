function appShell(id){
 const s=S.find(x=>x[0]===id)||S[0];
 const link=x=>`<a class="nv ${x[0]===id?"on":""}" href="#/app/${x[0]}">${ic(x[2])}${x[1]}</a>`;
 const bn=["overview","library","create","monitor"].map(k=>S.find(x=>x[0]===k));
 return `<div class="app"><aside class="side"><a class="brand" href="#/">${logo}${esc(CONFIG.name)}</a>${S.map(link).join("")}</aside><div class="main"><header class="top"><a class="brand mb" href="#/app">${logo}${esc(CONFIG.name)}</a><h2 class="dt">${s[1]}</h2><span class="tag">${prof&&prof.plan_id?esc(prof.plan_id):"your"} plan</span><button class="g" data-theme-toggle>Theme</button><button class="g" id="lo">Log out</button></header><div class="cont"><h2 class="mt">${s[1]}</h2>${body(id)}</div></div></div>
 <nav class="bot">${bn.map(x=>`<a class="${x[0]===id?"on":""}" href="#/app/${x[0]}">${ic(x[2])}${x[1].split(" ")[0]}</a>`).join("")}<button id="mb">${ic("menu")}More</button></nav>
 <div class="sheet" id="sh"><div>${S.map(link).join("")}</div></div>`;
}
function render(){
 const h=location.hash.replace(/^#\/?/,"");
 if(h.startsWith("app")&&!sess){location.hash="#/login";return}
 if(h.startsWith("app")&&prof===null&&!busy){busy=true;loadData().then(()=>{busy=false;render()})}
 if(h==="app/library"&&vids===null&&!busyV){busyV=true;loadVids().then(()=>{busyV=false;render()})}
 $("#root").innerHTML=h.startsWith("app")?appShell(h.split("/")[1]||"overview"):(pages[h]||pages.home)();
 window.scrollTo(0,0);
 document.querySelectorAll("[data-theme-toggle]").forEach(b=>b.onclick=()=>{const r=document.documentElement;const d=getComputedStyle(r).getPropertyValue("--bg").trim()==="#0a0e1a";r.dataset.theme=d?"light":"dark"});
 const af=$("#af"),cf=$("#cf"),mb=$("#mb"),sh=$("#sh");
 if(af)af.onsubmit=async e=>{e.preventDefault();const m=$("#msg"),reg=!!$("#n"),btn=af.querySelector("button");m.hidden=false;m.textContent="Please wait...";btn.disabled=true;try{const em=$("#e").value.trim(),pw=$("#p").value;let j;if(reg){j=await gt("signup",{email:em,password:pw,data:{display_name:$("#n").value.trim()}});if(!j.access_token){m.textContent="Account created. Check your email, tap the confirmation link, then log in.";btn.disabled=false;return}}else j=await gt("token?grant_type=password",{email:em,password:pw});save({...toSess(j),email:em});prof=null;cnt=null;location.hash="#/app"}catch(err){m.textContent=err.message;btn.disabled=false}};
 const vfm=$("#vform");if(vfm)vfm.onsubmit=e=>{e.preventDefault();doUpload()};
 const uf=$("#uform");if(uf)uf.onsubmit=e=>{e.preventDefault();doImport()};
 const lo=$("#lo");if(lo)lo.onclick=()=>{save(null);prof=null;cnt=null;vids=null;location.hash="#/login"};
 if(cf)cf.onsubmit=e=>{e.preventDefault();const m=$("#msg");m.hidden=false;m.textContent="Cannot go live yet. This needs the streaming server (Milestone 4) and a connected channel."};
 if(mb){mb.onclick=()=>sh.classList.add("open");sh.onclick=e=>{if(e.target===sh||e.target.closest("a"))sh.classList.remove("open")}}
}
document.addEventListener("click",async e=>{
 const d=e.target.closest("[data-del]"),p=e.target.closest("[data-pv]");
 const v=vids&&vids.find(x=>x.id===(d||p||{dataset:{}}).dataset[d?"del":"pv"]);
 if(!v||!sess)return;
 const H={apikey:SK,Authorization:"Bearer "+sess.access_token};
 if(p){const box=document.getElementById("pv-"+v.id);box.textContent="Loading preview...";
  try{const r=await fetch(SU+"/storage/v1/object/sign/videos/"+v.storage_key,{method:"POST",headers:{...H,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:3600})});const j=await r.json();if(!r.ok)throw new Error(j.message||"Could not load preview");
   const vd=document.createElement("video");vd.controls=true;vd.playsInline=true;vd.style.cssText="width:100%;margin-top:12px;border-radius:10px";vd.src=SU+"/storage/v1"+j.signedURL;box.textContent="";box.appendChild(vd)}
  catch(err){box.textContent=err.message}}
 if(d){if(!confirm("Delete this video? This cannot be undone."))return;
  try{await fetch(SU+"/storage/v1/object/videos/"+v.storage_key,{method:"DELETE",headers:H});
   const r=await fetch(SU+"/rest/v1/video_assets?id=eq."+encodeURIComponent(v.id),{method:"DELETE",headers:H});
   if(!r.ok)throw new Error("Could not delete ("+r.status+")");vids=null;prof=null;render()}
  catch(err){alert(err.message)}}
});
window.addEventListener("hashchange",render);ensure().then(render);

