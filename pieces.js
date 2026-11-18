(function(){
  "use strict";
  var R=RS,esc=R.esc,TYPES=R.TYPES,CHAIN=R.CHAIN,SPINE=R.SPINE;
  var shoots=[],pieces=[],byShoot={},byPiece={},ui={group:"type",typeFilters:{}};
  function sortedShoots(){return R.prods(shoots);}
  function childrenOf(id){return pieces.filter(function(p){return p.parent===id;});}
  function root(p){return R.rootShoot(p,byPiece,byShoot);}
  function lineage(p){
    if(p&&p.type==="spine"&&p.for_episode&&byPiece[p.for_episode])return ["For "+byPiece[p.for_episode].title,p.title];
    var out=[],cur=p,g=0;
    while(cur&&g++<20){out.unshift(cur.title);if(cur.parent&&byPiece[cur.parent]){cur=byPiece[cur.parent];continue;}
      out.unshift(cur.shoot==="all"?"All shoots":(cur.shoot&&byShoot[cur.shoot])?byShoot[cur.shoot].name:"Source to confirm");break;}
    return out;
  }
  function filtered(list){var on=Object.keys(ui.typeFilters).filter(function(k){return ui.typeFilters[k];});return on.length?list.filter(function(p){return ui.typeFilters[p.type];}):list;}
  function stageCls(st){return st==="published"?"st-done":R.chainIndex(st)>=0?"st-prog":"st-none";}
  function spineCls(s){var k=(SPINE[s]||{n:0}).n;return k===3?"st-done":k>0?"st-prog":"st-none";}
  function stats(){
    var sp=pieces.filter(function(p){return p.type==="spine";}),ed=pieces.filter(function(p){return p.type!=="spine";});
    var shot=sp.filter(function(p){return (SPINE[p.status]||{n:0}).n>=2;}).length;
    var moving=ed.filter(function(p){return R.chainIndex(p.stage)>=0&&p.stage!=="published";}).length;
    var pub=ed.filter(function(p){return p.stage==="published";}).length;
    var idle=ed.length-moving-pub;
    document.getElementById("stats").innerHTML=[[ed.length,"pieces"],[idle,"not started"],[moving,"in progress"],[pub,"published"],[shot+"/"+sp.length,"spines shot"]].map(function(i){return '<span><b>'+esc(i[0])+'</b> '+esc(i[1])+'</span>';}).join("");
  }
  function footage(p){
    if(p.shoot==="all")return {t:"Draws on all shoots",c:"st-none"};
    var s=byShoot[root(p)];if(!s)return {t:"Source to confirm",c:"st-issue"};
    if(s.kind==="planned")return {t:"Not shot yet",c:"st-none"};
    var st=s.stages||{};
    if(st.story_cut==="done")return {t:"Story cut done",c:"st-done"};
    if(st.story_cut==="in_progress")return {t:"Story cut in progress",c:"st-prog"};
    if(st.markers==="in_progress")return {t:"Markers in progress",c:"st-prog"};
    if(st.markers==="done")return {t:"Marked",c:"st-prog"};
    if(st.stringouts==="done")return {t:"Stringouts done",c:"st-prog"};
    return {t:"Ingested",c:"st-prog"};
  }
  function chainBar(p){var idx=R.chainIndex(p.stage);return '<span class="chain" title="'+esc(R.chainLabel(p.stage))+'">'+CHAIN.map(function(s,i){return '<span class="cs'+((p.stage==="published"||i<idx)?" is-done":i===idx?" is-current":"")+'"></span>';}).join("")+'</span>';}
  function fact(l,v,c,x){return '<div class="fact"><dt>'+esc(l)+'</dt><dd><i class="dot '+c+'"></i>'+esc(v)+(x||"")+'</dd></div>';}
  function card(p){
    var ti=R.typeInfo(p.type),src="",facts;
    if(p.type==="spine"){var ep=byPiece[p.for_episode];src=ep?"Feeds "+ep.title:"";facts=fact("Status",(SPINE[p.status]||SPINE.not_started).label,spineCls(p.status));}
    else{
      if(p.parent&&byPiece[p.parent])src="From "+byPiece[p.parent].title;
      else{var rs=byShoot[root(p)];if(rs)src=(rs.name===p.title?"":rs.name+" · ")+R.fmtDate(rs.date);}
      var fo=footage(p);facts=fact("Footage",fo.t,fo.c);
      if(p.spine_id&&byPiece[p.spine_id]){var sp=byPiece[p.spine_id];facts+=fact("Spine",(SPINE[sp.status]||SPINE.not_started).label,spineCls(sp.status));}
      facts+=fact("Piece",R.chainLabel(p.stage),stageCls(p.stage),chainBar(p));
    }
    if(p.frameio_url)facts+=fact("Frame.io",p.frameio_label||"Linked","st-done");
    return '<button class="card piece-card" data-piece="'+esc(p.id)+'" style="--c:'+ti.color+'"><div class="card-head"><span class="type-tag">'+esc(ti.label)+'</span><span class="spec">'+esc(ti.spec)+'</span></div><h3>'+esc(p.title)+'</h3>'+(src?'<div class="meta">'+esc(src)+'</div>':'')+'<dl class="facts">'+facts+'</dl>'+(p.notes?'<div class="card-notes">'+esc(p.notes)+'</div>':'')+'</button>';
  }
  function group(title,items,meta,desc){
    return '<section class="sec"><div class="sec-head"><h2>'+esc(title)+'<span class="count">'+items.length+'</span></h2>'+(meta?'<span class="sec-meta">'+esc(meta)+'</span>':'')+'</div>'+(desc?'<p class="note">'+esc(desc)+'</p>':'')+'<div class="grid">'+items.map(card).join("")+'</div></section>';
  }
  function body(){
    var list=filtered(pieces),h="";
    if(ui.group==="type"){TYPES.forEach(function(t){var it=list.filter(function(p){return p.type===t.key;});if(it.length)h+=group(t.label,it,t.spec,t.desc);});}
    else{
      sortedShoots().forEach(function(s){var it=list.filter(function(p){return root(p)===s.id;});if(it.length)h+=group((s.number?s.number+". ":"")+s.name,it,R.fmtDate(s.date));});
      var loose=list.filter(function(p){return !root(p);});if(loose.length)h+=group("Across shoots",loose,"Sizzle, feature and pieces with a source to confirm");
    }
    return h||'<p class="note">No pieces match this filter.</p>';
  }
  function render(){
    stats();
    document.getElementById("filters").innerHTML=TYPES.map(function(t){var on=!!ui.typeFilters[t.key];return '<button class="chip'+(on?' is-active':'')+'" data-type="'+t.key+'" aria-pressed="'+on+'" style="--c:'+t.color+'">'+(on?'✓ ':'')+esc(t.label)+'</button>';}).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#group-seg button"),function(b){var on=b.getAttribute("data-group")===ui.group;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",on?"true":"false");});
    document.getElementById("board").innerHTML=body();
  }
  function jump(id,l){return '<button class="dialog-link-btn" data-piece="'+esc(id)+'">'+esc(l)+' →</button>';}
  function open(id,noHash){
    var p=byPiece[id];if(!p)return;
    var ti=R.typeInfo(p.type),fd=function(l,h){return '<div class="dialog-field"><div class="dialog-label">'+esc(l)+'</div>'+h+'</div>';};
    var extra=(p.also_from||[]).filter(function(k){return byShoot[k];}).map(function(k){return byShoot[k].name;});
    var kids=childrenOf(p.id),fo=footage(p),rs=root(p),b;
    var seeFootage=rs&&byShoot[rs]&&byShoot[rs].footage?' <a class="dialog-link" href="footage.html#/'+esc(rs)+'">See the footage →</a>':'';
    if(p.type==="spine"){var ep=byPiece[p.for_episode];b=fd("Status",esc((SPINE[p.status]||SPINE.not_started).label))+(ep?fd("Feeds",jump(ep.id,ep.title)):"")+fd("Footage it draws on",esc(fo.t)+seeFootage);}
    else{
      var idx=R.chainIndex(p.stage),steps=CHAIN.map(function(s,i){return '<li class="'+((p.stage==="published"||i<idx)?"st-done":i===idx?"st-prog":"st-none")+'">'+esc(s.label)+'</li>';}).join("");
      var sp=p.spine_id&&byPiece[p.spine_id];
      b=fd("Footage",esc(fo.t)+seeFootage)+fd("Chain",'<ol class="chain-list">'+steps+'</ol>')+(sp?fd("Spine · Carlos · FX3 · James",esc((SPINE[sp.status]||SPINE.not_started).label)+' '+jump(sp.id,"Open spine")):"");
    }
    document.getElementById("dialog-inner").innerHTML='<button class="dialog-close" data-close aria-label="Close">&times;</button><div class="dialog-crumb">'+esc(lineage(p).slice(0,-1).join(" › "))+'</div><h2>'+esc(p.title)+'</h2><div class="meta">'+esc(ti.label)+' · '+esc(ti.spec)+'</div><p class="dialog-desc">'+esc(ti.desc)+'</p>'+b+
      (extra.length?fd("Also draws from",esc(extra.join(", "))):"")+(kids.length?fd("Cut from this",esc(kids.map(function(k){return k.title;}).join(", "))):"")+(p.notes?fd("Notes",esc(p.notes)):"")+
      (p.frameio_url?fd("Frame.io",(p.frameio_label?esc(p.frameio_label)+'<br>':'')+'<a class="dialog-link" href="'+esc(p.frameio_url)+'" target="_blank" rel="noopener">Open in Frame.io →</a>'):"")+
      (p.youtube_url?fd("Published",'<a class="dialog-link" href="'+esc(p.youtube_url)+'" target="_blank" rel="noopener">Watch on YouTube →</a>'):"");
    var d=document.getElementById("card-dialog");
    if(!d.open){if(typeof d.showModal==="function")d.showModal();else d.setAttribute("open","");}
    if(!noHash)try{history.replaceState(null,"","#"+id);}catch(e){}
  }
  function wire(){
    document.getElementById("group-seg").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;ui.group=b.getAttribute("data-group");render();});
    document.getElementById("filters").addEventListener("click",function(e){var c=e.target.closest(".chip");if(!c)return;var t=c.getAttribute("data-type");ui.typeFilters[t]=!ui.typeFilters[t];render();});
    document.getElementById("board").addEventListener("click",function(e){var r=e.target.closest("[data-piece]");if(r)open(r.getAttribute("data-piece"));});
    var d=document.getElementById("card-dialog");
    d.addEventListener("click",function(e){var j=e.target.closest("[data-piece]");if(j){open(j.getAttribute("data-piece"));return;}if(e.target.closest("[data-close]")||e.target===d){if(d.close)d.close();else d.removeAttribute("open");}});
    d.addEventListener("close",function(){try{history.replaceState(null,"",location.pathname);}catch(e){}});
  }
  wire();
  Promise.all([R.load("data/shoots.json"),R.load("data/pieces.json")]).then(function(r){
    shoots=r[0];pieces=r[1];byShoot=R.index(shoots);byPiece=R.index(pieces);render();
    var h=location.hash.replace("#","");if(h&&byPiece[h])open(h,true);
  }).catch(function(e){R.fail("board",e);});
})();
