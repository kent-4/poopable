import assert from 'node:assert/strict';
import { readEmulatorConfig } from './config.mjs';

function value(item) {
  if (item instanceof Date) return { timestampValue: item.toISOString() };
  if (item === null) return { nullValue: null };
  if (typeof item === 'string') return { stringValue: item };
  if (typeof item === 'boolean') return { booleanValue: item };
  if (typeof item === 'number' && Number.isFinite(item))
    return Number.isInteger(item)
      ? { integerValue: String(item) }
      : { doubleValue: item };
  if (Array.isArray(item)) return { arrayValue: { values: item.map(value) } };
  if (typeof item === 'object') return { mapValue: { fields: fields(item) } };
  throw new Error('Unsupported fixture value.');
}
function fields(record) {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, value(item)]),
  );
}

/** Emulator-only owner bypass, guarded before every write. Never accepts a cloud target. */
export async function writeFixtures(records) {
  const { projectId, host } = readEmulatorConfig();
  const root = `projects/${projectId}/databases/(default)/documents`;
  for (let offset = 0; offset < records.length; offset += 500) {
    const response = await fetch(`http://${host}/v1/${root}:commit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: records.slice(offset, offset + 500).map(([path, record]) => ({
          update: { name: `${root}/${path}`, fields: fields(record) },
        })),
      }),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200, await response.text());
  }
}
