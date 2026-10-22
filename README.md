# Visual Division Tutor

Visual Division Tutor is a free, child-friendly Progressive Web App (PWA) that makes division visible. It shows chunking and equal groups step by step, helping children connect division symbols with the quantities they represent.

## Canonical source and status

The canonical code source is the [`Elekim-74/visual-division-tutor`](https://github.com/Elekim-74/visual-division-tutor) repository on GitHub `main`. The live GitHub Pages site is available at <https://elekim-74.github.io/visual-division-tutor/>.

V1 has passed human visual and responsive acceptance on desktop, phone and tablet layouts. The current interface, deterministic maths engine, PWA behaviour and GitHub Pages configuration are accepted.

The guided "work it out together" mode was added on 22/10/2026 ([PR #1](https://github.com/Elekim-74/visual-division-tutor/pull/1)), approved by the project owner after local testing. It is now the main way to use the tutor.

Historical Windows copies may exist for reference, but they are not canonical and must not be used as release sources. Use GitHub `main` for code and release decisions.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md) describes the browser-only tutor, PWA assets and source boundaries.
- [Operations](docs/OPERATIONS.md) covers local running, testing, release verification and maintenance.
- [Decisions](docs/DECISIONS.md) records the canonical-source, release and historical-copy decisions.

## The problem

Division can feel abstract when a child sees only numbers and symbols. This project provides a visual aid for the moment when a learner needs to see what the maths is doing before returning to their school question.

## Features

- **Guided mode ("Let's work it out together"):** the tutor asks instead of telling. For 98 ÷ 10 it asks "How many groups of 10 do you think are in 98?", then "What is 8 groups of 10?", "How many are left?" and "Could we make any more groups of 10?", until the learner reaches the answer and a check (`9 × 10 + 8 = 98`).
- Wrong answers get a hint, never the answer. Each hint is more specific than the last.
- **Just show me the working** stays greyed out until the learner has had 3 wrong tries at one question (or 3 too-big guesses in a row). It locks again for each new problem.
- Builds the actual number of equal groups, with the correct number of counters in every group.
- Explains the dividend, divisor, quotient and remainder in child-friendly language.
- Shows chunking calculations and remainders step by step.
- Validates the calculation and the rendered counters before displaying a result.
- Works responsively on tablets and computers.
- Can be installed on supported browsers and works offline after the first successful load.
- Includes a **Start again** control for quick practice.

## Technical approach

The app uses standards-based HTML, CSS and JavaScript with no framework or server dependency. `division.js` contains the deterministic integer-only calculation engine. `app.js` renders the full worked view and checks the resulting DOM counters. `guided.js` holds the guided-mode logic (no screen code; every answer is checked with deterministic arithmetic) and `guided-ui.js` draws the guided conversation and controls the **Just show me the working** lock. A web app manifest, service worker and local icons provide installation and offline support. Relative PWA paths allow the app to work from the GitHub Pages project subpath.

## Validation and testing

- `calculateDivision()` creates one source-of-truth calculation object.
- `validateCalculation()` checks the quotient, remainder, chunk totals and every before/after step.
- The interface refuses to render a maths diagram when validation fails.
- `validateRenderedGroups()` counts the DOM counters in every group and removes an invalid diagram.
- Guided-mode tests replay real conversations (108 ÷ 10 and 98 ÷ 10), check that hints never contain the answer and that the show-me lock opens only after 3 wrong tries, and confirm every finished session satisfies dividend = groups × divisor + remainder.
- Automated tests cover representative calculations, stress cases, input handling, rendering, reset behaviour, manifest metadata, icons, app-shell caching and offline navigation.
- No AI-generated maths or images are used at runtime.

Run the test suite with:

```bash
npm test
```

## Screenshots

> Portfolio screenshot placeholder: add a clear desktop or tablet screenshot of a completed division example here.

## Use and install

Open the [live Visual Division Tutor](https://elekim-74.github.io/visual-division-tutor/).

- On Android Chrome, open the browser menu and choose **Install app** or **Add to Home screen**.
- On Windows Edge or Chrome, use the install icon in the address bar or choose **Install Visual Division Tutor** from the browser menu.

The first visit requires internet access. After the service worker caches the app files, the tutor can run offline.

For local use, start a simple web server from this folder:

```bash
python -m http.server 8000
```

On Windows, where Python is started with `py`, use PowerShell:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000>.

## What I learned

This project reinforced the value of separating a deterministic maths engine from the visual teaching layer, validating both the calculation and what is actually drawn on screen, and preparing relative PWA paths for deployment below a GitHub Pages project URL.
