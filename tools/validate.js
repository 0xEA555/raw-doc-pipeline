// Checks data/shoots.json and data/pieces.json for broken references and bad states.
// Run: node tools/validate.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const shoots = JSON.parse(fs.readFileSync(path.join(root, "data/shoots.json"), "utf8"));
const pieces = JSON.parse(fs.readFileSync(path.join(root, "data/pieces.json"), "utf8"));
const STEP = ["done", "in_progress", "not_started", "issue"];
const KIND = ["production", "supporting", "unsorted", "planned"];
const TYPE = ["spine", "youtube", "raw", "cutdown", "clip", "sizzle", "feature"];
const STAGE = ["not_started", "rough", "rs_treatment", "rs_approval", "published"];
const SPINE = ["not_started", "scheduled", "shot", "delivered"];
const errs = [];
const sid = new Set(), pid = new Set();
shoots.forEach(s => {
  if (sid.has(s.id)) errs.push(`duplicate shoot id ${s.id}`); sid.add(s.id);
  if (!KIND.includes(s.kind)) errs.push(`${s.id}: bad kind ${s.kind}`);
  if (s.date && !/^\d{4}-\d{2}$/.test(s.date)) errs.push(`${s.id}: date must be YYYY-MM`);
  (s.sources || []).forEach(src => { if (!STEP.includes(src.ingest)) errs.push(`${s.id}/${src.camera}: bad ingest ${src.ingest}`); });
  ["markers", "stringouts", "sync", "story_cut"].forEach(k => { if (!STEP.includes((s.stages || {})[k])) errs.push(`${s.id}: bad ${k}`); });
});
pieces.forEach(p => {
  if (pid.has(p.id)) errs.push(`duplicate piece id ${p.id}`); pid.add(p.id);
});
pieces.forEach(p => {
  if (!TYPE.includes(p.type)) errs.push(`${p.id}: bad type ${p.type}`);
  if (p.type === "spine") {
    if (!SPINE.includes(p.status)) errs.push(`${p.id}: bad spine status ${p.status}`);
    if (!p.for_episode || !pid.has(p.for_episode)) errs.push(`${p.id}: unknown for_episode ${p.for_episode}`);
  } else {
    if (!STAGE.includes(p.stage)) errs.push(`${p.id}: bad stage ${p.stage}`);
    if (p.type === "youtube" && (!p.spine_id || !pid.has(p.spine_id))) errs.push(`${p.id}: YouTube episodes need a valid spine_id`);
  }
  if (p.shoot && p.shoot !== "all" && !sid.has(p.shoot)) errs.push(`${p.id}: unknown shoot ${p.shoot}`);
  (p.also_from || []).forEach(k => { if (!sid.has(k)) errs.push(`${p.id}: unknown also_from ${k}`); });
  if (p.parent && !pid.has(p.parent)) errs.push(`${p.id}: unknown parent ${p.parent}`);
  let cur = p, seen = new Set();
  while (cur && cur.parent) { if (seen.has(cur.id)) { errs.push(`${p.id}: parent loop`); break; } seen.add(cur.id); cur = pieces.find(x => x.id === cur.parent); }
});
// spine_id back-references must actually point at a spine-type piece
pieces.forEach(p => {
  if (p.spine_id && (!pid.has(p.spine_id) || pieces.find(x => x.id === p.spine_id).type !== "spine")) {
    errs.push(`${p.id}: spine_id ${p.spine_id} is not a spine piece`);
  }
});
if (errs.length) { console.error("INVALID\n" + errs.join("\n")); process.exit(1); }
console.log(`OK: ${shoots.length} shoots, ${pieces.length} pieces`);
