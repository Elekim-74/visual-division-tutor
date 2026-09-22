# Operations

## Local running

Use a local static web server from the repository root:

```bash
python -m http.server 8000
```

Open <http://localhost:8000>. A server is required so the browser can load the module scripts and service worker in their normal web context.

## Testing

Run the complete automated suite with:

```bash
npm test
```

The suite uses Node's built-in test runner and covers deterministic calculation behaviour, input validation, visual group rendering, reset behaviour, accessible error announcements, manifest metadata, local asset caching and offline navigation fallback.

## Release and Pages verification

GitHub `main` is the canonical release branch and the GitHub Pages source. Before an authorised release:

1. Start from the current GitHub `main` and keep unrelated browser-review output out of the change.
2. Run `npm test`.
3. Review the local site at desktop, phone and tablet widths without changing the teaching behaviour or visual design unless separately authorised.
4. Publish only through the approved GitHub `main` workflow.
5. After propagation, verify the live Pages URL, manifest, service worker, local icons, HTTPS and one representative division example.

The Pages site is already deployed. This document does not authorise a hosting, deployment or PWA configuration change.

## Regular maintenance

- Keep `division.js` as the deterministic maths source and retain rendered-group validation in `app.js`.
- Keep manifest URLs, service-worker assets and icon paths relative to the project root.
- Update the service-worker cache name only when an authorised app-shell release needs clients to obtain new assets.
- Keep `.playwright-cli/` ignored. Its captures and screenshots are local review artefacts, not source files.
- Confirm `git status --short` contains only intended source or documentation changes before committing.

## Recovery and handover

| Situation | Recovery action |
| --- | --- |
| A local browser shows an earlier app shell | Refresh after checking the current service-worker cache behaviour; do not change cache configuration without approval. |
| Pages does not reflect an approved release immediately | Allow Pages propagation, then repeat the live verification checks. |
| A historical Windows copy is found | Treat it as reference-only. Compare it with GitHub `main`; do not use it as a release source. |
| Generated Playwright files appear | Leave them local and untracked; `.playwright-cli/` is intentionally ignored. |

For handover, provide the GitHub repository URL, the canonical `main` commit, the test result, the live Pages verification result and any explicit product decision affecting maths, teaching, PWA behaviour or hosting.
