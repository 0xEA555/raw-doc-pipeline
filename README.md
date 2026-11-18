# The RAW Doc: Before The Shift (status site)

Static site for Race Service leadership. Three pages share one stylesheet (`site.css`) and one helper (`common.js`):

- `index.html` Start: what this is, where it stands, what needs attention, how work moves.
- `footage.html` Footage: productions, then days, then a day's key moments and markers (`#/<production>/<day>`).
- `pieces.html` Pieces: everything being cut, by type or production. `pieces.html#<pieceId>` opens a piece.

Data lives in `data/` (`shoots.json`, `pieces.json`, `days.json`, `attention.json`). Validate with `node tools/validate.js`. Money never appears on the site.
