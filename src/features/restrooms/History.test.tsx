import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RestroomExperienceProvider } from './context';
import { createDemoServices } from './dependencies';
import { demoCenter } from './fixtures';
import { DetailScreen } from './screens';
import type { ExperienceDependencies, HistoryPage, Review } from './types';

const now = Date.parse('2026-10-21T04:00:00Z');

test('detail loads facility review pages and retries without losing earlier reviews or changing the overall score', async () => {
  const services = createDemoServices(() => now);
  const snapshot = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  const review = snapshot.reviews.find(
    (item) => item.restroomId === 'demo-ground',
  )!;
  let fail = true;
  Object.assign(services.repository, {
    loadReviews: async (_id: string, cursor?: unknown) => {
      if (!cursor)
        return {
          items: [{ ...review, notes: 'First page feedback' }],
          next: {
            restroomId: 'demo-ground',
            kind: 'reviews',
            seconds: 1,
            nanoseconds: 0,
            id: review.id,
          },
        };
      if (fail) throw new Error('History connection lost');
      return {
        items: [
          {
            ...review,
            id: 'older-review',
            authorId: 'older',
            notes: 'Second page feedback',
          },
        ],
        next: null,
      };
    },
  });
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
    initialCenter: demoCenter,
    mode: 'demo',
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
  expect(await screen.findByText('First page feedback')).toBeTruthy();
  expect(screen.queryByText('Second page feedback')).toBeNull();
  expect(screen.getByText('3.0 / 5 · 2 reviews')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'More reviews' }));
  expect(await screen.findByText('History connection lost')).toBeTruthy();
  expect(screen.getByText('First page feedback')).toBeTruthy();
  fail = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Retry reviews' }));
  expect(await screen.findByText('Second page feedback')).toBeTruthy();
  expect(screen.getByText('First page feedback')).toBeTruthy();
  expect(screen.getByText('3.0 / 5 · 2 reviews')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'More reviews' })).toBeNull();
});

test('equal-time reviews paginate without gaps and a refresh restarts history after an edit', async () => {
  const services = createDemoServices(() => now);
  for (let index = 1; index <= 12; index++) {
    await services.auth.register(
      `visitor${index}@example.invalid`,
      'secret1',
      `Visitor ${index}`,
    );
    await services.repository.saveReview('demo-ground', {
      overall: 4,
      notes: `Fictional paged note ${index}`,
    });
    await services.auth.signOut();
  }
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
    initialCenter: demoCenter,
    mode: 'demo',
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
  expect(await screen.findByText('Fictional paged note 9')).toBeTruthy();
  expect(screen.queryByText('Fictional paged note 10')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'More reviews' }));
  expect(await screen.findByText('Fictional paged note 10')).toBeTruthy();
  for (let index = 1; index <= 12; index++)
    expect(screen.getAllByText(`Fictional paged note ${index}`)).toHaveLength(
      1,
    );
  expect(screen.queryByRole('button', { name: 'More reviews' })).toBeNull();
  await act(async () => {
    await services.auth.signIn('visitor9@example.invalid', 'secret1');
  });
  await services.repository.saveReview('demo-ground', {
    overall: 5,
    notes: 'Edited history feedback',
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Refresh detail' }));
  expect(await screen.findByText('Edited history feedback')).toBeTruthy();
  expect(screen.queryByText('Fictional paged note 9')).toBeNull();
  expect(screen.queryByText('Fictional paged note 10')).toBeNull();
  expect(screen.getByRole('button', { name: 'More reviews' })).toBeTruthy();
});

test('a late history response cannot append another restroom’s reviews after navigation', async () => {
  const services = createDemoServices(() => now);
  const snapshot = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  const review = snapshot.reviews.find(
    (item) => item.restroomId === 'demo-ground',
  )!;
  let resolveGround!: (value: HistoryPage<Review>) => void;
  const pending = new Promise<HistoryPage<Review>>((resolve) => {
    resolveGround = resolve;
  });
  services.repository.loadReviews = async (id) =>
    id === 'demo-ground'
      ? pending
      : {
          items: [
            {
              ...review,
              id: 'upper-review',
              restroomId: id,
              notes: 'Upper-only review',
            },
          ],
          next: null,
        };
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
    initialCenter: demoCenter,
    mode: 'demo',
  };
  function Journey() {
    const [id, setId] = React.useState('demo-ground');
    return (
      <DetailScreen
        restroomId={id}
        onBack={() => setId('demo-upper')}
        onContribute={() => {}}
      />
    );
  }
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <Journey />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText('Loading reviews…')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Back to search' }));
  expect(await screen.findByText('Upper-only review')).toBeTruthy();
  await act(async () => {
    resolveGround({
      items: [{ ...review, notes: 'Late ground history' }],
      next: null,
    });
  });
  expect(screen.getByText('Upper-only review')).toBeTruthy();
  expect(screen.queryByText('Late ground history')).toBeNull();
});
