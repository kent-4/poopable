import type { CatalogSnapshot, Restroom } from './types';

// Deliberately fictional, isolated examples. Never used unless demo mode is explicit.
export const demoCenter = { latitude: 14.55, longitude: 121.02 };
export function createDemoCatalog(now: number): CatalogSnapshot {
  const common: Omit<Restroom, 'id' | 'name' | 'floor' | 'entrance'> = {
    building: 'Fictional Eucalyptus House',
    address: 'Demo coordinates — not a real facility',
    timezone: 'Asia/Manila',
    state: 'published',
    fictional: true,
    hours: Array.from({ length: 7 }, (_, day) => ({
      day,
      opens: '00:00',
      closes: '24:00',
    })),
    attributes: {
      bidet: 'yes',
      wheelchair: 'yes',
      babyChanging: 'unknown',
      gender: 'all-gender',
    },
    access: { fee: 'free', customerOnly: false },
  };
  return {
    restrooms: [
      {
        ...common,
        id: 'demo-ground',
        name: 'Demo Eucalyptus · Ground restroom',
        floor: 'Ground floor, east entrance',
        entrance: demoCenter,
      },
      {
        ...common,
        id: 'demo-upper',
        name: 'Demo Eucalyptus · Upper restroom',
        floor: 'Second floor, west entrance',
        entrance: { latitude: 14.551, longitude: 121.021 },
        attributes: { ...common.attributes, wheelchair: 'unknown' },
        hours: undefined,
      },
      {
        ...common,
        id: 'demo-last-resort',
        name: 'Demo Last-resort restroom',
        floor: 'Ground floor',
        entrance: { latitude: 14.552, longitude: 121.02 },
        access: {
          fee: 'paid',
          customerOnly: true,
          notes: 'Fictional access condition',
        },
      },
      {
        ...common,
        id: 'demo-closed',
        name: 'Demo Closed-hours restroom',
        floor: 'Ground floor',
        entrance: { latitude: 14.553, longitude: 121.02 },
        hours: [],
      },
      {
        ...common,
        id: 'demo-overnight',
        name: 'Demo Overnight restroom',
        floor: 'Ground floor',
        entrance: { latitude: 14.554, longitude: 121.02 },
        hours: Array.from({ length: 7 }, (_, day) => ({
          day,
          opens: '22:00',
          closes: '06:00',
        })),
      },
      {
        ...common,
        id: 'demo-permanent',
        name: 'Demo Permanently closed restroom',
        floor: 'Ground floor',
        entrance: demoCenter,
        state: 'permanently-closed',
      },
    ],
    reviews: [
      {
        id: 'ground-a',
        restroomId: 'demo-ground',
        authorId: 'demo-a',
        authorName: 'Demo visitor A',
        overall: 4,
        cleanliness: 5,
        updatedAt: now - 86400000,
      },
      {
        id: 'ground-b',
        restroomId: 'demo-ground',
        authorId: 'demo-b',
        authorName: 'Demo visitor B',
        overall: 2,
        supplies: 2,
        notes: 'Fictional review for testing only.',
        desperateTimes: false,
        updatedAt: now - 3600000,
      },
      ...[true, true, false].map((desperateTimes, index) => ({
        id: `last-${index}`,
        restroomId: 'demo-last-resort',
        authorId: `demo-${index}`,
        authorName: `Demo visitor ${index + 1}`,
        overall: 2,
        desperateTimes,
        updatedAt: now - 3600000,
      })),
    ],
    reports: [
      {
        id: 'ground-old',
        restroomId: 'demo-ground',
        authorId: 'demo-a',
        authorName: 'Demo visitor A',
        state: 'closed',
        observedAt: now - 90 * 60000,
      },
      {
        id: 'ground-new',
        restroomId: 'demo-ground',
        authorId: 'demo-b',
        authorName: 'Demo visitor B',
        state: 'usable',
        observedAt: now - 30 * 60000,
      },
      {
        id: 'closed-conflict',
        restroomId: 'demo-closed',
        authorId: 'demo-a',
        authorName: 'Demo visitor A',
        state: 'usable',
        observedAt: now - 60000,
      },
    ],
  };
}
