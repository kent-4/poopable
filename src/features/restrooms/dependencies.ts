import { createDemoCatalog, demoCenter } from './fixtures';
import { memoryHistoryPage } from './history';
import { inSearchArea, memoryLocations, validateScope } from './search-area';
import {
  nativeClock,
  nativeDirections,
  nativeLocation,
} from './native/adapters';
import type {
  Authentication,
  ExperienceDependencies,
  RestroomRepository,
  Visitor,
} from './types';

type Services = { repository: RestroomRepository; auth: Authentication };
function unavailable(message: string): Services {
  const fail = async () => {
    throw new Error(message);
  };
  return {
    repository: {
      load: fail,
      findLocations: fail,
      loadReviews: fail,
      loadReports: fail,
      saveReview: fail,
      submitReport: fail,
      flagContribution: fail,
    },
    auth: {
      current: () => null,
      subscribe: () => () => {},
      signIn: fail,
      register: fail,
      recover: fail,
      signOut: async () => {},
    },
  };
}

// Session-only fictional data. Account passwords and private flags never enter a public snapshot.
export function createDemoServices(now: () => number = Date.now): Services {
  let catalog = createDemoCatalog(now());
  let visitor: Visitor | null = null;
  const accounts = new Map<string, { password: string; visitor: Visitor }>();
  const listeners = new Set<(visitor: Visitor | null) => void>();
  const flags = new Set<string>();
  function publish(next: Visitor | null) {
    visitor = next;
    listeners.forEach((listener) => listener(next));
  }
  function signedIn() {
    if (!visitor) throw new Error('Sign in to contribute.');
    return visitor;
  }
  const auth: Authentication = {
    current: () => visitor,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    register: async (email, password, displayName) => {
      const key = email.trim().toLowerCase();
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) ||
        password.length < 6 ||
        !displayName.trim()
      )
        throw new Error(
          'Enter an email, a password of at least 6 characters, and a display name.',
        );
      if (accounts.has(key))
        throw new Error('A demo account already exists. Sign in instead.');
      const account = {
        id: `demo-visitor-${accounts.size + 1}`,
        displayName: displayName.trim(),
      };
      accounts.set(key, { password, visitor: account });
      publish(account);
    },
    signIn: async (email, password) => {
      const account = accounts.get(email.trim().toLowerCase());
      if (!account || account.password !== password)
        throw new Error(
          'Email or password was not recognized in this demo session.',
        );
      publish(account.visitor);
    },
    recover: async (email) => {
      if (!email.includes('@')) throw new Error('Enter your email.');
    },
    signOut: async () => publish(null),
  };
  const repository: RestroomRepository = {
    load: async (_now, scope = { center: null, radiusKm: 1 }) => {
      validateScope(scope);
      const restrooms = catalog.restrooms.filter((restroom) =>
        scope.detailId
          ? restroom.id === scope.detailId && restroom.state !== 'pending'
          : inSearchArea(restroom, scope),
      );
      const ids = new Set(restrooms.map((restroom) => restroom.id));
      return JSON.parse(
        JSON.stringify({
          restrooms,
          reviews: catalog.reviews.filter((item) => ids.has(item.restroomId)),
          reports: catalog.reports.filter((item) => ids.has(item.restroomId)),
        }),
      );
    },
    findLocations: async (query, cursor) =>
      memoryLocations(catalog.restrooms, query, cursor),
    loadReviews: async (restroomId, cursor) =>
      memoryHistoryPage(
        catalog.reviews,
        restroomId,
        'reviews',
        (item) => item.updatedAt,
        cursor,
      ),
    loadReports: async (restroomId, cursor) =>
      memoryHistoryPage(
        catalog.reports,
        restroomId,
        'reports',
        (item) => item.observedAt,
        cursor,
      ),
    saveReview: async (restroomId, input) => {
      const author = signedIn();
      if (
        !catalog.restrooms.some(
          (restroom) =>
            restroom.id === restroomId && restroom.state !== 'pending',
        )
      )
        throw new Error('Restroom not found.');
      for (const key of [
        'overall',
        'cleanliness',
        'supplies',
        'facilityCondition',
      ] as const) {
        const score = input[key];
        if (
          (key === 'overall' || score !== undefined) &&
          (!Number.isInteger(score) || score! < 1 || score! > 5)
        )
          throw new Error('Scores must be whole numbers from 1 to 5.');
      }
      if ((input.notes?.length ?? 0) > 2000)
        throw new Error('Notes must be no longer than 2,000 characters.');
      if (
        input.desperateTimes !== undefined &&
        typeof input.desperateTimes !== 'boolean'
      )
        throw new Error('Choose a valid desperate-times assessment.');
      const id = `${restroomId}:${author.id}`;
      const review = {
        ...input,
        id,
        restroomId,
        authorId: author.id,
        authorName: author.displayName,
        updatedAt: now(),
      };
      catalog = {
        ...catalog,
        reviews: [
          ...catalog.reviews.filter(
            (item) =>
              !(item.restroomId === restroomId && item.authorId === author.id),
          ),
          review,
        ],
      };
    },
    submitReport: async (restroomId, state, submissionId) => {
      const author = signedIn();
      if (
        !['usable', 'closed', 'out-of-service'].includes(state) ||
        !submissionId ||
        !catalog.restrooms.some(
          (restroom) =>
            restroom.id === restroomId && restroom.state !== 'pending',
        )
      )
        throw new Error('Choose a valid restroom and condition.');
      const id = `${author.id}:${submissionId}`;
      if (catalog.reports.some((report) => report.id === id)) return;
      catalog = {
        ...catalog,
        reports: [
          ...catalog.reports,
          {
            id,
            restroomId,
            state,
            authorId: author.id,
            authorName: author.displayName,
            observedAt: now(),
          },
        ],
      };
    },
    flagContribution: async (kind, contributionId, reason) => {
      const author = signedIn();
      if (!reason.trim() || reason.length > 2000)
        throw new Error('Enter a reason of at most 2,000 characters.');
      const exists =
        kind === 'review'
          ? catalog.reviews.some((review) => review.id === contributionId)
          : catalog.reports.some((report) => report.id === contributionId);
      if (!exists) throw new Error('Contribution not found.');
      flags.add(`${author.id}:${kind}:${contributionId}`);
    },
  };
  return { repository, auth };
}

/** A configured Firebase adapter can provide services without changing the feature. */
export function createDefaultDependencies(
  services?: Services,
  setupError?: string,
): ExperienceDependencies {
  const demo = process.env.EXPO_PUBLIC_DATA_MODE === 'demo';
  const selected =
    services ??
    (demo
      ? createDemoServices(nativeClock.now)
      : unavailable(
          setupError ??
            'Catalog is not configured. Choose an explicit development data mode.',
        ));
  return {
    ...selected,
    mode: services ? 'configured' : demo ? 'demo' : 'unconfigured',
    clock: nativeClock,
    location: nativeLocation,
    directions: nativeDirections,
    ...(demo ? { initialCenter: demoCenter } : {}),
  };
}
