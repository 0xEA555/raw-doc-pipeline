# RAW Doc Pipeline

Team-facing view of Before The Shift / RAW Doc post-production: every shoot, every piece cut from it, and where each one stands. It tracks the work only. Money (invoices, expenses, day bank) stays in the RS_RawDocumentary_EA_Project_Tracker sheet.

## Data
- `data/shoots.json`: the parent layer. One entry per shoot (production, supporting, to-sort, planned).
  - Each shoot has sources (Vixia, iPhone, Ray-Ban…), each with its own ingest state.
  - Stages: markers → stringouts → sync → story cut.
  - States: `done`, `in_progress`, `not_started`, `issue`.
- `data/pieces.json`: the children. Types: `spine`, `youtube`, `raw`, `cutdown`, `clip`, `sizzle`, `feature`.
  - `shoot` is the source shoot id, `"all"`, or `null` if not yet confirmed.
  - `also_from` lists extra shoots for cross-referenced cuts.
  - `parent` is the piece this was cut from (a cutdown from an episode, a clip from a cutdown).
  - `spine` pieces are their own mini production (Carlos · FX3 · James), one per YouTube episode. `status`: `not_started` → `scheduled` → `shot` → `delivered`. `for_episode` points back at the YouTube piece it feeds.
  - Every `youtube` piece carries `spine_id`, pointing at its spine piece — the board shows the episode as depending on it, not carrying a status field of its own.
  - `stage` is the edit chain for everything except spines: `not_started` → `rough` (EA) → `rs_treatment` (Carlos) → `rs_approval` → `published`.
  - `frameio_url` is where the export, notes and approval live. `youtube_url` is set once published.

Run `node tools/validate.js` after any data change. It catches broken references and bad states.

## Deploy
Static site, no build step. Netlify deploys `main` on every push.
