# Architecture

## Scope

Visual Division Tutor is a static, client-side learning application. It teaches whole-number division through equal groups and chunking; it is not an account service, data store or backend application.

## Components

| Path | Responsibility |
| --- | --- |
| `index.html` | Accessible page structure, input form, result region and PWA references. |
| `styles.css` | Responsive layout and visual presentation. |
| `division.js` | Deterministic integer-only division calculation and calculation validation. |
| `app.js` | Full worked view ("Just show me the working"): teaching-step rendering, rendered-group validation, accessible messages and reset behaviour. |
| `guided.js` | Guided-mode logic only (no DOM): questions, deterministic answer checks, escalating hints and the show-me unlock rule. |
| `guided-ui.js` | Guided-mode screen: conversation, drawn groups, running tally, answer inputs and the **Just show me the working** lock. |
| `manifest.webmanifest` | Installability metadata, colours and relative PWA paths. |
| `pwa.js` | Service-worker registration. |
| `service-worker.js` | Versioned local app-shell caching and offline navigation fallback. |
| `icons/` | Local install and maskable icon assets. |
| `tests/` | Node test coverage for maths, rendering, accessibility and PWA behaviour. |

## Teaching and validation flow

```text
Whole-number input
       |
       v
division.js calculation and validation
       |
       v
app.js teaching steps and equal-group rendering
       |
       v
rendered-counter validation before display
```

Guided mode ("Let's work it out together") runs a separate learner-led loop:

```text
Guess how many groups fit
       |
       v
Work out the product  --too big-->  try fewer groups
       |
       v
Work out how many are left  (groups are drawn)
       |
       v
Could we make any more?  --yes-->  back to the guess
       |
       no
       v
Add up the groups, then answer and check (groups x divisor + remainder)
```

Wrong answers stay on the same question with a more specific hint. After 3 wrong tries at one question, or 3 too-big guesses in a row, `guided-ui.js` enables **Just show me the working**, which hands over to the full worked view in `app.js`.

`division.js` is the single calculation source. `app.js` separately checks the rendered counters so a valid calculation is not presented with an invalid visual model. If validation fails, the tutor does not render the affected maths diagram.

## PWA and Pages boundary

The app has no framework or server dependency. It is published as a GitHub Pages project site from GitHub `main`; relative PWA paths (`./`) allow the manifest, service worker and icons to work below the project subpath.

The service worker precaches only local application assets and provides an offline navigation fallback after the first successful load. Its cache name is versioned so an approved release can replace an earlier app shell. The current cache is `visual-division-tutor-v7`, which includes `guided.js` and `guided-ui.js`.

## Privacy and data boundary

The tutor does not require accounts, a database, learner profiles or server-side data handling. Learner inputs are used only in the active browser session. Do not add personal learner data, browser-review captures or unrelated screenshots to the repository without an explicit review.
