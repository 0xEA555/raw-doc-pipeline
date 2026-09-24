# RAW Doc Pipeline

Public-visibility tracking site for BTS: RAW Doc content — every derived piece
(YouTube episode, raw selects, cutdown, social clip, feature) mapped to its
parent shoot, with status.

## Structure
- `index.html` / `styles.css` / `app.js` — static site, no build step
- `data/pieces.json` — source of truth for pieces. Edit this file and push to update the board.

## Local preview
Open `index.html` directly, or serve the folder (`npx serve .`) so `fetch()` works from `file://`-restricted browsers.

## Deploy
Connected to Netlify via Git — push to `main` and it redeploys automatically once the Netlify site is linked (Netlify dashboard → Add new site → Import an existing project → pick this repo).

## Roadmap
- **Frame.io** — set a piece's `frameio_url` in `data/pieces.json` to a share link and it renders inline in the card detail view.
- **YouTube data** — pull view counts / publish status via a Netlify Function calling the YouTube Data API v3, merged into `pieces.json` at build/refresh time.
- **Live sheet sync** — replace the static `pieces.json` with a Netlify Function pulling from the RS_RawDocumentary_EA_Project_Tracker Google Sheet, so this stays a read-through of the one tracker rather than a second source of truth.
- **Write-back** — team edits (status changes) currently go through the JSON file + git push. A lightweight authenticated edit flow (Netlify Function + GitHub API commit) is a natural next step if that becomes friction.
