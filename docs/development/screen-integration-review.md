# Screen integration review — 2026-10-21

Review baseline: `c6209ec`. Contract: [approved V1 spec](../specs/poopable-v1.md). Scope: integrate the previously isolated discovery/detail and account/contribution screens into `integration/poopable-v1`.

## Standards

No material findings against `AGENTS.md`, the agent guidance, glossary, and testing conventions. Routes use Expo Router; feature code stays outside the route directory. No actionable baseline code smells were identified.

## Spec

Three findings:

- Result summaries lacked Directions. Fixed by adding the shared directions action to result cards; the rendered location/directions journey was observed failing before the fix and passing afterward.
- Detail Directions followed all review/report history inside the scroll view. Fixed with a footer outside the scrolling content, within the safe area.
- Firebase reads load a capped global snapshot before UI history pagination. Unresolved C2 work: implement radius-bounded discovery, server aggregation, and facility-specific service pagination. The development adapter fails explicitly above its cap, preserving aggregate accuracy rather than silently truncating votes. Screen integration does not complete this production requirement.

Standards: 0 findings. Spec: 3 findings, 2 fixed and 1 remaining; service pagination is the remaining issue.

## Validation

Lint, typecheck, and both iOS/Android production bundle exports pass. The full rendered suite passes: 14 tests across three files, without snapshots. The local service configuration guard passes. The screen checks cover discovery/access filtering, exact classification/usability expiry, stale-data recovery, location races, review/report retry, account return, private flags, and discard confirmation.

Contribution emulator authorization checks were added but not run in this continuation because emulator execution permission was declined. Installed iOS/Android smoke checks, approved design originals, branding, map credentials, and a verified launch catalog remain release gates.
