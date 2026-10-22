import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RestroomExperienceProvider } from './context';
import { createDemoServices } from './dependencies';
import {
  AccountScreen,
  FlagScreen,
  ReportScreen,
  ReviewScreen,
} from './contributions';
import { demoCenter } from './fixtures';
import type { ExperienceDependencies } from './types';
const now = Date.parse('2026-10-21T04:00:00Z');
async function setup() {
  const services = createDemoServices(() => now);
  await services.auth.register('visitor@example.com', 'secret1', 'Visitor');
  const deps: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    mode: 'demo',
    initialCenter: demoCenter,
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
  };
  return deps;
}
test('review form retains input after retryable failure and saves one editable vote', async () => {
  const deps = await setup();
  const save = deps.repository.saveReview;
  let failing = true;
  deps.repository.saveReview = async (...args) => {
    if (failing) throw new Error('Network unavailable');
    await save(...args);
  };
  let done = false;
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <ReviewScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onAuthenticate={() => {}}
        onSuccess={() => {
          done = true;
        }}
      />
    </RestroomExperienceProvider>,
  );
  await screen.findByText('Demo Eucalyptus · Ground restroom');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Overall experience 5 stars' }),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Written notes'),
    'Good visit',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));
  expect(await screen.findByText('Network unavailable')).toBeTruthy();
  expect(screen.getByDisplayValue('Good visit')).toBeTruthy();
  failing = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));
  expect(done).toBe(true);
  const catalog = await deps.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  expect(
    catalog.reviews.find((r) => r.authorName === 'Visitor')?.desperateTimes,
  ).toBe(false);
  expect(
    catalog.reviews.filter((r) => r.authorName === 'Visitor'),
  ).toHaveLength(1);
});

test('usability requires an explicit condition and retries the same submission without creating duplicates', async () => {
  const deps = await setup();
  const submit = deps.repository.submitReport;
  let first = true;
  deps.repository.submitReport = async (...args) => {
    await submit(...args);
    if (first) {
      first = false;
      throw new Error('Response lost');
    }
  };
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <ReportScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onAuthenticate={() => {}}
        onSuccess={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Submit observation' }),
  );
  expect(screen.getByText('Choose a condition.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Out of service' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Submit observation' }),
  );
  expect(await screen.findByText('Response lost')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Submit observation' }),
  );
  expect(
    (
      await deps.repository.load(now, {
        center: demoCenter,
        radiusKm: 5,
      })
    ).reports.filter((r) => r.authorName === 'Visitor'),
  ).toHaveLength(1);
});

test('registration returns to intended action without automatically submitting a contribution', async () => {
  const deps = await setup();
  await deps.auth.signOut();
  let returned = false;
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <AccountScreen
        onBack={() => {}}
        onAuthenticated={() => {
          returned = true;
        }}
      />
    </RestroomExperienceProvider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Create an account' }),
  );
  await fireEvent.changeText(screen.getByLabelText('Email'), 'new@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'secret1');
  await fireEvent.changeText(
    screen.getByLabelText('Display name'),
    'New visitor',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Register' }));
  expect(returned).toBe(true);
  expect(
    (
      await deps.repository.load(now, {
        center: demoCenter,
        radiusKm: 5,
      })
    ).reviews.filter((r) => r.authorName === 'New visitor'),
  ).toHaveLength(0);
});

test('a private flag requires a reason and never removes the public contribution', async () => {
  const deps = await setup();
  let done = false;
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <FlagScreen
        kind="review"
        contributionId="ground-b"
        onBack={() => {}}
        onSuccess={() => {
          done = true;
        }}
        onAuthenticate={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Submit flag' }));
  expect(screen.getByText('Enter a reason for the owner.')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('Reason for flag'),
    'Inappropriate content',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Submit flag' }));
  expect(done).toBe(true);
  expect(
    (
      await deps.repository.load(now, {
        center: demoCenter,
        radiusKm: 5,
      })
    ).reviews.some((r) => r.id === 'ground-b'),
  ).toBe(true);
});

test('editing replaces the existing vote and back navigation protects unsaved notes', async () => {
  const deps = await setup();
  await deps.repository.saveReview('demo-ground', {
    overall: 2,
    notes: 'Earlier visit',
    desperateTimes: true,
  });
  let backed = false;
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <ReviewScreen
        restroomId="demo-ground"
        onBack={() => {
          backed = true;
        }}
        onAuthenticate={() => {}}
        onSuccess={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  await screen.findByDisplayValue('Earlier visit');
  await fireEvent.changeText(
    screen.getByLabelText('Written notes'),
    'Updated visit',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Back to restroom' }),
  );
  expect(backed).toBe(false);
  expect(screen.getByText('Discard unsaved changes?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep editing' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Overall experience 4 stars' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  const reviews = (
    await deps.repository.load(now, {
      center: demoCenter,
      radiusKm: 5,
    })
  ).reviews.filter((r) => r.authorName === 'Visitor');
  expect(reviews).toHaveLength(1);
  expect(reviews[0]).toMatchObject({
    overall: 4,
    notes: 'Updated visit',
    desperateTimes: true,
  });
});

test('review ratings expose selected numeric choices and visible star controls', async () => {
  const deps = await setup();
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <ReviewScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onAuthenticate={() => {}}
        onSuccess={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  await screen.findByText('Demo Eucalyptus · Ground restroom');
  expect(screen.getAllByText('☆')).toHaveLength(20);
  await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));
  expect(
    screen.getByRole('alert', {
      name: 'Choose an overall experience from 1 to 5.',
    }),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Overall experience 3 stars' }),
  );
  expect(
    screen.getByRole('button', {
      name: 'Overall experience 3 stars',
      selected: true,
    }),
  ).toBeTruthy();
  expect(
    screen.queryByText('Choose an overall experience from 1 to 5.'),
  ).toBeNull();
  expect(screen.getAllByText('★')).toHaveLength(3);
});
