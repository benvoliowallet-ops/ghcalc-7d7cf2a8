import { formatInTimeZone } from 'date-fns-tz';

export const SK_TZ = 'Europe/Bratislava';

/**
 * Formats a date value using Slovakia's timezone (CET/CEST — DST-aware).
 * Drop-in replacement for date-fns `format`.
 */
export function formatSK(date: Date | string | number, fmt: string): string {
  return formatInTimeZone(new Date(date), SK_TZ, fmt);
}
