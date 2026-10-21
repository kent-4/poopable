import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppText, Button, Card } from '../../components/ui';
import { useRestroomExperience } from './context';
import type { HistoryCursor, HistoryPage } from './types';

export type FlagAction = React.ComponentType<{
  kind: 'review' | 'report';
  contributionId: string;
}>;

function HistoryList<T extends { id: string }>({
  restroomId,
  load,
  label,
  empty,
  children,
}: {
  restroomId: string;
  load(id: string, cursor?: HistoryCursor): Promise<HistoryPage<T>>;
  label: string;
  empty: string;
  children(item: T): React.ReactNode;
}) {
  const {
    dependencies: { clock },
  } = useRestroomExperience();
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const cursor = useRef<HistoryCursor | undefined>(undefined);
  const locked = useRef(false);
  const generation = useRef(0);
  const fetchPage = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    const version = generation.current;
    setBusy(true);
    setError(null);
    try {
      const page = await load(restroomId, cursor.current);
      if (version !== generation.current) return;
      cursor.current = page.next ?? undefined;
      setItems((previous) => [
        ...new Map(
          [...previous, ...page.items].map((item) => [item.id, item]),
        ).values(),
      ]);
      setMore(page.next !== null);
      setLoaded(true);
      setLastLoadedAt(clock.now());
    } catch (error) {
      if (version === generation.current)
        setError(
          error instanceof Error ? error.message : `Could not load ${label}.`,
        );
    } finally {
      if (version === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }, [load, restroomId, label, clock]);
  useEffect(() => {
    let active = true;
    const version = generation.current;
    void Promise.resolve().then(() => {
      if (active) void fetchPage();
    });
    return () => {
      active = false;
      generation.current = version + 1;
      locked.current = false;
    };
  }, [fetchPage]);
  return (
    <>
      {items.map((item) => (
        <React.Fragment key={item.id}>{children(item)}</React.Fragment>
      ))}
      {busy && (
        <AppText accessibilityLiveRegion="polite">{`Loading ${label}…`}</AppText>
      )}
      {loaded && !items.length && <AppText>{empty}</AppText>}
      {error && (
        <>
          <AppText accessibilityRole="alert">{error}</AppText>
          <AppText>
            {items.length && lastLoadedAt !== null
              ? `Showing stale history · last loaded ${new Date(lastLoadedAt).toLocaleString()}. Retry to check for updates.`
              : 'History is unavailable. Retry to load it.'}
          </AppText>
          <Button
            label={`Retry ${label}`}
            disabled={busy}
            onPress={() => void fetchPage()}
          />
        </>
      )}
      {!error && more && (
        <Button
          label={`More ${label}`}
          disabled={busy}
          onPress={() => void fetchPage()}
        />
      )}
    </>
  );
}

export function HistorySection({
  restroomId,
  recentReportId,
  FlagComponent,
}: {
  restroomId: string;
  recentReportId?: string;
  FlagComponent?: FlagAction;
}) {
  const { dependencies, revision } = useRestroomExperience();
  return (
    <>
      <AppText variant="subtitle">Recent reviews</AppText>
      <HistoryList
        key={`reviews:${restroomId}:${revision}`}
        restroomId={restroomId}
        load={dependencies.repository.loadReviews}
        label="reviews"
        empty="No reviews yet"
      >
        {(review) => (
          <Card>
            <AppText variant="heading">{review.authorName}</AppText>
            <AppText>{`${review.overall} / 5 · ${new Date(review.updatedAt).toLocaleString()}`}</AppText>
            {review.notes && <AppText>{review.notes}</AppText>}
            {review.desperateTimes !== undefined && (
              <AppText>
                {review.desperateTimes
                  ? 'Visitor assessment: desperate times only'
                  : 'Visitor assessment: not desperate times only'}
              </AppText>
            )}
            {FlagComponent && (
              <FlagComponent kind="review" contributionId={review.id} />
            )}
          </Card>
        )}
      </HistoryList>
      <AppText variant="subtitle">Usability history</AppText>
      <HistoryList
        key={`reports:${restroomId}:${revision}`}
        restroomId={restroomId}
        load={dependencies.repository.loadReports}
        label="observations"
        empty="No observations yet"
      >
        {(report) =>
          report.id === recentReportId ? null : (
            <Card>
              <AppText>{`Historical observation · ${report.state} · ${new Date(report.observedAt).toLocaleString()}`}</AppText>
              {FlagComponent && (
                <FlagComponent kind="report" contributionId={report.id} />
              )}
            </Card>
          )
        }
      </HistoryList>
    </>
  );
}
