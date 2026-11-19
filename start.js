(function(){
  "use strict";
  var R=RS,esc=R.esc,n=R.n;

  function shootStatus(s){
    if(!s.footage||!s.footage.clips)return {t:"Shooting now",c:"st-prog"};
    var st=s.stages||{};
    if(st.story_cut==="done")return {t:"Story cut done",c:"st-done"};
    if(st.story_cut==="in_progress")return {t:"Story cut underway",c:"st-prog"};
    return {t:"Marked, ready to cut",c:"st-none"};
  }
  function tally(pieces,types){
    var l=pieces.filter(function(p){return types.indexOf(p.type)>=0;});
    var live=l.filter(function(p){return p.stage!=="not_started"&&p.stage!=="published";}).length;
    var pub=l.filter(function(p){return p.stage==="published";}).length;
    var a=[l.length+" mapped"];if(live)a.push(live+" underway");if(pub)a.push(pub+" published");
    return a.join(" · ");
  }

  function render(shoots,pieces,days){
    var fs=R.prods(shoots).filter(function(s){return s.footage.clips;});
    var sum=function(k){return fs.reduce(function(t,s){return t+(s.footage[k]||0);},0);};
    var dayCount=0,moments=0;
    Object.keys(days.productions||{}).forEach(function(k){days.productions[k].days.forEach(function(d){dayCount++;d.moments.forEach(function(m){if(m.hl)moments++;});});});
    var edited=pieces.filter(function(p){return p.type!=="spine";});
    var glance=[[Math.round(sum("hours")),"hours of footage","Shot across "+fs.length+" productions since August 2025."],
      [n(sum("clips")),"clips","Every one organized into its day and backed up."],
      [dayCount,"days laid out","Each natural day, wake to sleep, ready to cut from."],
      [moments,"key moments pulled","The scenes worth building on, found by working through each day."],
      [edited.length,"pieces mapped","Episodes, cutdowns, RAW cuts, clips and the feature."]];
    var glanceHtml='<div class="glance">'+glance.map(function(g){return '<div class="g"><b>'+esc(g[0])+'</b><span class="gl">'+esc(g[1])+'</span><span class="gd">'+esc(g[2])+'</span></div>';}).join("")+'</div>';

    var road=shoots.filter(function(s){return s.footage&&s.number;}).sort(function(a,b){return a.number-b.number;}).map(function(s){
      var st=shootStatus(s),f=s.footage;
      var when=s.dates?s.dates+", "+(s.date||"").slice(0,4):R.fmtDate(s.date);
      var size=f.clips?f.hours.toFixed(1)+" h · "+f.day_stringouts+(f.day_stringouts===1?" day":" days"):"Footage not in yet";
      return '<a class="road-row" href="footage.html#/'+esc(s.id)+'"><span class="num">'+s.number+'</span><span class="rn"><b>'+esc(s.name)+'</b><small>'+esc(when)+(s.location?' · '+esc(s.location):'')+'</small></span><span class="rs">'+esc(size)+'</span><span class="rp"><i class="dot '+st.c+'"></i>'+esc(st.t)+'</span></a>';
    }).join("");

    var tiers=[["Feature / docuseries","Long arc",["feature"],"The full story of James, Race Service and AMG over multiple years."],
      ["Episodes","12 to 20 min, YouTube",["youtube"],"One per shoot, each built around its own spine interview. The priority."],
      ["Topical cutdowns","Mini episodes",["cutdown"],"One experience each, such as Nico on Art Cars or the HWA tour. Still being catalogued."],
      ["RAW cuts","Multi-hour",["raw"],"Nearly uncut days with an audio pass and sensitive moments removed. First one: the Tutto Bene media day."],
      ["Clips and sizzle","10 to 90 sec",["clip","sizzle"],"BTS moments for social and a sizzle reel, pulled from the same marked footage."]];

    var withRS=edited.filter(function(p){return p.stage==="rs_treatment"||p.stage==="rs_approval";}).length;
    var rsLine=withRS?withRS+(withRS===1?" piece is":" pieces are")+" with Race Service now.":"Nothing is waiting on Race Service right now.";

    return ''+
    '<section class="sec"><div class="sec-head"><h2>What this is</h2></div>'+
      '<p class="lede"><b>Act I, before the headline.</b> The RAW Doc follows James Kirkham while the outcome is still open: the road to racing the next AMG, Adidas, Michelin, Race Service GT3 car, and ultimately Le Mans.</p>'+
      '<div class="grid" style="margin-top:16px">'+
        '<div class="card"><h3>The entrepreneurial rise</h3><p class="summary">From selling real estate at 19 to fund a track car, through GoPro and Donut Media, to founding Race Service around community.</p></div>'+
        '<div class="card"><h3>The Mercedes-AMG integration</h3><p class="summary">A five-year relationship that grew into the AMG GT3 RAW Spec program and a creative role inside AMG\'s cultural outreach.</p></div>'+
        '<div class="card"><h3>The road to Le Mans</h3><p class="summary">The first love never left. Track time, the Nürburgring, a race-capable GT3, and the pull toward the 24 Hours.</p></div>'+
      '</div></section>'+

    '<section class="sec"><div class="sec-head"><h2>What we have</h2></div>'+glanceHtml+
      '<p class="note" style="margin-top:12px">All of it is vérité, shot as it happened. The footage is organized so any moment can be found and cut quickly.</p></section>'+

    '<section class="sec"><div class="sec-head"><h2>The shoots so far</h2><span class="sec-meta">in order</span></div>'+
      '<div class="road">'+road+'</div>'+
      '<p class="note" style="margin-top:12px">Open any shoot to see its days and what happened in each.</p></section>'+

    '<section class="sec"><div class="sec-head"><h2>What it becomes</h2></div><ul class="list">'+
      tiers.map(function(t){return '<li class="tier"><div class="tier-name">'+esc(t[0])+'<small>'+esc(t[1])+'</small></div><div>'+esc(t[3])+'<span class="tier-n">'+esc(tally(pieces,t[2]))+'</span></div></li>';}).join("")+'</ul></section>'+

    '<section class="sec"><div class="sec-head"><h2>Where Race Service comes in</h2></div>'+
      '<div class="card"><div class="pathway"><div>Rough cut<span class="who">EA Productions</span></div><span class="arrow">→</span><div class="is-rs">Treatment<span class="who">Carlos, Race Service</span></div><span class="arrow">→</span><div class="is-rs">Final approval<span class="who">Race Service</span></div><span class="arrow">→</span><div>Published<span class="who">YouTube</span></div></div>'+
      '<p class="note" style="margin:6px 0 0">Race Service shapes every piece twice, at treatment and at final approval, and nothing publishes without it. '+esc(rsLine)+' Cuts, notes and approvals live in Frame.io.</p></div></section>'+

    '<section class="sec"><div class="sec-head"><h2>Go deeper</h2></div><div class="grid">'+
      '<a class="card" href="footage.html"><h3>The footage</h3><p class="summary">Every production, every day: how it is organized, with the key moments of each day.</p><span class="go">Open the footage →</span></a>'+
      '<a class="card" href="pieces.html"><h3>The pieces</h3><p class="summary">Everything being cut from the footage, by type or by shoot, and where each piece sits in the approval chain.</p><span class="go">Open the pieces →</span></a>'+
    '</div></section>';
  }
  Promise.all([R.load("data/shoots.json"),R.load("data/pieces.json"),R.load("data/days.json")]).then(function(r){
    document.getElementById("view").innerHTML=render(r[0],r[1],r[2]);
  }).catch(function(e){R.fail("view",e);});
})();
