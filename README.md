# Visual Division Tutor

Visual Division Tutor is a free, child-friendly Progressive Web App (PWA) that makes division visible. It shows chunking and equal groups step by step, helping children connect division symbols with the quantities they represent.

## Canonical source and status

The canonical code source is the [`Elekim-74/visual-division-tutor`](https://github.com/Elekim-74/visual-division-tutor) repository on GitHub `main`. The live GitHub Pages site is available at <https://elekim-74.github.io/visual-division-tutor/>.

V1 has passed human visual and responsive acceptance on desktop, phone and tablet layouts. The current interface, deterministic maths engine, PWA behaviour and GitHub Pages configuration are accepted.

Historical Windows copies may exist for reference, but they are not canonical and must not be used as release sources. Use GitHub `main` for code and release decisions.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md) describes the browser-only tutor, PWA assets and source boundaries.
- [Operations](docs/OPERATIONS.md) covers local running, testing, release verification and maintenance.
- [Decisions](docs/DECISIONS.md) records the canonical-source, release and historical-copy decisions.

## The problem

Division can feel abstract when a child sees only numbers and symbols. This project provides a visual aid for the moment when a learner needs to see what the maths is doing before returning to their school question.

## Features

- Builds the actual number of equal groups, with the correct number of counters in every group.
- Explains the dividend, divisor, quotient and remainder in child-friendly language.
- Shows chunking calculations and remainders step by step.
- Validates the calculation and the rendered counters before displaying a result.
- Works responsively on tablets and computers.
- Can be installed on supported browsers and works offline after the first successful load.
- Includes a **Start again** control for quick practice.

## Technical approach

The app uses standards-based HTML, CSS and JavaScript with no framework or server dependency. `division.js` contains the deterministic integer-only calculation engine. `app.js` renders the teaching view and checks the resulting DOM counters. A web app manifest, service worker and local icons provide installation and offline support. Relative PWA paths allow the app to work from the GitHub Pages project subpath.

## Validation and testing

- `calculateDivision()` creates one source-of-truth calculation object.
- `validateCalculation()` checks the quotient, remainder, chunk totals and every before/after step.
- The interface refuses to render a maths diagram when validation fails.
- `validateRenderedGroups()` counts the DOM counters in every group and removes an invalid diagram.
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

Then open <http://localhost:8000>.

## What I learned

This project reinforced the value of separating a deterministic maths engine from the visual teaching layer, validating both the calculation and what is actually drawn on screen, and preparing relative PWA paths for deployment below a GitHub Pages project URL.
