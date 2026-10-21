import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCustomToken,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  terminate,
} from 'firebase/firestore';
import { readEmulatorConfig } from './config.mjs';

const config = readEmulatorConfig();
const app = initializeApp(
  { projectId: config.projectId, apiKey: 'fake-emulator-key' },
  `contributions-${Date.now()}`,
);
const auth = getAuth(app);
const authHost = readEmulatorConfig({
  FIRESTORE_EMULATOR_HOST:
    process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099',
}).host;
const db = getFirestore(app);
connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
const [host, port] = config.host.split(':');
connectFirestoreEmulator(db, host, Number(port));

test(
  'contributions persist, reviews replace, reports retry, and bypassed invalid writes are denied',
  { timeout: 30000 },
  async () => {
    try {
      const { createFirebaseServices } =
        await import('../../src/features/restrooms/firebase.ts');
      const { repository } = createFirebaseServices(auth, db);
      await assert.rejects(
        repository.saveReview('fictional-emulator-restroom', { overall: 4 }),
      );
      const account = await createUserWithEmailAndPassword(
        auth,
        `review-${Date.now()}@example.invalid`,
        'local-password',
      );
      await updateProfile(account.user, { displayName: 'Local visitor' });
      await account.user.getIdToken(true);
      await repository.saveReview('fictional-emulator-restroom', {
        overall: 4,
        desperateTimes: true,
      });
      await repository.saveReview('fictional-emulator-restroom', {
        overall: 2,
        notes: 'Edited',
      });
      let snapshot = await repository.load();
      const reviews = snapshot.reviews.filter(
        (item) => item.authorId === account.user.uid,
      );
      assert.equal(reviews.length, 1);
      assert.equal(reviews[0].overall, 2);
      assert.equal(reviews[0].desperateTimes, undefined);
      await repository.submitReport(
        'fictional-emulator-restroom',
        'usable',
        'stable-retry',
      );
      await repository.submitReport(
        'fictional-emulator-restroom',
        'usable',
        'stable-retry',
      );
      snapshot = await repository.load();
      assert.equal(
        snapshot.reports.filter((item) => item.authorId === account.user.uid)
          .length,
        1,
      );
      await repository.flagContribution(
        'review',
        reviews[0].id,
        'Needs owner attention',
      );
      await assert.rejects(
        getDoc(
          doc(
            db,
            'moderationFlags',
            `${account.user.uid}:review:${reviews[0].id}`,
          ),
        ),
      );
      const invalid = {
        restroomId: 'fictional-emulator-restroom',
        authorId: account.user.uid,
        authorName: 'Local visitor',
        overall: 9,
        updatedAt: serverTimestamp(),
        suppressed: false,
      };
      await assert.rejects(
        setDoc(
          doc(db, 'reviews', `fictional-emulator-restroom:${account.user.uid}`),
          invalid,
        ),
      );
      await assert.rejects(
        setDoc(doc(db, 'reviews', 'someone-elses-review'), {
          ...invalid,
          overall: 3,
        }),
      );
      await assert.rejects(
        setDoc(
          doc(db, 'reports', `${account.user.uid}:stable-retry`),
          { state: 'closed' },
          { merge: true },
        ),
      );
      await assert.rejects(
        setDoc(doc(db, 'restrooms', 'client-created'), { state: 'published' }),
      );
      const valid = { ...invalid, overall: 3 };
      const reviewRef = doc(db, 'reviews', reviews[0].id);
      for (const altered of [
        { ...valid, authorId: 'another-visitor' },
        { ...valid, authorName: 'private@example.invalid' },
        { ...valid, cleanliness: 0 },
        { ...valid, desperateTimes: 'yes' },
        { ...valid, notes: 'x'.repeat(2001) },
        { ...valid, updatedAt: new Date(0) },
        { ...valid, location: { latitude: 1, longitude: 1 } },
        { ...valid, suppressed: true },
      ])
        await assert.rejects(setDoc(reviewRef, altered));
      const { createOwnerOperations } =
        await import('../../src/features/restrooms/firebaseOwner.ts');
      const owner = createOwnerOperations(db);
      await assert.rejects(owner.inspectFlags());
      await assert.rejects(owner.suppress('review', reviews[0].id));
      // Auth emulator alone accepts unsigned custom tokens; never a production credential.
      const encode = (value) =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
      const now = Math.floor(Date.now() / 1000);
      const customToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ uid: 'local-owner', claims: { owner: true }, iat: now, exp: now + 3600, aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iss: 'emulator@example.invalid', sub: 'emulator@example.invalid' })}.`;
      await signInWithCustomToken(auth, customToken);
      assert.ok(
        (await owner.inspectFlags()).items.some(
          (flag) => flag.reason === 'Needs owner attention',
        ),
      );
      await owner.suppress('review', reviews[0].id);
      snapshot = await repository.load();
      assert.equal(
        snapshot.reviews.some((item) => item.id === reviews[0].id),
        false,
      );
      await owner.suppress('review', reviews[0].id, false);
      assert.equal(
        (await repository.load()).reviews.find(
          (item) => item.id === reviews[0].id,
        ).overall,
        2,
      );
      const imported = {
        ...snapshot.restrooms[0],
        id: 'owner-imported-test',
        name: 'Fictional owner imported restroom',
      };
      await owner.importRestroom(imported);
      assert.equal(
        (await repository.load()).restrooms.find(
          (item) => item.id === imported.id,
        ).name,
        imported.name,
      );
    } finally {
      await terminate(db);
      await deleteApp(app);
    }
  },
);
