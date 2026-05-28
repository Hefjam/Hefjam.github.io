# hefjam.github.io

Personal landing page and Taproom support pages.

`index.html` is a simple landing page that links out to the Taproom ordering
app and the support pages below. It is deployed via Cloudflare Workers
(see `wrangler.jsonc`, worker name `pizza`, serving this directory as static
assets).

## Files

| File                            | Purpose                                              |
|---------------------------------|------------------------------------------------------|
| `index.html`                    | Personal landing page (links to the app + pages)     |
| `taproom-kitchen.html`          | Kitchen display for live orders                      |
| `QR Codes.html`                 | Printable table QR codes                             |
| `menu-development-research.html`| Menu inspiration / research board                    |
| `privacy.html`                  | GDPR privacy policy                                  |
| `wrangler.jsonc`                | Cloudflare Workers deployment config                 |

## The ordering app moved

The Taproom **ordering app** is no longer kept in this repo. It now lives in
its own repo as the single source of truth:

- **hefjam/Taproom-Pizza** → `index.html`

This repo previously held the app **three times** (as `index.html`, as a
byte-identical `The Taproom Pizza _standalone_.html`, and again in the
`Taproom-Pizza` repo). Those duplicates were drifting apart. They have been
consolidated: the app lives in `Taproom-Pizza`, and this repo links to it.

## ⚠️ Before deploying this to the live site

Changing `index.html` here changes what visitors see at the root URL (it is
no longer the ordering app). Before merging to `main` / deploying:

1. **Deploy the ordering app** from the `Taproom-Pizza` repo (e.g. enable
   GitHub Pages on that repo, or add it to your Cloudflare deployment).
2. **Set the app link** in `index.html` (marked with a comment) to the app's
   real live customer URL.
3. **Re-point the table QR codes** to that same URL — they currently point at
   this root URL, which will become the landing page.
