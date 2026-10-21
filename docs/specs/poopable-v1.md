# Poopable V1: find, assess, and review a nearby restroom

Status: draft for owner review; unpublished. Scope, proposed defaults, and testing boundaries require approval before implementation or GitHub publication.

## Problem Statement

Someone who needs a restroom cannot quickly tell which nearby facility they can access, whether it is expected to be open, or what recent visitors experienced. A building pin, old star rating, or attractive badge alone cannot establish that a particular restroom is suitable or currently usable.

## Solution

Deliver an iOS and Android app centered on one complete journey: find nearby restrooms on a map or list, assess a specific facility, and open directions. Guests can complete that journey without an account or location permission. Signed-in visitors can leave or edit a review and submit a timestamped usability report.

Start with a small, owner-curated catalog in a declared launch area. This spec proposes deferring public listing submissions and correction workflows to a follow-up release; their agreed domain definitions still apply to the longer-term product.

Use the three supplied Stitch screenshots as layout references for Map Home, Restroom Detail, and Rate This Restroom. Preserve the established warm eucalyptus palette, aqua accents, Quicksand headings, Nunito body text, rounded surfaces, pill controls, and gentle shadows. Screenshot sample names, photos, counts, claims, and scores are examples, not launch data.

### Proposed V1 scope

- Map and list discovery, manual search location, distance expansion, and relevant filters.
- Restroom detail, recommendation ordering, opening information, access conditions, and observed usability.
- Minimal account sign-in, sign-out, registration, and recovery needed to contribute.
- One editable review per signed-in visitor per restroom, with an overall rating and optional dimension scores and text.
- A separate desperate-times assessment on reviews and an “Include desperate-times options” search preference.
- Usability reporting and a way to flag inappropriate reviews or reports for owner handling.
- External directions to the entrance location; no in-app route calculation or invented walking ETA.

### Clarifications requiring approval

These are proposals, not additions to the agreed glossary yet.

| Screenshot concept                                   | Proposed V1 treatment                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sanitation tiers / Sanctuary Grade / Pristine Choice | Defer automatic tiers. Show numeric overall and dimension scores with counts. No score thresholds or sanitation certification have been agreed. Keep tier colors available for later design work.                                                                                                    |
| Desperate Times Only toggle                          | Include both agreed controls: a visitor assessment in the review and an “Include desperate-times options” search preference. This describes a last-resort quality trade-off, not closure or failed usability. Classification, freshness, and search defaults below are proposals requiring approval. |
| Highly Recommended                                   | Use recommendation ordering and a neutral “Recommended for your search” label where applicable; do not equate an app recommendation with a sanitation tier or guarantee.                                                                                                                             |
| Overall Cleanliness Rating                           | Change the required field to “Overall experience.” Optional cleanliness, supplies, and facility-condition ratings follow the glossary.                                                                                                                                                               |
| Fresh Scent / Water Flow / Door & Privacy            | Defer these additional scoring dimensions and aroma categories. Do not silently substitute them for the three agreed dimensions.                                                                                                                                                                     |
| Verified clean / verified users / Local Guide        | Omit verification and reputation claims. A report is a visitor observation, not independent verification.                                                                                                                                                                                            |
| Yes / No amenity checklist in a review               | Display known listing amenities with explicit unknowns. Defer visitor amenity edits; a review does not silently change approved listing attributes.                                                                                                                                                  |
| Go Now (2 mins) / walking distance                   | Use “Directions” and labelled direct distance. A directions app may calculate its own route and travel time.                                                                                                                                                                                         |
| Bookmarks, photo upload, karma, notifications        | Defer and omit the corresponding controls rather than ship nonfunctional buttons.                                                                                                                                                                                                                    |

## User Stories

1. As a guest, I want to start searching without signing in, so that I can find a restroom quickly.
2. As a seeker, I want to choose whether to share my location, so that I control location access.
3. As a guest, I want to search an area manually, so that discovery works without location permission.
4. As a seeker, I want to see restrooms within an initial 1 km radius, so that results are nearby.
5. As a seeker, I want to expand the radius, so that I can find options when the initial area has none.
6. As a seeker, I want to search catalog names and addresses, so that I can find a known building or facility.
7. As a seeker, I want distinct facilities on different floors or behind separate entrances to have distinct listings, so that I can find the correct restroom.
8. As a seeker, I want synchronized map and list results, so that I can choose a useful presentation.
9. As a seeker, I want labelled direct distance, so that I do not mistake it for a walking route.
10. As a seeker, I want to filter for a bidet, free entry, and a minimum overall score, so that I can express preferences.
11. As a seeker, I want to specify wheelchair access, gender designation or an all-gender option, and baby-changing requirements, so that results match my access needs.
12. As a seeker, I want missing attributes excluded when I explicitly require them, so that unknown information is not presented as a match.
13. As a seeker, I want to inspect listings with unknown attributes when I have not required those attributes, so that incomplete information remains discoverable.
14. As a seeker, I want opening hours and customer-only or paid access conditions, so that I understand entry requirements.
15. As a seeker, I want expected opening status separate from observed usability, so that I can judge uncertainty.
16. As a seeker, I want the time of the latest usability observation, so that I can judge its freshness.
17. As a seeker, I want older observations retained as history, so that a stale report is not presented as current confirmation.
18. As a seeker, I want permanently closed facilities excluded from recommendations, so that they are not suggested as usable destinations.
19. As a seeker, I want unrated facilities shown as “No ratings yet,” so that missing reviews are not mistaken for poor quality.
20. As a seeker, I want overall score and review count shown together, so that I can assess how much feedback exists.
21. As a seeker, I want dimension scores to remain separate from the overall score, so that I understand what each measures.
22. As a seeker, I want recent written reviews with dates and ratings, so that I can learn from visitor experiences.
23. As a seeker, I want directions to the restroom entrance and floor information, so that I can reach the intended facility.
24. As a guest, I want sign-in requested only when I contribute, so that browsing remains immediate.
25. As a visitor, I want to register, sign in, recover account access, and sign out, so that I can manage my contributions.
26. As a signed-in visitor, I want to submit an overall experience rating from 1 to 5, so that I can share my assessment.
27. As a reviewer, I want optional cleanliness, supplies, and facility-condition ratings and written notes, so that I can add useful detail without completing a long questionnaire.
28. As a reviewer, I want to edit my existing review, so that another visit updates my assessment without creating another vote.
29. As a reviewer, I want validation and retryable submission errors without losing my input, so that I can complete a contribution reliably.
30. As a signed-in visitor, I want to report usable, closed, or out of service independently of a review, so that I can share a time-sensitive observation quickly.
31. As a visitor, I want to flag an inappropriate review or usability report, so that the owner can address abuse.
32. As the owner, I want authenticated, restricted catalog and moderation operations, so that guests cannot alter public listing information.
33. As a screen-reader user, I want a complete list alternative and labelled controls, so that I can discover restrooms without interpreting map markers.
34. As a user with larger text settings, I want readable wrapping and reachable actions, so that the app remains usable.
35. As a seeker, I want explicit loading, offline, error, and empty-result states, so that I understand what happened and can recover.
36. As a seeker, I want my search and filters retained when returning from a detail screen, so that I can compare options easily.
37. As a reviewer, I want to indicate that I would use a restroom only in desperate times independently of my rating, so that I can communicate a last-resort experience.
38. As a seeker, I want to include desperate-times options explicitly, so that urgency can expand my quality choices while respecting my access needs.
39. As a seeker, I want to distinguish poor quality from closed or out of service, so that urgency never makes an unusable facility appear usable.
40. As a seeker, I want the basis and freshness of a desperate-times label visible, so that I can judge the evidence behind it.

## Implementation Decisions

### Current state and architectural boundaries

- The existing app provides theme tokens, bundled fonts, basic native components, and a design preview. Discovery, accounts, persistence, recommendation logic, and production navigation are not implemented. Installed libraries are not evidence of configured services.
- Use Expo Router for navigation, as required by the repository. Replace the design preview as the default launch experience; retain it as a development reference.
- Keep one cohesive restroom feature boundary responsible for discovery, detail, reviews, and reports. Screens should consume domain-facing operations rather than query storage independently.
- Use existing location, map, and Firebase dependencies where compatible and suitable. Propose Firebase Authentication and Firestore for accounts and persistence, subject to environment setup and SDK compatibility verification before implementation. Do not add overlapping state, styling, or navigation libraries by default.
- All proposed technical contracts describe behavior, not a finalized backend schema. Verify current official Expo and service documentation during implementation.

### Screen layouts and flows

| Screen             | Layout and behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map Home           | Compact brand header and account entry; floating search field; horizontally scrollable filter chips; full map; recenter control; selected-restroom summary above a bottom Map/List/Account dock. Summary contains facility name, floor, access conditions, direct distance, score/count, observed status, details entry, and Directions. Keep provider attribution visible.                                                                                                                                               |
| List               | Same search location, filters, and radius as Map. Virtualized result cards show the same information as map summaries in recommendation order. A result opens its detail. No selected summary obscures list content.                                                                                                                                                                                                                                                                                                      |
| Search / filters   | Search catalog names/addresses, choose a map center manually, change radius, and apply explicit access/amenity requirements. Include the “Include desperate-times options” switch with explanatory text. Provide Apply and Reset. Search results outside the radius can select a new search center; no external place-autocomplete service is required for V1.                                                                                                                                                            |
| Restroom Detail    | Back header; compact map preview; rounded content surface; name, floor, address, direct distance, hours, and access conditions; timestamped usability; desperate-times assessment counts and any derived last-resort label; overall score/count; optional dimension scorecards; amenity chips; paginated recent reviews; Write/Edit Review and Report Usability actions; bottom safe-area Directions action. Use “Restroom” in labels, with no claims of verification.                                                    |
| Rate This Restroom | Fixed facility summary; required “Overall experience” star input; optional cleanliness, supplies, and facility-condition inputs; optional notes; separate “I would only use this restroom in desperate times” switch; clear Submit/Save Changes action above the keyboard/safe area. Show an existing review for editing. Back navigation warns before discarding unsaved changes. Explain that this switch is independent of stars and usability. No automatic sanitation tier, rewards, or automatic draft-saved claim. |
| Report Usability   | Compact sheet or screen with usable, closed, and out-of-service choices, observation explanation, and explicit submission. The server assigns observation time at submission; V1 does not support backdated reports.                                                                                                                                                                                                                                                                                                      |
| Account            | Guest sign-in/registration entry; signed-in display identity and sign-out; email/password recovery. Preserve the intended restroom and action through authentication, and return on success without submitting automatically.                                                                                                                                                                                                                                                                                             |

Primary flow: launch → choose current or manual search location → map/list → filters or radius adjustment → select restroom → detail → external directions.

Contribution flow: detail → Write Review or Report Usability → authenticate if necessary → complete form → submit → success → refreshed detail. Authentication cancellation returns to detail with search context intact.

### Visual system and assets

- Existing theme tokens are authoritative for color and typography when screenshots differ: primary eucalyptus #00685f, page #f6fbf9, aqua/water accents, Quicksand headings, and Nunito text.
- Reuse AppText, Button, IconButton, Card, AmenityChip, and ScoreCard; adapt them to support production state and accessibility. Reuse the sheet styling with a real accessible presentation/dismissal controller. The preview dock is a styling reference; production navigation uses the router.
- Add reusable result summaries, filter controls, rating inputs, usability indicators, and review cards only where needed by these screens.
- Keep 48-unit minimum interactive targets, generous spacing, and rounded surfaces. Content reflows on narrow phones and tablets; large fonts must not cause fixed-height clipping.
- Use one consistent icon family for navigation, map markers, amenities, and actions. Markers must distinguish selection and condition using shape/text as well as color. Confirm library compatibility before adding dependencies.
- Use authentic, authorized launch content. No supplied screenshot photo, avatar, logo, certification, or numerical claim becomes production content automatically. Photo upload and galleries are deferred; show a simple facility icon rather than a fake photograph.
- App branding needs an actual approved icon asset before release. Existing app configuration references missing icon files; resolve this during implementation without treating the screenshot logo as a supplied production asset.

### Discovery and recommendations

- Initial radius is 1 km with explicit 2 km and 5 km expansion choices; never silently expand or relax requirements.
- The search location is independent of live device tracking. Panning the map presents “Search this area”; it does not continuously refetch on every gesture. Recenter requests foreground location only on user action or consented initial use.
- Published catalog entries are discoverable; pending submissions are not part of this release. Permanently closed entries remain reachable through an existing detail link and clearly labelled history, but are excluded from active discovery results and recommendations.
- Explicit required attributes must be known to match, including free entry and a minimum rating when chosen. Unrated listings fail an explicit minimum-score filter but remain eligible without it. Unknown hours and usability remain explicit, not silently treated as open or usable.
- Proposed recommendation eligibility excludes expected-closed facilities and those whose latest recent report is closed or out of service. A recent usable report does not override expected-closed hours; display both facts without hiding the conflict. Unknown hours remain eligible with a warning. This proposal needs approval.
- Proposed deterministic ordering: expected-open before unknown hours; within each group, direct distance ascending, recent usable observation before unknown usability when distance ties, overall score descending with unrated last only on ties, then stable listing identity. No undocumented weighted score. The distance-first trade-off follows the immediate-use goal and needs approval.
- Map/list show the same discovered matches. Ineligible recommendations can remain in discovery, visibly labelled and placed after eligible recommendations, so a visitor can inspect conflicting reports. Do not label these rows “recommended.”
- Opening calculations use the restroom's timezone and support overnight periods. Missing or ambiguous hours produce unknown opening status. Distances and scores use consistent display rounding without using rounded values for filtering.

### Desperate-times behavior

- Agreed meaning: a last-resort restroom someone may choose urgently despite low ratings or poor maintenance. Low rating alone never sets this classification, and a flag never changes a restroom's usability report, hours, or access conditions.
- Agreed review control: a separate “I would only use this restroom in desperate times” switch. New reviews start off, with text explaining that enabling it records that assessment; editing preserves the saved value. The service stores the boolean separately from all numerical scores. Historical reviews with no such answer remain unanswered rather than becoming negative votes.
- Agreed discovery control: “Include desperate-times options,” shared across map/list and retained with the current search. Show a clear last-resort label when an option is classified; its detail shows assessment counts and timestamps. Individual flagged reviews remain visible even when the facility has insufficient evidence for classification.
- Proposed classification, pending approval: use each visitor's single current, non-suppressed review updated within the previous 30 days and containing an explicit answer. At least three such answers and a strict majority flagged true classify the facility as a desperate-times option. A tie or fewer than three answers means insufficient evidence, not a positive claim of quality. Show the number flagged and total answers; re-evaluate after edits, suppression, and expiry. This 30-day quality window is independent of the two-hour usability window.
- Proposed search default, pending approval: inclusion is off. Off excludes classified desperate-times facilities from active map/list results and recommendations, while direct detail links remain available. On adds classified facilities that satisfy the same query, radius, explicit filters, and access requirements; group ordinary eligible recommendations before eligible last-resort options, then apply the existing ordering within each group.
- Turning inclusion on does not erase an explicitly chosen minimum rating: a low-rated option below that threshold remains excluded until the visitor changes the rating filter. No filter is silently relaxed. An empty state may offer inclusion and explain any still-active constraints.
- Closed, out-of-service, or permanently closed facilities remain ineligible for recommendation regardless of this preference. Discovery can still show temporary closure information under the existing discovery rules; the toggle never relabels it as usable. Unknown usability remains unknown, including for last-resort options.
- Reuse the urgent control's visual styling, replacing preview copy with the correct context-specific labels, state, and explanation. No changes to the live design preview are part of this specification update.

### Data, identity, and contribution contracts

- Each restroom has a stable identity, public lifecycle state, entrance coordinates, facility name, building/floor directions, address, local timezone/hours, access conditions, and explicit known-present/known-absent/unknown attributes. Treat customer restrictions and fees separately from physical accessibility.
- Discovery accepts search center, radius, text query, requirements, and the desperate-times inclusion preference; returns matching published listings with direct distance, recommendation eligibility, derived score/count, opening state, and latest observed usability. Detail returns one facility and paginated reviews/report history. Ordering and continuation must be stable.
- A review belongs to the authenticated visitor and a single restroom. Required overall rating is an integer 1–5; dimension scores are independently optional integers 1–5; notes are optional and limited to 2,000 characters. Store the desperate-times assessment separately as described above; validate any submitted value as a boolean. Optional empty fields remain absent rather than zero. Identity and timestamps are assigned or verified by the service.
- Review save is an upsert for that visitor/facility pair; retrying does not create extra reviews. A review update replaces its previous contribution to aggregate scores. Overall score is the arithmetic mean of published current overall ratings, displayed to one decimal with review count; each dimension has its own contributing count.
- Usability reports are separate immutable observations containing author, facility, server observation time, and usable/closed/out-of-service state. Retries use a stable submission identity to avoid duplicate observations. Latest observation wins; ties have a deterministic server ordering.
- A report is recent for strictly less than two hours after observation. At two hours it is historical and current usability becomes unknown unless another recent report exists. Recompute with elapsed time and on app resume, not only when new data arrives.
- Reviews and reports publish immediately after validation. A signed-in visitor can flag a contribution with a reason; create a private owner-visible moderation record, not an automatic public takedown. Provide an owner-only operational way to inspect flags and suppress inappropriate content; a dedicated moderator app is deferred. Suppressed content does not contribute to displayed scores or current usability.
- Enforce write ownership, allowed values, lengths, catalog permissions, and moderator access in the service, not only in screens. Public responses do not expose account emails, moderation records, or a seeker's location. Device location is used for the active search and is not stored in public contributions.
- Initial catalog content is owner-maintained through a restricted seed/import operation. Launch area and validated entries must be supplied before release; sample Glorietta data is not assumed accurate.

### Loading, errors, and empty states

- Initial discovery shows a visible progress state; refresh retains usable results and indicates refreshing. Prevent older search responses from replacing newer results. Retry acts on the current search.
- No matches offers radius expansion, manual relocation, and filter reset; no recommendations explains eligibility separately if other discovered matches remain.
- Denied, restricted, unavailable, or timed-out location offers manual location selection and a clear retry or settings action where supported. Do not repeatedly prompt automatically.
- A map-provider failure retains the list alternative. A malformed or missing detail link shows a recoverable not-found screen. Detail back behavior works for direct launches as well as navigation from search.
- Network failure offers Retry and retains already loaded data where possible. If previously loaded data remains visible offline, label it stale and show its last refresh time; do not imply it confirms current usability. Persistent offline caching and queued writes are deferred.
- No reviews and no dimension scores have distinct empty states. Missing hours, fees, attributes, and observation times never become affirmative values.
- Validation errors appear beside inputs and are announced. Disable duplicate submission while saving; preserve input after failure and permit retry. Only successful persisted saves display success.
- Sign-in failures preserve appropriate input and offer recovery; cancellation never submits a contribution. Sign-out removes access to privileged actions immediately.
- If no external directions handler is available, show the address/coordinates with a copy action and an understandable error.

### Accessibility and performance

- Map markers are an enhancement; the list supports the entire discovery-to-detail journey. Give markers and icon buttons descriptive labels, and expose selected tab/filter, rating value, and toggle state.
- Rating controls support both screen-reader increment/decrement or equivalent labelled discrete selections. Describe score values in text; do not require interpreting colored stars or progress tracks.
- Manage focus when opening and closing sheets and after navigation or validation. Respect font scaling, safe areas, keyboard avoidance, reduced motion, and contrast. Validate text/control contrast; use darker semantic ink where a token is too faint rather than copying low-contrast screenshot text.
- Keep primary actions reachable with large text and small screens. Paginate reviews, virtualize long lists, bound discovery by radius, and avoid repeated map renders and unbounded listeners. Do not request background location.

### Acceptance criteria

1. Given no account and denied location permission, a guest can choose a search location manually and open a listing without signing in.
2. Given map and list modes, changing a filter or radius produces the same result identities in both; back navigation preserves the search context.
3. Given separate facilities in one building, selecting either opens its own identity, entrance/floor information, and reviews.
4. Given required wheelchair access, an unknown or absent value cannot satisfy that requirement; removing it makes an otherwise matching listing discoverable.
5. Given no ratings, show “No ratings yet,” no numeric zero, and allow recommendation eligibility unless a minimum-score filter requires a rating.
6. Given ratings of 4 and 2, show 3.0 from two reviews; editing the second rating to 5 produces 4.5 from two reviews. An omitted dimension does not contribute to that dimension's denominator.
7. Given an earlier closed report and later usable report, display the later observation with time; at the two-hour boundary it becomes historical and current usability is unknown.
8. Given no approved sanitation-tier policy, production screens show neither Sanctuary Grade certification nor an inferred sanitation tier; the agreed desperate-times controls remain available as separate quality assessments.
9. Given a guest selecting Write Review, successful authentication returns to the intended form; cancelling returns without posting. Existing reviewers edit instead of adding another review.
10. Given invalid scores or notes exceeding 2,000 characters, submission is rejected accessibly; retry after network failure preserves input and does not duplicate a successful save.
11. Given a permanently closed facility, it never appears in active discovery or recommendations; an existing direct detail link explains permanent closure and preserves available history.
12. Given unknown hours or conflicting opening/report information, show the uncertainty and apply the proposed eligibility rules exactly; never label the facility confirmed open merely from hours.
13. Given a directions action, open the selected facility entrance in an external map app, without displaying a fabricated walking ETA; a missing handler offers copyable destination details.
14. Given unauthorized catalog or another visitor's review writes, the service rejects the request even if the app interface is bypassed. Moderation flags and account email are inaccessible to guests.
15. Given offline discovery, map-provider failure, empty results, missing detail, or failed submission, show the specified recovery state without blank screens or false success.
16. Given larger text, screen-reader use, or a narrow display, search, list, detail, review, and report flows remain completable with visible labels and reachable actions.
17. Given the screenshots and existing theme, all core screens retain eucalyptus/aqua colors, Quicksand/Nunito typography, pill controls, rounded cards, and safe-area-aware layouts, without screenshot sample claims or dead controls.

18. Given a review with a desperate-times flag, saving or editing it changes neither its star rating nor the facility's usability; show the visitor assessment separately.
19. Given the proposed aggregation policy is approved, two flagged answers out of three recent explicit answers classify a listing; one out of two, a tie, unanswered historical reviews, and fewer than three answers do not. Editing, suppressing, or expiring an answer recomputes the classification without adding another vote.
20. Given inclusion is off, classified facilities are excluded from active search results; turning it on includes only those meeting all remaining filters. Map/list agree and back navigation preserves the preference.
21. Given a flagged facility is closed, out of service, inaccessible for a required need, below an explicit minimum score, or permanently closed, enabling inclusion does not make it an eligible recommendation. Low stars alone never create a desperate-times classification.
22. Given insufficient classification evidence, show the observed counts with uncertainty and no claim that the facility is well maintained. At the proposed 30-day boundary, an answer stops contributing without altering its separate review or two-hour usability history.

## Testing Decisions

- Proposed main testing boundary: the assembled restroom experience, driven through rendered screens and user actions. Inject controlled catalog/review/report operations, authentication state, location results, clock, and external directions at the feature's outside boundary. Exercise real recommendation and aggregation behavior rather than mocking their internal functions.
- Cover discovery, filters, map/list synchronization, detail, authentication return, review upsert, usability expiry, moderation visibility, desperate-times assessment persistence, classification boundaries, inclusion filtering, and recovery through this shared boundary. Keep native map rendering as a narrow adapter and verify visible result identities through the accessible list.
- Good tests assert visible outcomes, persisted effects at the boundary, denied operations, and preserved user input. Avoid snapshots as the primary assertion, component-internal state, style-object tests, and tests mirroring implementation steps.
- Use deterministic fixtures for a rated facility, an unrated facility, unknown access, fees, separate entrances, closed hours, permanent closure, conflicting reports, and overnight schedules. Drive the injected clock across the exact two-hour boundary without real waiting.
- Add focused service/emulator authorization checks for public reads, review ownership, valid write data, aggregate updates, private moderation records, and owner-only catalog changes. Screen tests alone cannot establish access control.
- Use a small device smoke suite on iOS and Android for permission denial/manual fallback, native maps, keyboard and sheet interaction, external directions, and a successful review/report save. Review each screen visually against the supplied composition using approved tokens; check large text and a screen reader manually.
- No existing test suite, test runner, or comparable integration tests were found. Select the smallest compatible test tooling during implementation; there is no existing testing convention to claim as prior art.
- Run repository lint and typecheck, production bundle exports, and the added meaningful tests before completion. Test boundaries are proposed for owner approval with this draft.

## Out of Scope

- Automatic sanitation tiers and sanitation certification. The desperate-times assessment and inclusion controls are in scope as distinct concepts, subject to approval of their proposed aggregation and search defaults.
- Public new-listing submissions and listing-correction screens; duplicate merging and a dedicated moderator dashboard.
- Photo galleries/uploads, aroma classification, extra sanitation scoring dimensions, local-guide status, karma, rewards, notifications, bookmarks, and sharing.
- Third-party place autocomplete, in-app routing, walking-time estimates, indoor navigation, background location, offline map downloads, and queued offline contributions.
- Web release, dark mode, social sign-in, business-owner claims, paid placements, and recommendation personalization beyond explicit search requirements.
- Claims that visitor reports establish safety, independent verification, or guaranteed current access.

## Further Notes

The glossary remains the source of agreed domain language. This draft proposes a bounded release of that broader model; approving V1 scope does not delete future glossary concepts. New tier definitions must be agreed before being added to the glossary or enabled in the app.

The three screenshots are conversation attachments and have not been stored as repository image assets. Preserve exported originals as design reference artifacts before implementation handoff; the Stitch source identifier alone is not a local screenshot. The supplied stylesheet and native design preview are available as complementary visual references.

Before implementation, confirm this scope, the deferred sanitation-tier treatment, desperate-times classification/freshness/search proposals, the recommendation defaults, and the proposed testing boundary. Service provisioning, launch catalog content, production map credentials, approved branding assets, and account-release requirements remain release dependencies, not completed setup.

After owner approval, publish this spec to the configured GitHub repository with the ready-for-agent label. Do not publish this draft or create implementation tickets until authorized.
