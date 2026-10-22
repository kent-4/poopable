import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppText, Button, Card } from '../../components/ui';
import { useRestroomExperience } from './context';
import type { LocationCursor, Restroom } from './types';

/** Keyed by the normalized query at the call site; old requests cannot affect a new search. */
export function AreaPicker({
  query,
  onSelect,
}: {
  query: string;
  onSelect(restroom: Restroom): void;
}) {
  const { dependencies } = useRestroomExperience();
  const [items, setItems] = useState<Restroom[]>([]);
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const cursor = useRef<LocationCursor | undefined>(undefined);
  const locked = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    const version = generation.current;
    setBusy(true);
    setError(null);
    try {
      const page = await dependencies.repository.findLocations(
        query,
        cursor.current,
      );
      if (version !== generation.current) return;
      cursor.current = page.next ?? undefined;
      // Keep only the current ten-result page in the discovery header.
      setItems(page.items);
      setLastRefreshed(dependencies.clock.now());
      setMore(page.next !== null);
      setLoaded(true);
    } catch (error) {
      if (version === generation.current)
        setError(
          error instanceof Error
            ? error.message
            : 'Could not search catalog locations.',
        );
    } finally {
      if (version === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }, [dependencies.repository, dependencies.clock, query]);
  useEffect(() => {
    let active = true;
    const version = generation.current;
    // Let typing settle before starting a metadata request.
    const timer = setTimeout(
      () => {
        if (active) void load();
      },
      query ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      generation.current = version + 1;
      locked.current = false;
    };
  }, [load, query]);
  return (
    <Card>
      <AppText variant="heading">Choose a search area</AppText>
      <AppText>
        Search a catalog name or address, or choose a location below. On the
        map, pan and tap Search this area.
      </AppText>
      {items.map((restroom) => (
        <Button
          key={restroom.id}
          label={`Search around ${restroom.name}`}
          variant="secondary"
          onPress={() => onSelect(restroom)}
        />
      ))}
      {busy && (
        <AppText accessibilityLiveRegion="polite">
          Searching catalog locations…
        </AppText>
      )}
      {loaded && !items.length && (
        <AppText>
          {more
            ? 'No matches in this page. Search more locations or try another name.'
            : 'No matching catalog locations. Try another name or use your location.'}
        </AppText>
      )}
      {error && (
        <>
          <AppText accessibilityRole="alert">{error}</AppText>
          {items.length > 0 && lastRefreshed !== null && (
            <AppText>{`Showing stale locations · last refreshed ${new Date(lastRefreshed).toLocaleString()}. This does not confirm current usability.`}</AppText>
          )}
          <Button
            label="Retry location search"
            disabled={busy}
            onPress={() => void load()}
          />
        </>
      )}
      {!error && more && (
        <Button
          label="More catalog locations"
          disabled={busy}
          onPress={() => void load()}
        />
      )}
    </Card>
  );
}
