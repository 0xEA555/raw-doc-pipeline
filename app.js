(function(){
  "use strict";

  // ---------- vocab ----------
  var STEP_STATES = {
    done:        {label: "Done",        cls: "st-done"},
    in_progress: {label: "In progress", cls: "st-prog"},
    not_started: {label: "Not started", cls: "st-none"},
    issue:       {label: "Issue",       cls: "st-issue"}
  };
  var SHOOT_STEPS = [
    {key: "ingest",     label: "Ingest"},
    {key: "markers",    label: "Markers"},
    {key: "stringouts", label: "Stringouts"},
    {key: "sync",       label: "Sync"},
    {key: "story_cut",  label: "Story cut"}
  ];
  var KINDS = { production: "Production", supporting: "Supporting", unsorted: "To sort", planned: "Planned" };
  var TYPES = [
    {key: "youtube", label: "YouTube episode", color: "var(--ty-youtube)"},
    {key: "cutdown", label: "Cutdown",         color: "var(--ty-cutdown)"},
    {key: "clip",    label: "Clip",            color: "var(--ty-clip)"},
    {key: "sizzle",  label: "Sizzle",          color: "var(--ty-sizzle)"},
    {key: "feature", label: "Feature",         color: "var(--ty-feature)"}
  ];
  var CHAIN = [
    {key: "rough",        label: "EA rough"},
    {key: "rs_treatment", label: "RS treatment"},
    {key: "rs_approval",  label: "RS approval"},
    {key: "published",    label: "Published"}
  ];
  var SPINE = {
    not_started: {label: "Spine not started", n: 0},
    scheduled:   {label: "Spine scheduled",   n: 1},
    shot:        {label: "Spine shot",        n: 2},
    delivered:   {label: "Spine delivered",   n: 3}
  };
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ---------- helpers ----------
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }
  function typeInfo(k){ for (var i=0;i<TYPES.length;i++){ if (TYPES[i].key===k) return TYPES[i]; } return TYPES[0]; }
  function fmtDate(d){
    if (!d) return "Date TBD";
    var p = d.split("-");
    return MONTHS[parseInt(p[1],10)-1] + " " + p[0];
  }
  function chainIndex(stage){
    for (var i=0;i<CHAIN.length;i++){ if (CHAIN[i].key===stage) return i; }
    return -1;
  }
  function chainLabel(stage){ var i = chainIndex(stage); return i < 0 ? "Not started" : CHAIN[i].label; }
  function stageCls(stage){ return stage === "published" ? "st-done" : chainIndex(stage) >= 0 ? "st-prog" : "st-none"; }
  function ingestState(shoot){
    var srcs = shoot.sources || [];
    if (!srcs.length) return "not_started";
    if (srcs.every(function(s){ return s.ingest === "done"; })) return "done";
    return srcs.some(function(s){ return s.ingest === "done" || s.ingest === "in_progress"; }) ? "in_progress" : "not_started";
  }
  function stepState(shoot, key){ return key === "ingest" ? ingestState(shoot) : ((shoot.stages || {})[key] || "not_started"); }

  // ---------- state ----------
  var shoots = [], pieces = [], byShoot = {}, byPiece = {};
  var ui = { tab: "pieces", group: "type", typeFilters: {} };

  function index(){
    byShoot = {}; byPiece = {};
    shoots.forEach(function(s){ byShoot[s.id] = s; });
    pieces.forEach(function(p){ byPiece[p.id] = p; });
  }
  function sortedShoots(){
    var rank = {production: 0, supporting: 0, unsorted: 1, planned: 2};
    return shoots.slice().sort(function(a,b){
      var r = (rank[a.kind]||0) - (rank[b.kind]||0);
      if (r) return r;
      if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return a.date ? -1 : b.date ? 1 : 0;
    });
  }
  function childrenOf(id){ return pieces.filter(function(p){ return p.parent === id; }); }
  function rootShoot(p){
    var cur = p, guard = 0;
    while (cur && cur.parent && byPiece[cur.parent] && guard++ < 20) cur = byPiece[cur.parent];
    return cur && cur.shoot && byShoot[cur.shoot] ? cur.shoot : null;
  }
  function lineage(p){
    var out = [], cur = p, guard = 0;
    while (cur && guard++ < 20){
      out.unshift(cur.title);
      if (cur.parent && byPiece[cur.parent]){ cur = byPiece[cur.parent]; continue; }
      out.unshift(cur.shoot === "all" ? "All shoots" : (cur.shoot && byShoot[cur.shoot]) ? byShoot[cur.shoot].name : "Source to confirm");
      break;
    }
    return out;
  }
  function filtered(list){
    var on = Object.keys(ui.typeFilters).filter(function(k){ return ui.typeFilters[k]; });
    return on.length ? list.filter(function(p){ return ui.typeFilters[p.type]; }) : list;
  }

  // ---------- stats ----------
  function renderStats(){
    var items;
    if (ui.tab === "shoots"){
      var filmed = shoots.filter(function(s){ return s.kind === "production" || s.kind === "supporting"; }).length;
      var planned = shoots.filter(function(s){ return s.kind === "planned"; }).length;
      var ingested = shoots.filter(function(s){ return s.kind !== "planned" && ingestState(s) === "done"; }).length;
      var marked = shoots.filter(function(s){ return (s.stages||{}).markers === "done"; }).length;
      var cut = shoots.filter(function(s){ return (s.stages||{}).story_cut === "done"; }).length;
      items = [[filmed, "filmed"], [planned, "planned"], [ingested, "fully ingested"], [marked, "marked"], [cut, "story cut"]];
    } else {
      var eps = pieces.filter(function(p){ return p.type === "youtube"; });
      var spines = eps.filter(function(p){ return (SPINE[p.spine]||{n:0}).n >= 2; }).length;
      var moving = pieces.filter(function(p){ return chainIndex(p.stage) >= 0 && p.stage !== "published"; }).length;
      var pub = pieces.filter(function(p){ return p.stage === "published"; }).length;
      var idle = pieces.filter(function(p){ return chainIndex(p.stage) < 0; }).length;
      items = [[pieces.length, "total"], [idle, "not started"], [moving, "in progress"], [pub, "published"], [spines + "/" + eps.length, "spines shot"]];
    }
    document.getElementById("stats").innerHTML = items.map(function(it){
      return '<span><b>' + esc(it[0]) + '</b> ' + esc(it[1]) + '</span>';
    }).join("");
  }

  // ---------- pieces tab ----------
  function spineTag(p){
    if (p.spine == null) return '';
    var s = SPINE[p.spine] || SPINE.not_started;
    return '<span class="tag ' + (s.n === 3 ? "st-done" : s.n > 0 ? "st-prog" : "st-none") + '">' + esc(s.label) + '</span>';
  }
  function chainBar(p){
    var idx = chainIndex(p.stage);
    return '<span class="chain" title="' + esc(chainLabel(p.stage)) + '">' + CHAIN.map(function(step, i){
      var cls = (p.stage === "published" || i < idx) ? " is-done" : i === idx ? " is-current" : "";
      return '<span class="seg' + cls + '"></span>';
    }).join("") + '</span>';
  }
  function cardHTML(p){
    var ti = typeInfo(p.type);
    var meta;
    if (p.parent && byPiece[p.parent]) meta = "from " + byPiece[p.parent].title;
    else if (ui.group === "type"){
      var src = lineage(p).slice(0, -1).join(" › ");
      var rs = byShoot[rootShoot(p)];
      var parts = [];
      if (src !== p.title) parts.push(src);
      if (rs && rs.date) parts.push(fmtDate(rs.date));
      meta = parts.join(" · ") || src;
    }
    else meta = ti.label;
    return '<button class="card" data-piece="' + esc(p.id) + '">' +
      '<div class="card-top"><div class="card-title">' + esc(p.title) + '</div>' +
        '<span class="type-dot" style="background:' + ti.color + '" title="' + esc(ti.label) + '"></span></div>' +
      '<div class="card-meta">' + esc(meta) + '</div>' +
      '<div class="card-status"><span class="status-pill ' + stageCls(p.stage) + '">' + esc(chainLabel(p.stage)) + '</span>' + spineTag(p) + '</div>' +
      chainBar(p) +
      (p.notes ? '<div class="card-notes">' + esc(p.notes) + '</div>' : '') +
    '</button>';
  }
  function group(title, items, meta){
    return '<section class="group"><div class="group-head"><h2 class="group-title">' + esc(title) +
      '<span class="group-count">' + items.length + '</span></h2>' +
      (meta ? '<div class="group-meta">' + esc(meta) + '</div>' : '') + '</div>' +
      '<div class="cards">' + items.map(cardHTML).join("") + '</div></section>';
  }
  function renderPiecesTab(){
    var list = filtered(pieces), html = "";
    if (ui.group === "type"){
      TYPES.forEach(function(t){
        var items = list.filter(function(p){ return p.type === t.key; });
        if (items.length) html += group(t.label, items);
      });
    } else {
      sortedShoots().forEach(function(s){
        var items = list.filter(function(p){ return rootShoot(p) === s.id; });
        if (items.length) html += group(s.name, items, fmtDate(s.date));
      });
      var loose = list.filter(function(p){ return !rootShoot(p); });
      if (loose.length) html += group("Across shoots", loose, "Sizzle, feature, and pieces with a source to confirm");
    }
    return html || '<p class="sub">No pieces match this filter.</p>';
  }

  // ---------- shoots tab ----------
  function shootCard(s){
    var pieceCount = pieces.filter(function(p){ return rootShoot(p) === s.id; }).length;
    var meta = [fmtDate(s.date), s.location].filter(Boolean).join(" · ");
    var body = '';
    if (s.kind !== "planned"){
      var sources = (s.sources||[]).map(function(src){
        var st = STEP_STATES[src.ingest] || STEP_STATES.not_started;
        return '<span class="tag ' + st.cls + '" title="' + esc(src.detail || "") + '">' + esc(src.camera) + ' · ' + esc(st.label.toLowerCase()) + '</span>';
      }).join("") || '<span class="tag st-none">No sources logged</span>';
      var steps = SHOOT_STEPS.map(function(step){
        var st = STEP_STATES[stepState(s, step.key)] || STEP_STATES.not_started;
        var tip = step.key === "sync" && s.sync_note ? s.sync_note : st.label;
        return '<li class="' + st.cls + '" title="' + esc(tip) + '"><span>' + esc(step.label) + '</span><em>' + esc(st.label) + '</em></li>';
      }).join("");
      body = '<div class="card-status">' + sources + '</div><ul class="steps">' + steps + '</ul>' +
        (s.sync_note ? '<div class="card-notes">Sync: ' + esc(s.sync_note) + '</div>' : '');
    }
    return '<div class="card shoot-card kind-' + esc(s.kind) + '">' +
      '<div class="card-top"><div class="card-title">' + esc(s.name) + '</div><span class="kind">' + esc(KINDS[s.kind] || s.kind) + '</span></div>' +
      '<div class="card-meta">' + esc(meta) + (pieceCount ? ' · ' + pieceCount + (pieceCount === 1 ? ' piece' : ' pieces') : '') + '</div>' +
      body +
      (s.notes ? '<div class="card-notes">' + esc(s.notes) + '</div>' : '') +
    '</div>';
  }
  function renderShootsTab(){
    var sorted = sortedShoots();
    var sections = [
      ["Filmed", sorted.filter(function(s){ return s.kind === "production" || s.kind === "supporting"; })],
      ["To sort", sorted.filter(function(s){ return s.kind === "unsorted"; })],
      ["Planned", sorted.filter(function(s){ return s.kind === "planned"; })]
    ];
    return sections.filter(function(x){ return x[1].length; }).map(function(x){
      return '<section class="group"><div class="group-head"><h2 class="group-title">' + esc(x[0]) +
        '<span class="group-count">' + x[1].length + '</span></h2></div>' +
        '<div class="cards">' + x[1].map(shootCard).join("") + '</div></section>';
    }).join("");
  }

  // ---------- chrome ----------
  function renderControls(){
    var piecesTab = ui.tab === "pieces";
    document.getElementById("piece-controls").hidden = !piecesTab;
    document.getElementById("legend-pieces").hidden = !piecesTab;
    document.getElementById("legend-shoots").hidden = piecesTab;
    document.getElementById("filters").innerHTML = TYPES.map(function(t){
      var on = !!ui.typeFilters[t.key];
      return '<button class="chip' + (on ? ' is-active' : '') + '" data-type="' + t.key + '" style="color:' + t.color + '">' + esc(t.label) + '</button>';
    }).join("");
    setActive("#tabs .tab", "data-tab", ui.tab);
    setActive("#group-seg .seg-btn", "data-group", ui.group);
  }
  function setActive(sel, attr, val){
    Array.prototype.forEach.call(document.querySelectorAll(sel), function(b){
      var on = b.getAttribute(attr) === val;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }
  function render(){
    renderStats();
    renderControls();
    document.getElementById("board").innerHTML = ui.tab === "shoots" ? renderShootsTab() : renderPiecesTab();
  }

  // ---------- dialog ----------
  function openPiece(id){
    var p = byPiece[id];
    if (!p) return;
    var ti = typeInfo(p.type), idx = chainIndex(p.stage);
    var steps = CHAIN.map(function(step, i){
      var cls = (p.stage === "published" || i < idx) ? "st-done" : i === idx ? "st-prog" : "st-none";
      return '<li class="' + cls + '">' + esc(step.label) + '</li>';
    }).join("");
    var spine = p.spine == null ? "Optional for this piece" : (SPINE[p.spine]||SPINE.not_started).label;
    var extra = (p.also_from||[]).filter(function(k){ return byShoot[k]; }).map(function(k){ return byShoot[k].name; });
    var kids = childrenOf(p.id);
    var src = byShoot[rootShoot(p)];
    var field = function(label, html){ return '<div class="dialog-field"><div class="dialog-label">' + esc(label) + '</div>' + html + '</div>'; };
    document.getElementById("dialog-inner").innerHTML =
      '<button class="dialog-close" data-close aria-label="Close">&times;</button>' +
      '<div class="dialog-crumb">' + esc(lineage(p).slice(0, -1).join(" › ")) + '</div>' +
      '<h2>' + esc(p.title) + '</h2>' +
      '<div class="card-meta">' + esc(ti.label) + '</div>' +
      field("Chain", '<ol class="chain-list">' + steps + '</ol>') +
      field("Spine · Carlos · FX3 · James", esc(spine)) +
      (src && src.kind !== "planned" ? field("Source footage", esc(src.name) + ' · story cut ' + esc((STEP_STATES[stepState(src, "story_cut")]||STEP_STATES.not_started).label.toLowerCase())) : '') +
      (extra.length ? field("Also draws from", esc(extra.join(", "))) : '') +
      (kids.length ? field("Cut from this", esc(kids.map(function(k){ return k.title; }).join(", "))) : '') +
      (p.notes ? field("Notes", esc(p.notes)) : '') +
      (p.frameio_url ? field("Frame.io", '<iframe class="frame-embed" src="' + esc(p.frameio_url) + '" allow="fullscreen"></iframe><a class="dialog-link" href="' + esc(p.frameio_url) + '" target="_blank" rel="noopener">Open in Frame.io →</a>') : '') +
      (p.youtube_url ? field("Published", '<a class="dialog-link" href="' + esc(p.youtube_url) + '" target="_blank" rel="noopener">Watch on YouTube →</a>') : '');
    var dlg = document.getElementById("card-dialog");
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  // ---------- wiring ----------
  function wire(){
    document.getElementById("tabs").addEventListener("click", function(e){
      var b = e.target.closest(".tab"); if (!b) return;
      ui.tab = b.getAttribute("data-tab"); render();
    });
    document.getElementById("group-seg").addEventListener("click", function(e){
      var b = e.target.closest(".seg-btn"); if (!b) return;
      ui.group = b.getAttribute("data-group"); render();
    });
    document.getElementById("filters").addEventListener("click", function(e){
      var c = e.target.closest(".chip"); if (!c) return;
      var t = c.getAttribute("data-type"); ui.typeFilters[t] = !ui.typeFilters[t]; render();
    });
    document.getElementById("board").addEventListener("click", function(e){
      var row = e.target.closest("[data-piece]");
      if (row) openPiece(row.getAttribute("data-piece"));
    });
    var dlg = document.getElementById("card-dialog");
    dlg.addEventListener("click", function(e){
      if (e.target.closest("[data-close]") || e.target === dlg){
        if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
      }
    });
  }

  function load(url){
    return fetch(url, {cache: "no-store"}).then(function(r){
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }
  function init(){
    wire();
    Promise.all([load("data/shoots.json"), load("data/pieces.json")]).then(function(res){
      shoots = res[0] || []; pieces = res[1] || [];
      index(); render();
    }).catch(function(err){
      document.getElementById("board").innerHTML = '<p class="sub">Could not load pipeline data (' + esc(err && err.message) + ').</p>';
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
