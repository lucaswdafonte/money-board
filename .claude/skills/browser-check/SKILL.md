---
name: browser-check
description: Ad-hoc headless-Chromium (Playwright) driver for visually smoke-testing the money-board frontend against the running docker compose stack. Use when asked to run/verify/screenshot the app in a browser. Not an automated test suite — no assertions are wired into CI, just a one-off visual check plus console-error capture.
---

# money-board browser check

This is the fallback driver the `run` skill's "browser-driven web app" pattern asks for when
`chromium-cli` isn't available in the sandbox. It exists so the Playwright setup (npm install,
Chromium binary download) doesn't have to be rediscovered every session — the binary itself is
cached at `~/.cache/ms-playwright` (host-level, outside this repo) and survives across sessions on
the same machine regardless of workspace.

## Prerequisites

The app stack must already be running:

```bash
docker compose up -d
```

Frontend at `http://localhost:5173`, backend at `http://localhost:8000`. CORS is configured
(`app/core/config.py: cors_origins`) to allow the frontend origin — if you add a new frontend
origin/port, add it there too or browser `fetch` calls will fail with a CORS error even though
`curl` against the API works fine (curl doesn't enforce CORS).

Chromium also needs OS shared libraries (`libnspr4`, `libnss3`, etc.) that aren't present by
default in this sandbox and require `sudo` to install — the agent can't supply a sudo password, so
this is a one-time step for **the human** to run once per machine (not per session):

```bash
sudo apt-get update && sudo apt-get install -y \
  fonts-freefont-ttf fonts-ipafont-gothic fonts-liberation fonts-noto-color-emoji \
  fonts-tlwg-loma-otf fonts-unifont fonts-wqy-zenhei libasound2-data libasound2t64 \
  libfontenc1 libice6 libnspr4 libnss3 libsm6 libxaw7 libxfont2 libxkbfile1 libxmu6 \
  libxt6t64 x11-xkb-utils xfonts-cyrillic xfonts-encodings xfonts-scalable xfonts-utils \
  xserver-common xvfb
```

(Equivalently `sudo env "PATH=$PATH" npx playwright install-deps chromium` from this directory —
plain `sudo npx ...` fails with `command not found` since `sudo` resets `PATH` and `npx` lives
under the user's nvm install, not root's.) Without this, `chromium.launch()` fails with
`error while loading shared libraries: libnspr4.so: cannot open shared object file`.

## Run it

```bash
cd .claude/skills/browser-check
npm install   # first run per machine downloads Chromium (~/.cache/ms-playwright); after that, instant
node check.mjs
```

Screenshots land in `.claude/skills/browser-check/screenshots/`, numbered in the order they were
taken. `screenshots/` and `node_modules/` are covered by the repo's root `node_modules`/generic
gitignore patterns; nothing here is meant to be committed as-is unless you decide to promote it
into a real test suite later.

## What it currently checks

The Phase 1 auth flow end to end: visiting `/` while logged out redirects to `/login`; registering
via `/register` logs in and lands on the dashboard showing the user's email; "Log out" returns to
`/login`; logging back in with the same credentials returns to the dashboard. It fails (non-zero
exit) if any browser console error/pageerror fires during the run.

## Extending it for a different check

`check.mjs` is a plain Playwright script, not a generic REPL — for a different flow, either edit it
in place for a one-off check, or copy the pattern (`chromium.launch()` → `page.goto()` →
`fill`/`click` → `waitForSelector` → `screenshot()`) for a new scenario. Use `page.fill()`/`.click()`
rather than raw DOM manipulation — React's controlled inputs need real input events, not just an
`el.value` assignment, to pick up the change.

Two gotchas hit while building this:
- `page.screenshot({ path })` wants a plain string, not a `URL` object — pass
  `fileURLToPath(...)`/`path.join(...)`, not a raw `new URL(...)`, or it throws deep inside
  playwright-core with a confusing `path59.lastIndexOf is not a function` error.
- After a **client-side** route change (e.g. clicking "Log out", which redirects via React Router,
  not a full page load), `page.waitForURL()` resolves as soon as the history API updates — before
  React has necessarily painted the new route. Always follow it with a `waitForSelector` for
  something on the destination page before screenshotting, or you'll capture a blank frame that
  looks like a bug but isn't.
