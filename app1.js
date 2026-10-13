const CONFIG={supaUrl:"https://ybhgmlkivpqvogqeabcn.supabase.co",supaKey:"sb_publishable_EB2QWYEmOQR9-6roFiNuXQ__R_k2kZ4",name:"StreamForge",tagline:"Upload a video, pick your YouTube or Facebook channel, and keep it live from a server, not your phone."};
const P={home:"M3 11l9-8 9 8v10H3z",video:"M3 6h13v12H3zM16 10l5-3v10l-5-3",link:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",radio:"M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9M4.5 4.5a10 10 0 0 0 0 15M19.5 4.5a10 10 0 0 1 0 15",clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",list:"M4 6h16M4 12h16M4 18h10",up:"M12 16V4M7 9l5-5 5 5M4 20h16",chart:"M4 20V10M10 20V4M16 20v-8M22 20H2",gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-2 1-2-4-2-1 2h-3L7 2 3 4l1 2-2 2-2 0 0 4 2 0 2 2-1 2 4 2 1-2h3l1 2 4-2-1-2z",help:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h0",shield:"M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z",bolt:"M13 2L4 14h7l-1 8 9-12h-7z",lock:"M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",menu:"M4 7h16M4 12h16M4 17h16"};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const S=[
 ["overview","Overview","home","",""],
 ["import","Import video","up","Add a video by upload or a direct file link you have the right to use.","Milestone 3"],
 ["library","Video library","video","Your videos with duration, resolution and size.","Milestone 3"],
 ["channels","Channels","link","Connect your YouTube channel or Facebook Page.","Milestones 5 and 6"],
 ["create","Go live","radio","","Milestone 4"],
 ["schedules","Schedules","clock","Streams that start at a time you pick.","Milestone 7"],
 ["playlists","24/7 playlists","list","Loop several videos nonstop on a server.","Milestone 7"],
 ["monitor","Active streams","bolt","Live status, uptime and errors reported by the server.","Milestone 7"],
 ["history","History","clock","Past streams and what happened in them.","Milestone 7"],
 ["usage","Plan and usage","chart","Storage, active streams and your plan limits.","Milestone 8"],
 ["settings","Settings","gear","Your name, password and theme.","Milestone 2"],
 ["help","Help","help","",""],
 ["admin","Admin","shield","Users, queue, failed jobs and system health. Admins only.","Milestone 8"]];
const PLANS=[["Free","500 MB",1,1,"720p"],["Basic","5 GB",2,3,"1080p"],["Premium","50 GB",5,5,"1080p"]];
const SU=CONFIG.supaUrl,SK=CONFIG.supaKey;
let sess=null,prof=null,cnt=null,busy=false;
try{sess=JSON.parse(localStorage.getItem("sf_s")||"null")}catch(e){}
function save(v){sess=v;try{v?localStorage.setItem("sf_s",JSON.stringify(v)):localStorage.removeItem("sf_s")}catch(e){}}
async function gt(path,body){const r=await fetch(SU+"/auth/v1/"+path,{method:"POST",headers:{apikey:SK,"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.msg||j.error_description||j.message||("Request failed ("+r.status+")"));return j}
function toSess(j){return{access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),email:(j.user&&j.user.email)||""}}
async function ensure(){if(!sess)return false;if(sess.expires_at-60>Date.now()/1000)return true;try{const j=await gt("token?grant_type=refresh_token",{refresh_token:sess.refresh_token});save({...toSess(j),email:sess.email});return true}catch(e){save(null);return false}}
function rest(p,x){return fetch(SU+"/rest/v1/"+p,{headers:{apikey:SK,Authorization:"Bearer "+sess.access_token,...(x||{})}})}
async function count(p){try{const r=await rest(p,{Prefer:"count=exact",Range:"0-0"});const m=(r.headers.get("content-range")||"").split("/")[1];return r.ok&&m&&m!=="*"?Number(m):null}catch(e){return null}}
async function loadData(){try{if(!(await ensure())){prof=null;return}const r=await rest("profiles?select=display_name,plan_id");if(r.status===401){save(null);prof=null;return}const a=r.ok?await r.json():[];prof=a[0]||{};cnt={v:await count("video_assets?select=id"),a:await count("streaming_jobs?select=id&status=eq.live"),c:await count("destinations_public?select=id")}}catch(e){prof={};cnt={v:null,a:null,c:null}}}
let vids=null,busyV=false;
const fmtS=b=>b>=1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
const fmtT=t=>{t=Math.round(t||0);return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")};
function uid(){try{return JSON.parse(atob(sess.access_token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))).sub}catch(e){return null}}
async function loadVids(){try{if(!(await ensure())){return}const r=await rest("video_assets?select=id,title,size_bytes,duration_s,width,height,status,storage_key,created_at&order=created_at.desc");vids=r.ok?await r.json():[]}catch(e){vids=[]}}
function readMeta(f){return new Promise((res,rej)=>{const v=document.createElement("video"),u=URL.createObjectURL(f);v.preload="metadata";v.onloadedmetadata=()=>{const o={duration:v.duration,width:v.videoWidth,height:v.videoHeight};URL.revokeObjectURL(u);res(o)};v.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("Your browser cannot read this video. Try an MP4 (H.264) file."))};v.src=u})}
function xput(url,f,tok,onp){return new Promise((res,rej)=>{const x=new XMLHttpRequest();x.open("POST",url);x.setRequestHeader("apikey",SK);x.setRequestHeader("Authorization","Bearer "+tok);x.setRequestHeader("Content-Type",f.type);x.setRequestHeader("x-upsert","false");x.upload.onprogress=e=>{if(e.lengthComputable)onp(e.loaded/e.total)};x.onload=()=>{if(x.status<300)return res();let m="Upload failed ("+x.status+")";try{m=JSON.parse(x.responseText).message||m}catch(e){}rej(new Error(m))};x.onerror=()=>rej(new Error("Network error. Check your connection and try again."));x.send(f)})}
async function doUpload(){const f=$("#vf").files[0],m=$("#msg"),pb=$("#pb"),btn=$("#ub");m.hidden=false;let path=null;
 try{if(!f)throw new Error("Choose a video file first.");
  const ext={"video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"}[f.type];
  if(!ext)throw new Error("Only MP4, WebM or MOV videos are allowed.");
  if(f.size>52428800)throw new Error("This file is over 50 MB, the limit on the free Supabase plan.");
  btn.disabled=true;m.textContent="Reading video details...";
  const md=await readMeta(f);
  if(!(await ensure()))throw new Error("Your session ended. Log in again.");
  const id=uid();if(!id)throw new Error("Could not read your account. Log in again.");
  path=id+"/"+crypto.randomUUID()+"."+ext;pb.hidden=false;pb.value=0;m.textContent="Uploading...";
  await xput(SU+"/storage/v1/object/videos/"+path,f,sess.access_token,p=>{pb.value=p});
  const r=await fetch(SU+"/rest/v1/video_assets",{method:"POST",headers:{apikey:SK,Authorization:"Bearer "+sess.access_token,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({user_id:id,title:f.name.replace(/\.[^.]+$/,"").slice(0,120)||"Untitled",storage_key:path,source_type:"upload",size_bytes:f.size,duration_s:isFinite(md.duration)?md.duration:null,width:md.width||null,height:md.height||null,status:"pending"})});
  if(!r.ok){await fetch(SU+"/storage/v1/object/videos/"+path,{method:"DELETE",headers:{apikey:SK,Authorization:"Bearer "+sess.access_token}}).catch(()=>{});throw new Error("Saved the file but could not save its details ("+r.status+"). The upload was removed. Run the Milestone 3 SQL in Supabase, then try again.")}
  vids=null;prof=null;$("#vf").value="";pb.hidden=true;m.innerHTML='Uploaded. See it in <a href="#/app/library">Video library</a>.'
 }catch(err){pb.hidden=true;m.textContent=err.message}finally{btn.disabled=false}}
async function doImport(){const u=$("#uu").value.trim(),m=$("#umsg"),b=$("#ib");m.hidden=false;
 try{if(!u)throw new Error("Paste a video link first.");
  if(!/^https:\/\//i.test(u))throw new Error("The link must start with https://");
  if(!(await ensure()))throw new Error("Your session ended. Log in again.");
  b.disabled=true;m.textContent="Importing... a large file can take a minute.";
  const r=await fetch(SU+"/functions/v1/import-url",{method:"POST",headers:{apikey:SK,Authorization:"Bearer "+sess.access_token,"Content-Type":"application/json"},body:JSON.stringify({url:u})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||j.message||(r.status===404?"The import service is not set up yet. Deploy the import-url function in Supabase.":"Import failed ("+r.status+")"));
  vids=null;prof=null;$("#uu").value="";m.innerHTML='Imported. See it in <a href="#/app/library">Video library</a>.'
 }catch(err){m.textContent=err instanceof TypeError?"Could not reach the import service. Check that the import-url function is deployed.":err.message}finally{b.disabled=false}}
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const logo=`<span class="logo">${ic("radio")}</span>`;

