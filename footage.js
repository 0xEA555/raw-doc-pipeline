(function(){
  "use strict";
  var R=RS,esc=R.esc,n=R.n;
  var shoots=[],pieces=[],days={},byPiece={},byShoot={};
  function hm(sec){var h=Math.floor(sec/3600),m=Math.round((sec%3600)/60);if(m===60){h++;m=0;}return h+":"+(m<10?"0":"")+m;}
  function stats(){
    var f=R.prods(shoots),sum=function(k){return f.reduce(function(t,s){return t+(s.footage[k]||0);},0);};
    var items=[[f.filter(function(s){return s.number;}).length,"productions"],[sum("bins"),"bins"],[n(sum("clips")),"clips"],[Math.round(sum("hours")),"hours of footage"],[sum("day_stringouts"),"days built"],[n(sum("markers")),"markers"]];
    document.getElementById("stats").innerHTML=items.map(function(i){return '<span><b>'+esc(i[0])+'</b> '+esc(i[1])+'</span>';}).join("");
  }
  function crumbs(parts){
    document.getElementById("crumbs").innerHTML=parts.map(function(p){return p[1]?'<a href="'+p[1]+'">'+esc(p[0])+'</a>':'<span>'+esc(p[0])+'</span>';}).join('<i>/</i>');
  }
  function sub(s){var f=s.footage;return R.fmtDate(s.date)+' · '+f.bins+(f.bins===1?' bin':' bins')+' · '+n(f.clips)+' clips · '+f.hours.toFixed(1)+' h · '+f.day_stringouts+(f.day_stringouts===1?' day':' days')+' · '+n(f.markers)+' markers';}
  function piecesOf(id){return pieces.filter(function(p){return p.type!=="spine"&&R.rootShoot(p,byPiece,byShoot)===id;});}

  function viewProductions(){
    crumbs([["Footage"]]);
    var list=R.prods(shoots);
    var head=R.COLS.map(function(c){
      var t={done:0,in_progress:0,issue:0,not_started:0};list.forEach(function(s){t[R.state(s,c.key)]++;});
      var a=[];if(t.done)a.push(t.done+" done");if(t.in_progress)a.push(t.in_progress+" in progress");if(t.issue)a.push(t.issue+" issue");if(t.not_started)a.push(t.not_started+" not yet");
      return '<div class="mx-h"><b>'+esc(c.label)+'</b><span>'+esc(a.join(" · "))+'</span></div>';
    }).join("");
    var rows=list.map(function(s){
      var issue=(s.stages||{}).markers==="issue";
      return '<a class="mx-row is-link'+(issue?' has-issue':'')+'" href="#/'+esc(s.id)+'">'+
        '<div class="mx-name"><div class="mx-title">'+(s.number?'<span class="num">'+s.number+'</span>':'')+esc(s.name)+'</div><div class="mx-sub">'+esc(sub(s))+'</div></div>'+
        R.COLS.map(function(c){return '<div class="mx-c">'+R.pill(s,c.key)+'</div>';}).join("")+
        '<div class="mx-go">Open →</div>'+(s.flag?'<div class="mx-flag'+(issue?' is-issue':'')+'">'+esc(s.flag)+'</div>':'')+'</a>';
    }).join("");
    var defs='<dl class="defs">'+R.COLS.map(function(c){return '<div><dt>'+esc(c.label)+'</dt><dd>'+esc(c.tip)+'</dd></div>';}).join("")+'</dl>';
    return '<section class="sec"><div class="sec-head"><h2>Where every production stands<span class="count">'+list.length+'</span></h2></div>'+
      '<p class="note">Every production moves through the same six steps. Read across a row to see how far one has come, or down a column to see where the work is. Open a production to see its days and the pieces cut from it.</p>'+
      '<div class="mx"><div class="mx-head"><div></div>'+head+'<div></div></div>'+rows+'</div>'+
      '<p class="note" style="margin-top:12px">Ingested covers the main camera footage. iPhone and Ray-Ban footage is exported from iCloud separately and is still coming in for some productions.</p>'+
      '<details class="more"><summary>What each step means</summary>'+defs+'</details></section>';
  }

  function timeline(d,compact){
    var pins="",ticks="";
    d.moments.forEach(function(m){if(m.held)return;if(m.hl&&!compact)return;ticks+='<i class="tk tk-'+m.cat+'" style="left:'+(m.t*100).toFixed(2)+'%"></i>';});
    if(!compact){var k=0;d.moments.forEach(function(m){if(!m.hl)return;pins+='<b class="pin lvl'+(k++%2)+'" style="left:'+(m.t*100).toFixed(2)+'%" title="'+esc(m.label)+'">'+m.n+'</b>';});}
    return '<div class="tl'+(compact?' tl-compact':'')+'">'+(compact?'':'<div class="tl-pins">'+pins+'</div>')+'<div class="tl-bar">'+ticks+'</div>'+(compact?'':'<div class="tl-scale"><span>0:00</span><span>'+hm(d.total_s/2)+'</span><span>'+hm(d.total_s)+'</span></div>')+'</div>';
  }

  function statusRow(s){
    return '<div class="mx mx-one"><div class="mx-head"><div></div>'+R.COLS.map(function(c){return '<div class="mx-h"><b>'+esc(c.label)+'</b></div>';}).join("")+'<div></div></div>'+
      '<div class="mx-row"><div class="mx-name"><div class="mx-sub">'+esc(sub(s))+'</div></div>'+R.COLS.map(function(c){return '<div class="mx-c">'+R.pill(s,c.key)+'</div>';}).join("")+'<div></div>'+(s.backup_note?'<div class="mx-flag">Backup: '+esc(s.backup_note)+'</div>':'')+(s.flag?'<div class="mx-flag'+(s.flag_level==="issue"?' is-issue':'')+'">'+esc(s.flag)+'</div>':'')+'</div></div>';
  }

  function viewProduction(id){
    var s=byShoot[id];if(!s||!s.footage)return viewProductions();
    var D=days[id];
    crumbs([["Footage","#/"],[s.name]]);
    var h='<section class="sec"><div class="sec-head"><h2>'+(s.number?'<span class="num">'+s.number+'</span>':'')+esc(s.name)+'</h2><span class="sec-meta">'+esc(R.fmtDate(s.date))+(s.location?' · '+esc(s.location):'')+'</span></div>'+statusRow(s)+'</section>';
    if(D){
      h+='<section class="sec"><div class="sec-head"><h2>Days<span class="count">'+D.days.length+'</span></h2></div>'+
        '<p class="note">One uncut stringout for each natural day, wake to sleep. The bar is the day, with a tick wherever a marker sits. Summaries are written from the markers, and from transcripts where a day has no markers.</p><div class="grid">'+
        D.days.map(function(d){return '<a class="card" href="#/'+esc(id)+'/'+d.day+'"><h3><span class="num">Day '+d.day+'</span>'+esc(d.title)+'</h3><div class="meta">'+esc(d.label)+'</div>'+timeline(d,true)+'<div class="meta">'+d.clips+' clips · '+d.hours.toFixed(1)+' h · '+d.markers+' markers</div><p class="summary">'+esc(d.summary)+'</p><span class="go">Open the day →</span></a>';}).join("")+'</div></section>';
    } else {
      h+='<section class="sec"><div class="sec-head"><h2>Days<span class="count">'+s.footage.day_stringouts+'</span></h2></div>'+
        '<p class="note">'+s.footage.day_stringouts+' day stringouts are built for this production. The day-by-day view with markers and key moments is not published yet.</p></section>';
    }
    var ps=piecesOf(id);
    h+='<section class="sec"><div class="sec-head"><h2>Pieces from this production<span class="count">'+ps.length+'</span></h2></div>'+
      (ps.length?'<ul class="list">'+ps.map(function(p){var t=R.typeInfo(p.type);return '<li><a class="tier" style="text-decoration:none;color:inherit" href="pieces.html#'+esc(p.id)+'"><div class="tier-name">'+esc(p.title)+'<small>'+esc(t.label)+'</small></div><div>'+esc(R.chainLabel(p.stage))+' →</div></a></li>';}).join("")+'</ul>':
        '<p class="note">No pieces are listed for this production yet.</p>')+'</section>';
    return h;
  }

  function keyItem(m){return '<li class="km"><span class="km-n">'+m.n+'</span><div><div class="km-label">'+esc(m.label)+'</div><div class="meta">Clip '+esc(m.clip.replace("MVI_",""))+' · '+esc(m.at)+'</div></div></li>';}
  function logItem(m){return '<li class="mom mom-'+m.cat+'"><span class="mom-at">'+esc(m.clip.replace("MVI_",""))+' · '+esc(m.at)+'</span><span class="mom-name">'+esc(m.name||"(unnamed)")+'</span>'+(m.note?'<span class="mom-note">'+esc(m.note)+'</span>':'')+'</li>';}
  function viewDay(id,num){
    var s=byShoot[id],D=days[id];if(!s||!D)return viewProductions();
    var d=D.days.filter(function(x){return x.day===+num;})[0];if(!d)return viewProduction(id);
    crumbs([["Footage","#/"],[s.name,"#/"+id],["Day "+d.day]]);
    var shown=d.moments.filter(function(m){return !m.held;}),hl=shown.filter(function(m){return m.hl;});
    var c={story:0,texture:0,sync:0};shown.forEach(function(m){c[m.cat]++;});
    var st=function(v,l){return '<div class="dstat"><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>';};
    var prev=d.day>1?'<a class="btn" href="#/'+id+'/'+(d.day-1)+'">← Day '+(d.day-1)+'</a>':'<span></span>';
    var next=d.day<D.days.length?'<a class="btn" href="#/'+id+'/'+(d.day+1)+'">Day '+(d.day+1)+' →</a>':'<span></span>';
    var warn=s.flag_level==="issue"&&s.flag?'<div class="banner" style="margin:0 0 16px">'+esc(s.flag)+'</div>':'';
    return warn+'<section class="sec"><div class="sec-head"><h2><span class="num">Day '+d.day+'</span>'+esc(d.title)+'</h2><span class="sec-meta">'+esc(d.label+", "+(s.date||"").slice(0,4))+'</span></div>'+
      '<p class="lede">'+esc(d.summary)+'</p>'+'</section>'+
      '<section class="sec"><div class="dstats">'+st(d.hours.toFixed(1)+" h","of footage")+st(d.clips,"clips")+st(shown.length||!(s.flag_level==="issue")?d.markers:"Not exported","markers")+st(d.transcribed+" of "+d.clips,"clips transcribed")+'</div>'+
      '<p class="note" style="margin-top:10px">Footage from bin'+(d.bins.length>1?'s ':' ')+esc(d.bins.join(" and "))+'.'+'</p></section>'+
      (shown.length?'<section class="sec"><div class="sec-head"><h2>The shape of the day</h2></div><p class="note">The whole day, start to finish. Numbered pins are the key moments below. Ticks are markers: blue for story, grey for texture and coverage, orange for sync notes.</p>'+timeline(d,false)+'</section>':'')+
      '<section class="sec"><div class="sec-head"><h2>Key moments<span class="count">'+hl.length+'</span></h2></div>'+(hl.length?'<ol class="list">'+hl.map(keyItem).join("")+'</ol>':'<p class="note">No key moments yet for this day.</p>')+'</section>'+
      (shown.length?'<section class="sec"><details class="more"><summary>Every marker in this day ('+shown.length+')<span>'+c.story+' story · '+c.texture+' texture and coverage · '+c.sync+' sync notes</span></summary><ul class="list">'+shown.map(logItem).join("")+'</ul></details></section>':'')+
      '<div class="daynav">'+prev+next+'</div>';
  }

  function route(){
    var h=(location.hash||"#/").replace(/^#\/?/,"").split("/").filter(Boolean),html;
    if(!h.length)html=viewProductions();else if(h.length===1)html=viewProduction(h[0]);else html=viewDay(h[0],h[1]);
    document.getElementById("view").innerHTML=html;window.scrollTo(0,0);
  }
  Promise.all([R.load("data/shoots.json"),R.load("data/pieces.json"),R.load("data/days.json")]).then(function(r){
    shoots=r[0];pieces=r[1];days=r[2].productions;byShoot=R.index(shoots);byPiece=R.index(pieces);
    stats();route();window.addEventListener("hashchange",route);
  }).catch(function(e){R.fail("view",e);});
})();
