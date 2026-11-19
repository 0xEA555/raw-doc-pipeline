# The RAW Doc: Before The Shift (status site)

Static site for Race Service leadership. Three pages share one stylesheet (`site.css`) and one helper (`common.js`):

- `index.html` Start: what this is, what we have, the shoots so far, what it becomes.
- `footage.html` Footage: productions, then days, then a day's key moments and markers (`#/<production>/<day>`).
- `pieces.html` Pieces: everything being cut, by type or production. `pieces.html#<pieceId>` opens a piece.

Data lives in `data/` (`shoots.json`, `pieces.json`, `days.json`). Validate with `node tools/validate.js`. Money never appears on the site.

## Syncing words from the sheet

The Google Sheet is where day titles, summaries, date labels and key-moment labels get edited.
`tools/sync_from_sheet.py day_notes.json key_moments.json` copies those into `data/days.json`
(Status `show` puts a moment on the page). Positions, clip counts and hours are untouched.
Then run `node tools/validate.js` and push.
