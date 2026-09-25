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
    {key: "icloud_export", label: "iCloud export", cloudOnly: true},
    {key: "ingest",     label: "Ingest"},
    {key: "markers",    label: "Markers"},
    {key: "stringouts", label: "Stringouts"},
    {key: "sync",       label: "Sync"},
    {key: "story_cut",  label: "Story cut"}
  ];
  var KINDS = { production: "Production", supporting: "Supporting", unsorted: "To sort", planned: "Planned" };
  var TYPES = [
    {key: "youtube", label: "YouTube cut",          spec: "12–20 min",    color: "var(--ty-youtube)", desc: "The priority. Depends on its narrative spine, shot on the FX3 at RS with James."},
    {key: "spine",   label: "Spine",                spec: "FX3 · Carlos · James", color: "var(--ty-spine)", desc: "Narrative spine interview, shot separately at RS — its own mini production that a YouTube cut is built around."},
    {key: "raw",     label: "RAW cut",              spec: "Multi-hour",   color: "var(--ty-raw)",     desc: "Nearly uncut, premiered or livestreamed. Audio pass and sensitive content removed; everything else plays out."},
    {key: "cutdown", label: "Topical cutdown",      spec: "Mini episode", color: "var(--ty-cutdown)", desc: "A mini episode built around one experience."},
    {key: "clip",    label: "Clip",                 spec: "10–90 sec",    color: "var(--ty-clip)",    desc: "BTS moments for social."},
    {key: "sizzle",  label: "Sizzle",               spec: "Reel",         color: "var(--ty-sizzle)",  desc: "A short reel across the shoots."},
    {key: "feature", label: "Feature / docuseries", spec: "Long arc",     color: "var(--ty-feature)", desc: "The full story over multiple years: James, RS, AMG."}
  ];
  var CHAIN = [
    {key: "rough",        label: "EA rough"},
    {key: "rs_treatment", label: "RS treatment"},
    {key: "rs_approval",  label: "RS approval"},
    {key: "published",    label: "Published"}
  ];
  var SPINE = {
    not_started: {label: "Not started", n: 0},
    scheduled:   {label: "Scheduled",   n: 1},
    shot:        {label: "Shot",        n: 2},
    delivered:   {label: "Delivered",   n: 3}
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
  function hasCloudSource(shoot){ return (shoot.sources || []).some(function(s){ return s.camera === "iPhone" || s.camera === "Ray-Ban"; }); }

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
    if (p && p.type === "spine" && p.for_episode && byPiece[p.for_episode]) return rootShoot(byPiece[p.for_episode]);
    var cur = p, guard = 0;
    while (cur && cur.parent && byPiece[cur.parent] && guard++ < 20) cur = byPiece[cur.parent];
    return cur && cur.shoot && byShoot[cur.shoot] ? cur.shoot : null;
  }
  function lineage(p){
    if (p && p.type === "spine" && p.for_episode && byPiece[p.for_episode]){
      return ["For " + byPiece[p.for_episode].title, p.title];
    }
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
      var spinePieces = pieces.filter(function(p){ return p.type === "spine"; });
      var spinesShot = spinePieces.filter(function(p){ return (SPINE[p.status]||{n:0}).n >= 2; }).length;
      var edited = pieces.filter(function(p){ return p.type !== "spine"; });
      var moving = edited.filter(function(p){ return chainIndex(p.stage) >= 0 && p.stage !== "published"; }).length;
      var pub = edited.filter(function(p){ return p.stage === "published"; }).length;
      var idle = edited.filter(function(p){ return chainIndex(p.stage) < 0; }).length;
      items = [[pieces.length, "total"], [idle, "not started"], [moving, "in progress"], [pub, "published"], [spinesShot + "/" + spinePieces.length, "spines shot"]];
    }
    document.getElementById("stats").innerHTML = items.map(function(it){
      return '<span><b>' + esc(it[0]) + '</b> ' + esc(it[1]) + '</span>';
    }).join("");
  }

  // ---------- pieces tab ----------
  function spineStateCls(status){ var n = (SPINE[status]||{n:0}).n; return n === 3 ? "st-done" : n > 0 ? "st-prog" : "st-none"; }
  function chainBar(p){
    var idx = chainIndex(p.stage);
    return '<span class="chain" title="' + esc(chainLabel(p.stage)) + '">' + CHAIN.map(function(step, i){
      var cls = (p.stage === "published" || i < idx) ? " is-done" : i === idx ? " is-current" : "";
      return '<span class="seg' + cls + '"></span>';
    }).join("") + '</span>';
  }
  // where the source footage stands, in one line
  function footage(p){
    if (p.shoot === "all") return {text: "Draws on all shoots", cls: "st-none"};
    var s = byShoot[rootShoot(p)];
    if (!s) return {text: "Source to confirm", cls: "st-issue"};
    if (s.kind === "planned") return {text: "Not shot yet", cls: "st-none"};
    var st = s.stages || {};
    if (st.story_cut === "done") return {text: "Story cut done", cls: "st-done"};
    if (st.story_cut === "in_progress") return {text: "Story cut in progress", cls: "st-prog"};
    if (st.markers === "in_progress") return {text: "Markers in progress", cls: "st-prog"};
    if (st.markers === "done") return {text: "Marked", cls: "st-prog"};
    if (st.stringouts === "done") return {text: "Stringouts done", cls: "st-prog"};
    if (ingestState(s) !== "not_started") return {text: "Ingested", cls: "st-prog"};
    return {text: "Not ingested", cls: "st-none"};
  }
  function fact(label, value, cls, extra){
    return '<div class="fact"><dt>' + esc(label) + '</dt><dd><i class="dot ' + cls + '"></i>' + esc(value) + (extra || '') + '</dd></div>';
  }
  function cardHTML(p){
    var ti = typeInfo(p.type);
    var src, facts;
    if (p.type === "spine"){
      var ep = byPiece[p.for_episode];
      src = ep ? "Feeds " + ep.title : "";
      facts = fact("Status", (SPINE[p.status]||SPINE.not_started).label, spineStateCls(p.status));
    } else {
      if (p.parent && byPiece[p.parent]) src = "From " + byPiece[p.parent].title;
      else {
        var rs = byShoot[rootShoot(p)];
        if (rs) src = (rs.name === p.title ? "" : rs.name + " · ") + fmtDate(rs.date);
        else src = "";
      }
      var fo = footage(p);
      facts = fact("Footage", fo.text, fo.cls);
      if (p.spine_id && byPiece[p.spine_id]){
        var sp = byPiece[p.spine_id];
        facts += fact("Spine", (SPINE[sp.status]||SPINE.not_started).label, spineStateCls(sp.status));
      }
      facts += fact("Stage", chainLabel(p.stage), stageCls(p.stage), chainBar(p));
    }
    if (p.frameio_url) facts += fact("Frame.io", p.frameio_label || "Linked", "st-done");
    return '<button class="card piece-card" data-piece="' + esc(p.id) + '" style="--c:' + ti.color + '">' +
      '<div class="card-head"><span class="type-tag">' + esc(ti.label) + '</span><span class="spec">' + esc(ti.spec) + '</span></div>' +
      '<div class="card-title">' + esc(p.title) + '</div>' +
      (src ? '<div class="card-meta">' + esc(src) + '</div>' : '') +
      '<dl class="facts">' + facts + '</dl>' +
      (p.notes ? '<div class="card-notes">' + esc(p.notes) + '</div>' : '') +

    '</button>';
  }
  function group(title, items, meta, desc){
    return '<section class="group"><div class="group-head"><h2 class="group-title">' + esc(title) +
      '<span class="group-count">' + items.length + '</span></h2>' +
      (meta ? '<div class="group-meta">' + esc(meta) + '</div>' : '') + '</div>' +
      (desc ? '<p class="group-notes">' + esc(desc) + '</p>' : '') +
      '<div class="cards">' + items.map(cardHTML).join("") + '</div></section>';
  }
  function renderPiecesTab(){
    var list = filtered(pieces), html = "";
    if (ui.group === "type"){
      TYPES.forEach(function(t){
        var items = list.filter(function(p){ return p.type === t.key; });
        if (items.length) html += group(t.label, items, t.spec, t.desc);
      });
    } else {
      sortedShoots().forEach(function(s){
        var items = list.filter(function(p){ return rootShoot(p) === s.id; });
        if (items.length) html += group(s.name, items, fmtDate(s.date));
      });
      var loose = list.filter(function(p){ return !rootShoot(p); });
      if (loose.length) html += group("Across shoots", loose, "Sizzle, feature / docuseries, and pieces with a source to confirm");
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
      var steps = SHOOT_STEPS.filter(function(step){
        return !step.cloudOnly || hasCloudSource(s);
      }).map(function(step){
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
      return '<button class="chip' + (on ? ' is-active' : '') + '" data-type="' + t.key + '" aria-pressed="' + on + '" style="--c:' + t.color + '">' + (on ? '<span class="chip-check">✓</span>' : '') + esc(t.label) + '</button>';
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
  function jumpBtn(id, label){ return '<button class="dialog-link-btn" data-piece="' + esc(id) + '">' + esc(label) + ' →</button>'; }
  function openPiece(id){
    var p = byPiece[id];
    if (!p) return;
    var ti = typeInfo(p.type);
    var field = function(label, html){ return '<div class="dialog-field"><div class="dialog-label">' + esc(label) + '</div>' + html + '</div>'; };
    var extra = (p.also_from||[]).filter(function(k){ return byShoot[k]; }).map(function(k){ return byShoot[k].name; });
    var kids = childrenOf(p.id);
    var body;
    if (p.type === "spine"){
      var ep = byPiece[p.for_episode];
      var status = (SPINE[p.status]||SPINE.not_started).label;
      var fo = footage(p);
      body = field("Status", esc(status)) +
        (ep ? field("Feeds", jumpBtn(ep.id, ep.title)) : '') +
        field("Footage it draws on", esc(fo.text));
    } else {
      var idx = chainIndex(p.stage);
      var steps = CHAIN.map(function(step, i){
        var cls = (p.stage === "published" || i < idx) ? "st-done" : i === idx ? "st-prog" : "st-none";
        return '<li class="' + cls + '">' + esc(step.label) + '</li>';
      }).join("");
      var fo2 = footage(p);
      var sp = p.spine_id && byPiece[p.spine_id];
      body = field("Footage", esc(fo2.text)) +
        field("Chain", '<ol class="chain-list">' + steps + '</ol>') +
        (sp ? field("Spine · Carlos · FX3 · James", esc((SPINE[sp.status]||SPINE.not_started).label) + ' ' + jumpBtn(sp.id, "Open spine")) : '');
    }
    document.getElementById("dialog-inner").innerHTML =
      '<button class="dialog-close" data-close aria-label="Close">&times;</button>' +
      '<div class="dialog-crumb">' + esc(lineage(p).slice(0, -1).join(" › ")) + '</div>' +
      '<h2>' + esc(p.title) + '</h2>' +
      '<div class="card-meta">' + esc(ti.label) + ' · ' + esc(ti.spec) + '</div>' +
      '<p class="dialog-desc">' + esc(ti.desc) + '</p>' +
      body +
      (extra.length ? field("Also draws from", esc(extra.join(", "))) : '') +
      (kids.length ? field("Cut from this", esc(kids.map(function(k){ return k.title; }).join(", "))) : '') +
      (p.notes ? field("Notes", esc(p.notes)) : '') +
      (p.frameio_url ? field("Frame.io", (p.frameio_label ? esc(p.frameio_label) + '<br>' : '') + '<a class="dialog-link" href="' + esc(p.frameio_url) + '" target="_blank" rel="noopener">Open in Frame.io →</a>') : '') +
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
      var jump = e.target.closest("[data-piece]");
      if (jump){ openPiece(jump.getAttribute("data-piece")); return; }
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
