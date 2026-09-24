(function(){
  "use strict";

  var STATUSES = [
    {key:"not_started", label:"Not started", fg:"var(--st-not-fg)", bg:"var(--st-not-bg)"},
    {key:"in_progress", label:"In progress", fg:"var(--st-prog-fg)", bg:"var(--st-prog-bg)"},
    {key:"review",      label:"Review",      fg:"var(--st-rev-fg)",  bg:"var(--st-rev-bg)"},
    {key:"published",   label:"Published",   fg:"var(--st-pub-fg)",  bg:"var(--st-pub-bg)"}
  ];
  var TYPES = [
    {key:"youtube", label:"YouTube episode", color:"var(--ty-youtube)"},
    {key:"raw",     label:"Raw selects",     color:"var(--ty-raw)"},
    {key:"cutdown", label:"Cutdown",         color:"var(--ty-cutdown)"},
    {key:"clip",    label:"Social clip",     color:"var(--ty-clip)"},
    {key:"feature", label:"Feature",         color:"var(--ty-feature)"}
  ];

  function statusInfo(key){
    for (var i=0;i<STATUSES.length;i++){ if (STATUSES[i].key===key) return STATUSES[i]; }
    return STATUSES[0];
  }
  function typeInfo(key){
    for (var i=0;i<TYPES.length;i++){ if (TYPES[i].key===key) return TYPES[i]; }
    return TYPES[0];
  }
  function escapeHTML(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }

  var cards = [];
  var uiState = { group: "shoot", typeFilters: {} };

  function visibleCards(){
    var active = Object.keys(uiState.typeFilters).filter(function(k){ return uiState.typeFilters[k]; });
    if (active.length === 0) return cards.slice();
    return cards.filter(function(c){ return uiState.typeFilters[c.type]; });
  }

  function groupCards(list){
    var groups = {};
    var order = [];
    list.forEach(function(c){
      var key = uiState.group === "type" ? typeInfo(c.type).label : (c.shoot || "Unassigned");
      if (!groups[key]){ groups[key] = []; order.push(key); }
      groups[key].push(c);
    });
    return order.map(function(key){ return {key:key, items:groups[key]}; });
  }

  function renderStats(){
    var total = cards.length;
    var counts = {};
    STATUSES.forEach(function(s){ counts[s.key] = 0; });
    cards.forEach(function(c){ counts[c.status] = (counts[c.status]||0) + 1; });
    var el = document.getElementById("stats");
    el.innerHTML = '<span><b>' + total + '</b> total</span>' +
      STATUSES.map(function(s){
        return '<span><b>' + (counts[s.key]||0) + '</b> ' + escapeHTML(s.label.toLowerCase()) + '</span>';
      }).join("");
  }

  function renderFilters(){
    var el = document.getElementById("filters");
    el.innerHTML = TYPES.map(function(t){
      var active = !!uiState.typeFilters[t.key];
      return '<button class="chip' + (active?' is-active':'') + '" data-type="' + t.key +
        '" style="color:' + t.color + '">' + escapeHTML(t.label) + '</button>';
    }).join("");
  }

  function metaLine(c){
    var s = c.shoot || "Unassigned";
    if (c.part && c.parts && c.parts > 1) s += " · Part " + c.part + " of " + c.parts;
    return s;
  }

  function cardHTML(c){
    var si = statusInfo(c.status);
    var ti = typeInfo(c.type);
    return '<button class="card" data-id="' + c.id + '">' +
      '<div class="card-top">' +
        '<div class="card-title">' + escapeHTML(c.title) + '</div>' +
        '<span class="type-dot" style="background:' + ti.color + '"></span>' +
      '</div>' +
      '<div class="card-meta">' + escapeHTML(metaLine(c)) + '</div>' +
      '<span class="status-pill" style="color:' + si.fg + ';background:' + si.bg + '">' + si.label + '</span>' +
      (c.notes ? '<div class="card-notes">' + escapeHTML(c.notes) + '</div>' : '') +
    '</button>';
  }

  function render(){
    renderStats();
    renderFilters();
    var groups = groupCards(visibleCards());
    var board = document.getElementById("board");
    board.innerHTML = groups.map(function(g){
      return '<section class="group">' +
        '<h2 class="group-title">' + escapeHTML(g.key) + '<span class="group-count">' + g.items.length + '</span></h2>' +
        '<div class="cards">' + g.items.map(cardHTML).join("") + '</div>' +
      '</section>';
    }).join("") || '<p class="sub">No pieces match this filter.</p>';

    Array.prototype.forEach.call(board.querySelectorAll(".card"), function(btn){
      btn.addEventListener("click", function(){ openDialog(btn.getAttribute("data-id")); });
    });
  }

  function openDialog(id){
    var c = cards.filter(function(x){ return x.id === id; })[0];
    if (!c) return;
    var si = statusInfo(c.status);
    var ti = typeInfo(c.type);
    var inner = document.getElementById("dialog-inner");
    var frameBlock = c.frameio_url
      ? '<div class="dialog-field"><div class="dialog-label">Cut</div><iframe class="frame-embed" src="' + escapeHTML(c.frameio_url) + '" allow="fullscreen"></iframe></div>'
      : "";
    var ytBlock = c.youtube_url
      ? '<div class="dialog-field"><div class="dialog-label">Published</div><a class="dialog-link" href="' + escapeHTML(c.youtube_url) + '" target="_blank" rel="noopener">Watch on YouTube →</a></div>'
      : "";
    inner.innerHTML =
      '<button class="dialog-close" data-close>&times;</button>' +
      '<h2>' + escapeHTML(c.title) + '</h2>' +
      '<div class="card-meta">' + escapeHTML(ti.label) + ' · ' + escapeHTML(metaLine(c)) + '</div>' +
      '<div class="dialog-field"><span class="status-pill" style="color:' + si.fg + ';background:' + si.bg + '">' + si.label + '</span></div>' +
      (c.notes ? '<div class="dialog-field"><div class="dialog-label">Notes</div>' + escapeHTML(c.notes) + '</div>' : '') +
      frameBlock + ytBlock;
    inner.querySelector("[data-close]").addEventListener("click", function(){
      document.getElementById("card-dialog").close();
    });
    document.getElementById("card-dialog").showModal();
  }

  function wireControls(){
    document.getElementById("group-seg").addEventListener("click", function(e){
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      uiState.group = btn.getAttribute("data-group");
      Array.prototype.forEach.call(document.querySelectorAll(".seg-btn"), function(b){
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      render();
    });
    document.getElementById("filters").addEventListener("click", function(e){
      var chip = e.target.closest(".chip");
      if (!chip) return;
      var t = chip.getAttribute("data-type");
      uiState.typeFilters[t] = !uiState.typeFilters[t];
      render();
    });
  }

  function init(){
    wireControls();
    fetch("data/pieces.json")
      .then(function(r){ return r.json(); })
      .then(function(data){
        cards = data || [];
        render();
      })
      .catch(function(err){
        document.getElementById("board").innerHTML =
          '<p class="sub">Could not load pipeline data (' + escapeHTML(err && err.message) + ').</p>';
      });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
