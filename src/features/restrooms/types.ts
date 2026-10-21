export type Coordinates = { latitude: number; longitude: number };
export type KnownAttribute = 'yes' | 'no' | 'unknown';
export type OpeningPeriod = { day: number; opens: string; closes: string };
export type Restroom = {
  id: string;
  name: string;
  building: string;
  floor: string;
  address: string;
  entrance: Coordinates;
  timezone: string;
  hours?: OpeningPeriod[];
  state: 'published' | 'pending' | 'permanently-closed';
  attributes: {
    bidet: KnownAttribute;
    wheelchair: KnownAttribute;
    babyChanging: KnownAttribute;
    gender: 'men' | 'women' | 'all-gender' | 'unknown';
  };
  access: {
    fee: 'free' | 'paid' | 'unknown';
    customerOnly: boolean | null;
    notes?: string;
  };
  fictional?: boolean;
};
export type Review = {
  id: string;
  restroomId: string;
  authorId: string;
  authorName: string;
  overall: number;
  cleanliness?: number;
  supplies?: number;
  facilityCondition?: number;
  notes?: string;
  desperateTimes?: boolean;
  updatedAt: number;
  suppressed?: boolean;
};
export type UsabilityReport = {
  id: string;
  restroomId: string;
  authorId: string;
  authorName: string;
  state: 'usable' | 'closed' | 'out-of-service';
  observedAt: number;
  suppressed?: boolean;
};
export type CatalogSnapshot = {
  restrooms: Restroom[];
  reviews: Review[];
  reports: UsabilityReport[];
};
export type Visitor = { id: string; displayName: string; moderator?: boolean };
export type ReviewInput = Pick<
  Review,
  | 'overall'
  | 'cleanliness'
  | 'supplies'
  | 'facilityCondition'
  | 'notes'
  | 'desperateTimes'
>;
export type ContributionTarget = {
  restroomId: string;
  action: 'review' | 'report';
};
export type HistoryCursor = {
  restroomId: string;
  kind: 'reviews' | 'reports';
  seconds: number;
  nanoseconds: number;
  id: string;
};
export type HistoryPage<T> = { items: T[]; next: HistoryCursor | null };
export interface RestroomRepository {
  load(): Promise<CatalogSnapshot>;
  loadReviews(
    restroomId: string,
    cursor?: HistoryCursor,
  ): Promise<HistoryPage<Review>>;
  loadReports(
    restroomId: string,
    cursor?: HistoryCursor,
  ): Promise<HistoryPage<UsabilityReport>>;
  saveReview(restroomId: string, input: ReviewInput): Promise<void>;
  submitReport(
    restroomId: string,
    state: UsabilityReport['state'],
    submissionId: string,
  ): Promise<void>;
  flagContribution(
    kind: 'review' | 'report',
    contributionId: string,
    reason: string,
  ): Promise<void>;
}
export interface Authentication {
  current(): Visitor | null;
  subscribe(listener: (visitor: Visitor | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  register(email: string, password: string, displayName: string): Promise<void>;
  recover(email: string): Promise<void>;
  signOut(): Promise<void>;
}
export type Filters = {
  bidet: boolean;
  wheelchair: boolean;
  babyChanging: boolean;
  free: boolean;
  gender: 'any' | 'men' | 'women' | 'all-gender';
  minimumScore: number | null;
  includeDesperate: boolean;
};
export type Search = {
  center: Coordinates | null;
  radiusKm: 1 | 2 | 5;
  query: string;
  filters: Filters;
};
export type ExperienceDependencies = {
  repository: RestroomRepository;
  auth: Authentication;
  clock: { now(): number; subscribe?(listener: () => void): () => void };
  location: { locate(): Promise<Coordinates> };
  directions: {
    open(restroom: Restroom): Promise<void>;
    copy(restroom: Restroom): Promise<void>;
  };
  mode: 'demo' | 'configured' | 'unconfigured';
  initialCenter?: Coordinates;
};
