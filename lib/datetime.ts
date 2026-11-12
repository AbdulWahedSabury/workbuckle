// Interview times are entered and shown in the business's own time zone, so the
// server and every admin's browser agree regardless of where each one runs.
// Pure functions; safe on the server and the client.

export const BUSINESS_TIME_ZONE = 'Europe/Nicosia';

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function zonedParts(date: Date): Record<string, string> {
  return Object.fromEntries(partsFormat.formatToParts(date).map((p) => [p.type, p.value]));
}

/** Minutes the business zone is ahead of UTC at `date` (DST-aware). */
function offsetMinutes(date: Date): number {
  const p = zonedParts(date);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/** Date → "YYYY-MM-DDTHH:mm" wall time in the business zone, for <input type="datetime-local">. */
export function toZonedInputValue(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** "YYYY-MM-DDTHH:mm" wall time in the business zone → Date, or null if malformed. */
export function fromZonedInputValue(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (Number.isNaN(wall)) return null;
  // Second pass settles times near a DST switch, where the first guess's offset is off by an hour.
  const first = new Date(wall - offsetMinutes(new Date(wall)) * 60_000);
  return new Date(wall - offsetMinutes(first) * 60_000);
}

const displayFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "12 Nov 2026, 10:30" in the business zone. */
export function formatDateTime(date: Date): string {
  return displayFormat.format(date);
}
