# Radius-bounded discovery

`repository.load(now, scope)` accepts a center and a 1, 2, or 5 km radius. Without a center it returns no nearby facilities. Firebase queries published catalog metadata inside spherical bounding rectangles, then applies exact circular distance filtering before loading contribution summaries. Dateline crossings use two rectangles; circles reaching a pole span all longitudes. Existing text, access, and score filters apply to the returned circle without expanding it.

A detail ID switches the request to that single published or permanently closed facility, independently of the search area. Detail, review, and report screens install this scope while mounted. Pending records remain unavailable. Scope changes invalidate older responses, including delayed radius requests.

Each rectangle requests at most 201 candidates. More than 200 candidates, or more than 200 combined circular matches, produces an explicit density error rather than silently dropping facilities. This is a bounded curated-catalog implementation; dense areas need a paginated geographic index before launch at greater scale.

`findLocations(query, cursor)` is a separate name/building/address substring lookup for selecting a center. It scans at most three pages of 100 published metadata records per request and returns up to ten matches. It never loads review/report summaries. A query-bound document cursor resumes after the last consumed record; an empty page can still offer More catalog locations. This preserves substring semantics but is not indexed full-text search. Further scans require an explicit user action.

The latitude/longitude composite index is in `firestore.indexes.json`. Indexes and rules require an authorized deployment before cloud use; no deployment was performed.

Rendered tests cover radius expansion, stale response rejection, direct permanent-closure details without a center, and catalog relocation before nearby results exist. The radius, detail, and relocation scenarios were observed failing before their fixes. `scripts/service/discovery.test.mjs` adds geographic, dateline, pole, draft exclusion, direct-detail, metadata continuation, and cursor-validation checks. The emulator suite remains unexecuted following the earlier declined emulator runtime request; rendered tests and exports do not establish Firestore runtime or deployed index compatibility.

```sh
npx firebase-tools@15.34.0 emulators:exec --project demo-poopable --only firestore,auth 'node --test scripts/service/discovery.test.mjs'
```

The area picker displays only the current ten-result page, replacing it on successful continuation. A failed continuation retains that page with a stale label and its last successful refresh time; retry resumes from the same cursor.

Primary reference: [Firestore range filters on multiple fields](https://firebase.google.com/docs/firestore/query-data/multiple-range-fields).

## Standards review

No documented standards violations. One low-priority possible duplication finding concerned the picker's request lifecycle and the history pager. They retain separate lifecycle code because location lookup replaces a bounded page after a debounce, while history appends pages and resets on detail revision. A shared pagination abstraction is deferred until another concrete shared behavior requires it.

## Spec review

Two findings were fixed: catalog continuation now replaces the bounded current page, and failed continuation labels retained locations stale with their refresh time. A rendered retry scenario was observed failing before the fix and passing afterward. The existing Router `Slot` unmounts route screens; scope cleanup is checked against that navigation arrangement.

Standards: one low-priority judgement call, deferred. Spec: two findings, both fixed.

Local verification on 2026-10-22: lint, typecheck, all 25 rendered tests, configuration guard, adapter import, and iOS/Android production exports pass. Changed-file formatting passes. Repository-wide formatting still reports pre-existing issues in skill files, the approved spec, and root layout. An additional all-platform export attempted web and failed because the existing project has no `react-native-web`; both required native exports were rerun successfully. No dependency was added for web.
