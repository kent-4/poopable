# Local development catalog

Prerequisite 4 uses the local Firebase Emulator Suite exclusively. The repository already depends on the Firebase JavaScript SDK; there was no Firebase project configuration or evidence of provisioned resources in the repository. No account lookup, cloud project, billing, deployment, or external account change was performed. The contributor owns their disposable local emulator data. `demo-poopable` is a demo identifier, not a provisioned project.

Email/password is the approved Authentication provider. The Auth emulator is configured on port 9099 for later account slices; this catalog proof requires no account or app sign-in. Production provider enablement, project ownership, region, client configuration, and privileged owner import credentials remain unconfigured. The rules deny every client catalog write, including signed-in clients; a future restricted owner service must perform imports.

## Reproduce

Use Node 24 and Java 21 or later. From the repository root:

```sh
node --test scripts/service/config.test.mjs
npx firebase-tools emulators:exec --project demo-poopable --only firestore,auth 'node --test scripts/service/emulator.test.mjs'
```

The CLI downloads the emulator on first use and needs network access. `emulators:exec` starts a fresh in-memory instance, runs the check, and stops it. Re-run the command to reset. For an interactive session, run `npx firebase-tools emulators:start --project demo-poopable --only firestore,auth` and execute the test separately. Do not use these permissive owner-token seed operations against cloud services; the scripts reject non-demo project IDs and non-loopback addresses before making a request.

`.env.example` supplies local placeholders. Defaults work without copying it. To override local ports, copy to `.env.local` and run Node with `--env-file=.env.local`; change `firebase.json` to match. No privileged credentials are needed or stored. Public Firebase client settings do not grant permissions. Native devices require a separate explicitly configured host adapter; these scripts deliberately support only local loopback.

The proof seeds `fictional-emulator-restroom` and a private pending fixture through the emulator-only owner token, then reads the published fixture as a guest and attempts create/update/delete and private reads without authorization. Real Firestore rules must reject those operations. Missing emulators fail the check; this is never counted as a passing skipped test.

## Data and authorization boundary

The `restrooms/{id}` fixture uses `state`, identity/name/building/floor/address, entrance coordinates, timezone, `attributes`, and `access` matching the V1 app contract. Coordinates (0, 0) and its name clearly mark it as fictional. Unknown amenities are explicit `unknown`, customer-only access is `null`, hours are absent, and no reviews or fabricated ratings are seeded. These records are not launch data.

Guests may read published records and permanently closed history; pending records remain private. Queries must constrain state to the public states because Firestore rules are not result filters. All client writes and all other collections default to denied. Review ownership, aggregates, usability reports, account data, and moderation write rules must be added with their corresponding tested service slices; this prerequisite does not claim those workflows are implemented.

## Verification evidence

Configuration guard test was observed failing before implementation and passing after implementation. The emulator authorization test was written and attempted, but cannot run in the current environment: no Java runtime is installed. Install Java 21+ and run the command above to establish the authorization evidence. This runtime dependency leaves prerequisite 4 partially verified, not complete.

Primary references checked 2026-10-21: [Firestore emulator connection and demo-project isolation](https://firebase.google.com/docs/emulator-suite/connect_firestore), [Security Rules testing](https://firebase.google.com/docs/rules/unit-tests), and [email/password authentication](https://firebase.google.com/docs/auth/web/password-auth).
