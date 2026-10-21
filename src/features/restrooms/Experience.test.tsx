import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createDemoCatalog, demoCenter } from './fixtures';
import { memoryHistoryPage } from './history';
import { RestroomExperienceProvider } from './context';
import { DiscoveryScreen, DetailScreen } from './screens';
import type { ExperienceDependencies } from './types';

jest.setTimeout(15000);

const now = Date.parse('2026-10-21T04:00:00Z');
function dependencies(): ExperienceDependencies {
  return {
    repository: {
      load: async () => createDemoCatalog(now),
      loadReviews: async (id, cursor) =>
        memoryHistoryPage(
          createDemoCatalog(now).reviews,
          id,
          'reviews',
          (item) => item.updatedAt,
          cursor,
        ),
      loadReports: async (id, cursor) =>
        memoryHistoryPage(
          createDemoCatalog(now).reports,
          id,
          'reports',
          (item) => item.observedAt,
          cursor,
        ),
      saveReview: async () => {},
      submitReport: async () => {},
      flagContribution: async () => {},
    },
    auth: {
      current: () => null,
      subscribe: () => () => {},
      signIn: async () => {},
      register: async () => {},
      recover: async () => {},
      signOut: async () => {},
    },
    clock: { now: () => now },
    location: {
      locate: async () => {
        throw new Error('Location permission denied');
      },
    },
    directions: { open: async () => {}, copy: async () => {} },
    mode: 'demo',
    initialCenter: demoCenter,
  };
}

test('guest discovers separate entrances, excludes unknown wheelchair access when required, and retains the search after detail', async () => {
  function Journey() {
    const [id, setId] = React.useState<string | null>(null);
    return id ? (
      <DetailScreen
        restroomId={id}
        onBack={() => setId(null)}
        onContribute={() => {}}
      />
    ) : (
      <DiscoveryScreen onOpen={setId} onAccount={() => {}} />
    );
  }
  await render(
    <RestroomExperienceProvider dependencies={dependencies()}>
      <Journey />
    </RestroomExperienceProvider>,
  );
  expect(
    await screen.findByText('Demo Eucalyptus · Ground restroom'),
  ).toBeTruthy();
  expect(screen.getByText('Demo Eucalyptus · Upper restroom')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent(
    screen.getByRole('switch', { name: 'Require wheelchair access' }),
    'valueChange',
    true,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.queryByText('Demo Eucalyptus · Upper restroom')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', {
      name: 'Details for Demo Eucalyptus · Ground restroom',
    }),
  );
  expect(await screen.findByText('3.0 / 5 · 2 reviews')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Back to search' }));
  expect(screen.queryByText('Demo Eucalyptus · Upper restroom')).toBeNull();
});

test('last-resort inclusion preserves an explicit minimum score', async () => {
  const deps = dependencies();
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  await screen.findByText('Demo Eucalyptus · Ground restroom');
  expect(screen.queryByText('Demo Last-resort restroom')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent(
    screen.getByRole('switch', { name: 'Include desperate-times options' }),
    'valueChange',
    true,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Minimum score 3' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.queryByText('Demo Last-resort restroom')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'No minimum score' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.getByText('Demo Last-resort restroom')).toBeTruthy();
  expect(
    screen.getByText('Desperate-times option · 2 of 3 recent answers'),
  ).toBeTruthy();
});

test('expected closed and a recent usable observation stay distinct, then usability expires at exactly two hours', async () => {
  const deps = dependencies();
  let time = now;
  let tick = () => {};
  deps.clock = {
    now: () => time,
    subscribe: (listener) => {
      tick = listener;
      return () => {};
    },
  };
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <DetailScreen
        restroomId="demo-closed"
        onBack={() => {}}
        onContribute={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText('Expected closed')).toBeTruthy();
  expect(screen.getByText(/Reported usable/)).toBeTruthy();
  expect(screen.getByText('Not recommended for this search')).toBeTruthy();
  time = now - 60000 + 2 * 3600000;
  await act(async () => tick());
  expect(screen.getByText('Current usability unknown')).toBeTruthy();
  expect(screen.getByText(/Historical observation · usable/)).toBeTruthy();
});

test('location denial keeps manual discovery and failed directions offer the exact entrance for copying', async () => {
  const deps = dependencies();
  delete deps.initialCenter;
  let copied = '';
  deps.directions = {
    open: async () => {
      throw new Error('No map handler available');
    },
    copy: async (restroom) => {
      copied = `${restroom.entrance.latitude},${restroom.entrance.longitude}`;
    },
  };
  function Journey() {
    const [id, setId] = React.useState<string | null>(null);
    return id ? (
      <DetailScreen
        restroomId={id}
        onBack={() => setId(null)}
        onContribute={() => {}}
      />
    ) : (
      <DiscoveryScreen onOpen={setId} onAccount={() => {}} />
    );
  }
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <Journey />
    </RestroomExperienceProvider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Use my location' }),
  );
  expect(await screen.findByText(/Location permission denied/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Search latitude'), '14.55');
  await fireEvent.changeText(
    screen.getByLabelText('Search longitude'),
    '121.02',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Search this location' }),
  );
  await fireEvent.press(
    (await screen.findAllByRole('button', { name: 'Directions' }))[0],
  );
  expect(await screen.findByText(/No map handler available/)).toBeTruthy();
  await fireEvent.press(
    await screen.findByRole('button', {
      name: 'Details for Demo Eucalyptus · Ground restroom',
    }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Directions' }));
  expect(await screen.findByText(/No map handler available/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Copy destination' }),
  );
  expect(copied).toBe('14.55,121.02');
});

test('a text match outside the radius can become the manual search center without silently expanding radius', async () => {
  const deps = dependencies();
  deps.initialCenter = { latitude: 14.6, longitude: 121.02 };
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  await fireEvent.changeText(
    screen.getByLabelText('Search catalog names and addresses'),
    'Ground restroom',
  );
  await fireEvent.press(
    await screen.findByRole('button', {
      name: 'Search around Demo Eucalyptus · Ground restroom',
    }),
  );
  expect(
    await screen.findByText('Demo Eucalyptus · Ground restroom'),
  ).toBeTruthy();
  expect(screen.getByText('1 matching restrooms · 1 km radius')).toBeTruthy();
});

test('detail retains labelled stale data after refresh failure and an edited current review replaces its vote on retry', async () => {
  const deps = dependencies();
  let fail = false;
  let catalog = createDemoCatalog(now);
  deps.repository.load = async () => {
    if (fail) throw new Error('Network unavailable');
    return catalog;
  };
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <DetailScreen
        restroomId="demo-ground"
        onBack={() => {}}
        onContribute={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText('3.0 / 5 · 2 reviews')).toBeTruthy();
  fail = true;
  await fireEvent.press(screen.getByRole('button', { name: 'Refresh detail' }));
  expect(await screen.findByText(/Showing stale data/)).toBeTruthy();
  expect(screen.getByText('3.0 / 5 · 2 reviews')).toBeTruthy();
  fail = false;
  catalog = {
    ...catalog,
    reviews: catalog.reviews.map((review) =>
      review.id === 'ground-b' ? { ...review, overall: 5 } : review,
    ),
  };
  await fireEvent.press(screen.getByRole('button', { name: 'Retry detail' }));
  expect(await screen.findByText('4.5 / 5 · 2 reviews')).toBeTruthy();
  expect(screen.getByText('5.0 / 5')).toBeTruthy();
});

test('last-resort classification expires at the exact 30-day boundary without treating low stars as a flag', async () => {
  const deps = dependencies();
  let time = now;
  let tick = () => {};
  deps.clock = {
    now: () => time,
    subscribe: (listener) => {
      tick = listener;
      return () => {};
    },
  };
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  await screen.findByText('Demo Eucalyptus · Ground restroom');
  expect(screen.queryByText('Demo Last-resort restroom')).toBeNull();
  time = now - 3600000 + 30 * 86400000;
  await act(async () => tick());
  expect(await screen.findByText('Demo Last-resort restroom')).toBeTruthy();
  expect(screen.queryByText(/Desperate-times option ·/)).toBeNull();
});

test('a late location response cannot replace a newer manually chosen search area', async () => {
  const deps = dependencies();
  delete deps.initialCenter;
  let finishLocation!: (center: {
    latitude: number;
    longitude: number;
  }) => void;
  deps.location.locate = () =>
    new Promise((resolve) => {
      finishLocation = resolve;
    });
  await render(
    <RestroomExperienceProvider dependencies={deps}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Use my location' }),
  );
  await fireEvent.changeText(screen.getByLabelText('Search latitude'), '14.55');
  await fireEvent.changeText(
    screen.getByLabelText('Search longitude'),
    '121.02',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Search this location' }),
  );
  await act(async () => finishLocation({ latitude: 15, longitude: 122 }));
  expect(screen.getByText('Search center: 14.5500, 121.0200')).toBeTruthy();
  expect(screen.getByText('Demo Eucalyptus · Ground restroom')).toBeTruthy();
});
