# Restroom history pagination

The detail screen requests reviews and usability observations through separate `RestroomRepository.loadReviews` and `loadReports` operations. Each request is scoped to one restroom and returns up to ten non-suppressed records, newest first. A non-null `next` cursor means another page is available. These operations do not change the catalog snapshot used for aggregate ratings, recommendations, or current usability.

Firebase orders by contribution timestamp descending, then document identity descending. Cursors preserve timestamp seconds and nanoseconds, not rounded display milliseconds, and carry their restroom and collection identity. A cursor for another facility or contribution kind is rejected before a query. One extra record determines whether more results exist; it is not consumed by the cursor. Retry reuses the same cursor. The session-only demo adapter uses the same time/identity order.

History loads on detail entry. A failed next-page request keeps already loaded history and offers Retry. Pending requests cannot append to a different restroom after navigation. A successful detail refresh starts fresh pages, including when the clock has not advanced. Edits and new contributions that move ahead of the cursor appear on refresh; pagination is a continuation through current data, not a frozen historical snapshot. Suppression takes effect on subsequent reads and refreshes.

`firestore.indexes.json` defines the review/report composite indexes. They must be deployed with the existing rules to an authorized Firebase project before cloud use. No deployment or cloud provisioning was performed here. TypeScript import extensions are enabled for the shared cursor code so Node 24 emulator scripts can load the same adapter directly without a separate transpiler.

## Verification

The rendered detail boundary covers next-page retry while preserving the aggregate score, equal-time continuation without duplicates/gaps, and page reset after an edit/refresh. Emulator checks in `scripts/service/history.test.mjs` additionally cover full nanosecond precision, facility isolation, suppression, tie order, repeatable cursors, and cross-facility/kind cursor rejection.

Run those checks in the existing local emulator environment:

```sh
npx firebase-tools@15.34.0 emulators:exec --project demo-poopable --only firestore,auth 'node --test scripts/service/history.test.mjs'
```

The emulator checks are added but remain unexecuted following the earlier declined emulator execution request. JavaScript tests do not establish deployed index availability or installed-device behavior.

Local verification on 2026-10-21: lint and typecheck pass; the complete rendered suite passes 17 tests across four files; the emulator configuration guard and direct Node adapter import pass; iOS and Android production bundle exports pass. The first rendered pagination/retry scenario was observed failing before the history implementation and passing afterward.

## Remaining C2 work

The catalog snapshot now uses [service-side aggregates](service-aggregation.md) instead of downloading public contribution collections. [Radius-bounded catalog queries](radius-discovery.md) are implemented; geographic service validation remains pending. Never derive an overall score from the currently displayed history page.

Primary references: [Firestore query cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors), [query indexes](https://firebase.google.com/docs/firestore/query-data/index-overview), [stored timestamp precision](https://firebase.google.com/docs/firestore/manage-data/data-types).

## Standards review

No actionable findings against repository guidance, glossary, testing conventions, or the code-smell baseline.

## Spec review

One test-fixture finding was fixed: Firestore stores timestamps with microsecond precision. The emulator fixture now uses distinct microseconds within one millisecond, with timestamp order different from identity order. The cursor still carries the full stored seconds/nanoseconds values. Facility scope, suppression filters, retry, refresh reset, navigation races, and aggregate/history separation otherwise match this slice's contract.

Standards: 0 findings. Spec: 1 finding, fixed; no remaining scoped findings. Geographic service validation remains pending above.
