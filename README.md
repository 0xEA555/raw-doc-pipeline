# RAW Doc Pipeline

Team-facing view of Before The Shift / RAW Doc post-production: every shoot, every piece cut from it, and where each one stands. It tracks the work only. Money (invoices, expenses, day bank) stays in the RS_RawDocumentary_EA_Project_Tracker sheet.

## Data
- `data/shoots.json`: the parent layer. One entry per shoot (production, supporting, to-sort, planned).
  - Each shoot has sources (Vixia, iPhone, Ray-Ban…), each with its own ingest state.
  - Stages: markers → stringouts → sync → story cut.
  - States: `done`, `in_progress`, `not_started`, `issue`.
- `data/pieces.json`: the children. Types: `youtube`, `cutdown`, `clip`, `sizzle`, `feature`.
  - `shoot` is the source shoot id, `"all"`, or `null` if not yet confirmed.
  - `also_from` lists extra shoots for cross-referenced cuts.
  - `parent` is the piece this was cut from (a cutdown from an episode, a clip from a cutdown).
  - `spine` (Carlos · FX3 · James) is required for YouTube episodes: `not_started` → `scheduled` → `shot` → `delivered`. It's `null` where optional.
  - `stage` is the chain: `not_started` → `rough` (EA) → `rs_treatment` (Carlos) → `rs_approval` → `published`.
  - `frameio_url` is where the export, notes and approval live. `youtube_url` is set once published.

Run `node tools/validate.js` after any data change. It catches broken references and bad states.

## Deploy
Static site, no build step. Netlify deploys `main` on every push.
