export const OSLO_TIME_ZONE = 'Europe/Oslo';
export const NB_LOCALE = 'nb-NO';
export const EN_LOCALE = 'en-US';

type DateLike = Date | string | number | null | undefined;

function toDate(value: DateLike): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

export function createOsloFormatter(
  locale: string = NB_LOCALE,
  options: Intl.DateTimeFormatOptions = {},
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    timeZone: OSLO_TIME_ZONE,
    ...options,
  });
}

export function formatOsloDate(
  value: DateLike,
  locale: string = NB_LOCALE,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const formatter = createOsloFormatter(locale, options);
  return formatter.format(toDate(value));
}

export function formatOsloDateTime(
  value: DateLike,
  locale: string = NB_LOCALE,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const formatter = createOsloFormatter(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  });
  return formatter.format(toDate(value));
}

export function formatOsloTime(
  value: DateLike,
  locale: string = NB_LOCALE,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const formatter = createOsloFormatter(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
  return formatter.format(toDate(value));
}

export function parseDate(value: DateLike): Date {
  return toDate(value);
}
