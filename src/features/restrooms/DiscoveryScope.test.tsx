import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RestroomExperienceProvider } from './context';
import { createDemoServices } from './dependencies';
import { demoCenter } from './fixtures';
import { DiscoveryScreen, DetailScreen } from './screens';
import type {
  CatalogSnapshot,
  Coordinates,
  ExperienceDependencies,
} from './types';

const now = Date.parse('2026-10-22T04:00:00Z');

test('expanding the radius fetches the newly included area from the service', async () => {
  const services = createDemoServices(() => now);
  const catalog = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  const ground = catalog.restrooms[0];
  const far = {
    ...ground,
    id: 'far',
    name: 'Fictional Far restroom',
    entrance: { ...demoCenter, latitude: demoCenter.latitude + 0.014 },
  };
  Object.assign(services.repository, {
    load: async (
      _now?: number,
      scope?: { center: Coordinates | null; radiusKm: number },
    ) => ({
      ...catalog,
      restrooms: scope?.radiusKm === 2 ? [ground, far] : [ground],
    }),
  });
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    initialCenter: demoCenter,
    mode: 'configured',
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText(ground.name)).toBeTruthy();
  expect(screen.queryByText(far.name)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: '2 km radius' }));
  expect(await screen.findByText(far.name)).toBeTruthy();
  expect(screen.getByText('2 matching restrooms · 2 km radius')).toBeTruthy();
});

test('a direct detail launch loads retained permanent-closure history without a search location', async () => {
  const services = createDemoServices(() => now);
  const catalog = await services.repository.load(now, {
    center: null,
    radiusKm: 1,
    detailId: 'demo-permanent',
  });
  const permanent = catalog.restrooms.find(
    (item) => item.id === 'demo-permanent',
  )!;
  Object.assign(services.repository, {
    load: async (_now?: number, scope?: { detailId?: string }) => ({
      ...catalog,
      restrooms: scope?.detailId === permanent.id ? [permanent] : [],
    }),
  });
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    mode: 'configured',
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DetailScreen
        restroomId={permanent.id}
        onBack={() => {}}
        onContribute={() => {}}
      />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText(permanent.name)).toBeTruthy();
  expect(
    screen.getByText(
      'Permanently closed · retained history, excluded from discovery',
    ),
  ).toBeTruthy();
});

test('a guest can choose a named catalog area before any nearby results have loaded', async () => {
  const services = createDemoServices(() => now);
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    mode: 'demo',
    location: {
      locate: async () => {
        throw new Error('Location permission denied');
      },
    },
    directions: { open: async () => {}, copy: async () => {} },
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  await fireEvent.press(
    await screen.findByRole('button', {
      name: 'Search around Demo Eucalyptus · Ground restroom',
    }),
  );
  expect(
    await screen.findByText('Demo Eucalyptus · Ground restroom'),
  ).toBeTruthy();
  expect(
    screen.getByText('Area around Demo Eucalyptus · Ground restroom'),
  ).toBeTruthy();
  expect(screen.queryByLabelText('Search latitude')).toBeNull();
});

test('an old radius response cannot replace results for the newer radius', async () => {
  const services = createDemoServices(() => now);
  const catalog = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  const ground = catalog.restrooms[0];
  const newer = {
    ...ground,
    id: 'newer',
    name: 'Fictional Newer area restroom',
    entrance: { ...demoCenter, latitude: demoCenter.latitude + 0.03 },
  };
  let resolveOld!: (value: CatalogSnapshot) => void;
  const pending = new Promise<CatalogSnapshot>((resolve) => {
    resolveOld = resolve;
  });
  services.repository.load = async (_now, scope) =>
    scope?.radiusKm === 2
      ? pending
      : {
          ...catalog,
          restrooms: scope?.radiusKm === 5 ? [ground, newer] : [ground],
        };
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    initialCenter: demoCenter,
    mode: 'configured',
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  expect(await screen.findByText(ground.name)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: '2 km radius' }));
  await fireEvent.press(screen.getByRole('button', { name: '5 km radius' }));
  expect(await screen.findByText(newer.name)).toBeTruthy();
  await act(async () => {
    resolveOld({ ...catalog, restrooms: [ground] });
  });
  expect(screen.getByText(newer.name)).toBeTruthy();
  expect(screen.getByText('2 matching restrooms · 5 km radius')).toBeTruthy();
});

test('catalog continuation stays bounded and labels retained results stale after failure', async () => {
  const services = createDemoServices(() => now);
  const catalog = await services.repository.load(now, {
    center: demoCenter,
    radiusKm: 5,
  });
  const first = { ...catalog.restrooms[0], id: 'first', name: 'First area' };
  const second = { ...first, id: 'second', name: 'Second area' };
  let attempts = 0;
  services.repository.findLocations = async (_query, cursor) => {
    if (!cursor) return { items: [first], next: { query: '', id: first.id } };
    if (++attempts === 1) throw new Error('Offline catalog');
    return { items: [second], next: null };
  };
  const dependencies: ExperienceDependencies = {
    ...services,
    clock: { now: () => now },
    mode: 'demo',
    location: { locate: async () => demoCenter },
    directions: { open: async () => {}, copy: async () => {} },
  };
  await render(
    <RestroomExperienceProvider dependencies={dependencies}>
      <DiscoveryScreen onOpen={() => {}} onAccount={() => {}} />
    </RestroomExperienceProvider>,
  );
  expect(
    await screen.findByRole('button', { name: 'Search around First area' }),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'More catalog locations' }),
  );
  expect(
    await screen.findByText(/Showing stale locations · last refreshed/),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Search around First area' }),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry location search' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Search around Second area' }),
  ).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Search around First area' }),
  ).toBeNull();
  expect(screen.queryByText(/Showing stale locations/)).toBeNull();
});
