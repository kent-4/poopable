import type { HistoryCursor, HistoryPage } from './types';

export const historyPageSize = 10;

export function validateHistoryCursor(
  restroomId: string,
  kind: HistoryCursor['kind'],
  cursor?: HistoryCursor,
) {
  if (!restroomId || restroomId.includes('/'))
    throw new Error('Invalid restroom identity.');
  if (
    cursor &&
    (cursor.restroomId !== restroomId ||
      cursor.kind !== kind ||
      !Number.isSafeInteger(cursor.seconds) ||
      !Number.isInteger(cursor.nanoseconds) ||
      cursor.nanoseconds < 0 ||
      cursor.nanoseconds >= 1e9 ||
      !cursor.id ||
      cursor.id.includes('/'))
  )
    throw new Error('Invalid history cursor. Refresh this restroom.');
}

/** Session-only adapter. Firebase uses the same timestamp/identity order on the server. */
export function memoryHistoryPage<
  T extends { id: string; restroomId: string; suppressed?: boolean },
>(
  values: T[],
  restroomId: string,
  kind: HistoryCursor['kind'],
  time: (item: T) => number,
  cursor?: HistoryCursor,
): HistoryPage<T> {
  validateHistoryCursor(restroomId, kind, cursor);
  const after = cursor
    ? cursor.seconds * 1000 + cursor.nanoseconds / 1e6
    : null;
  const matches = values
    .filter(
      (item) =>
        item.restroomId === restroomId &&
        !item.suppressed &&
        (after === null ||
          time(item) < after ||
          (time(item) === after && item.id < cursor!.id)),
    )
    .sort(
      (a, b) => time(b) - time(a) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
    );
  const items = matches.slice(0, historyPageSize);
  const last = items.at(-1);
  const milliseconds = last ? time(last) : 0;
  const seconds = Math.floor(milliseconds / 1000);
  return {
    items,
    next:
      matches.length > historyPageSize && last
        ? {
            restroomId,
            kind,
            id: last.id,
            seconds,
            nanoseconds: Math.round((milliseconds - seconds * 1000) * 1e6),
          }
        : null,
  };
}
