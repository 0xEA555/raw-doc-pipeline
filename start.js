(function(){
  "use strict";
  var R=RS,esc=R.esc;
  function bar(d,p,x,total){var h="";for(var i=0;i<total;i++){h+='<i class="'+(i<d?"d":i<d+p?"p":i<d+p+x?"x":"")+'"></i>';}return '<div class="bar" aria-hidden="true">'+h+'</div>';}
  function meter(label,d,p,x,total,detail){
    return '<div class="meter"><div class="meter-top"><b>'+esc(label)+'</b><span>'+esc(detail)+'</span></div>'+bar(d,p,x,total)+'</div>';
  }
  function count(list,key){var t={done:0,in_progress:0,issue:0,not_started:0};list.forEach(function(s){t[R.state(s,key)]++;});return t;}
  function detail(t,total){var a=[];if(t.done)a.push(t.done+" done");if(t.in_progress)a.push(t.in_progress+" in progress");if(t.issue)a.push(t.issue+" issue");if(t.not_started)a.push(t.not_started+" not yet");return a.join(" · ");}

  function render(shoots,pieces,attn){
    var fs=R.prods(shoots),N=fs.length;
    var foot=["ingest","backup","stringouts","markers","transcripts"].map(function(k){
      var t=count(fs,k),c=R.COLS.filter(function(c){return c.key===k;})[0];
      return meter(c.label,t.done,t.in_progress,t.issue,N,detail(t,N));
    }).join("");
    var sc=count(fs,"story_cut");
    var story=meter("Story cuts",sc.done,sc.in_progress,0,N,detail(sc,N))+
      '<p class="note" style="margin:10px 0 0">One story cut per production, built from the marked footage.</p>';
    var edited=pieces.filter(function(p){return p.type!=="spine";}),spines=pieces.filter(function(p){return p.type==="spine";});
    var cnt={not_started:0,rough:0,rs_treatment:0,rs_approval:0,published:0};
    edited.forEach(function(p){cnt[R.chainIndex(p.stage)<0?"not_started":p.stage]++;});
    var moving=cnt.rough+cnt.rs_treatment+cnt.rs_approval,pub=cnt.published;
    var shot=spines.filter(function(p){return (R.SPINE[p.status]||{n:0}).n>=2;}).length;
    var pc=meter("Pieces",pub,moving,0,edited.length,edited.length+" listed · "+(moving+pub)+" under way")+
      meter("Spine interviews shot",shot,0,0,spines.length,shot+" of "+spines.length)+
      '<p class="note" style="margin:10px 0 0">Episodes, cutdowns, RAW cuts, clips and the feature. Cutdowns are still being catalogued.</p>';
    var sec=function(t,body,href,go){return '<div class="card meter-card"><h3>'+esc(t)+'</h3>'+body+(href?'<a class="go" href="'+href+'">'+esc(go)+' →</a>':'')+'</div>';};

    var items=[];
    shoots.forEach(function(s){ if(s.flag&&(s.flag_level==="issue"||s.flag_level==="todo")) items.push({level:s.flag_level,title:(s.number?s.number+". ":"")+s.name,text:s.flag,href:"footage.html#/"+s.id}); });
    var phone=shoots.filter(function(s){return s.footage&&(s.sources||[]).some(function(x){return (x.camera==="iPhone"||x.camera==="Ray-Ban")&&x.ingest==="in_progress";});}).length;
    if(phone) items.push({level:"todo",title:"iPhone and Ray-Ban footage",text:"Still exporting from iCloud for "+phone+" productions. The main camera footage is fully ingested."});
    (attn||[]).forEach(function(a){items.push(a);});
    items.sort(function(a,b){return (a.level==="issue"?0:1)-(b.level==="issue"?0:1);});
    var attnHtml=items.map(function(i){return '<li class="'+(i.level==="issue"?"is-issue":"")+'"><b>'+esc(i.title)+'</b><span>'+esc(i.text)+'</span></li>';}).join("");

    var tiers=[["Feature / docuseries","Long arc","The full story of James, Race Service and AMG over multiple years."],
      ["Episodes","12 to 20 min, YouTube","One per shoot, each built around its own spine interview. The priority."],
      ["Topical cutdowns","Mini episodes","One experience each, such as Nico on Art Cars or the HWA tour."],
      ["RAW cuts","Multi-hour","Nearly uncut days with an audio pass and sensitive moments removed. First one: the Tutto Bene media day."],
      ["Clips and sizzle","10 to 90 sec","BTS moments for social and a sizzle reel, pulled from the same marked footage."]];

    return ''+
    '<section class="sec"><div class="sec-head"><h2>What this is</h2></div>'+
      '<p class="lede"><b>Act I, before the headline.</b> The RAW Doc follows James Kirkham while the outcome is still open: the road to racing the next AMG, Adidas, Michelin, Race Service GT3 car, and ultimately Le Mans.</p>'+
      '<div class="grid" style="margin-top:16px">'+
        '<div class="card"><h3>The entrepreneurial rise</h3><p class="summary">From selling real estate at 19 to fund a track car, through GoPro and Donut Media, to founding Race Service around community.</p></div>'+
        '<div class="card"><h3>The Mercedes-AMG integration</h3><p class="summary">A five-year relationship that grew into the AMG GT3 RAW Spec program and a creative role inside AMG\'s cultural outreach.</p></div>'+
        '<div class="card"><h3>The road to Le Mans</h3><p class="summary">The first love never left. Track time, the Nürburgring, a race-capable GT3, and the pull toward the 24 Hours.</p></div>'+
      '</div>'+
      '<p class="note" style="margin-top:14px">This site shows where the post-production stands: that the footage is organized and prepared, what is being cut, and what comes next. It tracks the work only.</p></section>'+

    '<section class="sec"><div class="sec-head"><h2>Where it stands</h2><span class="sec-meta">'+N+' productions filmed</span></div>'+
      '<div class="meters">'+sec("Footage prepared",foot,"footage.html","Open the footage")+sec("Story",story,"footage.html","See each production")+sec("Pieces",pc,"pieces.html","Open the pieces")+'</div></section>'+

    '<section class="sec"><div class="sec-head"><h2>Needs attention</h2><span class="sec-meta">'+items.length+' open</span></div>'+
      '<ul class="attn">'+attnHtml+'</ul></section>'+

    '<section class="sec"><div class="sec-head"><h2>How the footage becomes story</h2></div><ul class="list">'+
      tiers.map(function(t){return '<li class="tier"><div class="tier-name">'+esc(t[0])+'<small>'+esc(t[1])+'</small></div><div>'+esc(t[2])+'</div></li>';}).join("")+'</ul></section>'+

    '<section class="sec"><div class="sec-head"><h2>How work moves</h2></div>'+
      '<div class="card"><div class="pathway"><div>EA rough cut<span class="who">EA Productions</span></div><span class="arrow">→</span><div>RS treatment<span class="who">Carlos</span></div><span class="arrow">→</span><div>RS final approval<span class="who">Race Service</span></div><span class="arrow">→</span><div>Published<span class="who">YouTube</span></div></div>'+
      '<p class="note" style="margin:6px 0 0">Every piece follows this chain, except the spine interviews, which are shot first. Cuts, notes and approvals live in Frame.io.</p></div></section>'+

    '<section class="sec"><div class="sec-head"><h2>Go deeper</h2></div><div class="grid">'+
      '<a class="card" href="footage.html"><h3>The footage</h3><p class="summary">Every production, every day: how it is organized and prepared, with the markers and key moments of each day.</p><span class="go">Open the footage →</span></a>'+
      '<a class="card" href="pieces.html"><h3>The pieces</h3><p class="summary">Everything being cut from the footage, by type or by shoot, and where each piece sits in the approval chain.</p><span class="go">Open the pieces →</span></a>'+
    '</div></section>';
  }
  Promise.all([R.load("data/shoots.json"),R.load("data/pieces.json"),R.load("data/attention.json").catch(function(){return [];})]).then(function(r){
    document.getElementById("view").innerHTML=render(r[0],r[1],r[2]);
  }).catch(function(e){R.fail("view",e);});
})();
