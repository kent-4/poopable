# Local development catalog

Prerequisite 4 uses the local Firebase Emulator Suite exclusively. The repository already depends on the Firebase JavaScript SDK; there was no Firebase project configuration or evidence of provisioned resources in the repository. No account lookup, cloud project, billing, deployment, or external account change was performed. The contributor owns their disposable local emulator data. `demo-poopable` is a demo identifier, not a provisioned project.

Email/password is the approved Authentication provider. The Auth emulator is configured on port 9099 for later account slices; this catalog proof requires no account or app sign-in. Production provider enablement, project ownership, region, client configuration, and privileged owner import credentials remain unconfigured. The rules deny every client catalog write, including signed-in clients; a future restricted owner service must perform imports.

## Reproduce

Use Node 24 and Java 21 or later. From the repository root:

```sh
node --test scripts/service/config.test.mjs
npx firebase-tools@15.34.0 emulators:exec --project demo-poopable --only firestore,auth 'node --test scripts/service/emulator.test.mjs'
```

The CLI downloads the emulator on first use and needs network access. `emulators:exec` starts a fresh in-memory instance, runs the check, and stops it. Re-run the command to reset. For an interactive session, run `npx firebase-tools@15.34.0 emulators:start --project demo-poopable --only firestore,auth` and execute the test separately. Do not use these permissive owner-token seed operations against cloud services; the scripts reject non-demo project IDs and non-loopback addresses before making a request.

`.env.example` supplies local placeholders. Defaults work without copying it. To override local ports, copy to `.env.local` and run Node with `--env-file=.env.local`; change `firebase.json` to match. No privileged credentials are needed or stored. Public Firebase client settings do not grant permissions. Native devices require a separate explicitly configured host adapter; these scripts deliberately support only local loopback.

The proof seeds `fictional-emulator-restroom` and a private pending fixture through the emulator-only owner token, then reads the published fixture as a guest and attempts create/update/delete and private reads without authorization. It also creates an email/password account in the Auth emulator and checks that signed-in clients still cannot edit the catalog or read private moderation records. Real Firestore rules reject those operations. Missing emulators fail the check; this is never counted as a passing skipped test.

## Data and authorization boundary

The `restrooms/{id}` fixture uses `state`, identity/name/building/floor/address, entrance coordinates, timezone, `attributes`, and `access` matching the V1 app contract. Coordinates (0, 0) and its name clearly mark it as fictional. Unknown amenities are explicit `unknown`, customer-only access is `null`, hours are absent, and no reviews or fabricated ratings are seeded. These records are not launch data.

Guests may read published records and permanently closed history; pending records remain private. Queries must constrain state to the public states because Firestore rules are not result filters. All client writes and all other collections default to denied. Review ownership, aggregates, usability reports, account data, and moderation write rules must be added with their corresponding tested service slices; this prerequisite does not claim those workflows are implemented.

## Verification evidence

Configuration guard test was observed failing before implementation and passing after implementation. The emulator authorization check passed on 2026-10-21 with Node 24.21.0, Firebase CLI 15.34.0, Firestore emulator 1.22.0, and a temporary Temurin JDK 21.0.12.1. Both guest and authenticated catalog write attempts were rejected, pending and private reads were rejected, and the published fictional fixture was readable. Lint and typecheck also passed. The system Java installation was left unchanged; contributors still need Java 21+ to reproduce the check. No cloud service was contacted by the catalog/auth test.

Primary references checked 2026-10-21: [Firestore emulator connection and demo-project isolation](https://firebase.google.com/docs/emulator-suite/connect_firestore), [Security Rules testing](https://firebase.google.com/docs/rules/unit-tests), and [email/password authentication](https://firebase.google.com/docs/auth/web/password-auth).

## Contribution service slice (2026-10-21)

The client adapter is `src/features/restrooms/firebase.ts`. It implements the shared repository/auth boundary with email/password accounts, public display names (no email fallback), a deterministic review ID per visitor/restroom, immutable reports with retry identifiers, server timestamps, and private moderation flags. Contribution writes use transactions so offline attempts fail rather than becoming queued offline submissions. The adapter reads from the server, never treats cached data as a successful refresh, and converts Firestore timestamps to epoch milliseconds. Rules enforce ownership, field allowlists, whole-number scores, optional boolean answers, text lengths, public restroom references, and server time even for clients bypassing the app.

`createConfiguredServices()` in `firebaseConfiguration.ts` accepts only explicit `emulator` or `firebase` app modes. `.env.example` documents public settings. Emulator mode requires a `demo-` project and an explicit reachable host; live mode rejects demo project IDs and emulator-host settings. No default service contact, account setup, provider enablement, rule deployment, or cloud project is performed by this implementation. Auth uses SDK session storage availability; no native persistent sign-in store or disk-backed catalog is introduced.

The small curated catalog is bounded to 200 restrooms. Contribution scores/counts use [server-side aggregation](service-aggregation.md); full contribution downloads and the former 2,000-record caps are removed. Detail history uses separate facility-scoped ten-record queries; see [history pagination](history-pagination.md) for cursors, indexes, and emulator checks. A larger launch still requires radius-bounded catalog search. Queries do not share a single read timestamp; a concurrent edit can appear on the next refresh.

`createOwnerOperations(db)` is an operational API outside consumer screens. The authenticated account must carry a trusted `owner: true` custom claim assigned from a privileged environment. It exposes catalog import, private flag inspection, and contribution suppression/restoration. A client cannot grant itself that claim. Suppression only changes the suppression field; hidden contributions leave public queries and aggregates. There is no automatic takedown from a flag. Production owner assignment remains an owner provisioning dependency.

Run both checks in order in the same fresh emulator session (the first seeds the fictional catalog):

```sh
npx firebase-tools@15.34.0 emulators:exec --project demo-poopable --only firestore,auth 'node --test scripts/service/emulator.test.mjs && node --test scripts/service/contributions.test.mjs'
```

The contribution check covers persisted review replacement, absent optional answers after edits, report retry, private flags, bypassed invalid writes, unauthorized owner operations, and authenticated owner suppression/import. It uses an unsigned custom token accepted only by the Auth emulator for its local owner fixture. Do not use this test token outside the emulator.

Verification status: the new contribution suite was observed failing before its adapter existed. Typecheck and lint pass. The new Firestore rules and contribution/emulator checks have **not been executed successfully** in this resume session: execution permission for the emulator runtime was declined. Earlier catalog-only emulator evidence above applies to the prior rules, not this contribution slice. Passing service authorization is a remaining validation gate.

Primary API references checked 2026-10-21: [transactions and offline failure](https://firebase.google.com/docs/firestore/manage-data/transactions), [password authentication](https://firebase.google.com/docs/auth/web/password-auth), [Rules and authentication](https://firebase.google.com/docs/rules/rules-and-auth), [Auth emulator unsigned tokens](https://firebase.google.com/docs/emulator-suite/connect_auth), and [trusted owner claims](https://firebase.google.com/docs/auth/admin/custom-claims).
