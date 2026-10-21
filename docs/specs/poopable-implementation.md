# Poopable V1 implementation graph

Tracking stays local by owner instruction on 2026-10-21. Source contract: [approved V1 spec](poopable-v1.md). Integration branch: `integration/poopable-v1`. Baseline: `16b3543` (preserves existing specification and development setup changes).

## Phase 1 — reproducible foundations

- F1: Router startup, existing preview/fonts, startup documentation and native exports. Prerequisite draft 2. No blockers.
- F2: Rendered preview save/reset interaction, minimal test runner, lint/typecheck/test CI. Prerequisite draft 3. No blockers.
- F3: Isolated Firebase emulator, fictional catalog read, denied guest writes, configuration and reproduction instructions. Prerequisite draft 4. No blockers; no cloud provisioning.

## Phase 2 — discovery and assessment

- D1: Cohesive restroom experience boundary, deterministic fixtures, discovery and detail, access filters, opening hours, recommendation ordering, ratings and desperate-times aggregation. Blocked by F1 and F2.
- D2: Native map/location/directions adapters, manual search and accessible list alternative. Blocked by D1. Device verification remains separate from bundle validation.

## Phase 3 — identity and contributions

- C1: Email/password authentication, return-to-contribution navigation, editable review, immutable idempotent usability report, private moderation flags and owner operations. Blocked by F3 and D1.
- C2: Enforced service validation/authorization, screen recovery and retry, expiry/app resume behavior, pagination. Blocked by C1.

## Phase 4 — release validation

- V1: Screen behavior and emulator authorization checks, both native exports, lint/typecheck, independent standards/spec review. Blocked by D2 and C2.
- V2: Installed iOS/Android smoke checks, screen reader/large text, approved design originals, branding, map credentials and owner-verified launch catalog. Human-dependent inputs from prerequisite drafts 5–8; these are release gates, not completed by fixtures or JavaScript exports.

## Test boundaries

The spec already approves testing the assembled rendered experience with injected storage/authentication/location/clock/directions, plus service/emulator authorization checks. Real recommendation and aggregation behavior runs inside that boundary. Preview save/reset is the initial foundation interaction. No snapshots or style-object assertions.

## Execution record

- Baseline captured; F1, F2, F3 implementation underway in isolated worktrees.
- No GitHub issues or PRs will be created or updated.
