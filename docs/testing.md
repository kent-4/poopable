# Local interaction checks

Run `npm ci`, then `npm test` from the repository root. For the complete pull-request check, run `npm run lint`, `npm run typecheck`, and `npm test -- --ci`.

The approved seam is the rendered restroom experience with injected repository, authentication, clock, location, and directions boundaries. Discovery/detail tests exercise access filters, classification and expiry, manual relocation, stale data, review aggregation, and late location responses. Contribution tests exercise review retry, report idempotency, registration without automatic submission, private flags, and discard confirmation. Real domain behavior runs inside this boundary; native maps stay an adapter.

The `DesignPreview` reference also retains its save/reset interaction test. These checks render actual UI controls without snapshots or style-object assertions.

History tests drive detail through lazy review pages, a retryable next-page failure, equal-time continuation, refresh after an edit, and navigation away from an in-flight request. Aggregates use the complete catalog snapshot and remain independent of the displayed history page. The separate [history emulator suite](development/history-pagination.md) verifies Firestore cursor precision, scoping, and suppression; it remains unexecuted pending emulator permission.

The SDK 58-compatible `jest-expo` preset supplies native boundary mocks. React Native Testing Library 14 uses its React 19-compatible renderer; no deprecated `react-test-renderer` dependency is needed. Service checks in `scripts/service/` use Node’s separate test runner and are excluded from Jest; see [the emulator guide](development/firebase-emulators.md). Watchman is disabled so checks also run on machines without its service or filesystem permissions.

The GitHub Actions workflow installs the committed npm lockfile with Node 24 and runs lint, typecheck, and tests on pull requests and pushes to main. It requires no production credentials, signing, or paid services. Creating the workflow locally does not publish or run it on GitHub.

On 2026-10-21, failure detection was verified by temporarily expecting the nonexistent button label **Saved incorrectly** after saving: `npm test -- --ci` exited 1 with one failed test. Restoring **Saved to preview** produced one passing test. Production screen behavior already existed and needed no changes.

These JavaScript interaction checks do not establish that native maps, permissions, fonts, or signing work on installed iOS and Android builds.

Tooling references: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Expo Jest setup](https://docs.expo.dev/develop/unit-testing/), and [Jest getting started](https://jestjs.io/docs/getting-started).
