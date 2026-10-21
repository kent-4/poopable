# Poopable: prerequisite ticket drafts

Status: prerequisite 1 completed locally on 2026-10-21 after owner approval of the V1 decisions. Remaining tickets are drafts; no GitHub issues created. Publication and implementation have not begun.

## Audit evidence

- Repository has a clean working tree at audit start; no existing open GitHub issues were found.
- Lint and typecheck pass. Online Expo dependency validation reports installed dependencies are up to date; no blanket dependency upgrade is needed.
- Expo Doctor passes 19 of 20 checks. App asset validation fails because configured app/adaptive icon files are missing. The configured web favicon is also absent, although web release is out of scope.
- Expo Router is required by repository guidance but is absent from dependencies and application startup.
- The design system and font-loading preview exist. There are no automated behavior tests, test runner, CI workflow, service configuration, environment example, EAS configuration, or onboarding README in the repo.
- Firebase and maps libraries are installed, but repository contents do not establish a provisioned Firebase project, authentication provider, map credentials, or working native maps build. External accounts may already exist; inspect them before provisioning duplicates.
- At audit time, the V1 scope and defaults were unapproved. The owner approved them on 2026-10-21; see the resolution for prerequisite 1 below.
- Stitch screenshots are available in conversation, not as durable repo assets. Production branding and a validated launch catalog are not supplied.

## Sequence and scope

Ticket 1 is the product decision gate before feature coding. Tickets 2 and 3 are bounded code/setup prerequisites, not work to perform in this planning turn. Tickets 4 and 5 verify external services through the smallest useful path rather than asking for a complete backend or map feature upfront. Tickets 6 and 7 can proceed independently; ticket 8 is needed for release, not a reason to stop fixture-based development.

Owner decisions, account access, billing approval where needed, and real-world data validation are human inputs; agents handle the preparation and verification around them. The proposed publication label is ready-for-agent for technical work and ready-for-human for unresolved owner-input work. Do not assign ready-for-agent to an unresolved product decision.

## 1: Agree the V1 behavior and testing contract

**What to build:** An approved, internally consistent V1 brief that lets implementers make the same decisions about discovery, reviews, and desperate-times options.

**Blocked by:** None.

**Status:** Completed locally on 2026-10-21. Owner approved the decision package in conversation; the approved contract is recorded in [the V1 spec](poopable-v1.md). GitHub publication remains separately authorized. The glossary already defines the relevant concepts and needs no terminology change.

- [x] Resolve the desperate-times classification proposal: strict majority of at least three explicit recent answers, a 30-day window, inclusion off by default, and interaction with explicit minimum ratings and usability.
- [x] Approve or revise recommendation eligibility and ordering, the owner-curated catalog scope, deferred sanitation tiers, authentication approach, Firebase proposal, and the main screen-level testing boundary.
- [x] Record approved decisions in the V1 spec; retain the existing glossary vocabulary. Publication is a separate pending action requiring owner authorization.

## 2: Make the existing preview boot reliably through Expo Router

**What to build:** The same design preview opens through the required navigation system on iOS and Android, with valid local app assets and reproducible startup instructions.

**Blocked by:** None. Independent of unresolved feature rules.

- [ ] Add SDK-compatible router setup and move the existing preview behind its entry route without adding business screens or duplicating navigation systems.
- [ ] Repair missing native icon references using valid existing or explicitly temporary assets; remove or correct the stale favicon reference. Temporary assets need no final brand approval.
- [ ] App startup loads the existing bundled fonts and displays the preview; lint, typecheck, Expo Doctor, and both platform bundle exports pass.
- [ ] Document install/start commands and the distinction between bundling and device verification.

## 3: Prove a user interaction locally and in CI

**What to build:** A contributor can run one command locally and have a pull request verify a real interaction in the current preview, plus lint and typecheck.

**Blocked by:** None. Can exercise the current preview independently of router migration.

- [ ] Select minimal Expo-compatible test tooling and prove a meaningful interaction: saving a preview changes its visible saved state and Reset restores it.
- [ ] Add a pull-request workflow using the committed package-manager lockfile, lint, typecheck, and the interaction test; demonstrate that a deliberately failing assertion is detected before restoring it.
- [ ] Avoid tests that merely inspect style objects or mirror component internals. Do not require paid accounts, production credentials, or mobile signing for this check.
- [ ] Keep any UI assertions compatible with ticket 2's entry-point change, and document the test command.

## 4: Prove a development catalog can be read safely

**What to build:** A reproducible development service check reads one clearly fictional published restroom as a guest while unauthorized catalog writes fail; all data is isolated from production.

**Blocked by:** 1 (resolved on 2026-10-21: Firebase Authentication and Firestore approved, subject to setup and compatibility verification).

**Owner input:** Existing project access, or authorization and project/region selection if a development project must be provisioned.

- [ ] Inspect existing resources before creating anything; record environment ownership and the approved development project or emulator setup.
- [ ] Supply a configuration example with placeholders, validate required values, and keep privileged credentials outside the app and source control. Public client configuration is not treated as authorization.
- [ ] Use an emulator-backed seed/read path with explicit published status and unknown attributes; verify guest read and rejected unauthorized write.
- [ ] Record the selected account authentication provider and development access setup. Implementing account UI, aggregate ratings, and the full review/report model belongs to later vertical slices.
- [ ] Document how to reset and reproduce the check, plus which external provisioning remains human-dependent.

## 5: Prove a native map can locate one fixture and hand off directions

**What to build:** In a development build, a tester can open one fictional restroom marker, deny location access and still find it manually, and open external directions to its entrance.

**Blocked by:** 2. Does not require live catalog access or ticket 4.

**Owner input:** Expo account access and map-provider credentials or billing approval only where the selected provider requires them.

- [ ] Inspect available Expo project ownership, choose platform app identifiers and map provider setup, and configure development builds using EAS where needed.
- [ ] Set up only required foreground location permission text, restricted provider configuration, and a documented device test path.
- [ ] Verify a native map and marker on iOS and Android; deny permission and complete the manual-location path; confirm directions use the fixture's entrance coordinates.
- [ ] Record evidence for installed builds. A successful JavaScript bundle alone does not complete this ticket.
- [ ] Keep the fixture path isolated from production; no full search backend, review model, or production signing/submission is included.

## 6: Preserve and annotate the design handoff

**What to build:** A reviewer can compare the three screen references with the native design system and distinguish approved V1 elements from deferred screenshot features.

**Blocked by:** 1 (resolved) for the final annotations. The supplied references can be collected immediately.

**Owner input:** Original Stitch exports or access if they cannot be recovered from available artifacts.

- [ ] Preserve original map, detail, and review screenshots as durable authorized design references, with source context.
- [ ] Identify the existing tokens and reusable controls; choose one icon family rather than adding overlapping UI libraries.
- [ ] Annotate loading, empty, error, unknown, large-text, and keyboard layouts and the agreed wording for desperate-times controls.
- [ ] Distinguish numeric ratings, community observations, recommendation labels, and deferred verification/karma/photo features. No invented sanitation guarantee appears in the handoff.

## 7: Prepare an approved native branding asset set

**What to build:** A device-installed development app displays approved Poopable branding instead of temporary or missing icons.

**Blocked by:** None. Asset creation can proceed independently; native verification uses the build path established in ticket 5 when available.

**Owner input:** Brand asset selection or approval.

- [ ] Inventory any existing authorized logo/icon source before commissioning or generating replacements.
- [ ] Prepare the required native app/adaptive icon variants and validate their configuration; retain the existing eucalyptus palette and document source rights.
- [ ] Obtain owner approval and confirm the installed app icon on each target platform before release.
- [ ] Do not block fixture-based feature development on final branding. Web favicon work remains deferred unless needed to make current configuration valid.

## 8: Prepare the first verified launch catalog

**What to build:** The first declared launch area contains owner-reviewed restroom listings that a guest can actually use for discovery, rather than screenshot examples mistaken for facts.

**Blocked by:** 4 for the complete imported catalog; prerequisite 1 is resolved. Research and factual review can start while service setup proceeds.

**Owner input:** Launch area and factual approval of real facilities.

- [ ] Select a small launch area and record facility identity, separate entrance/floor, coordinates, hours/timezone, access conditions, and explicitly unknown amenities where evidence is missing.
- [ ] Record provenance and review date; do not fabricate ratings, usability reports, or verification badges for seed data.
- [ ] Keep fictional test fixtures separate from launch data. Import approved records through the restricted catalog operation when available.
- [ ] Demonstrate at least one suitable known facility and an honest empty/unknown case. Launch data completeness gates release, not the start of fixture-based coding.

## Review questions before publication

Does this granularity feel right, are the blocking edges genuine, and should any tickets be merged or split? Approval of this breakdown authorizes publication of these prerequisite tickets, not automatic approval of every still-proposed V1 rule or execution of account/billing changes.

Technical sources checked during this audit: [Expo Router installation](https://docs.expo.dev/router/installation/), [SDK 58 maps reference](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/), and the installed Expo tooling's online compatibility check and Doctor results.
