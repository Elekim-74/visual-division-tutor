# Decisions and handover

## Canonical source

GitHub repository [`Elekim-74/visual-division-tutor`](https://github.com/Elekim-74/visual-division-tutor), branch `main`, is the sole canonical code source. This decision is independent of any local worktree name or machine path.

Historical Windows copies exist, including an earlier local Git worktree, a dated Codex task copy and a Documents copy. They are preserved as historical references only. They must not be merged, deployed or used as release sources without a separate comparison and human approval.

## Accepted product decisions

| Decision | Status |
| --- | --- |
| Deterministic maths engine and rendered-group validation | Accepted. Preserve the calculation and teaching safeguards. |
| Current sci-fi visual design and teaching flow | Accepted. V1 has passed human visual and responsive review. |
| Static client-side PWA | Accepted. No framework, backend, database or learner account system is required. |
| GitHub Pages project-site deployment | Accepted and live. Keep the existing relative-path PWA configuration. |
| Browser-review artefacts | Not source. `.playwright-cli/` is ignored to prevent accidental commits. |

## Known limitations

- The tutor supports whole-number division only.
- Offline use begins only after a successful online app-shell cache.
- The project has no learner progress tracking, authentication or multi-user features.
- The README screenshot remains a placeholder; adding a portfolio image requires a separate asset decision.

## Decisions requiring approval

- Any change to the maths engine, teaching language, validation behaviour, accessibility behaviour, visual design, PWA cache strategy or Pages configuration.
- Any public deployment change beyond the existing Pages site.
- Any attempt to merge, remove, rename, archive or otherwise reconcile historical Windows copies.
- Any decision to retain browser screenshots as deliberate repository assets rather than local review output.
