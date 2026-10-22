# Service-side contribution summaries

Firebase discovery snapshots no longer download entire review and report collections. For each catalog restroom, `firebaseSummary.ts` uses Firestore read-time `count` and `average` queries for the overall score and each optional dimension. Each dimension has its own denominator; missing values remain absent. Scores are not calculated from the displayed history page.

Two filtered counts determine explicit true/false desperate-times answers updated strictly within the past 30 days. Separate bounded edge queries provide the latest assessment time and earliest answer expiry. Historical unanswered reviews, suppressed records, exact-boundary expired answers, and future answers do not contribute. The backend enforces one review identity per visitor/restroom; edits replace that record rather than adding votes.

The snapshot contains numerical summaries, at most the current signed-in visitor's own public review per restroom, and the single latest non-suppressed usability report at or before the evaluation time. Guest snapshots contain no review bodies. Review/report history remains independently paginated. The prior 2,000-review/report download caps are removed; unrelated contribution volume no longer trips those caps.

## Time and identity

`repository.load(now, scope)` accepts the feature's evaluation clock in epoch milliseconds. Write observation/update times still come from the service. Each summary carries `asOf` and the next explicit answer's `expiresAt`; these are evaluation metadata, not an observation or guarantee of current usability.

At expiry (or a backwards clock change), the provider requests fresh counts. Until that succeeds, the detail shows **Assessment needs refresh**, hides stale counts/classification, and retains the numerical scores. The default search excludes an assessment awaiting refresh; explicit inclusion can display it as not recommended with the refresh warning. An offline failure retains the existing data with its stale-data label and permits Retry. The provider attempts each expired summary version once automatically, avoiding repeated failed requests. Normal explicit refresh and app resume can retry. Latest usability still expires locally at exactly two hours without needing another report download.

Authentication changes reload the snapshot. The review editor waits until the snapshot belongs to the current visitor before prefilling an existing vote. An ordinary same-visitor refresh leaves an active draft mounted. Older guest/account requests cannot overwrite newer requests.

## Query footprint and deployment

Each facility currently uses four score aggregate queries, two answer counts, two answer-edge queries, one latest-report query, and (when signed in) one own-review query. Facility concurrency is limited to four. No listener, offline queue, new dependency, Cloud Function, or privileged client credential is introduced.

`firestore.indexes.json` includes the required score, answer-window, own-review, and history indexes. An authorized owner must deploy indexes/rules before cloud use; no deployment was performed. Aggregate and document queries do not share a transactional read timestamp. Concurrent writes may be reflected across different requests; refresh recomputes the current results. Firestore aggregation still scans server index entries and has service limits/costs; it avoids downloading contribution bodies, not all server work.

The catalog now loads only the selected radius or a single direct-detail facility before computing summaries. See [radius discovery](radius-discovery.md) for query bounds, density limits, and validation status.

## Validation and review

Rendered tests cover service scores beyond the old contribution cap, independent optional counts/history, exact assessment expiry with offline recovery, and delayed own-review loading after sign-in. The score and sign-in scenarios were observed failing before their fixes. `scripts/service/summary.test.mjs` adds emulator coverage for 2,502 ratings, 2,002 usability reports, optional dimensions, suppression, edits, exact 30-day exclusion, future/unanswered answers, and deterministic latest-report selection.

```sh
npx firebase-tools@15.34.0 emulators:exec --project demo-poopable --only firestore,auth 'node --test scripts/service/summary.test.mjs'
```

The emulator suite remains unexecuted under the earlier declined runtime permission. Deployed index availability and installed-device behavior are not established by rendered tests or bundle exports.

Local verification on 2026-10-21: lint, typecheck, formatting, the full 20-test rendered suite, the emulator configuration guard, direct Node adapter import, and both iOS/Android production bundle exports pass.

Primary references: [Firestore read-time aggregation](https://firebase.google.com/docs/firestore/query-data/aggregation-queries), [query indexes](https://firebase.google.com/docs/firestore/query-data/index-overview).

## Standards review

No actionable findings. Domain terminology, Router boundaries, and the rendered testing seam follow repository guidance.

## Spec review

No actionable findings in this aggregation slice. Independent score denominators, strict answer windows, suppression, latest-report ordering, identity-aware editor loading, and stale assessment recovery match the scoped contract. The unexecuted emulator suites and pending geographic service validation are explicit limitations.

Standards: 0 findings. Spec: 0 findings.
