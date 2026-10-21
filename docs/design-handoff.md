# V1 design handoff

Source of behavior: [approved spec](specs/poopable-v1.md). Source of language: [glossary](../GLOSSARY.md). Source of visual tokens: `src/theme/tokens.ts`; reusable primitives: `src/components/ui/index.tsx`.

## Reference availability

The map, restroom detail, and review Stitch screenshots mentioned in the spec are not present in this checkout or this conversation's available attachments. No originals have been recreated or claimed as preserved. Authorized exports are still needed for screenshot-by-screenshot visual acceptance. The existing `DesignPreview` remains the available native composition reference. No sample facility, photo, rating, or certification becomes launch content.

## Screen composition

Map: compact brand/account header, search and filter controls, map attribution left visible, selected restroom summary and Map/List/Account navigation. Selection and observed condition need text as well as color. The list provides the complete alternative journey.

List: virtualized summaries using the same identities and order as the map. Each summary includes floor/access, direct distance, score with count, expected hours and separately timestamped observations. Eligible ordinary options precede last-resort options; temporarily closed options never receive recommendation wording.

Detail: back navigation, entrance/floor/address, hours in the facility's timezone, explicit unknown attributes, separate quality scores/counts and observed usability, recent written reviews with pagination, review/report actions, and a reachable Directions action. Use a facility symbol rather than an invented photograph.

Review: stable facility summary, overall experience required, three optional dimension scores, optional 2,000-character notes, and the independent desperate-times switch. Keyboard avoidance and scrolling keep submit reachable. Warn before discarding changes. Failed writes retain values and never show success.

## Wording and states

- Search switch: “Include desperate-times options.” Explain that access requirements, minimum rating, hours and usability remain in force.
- Review switch: “I would only use this restroom in desperate times.” Explain that it is independent of stars and observed usability.
- Quality: numeric overall and dimension scores, each with its own count. Unrated: “No ratings yet.” Classification evidence: flagged/explicit recent answers, dates and uncertainty.
- Observation: usable/closed/out of service with time; after two hours current usability is unknown. Expected-open hours are a separate fact.
- Loading: progress label. Refresh retains current results. Empty: explicit radius, relocation and reset choices. Failure: clear retry for current action. Offline retained data is labelled stale with last refresh time.
- Unknown fees, amenities, hours and access remain unknown. No verified-clean, certification, reputation, karma, photo-upload or bookmark controls appear in V1.

## Accessibility review

Use existing eucalyptus/aqua tokens, Quicksand headings and Nunito body text. Use semantic dark text (`ink`, `secondary`, `primary`) for readable content; do not use `mutedInk` for essential text without checking contrast. Targets are at least 48 units. Text wraps without fixed-height containers. Rating choices expose numerical values; switches expose labels and checked state. Keyboard focus, screen reader focus after navigation/errors, reduced motion, large text and both native platforms require installed-device acceptance.

## Release assets

Only the generic `assets/splash-icon.png` is available. Missing icon references have been removed; approved branding is still a release dependency. Do not treat the placeholder or screenshot logo as approved app branding. Keep fictional fixtures labelled and isolated from an owner-verified launch catalog.
