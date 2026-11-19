#!/usr/bin/env python3
"""Copy the editable text from the Google Sheet into data/days.json.

The sheet is the source of truth for words: day titles, summaries, date labels,
key-moment labels, and whether a moment shows. Positions, clip counts and hours
come from the stringouts and stay as they are.

Usage: python3 tools/sync_from_sheet.py day_notes.json key_moments.json
Each file is the JSON returned by reading the tab (an object with "values", or a bare list of rows).
Columns: Day Notes = Production, Day, Date, Title, Summary, Reviewed.
         Key Moments = Production, Day, #, Clip, At, Label, Status, Reviewed.
Status "show" puts the moment on the page. Any other status keeps it off the page. Marker names and notes from the editor are never touched.
"""
import json, sys, os

def rows(path):
    d = json.load(open(path))
    v = d['values'] if isinstance(d, dict) else d
    return v[1:]  # drop header

def cell(r, i):
    return str(r[i]).strip() if i < len(r) and r[i] is not None else ''

def main(dn_path, km_path):
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, '..', 'data', 'days.json')
    data = json.load(open(path))
    prods = data['productions']
    changed = 0; warn = []
    days = {}
    for k, v in prods.items():
        for d in v['days']:
            days[(k, int(d['day']))] = d
    for r in rows(dn_path):
        k, dy = cell(r, 0), cell(r, 1)
        if not k or not dy: continue
        d = days.get((k, int(dy)))
        if not d: warn.append('Day Notes: no day %s %s' % (k, dy)); continue
        for field, i in (('label', 2), ('title', 3), ('summary', 4)):
            val = cell(r, i)
            if val and d[field] != val: d[field] = val; changed += 1
    index = {}
    for key, d in days.items():
        for m in d['moments']:
            index.setdefault((key[0], key[1], m['clip'], m['at']), []).append(m)
    seen = set()
    for r in rows(km_path):
        k, dy, clip, at = cell(r, 0), cell(r, 1), cell(r, 3), cell(r, 4)
        if not k or not dy: continue
        cands = index.get((k, int(dy), clip, at), [])
        num = cell(r, 2)
        # Two markers can share a clip and timecode. Prefer the one the sheet's # points at, then any not yet used.
        m = next((c for c in cands if str(c.get('n')) == num and id(c) not in seen), None) \
            or next((c for c in cands if id(c) not in seen), None)
        if not m: warn.append('Key Moments: no marker %s day %s %s %s' % (k, dy, clip, at)); continue
        seen.add(id(m))
        label, status = cell(r, 5), cell(r, 6).lower()
        if status == 'show' and label:
            if not m.get('hl') or m.get('label') != label:
                changed += 1
            m['hl'] = True; m['held'] = False; m['label'] = label
        else:
            if m.get('hl'): changed += 1
            m['hl'] = False; m['held'] = status == 'held'
            m.pop('n', None)
    for key, d in days.items():
        n = 0
        for m in d['moments']:
            if m.get('hl'):
                n += 1; m['n'] = n
    json.dump(data, open(path, 'w'), indent=1, ensure_ascii=False)
    print('changed %d fields' % changed)
    for w in warn: print('WARN', w)

if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
