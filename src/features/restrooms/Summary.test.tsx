import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RestroomExperienceProvider } from './context';
import { createDemoServices } from './dependencies';
import { demoCenter } from './fixtures';
import { DetailScreen } from './screens';
import { ReviewScreen } from './contributions';
import type { ExperienceDependencies } from './types';

const now = Date.parse('2026-10-21T04:00:00Z');
const summary = {
  overall: { value: 4.5, count: 2501 },
  cleanliness: { value: 5, count: 1 },
  supplies: { value: null, count: 0 },
  facilityCondition: { value: 3, count: 2 },
  desperate: { flagged: 0, total: 0, latestAt: null, expiresAt: null },
  asOf: now,
};

test('detail displays complete service scores while review history is paginated independently', async () => {
  const services = createDemoServices(() => now);
  const snapshot = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  services.repository.load = async () =>
    Object.assign(
      { ...snapshot, reviews: [] },
      {
        reviewSummaries: { 'demo-ground': summary },
      },
    );
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
    initialCenter: demoCenter,
    mode: 'configured',
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DetailScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onContribute={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText('4.5 / 5 · 2501 reviews')).toBeTruthy();
  expect(screen.getByText('1 dimension ratings')).toBeTruthy();
  expect(screen.getByText('2 dimension ratings')).toBeTruthy();
  expect(
    await screen.findByText('Fictional review for testing only.'),
  ).toBeTruthy();
});

test('an expiring service assessment becomes uncertain while offline and recomputes on retry', async () => {
  const services = createDemoServices(() => now);
  const snapshot = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  let currentNow = now;
  let online = true;
  let tick = () => {};
  const expiresAt = now + 60000;
  services.repository.load = async () => {
    if (!online) throw new Error('Aggregate service offline');
    return {
      ...snapshot,
      reviews: [],
      reviewSummaries: {
        'demo-ground': {
          ...summary,
          asOf: currentNow,
          desperate:
            currentNow < expiresAt
              ? { flagged: 2, total: 3, latestAt: now, expiresAt }
              : { flagged: 1, total: 2, latestAt: now, expiresAt: null },
        },
      },
    };
  };
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: {
      now: () => currentNow,
      subscribe: (listener) => {
        tick = listener;
        return () => {};
      },
    },
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
    initialCenter: demoCenter,
    mode: 'configured',
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DetailScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onContribute={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText('Desperate-times option')).toBeTruthy();
  expect(
    screen.getByText('2 flagged of 3 explicit answers in the past 30 days'),
  ).toBeTruthy();
  online = false;
  await act(async () => {
    currentNow = expiresAt;
    tick();
  });
  expect(await screen.findByText('Assessment needs refresh')).toBeTruthy();
  expect(await screen.findByText('Aggregate service offline')).toBeTruthy();
  expect(screen.queryByText('Desperate-times option')).toBeNull();
  expect(
    screen.queryByText('2 flagged of 3 explicit answers in the past 30 days'),
  ).toBeNull();
  expect(screen.getByText('4.5 / 5 · 2501 reviews')).toBeTruthy();
  online = true;
  await fireEvent.press(screen.getByRole('button', { name: 'Retry detail' }));
  expect(
    await screen.findByText(
      '1 flagged of 2 explicit answers in the past 30 days',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('Assessment needs refresh')).toBeNull();
});

test('sign-in waits for the visitor’s existing review before opening the editor', async () => {
  const services = createDemoServices(() => now);
  await services.auth.register(
    'returning@example.invalid',
    'secret1',
    'Returning visitor',
  );
  await services.repository.saveReview('demo-ground', {
    overall: 2,
    notes: 'Previous visit feedback',
  });
  await services.auth.signOut();
  const load = services.repository.load;
  let resolve!: () => void;
  const hold = new Promise<void>((done) => {
    resolve = done;
  });
  services.repository.load = async () => {
    const visitor = services.auth.current();
    if (visitor) await hold;
    const snapshot = await load(now, {
      center: demoCenter,
      radiusKm: 5,
    });
    return {
      ...snapshot,
      reviews: snapshot.reviews.filter(
        (review) => review.authorId === visitor?.id,
      ),
      reviewSummaries: { 'demo-ground': summary },
    };
  };
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
    initialCenter: demoCenter,
    mode: 'configured',
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <ReviewScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onSuccess={() => {}}
        onAuthenticate={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText('Sign in to write a review')).toBeTruthy();
  await act(async () => {
    await services.auth.signIn('returning@example.invalid', 'secret1');
  });
  expect(await screen.findByText('Loading your review…')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Submit review' })).toBeNull();
  await act(async () => {
    resolve();
  });
  expect(await screen.findByText('Edit review')).toBeTruthy();
  expect(screen.getByDisplayValue('Previous visit feedback')).toBeTruthy();
});
