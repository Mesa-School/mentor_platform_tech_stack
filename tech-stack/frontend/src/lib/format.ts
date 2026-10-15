/**
 * Display formatters. Centralised so currency, dates, and numbers look the same
 * on every screen and the locale is changed in one place.
 *
 * `Intl` formatters are expensive to construct — they are memoised per locale here.
 */

const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function numberFormatter(options: Intl.NumberFormatOptions, locale: string) {
  const key = locale + JSON.stringify(options);
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

function dateFormatter(options: Intl.DateTimeFormatOptions, locale: string) {
  const key = locale + JSON.stringify(options);
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatCurrency(
  value: number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
) {
  return numberFormatter(
    { style: "currency", currency, maximumFractionDigits: 2 },
    locale,
  ).format(value);
}

export function formatNumber(value: number, locale = DEFAULT_LOCALE) {
  return numberFormatter({}, locale).format(value);
}

export function formatCompactNumber(value: number, locale = DEFAULT_LOCALE) {
  return numberFormatter(
    { notation: "compact", maximumFractionDigits: 1 },
    locale,
  ).format(value);
}

export function formatPercent(
  value: number,
  fractionDigits = 1,
  locale = DEFAULT_LOCALE,
) {
  return numberFormatter(
    {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    },
    locale,
  ).format(value);
}

/** ISO string or Date → "12 Mar 2026". Returns "—" for null/invalid input. */
export function formatDate(
  value: string | Date | null | undefined,
  locale = DEFAULT_LOCALE,
) {
  const date = toDate(value);
  if (!date) return "—";
  return dateFormatter(
    { day: "2-digit", month: "short", year: "numeric" },
    locale,
  ).format(date);
}

/** ISO string or Date → "12 Mar 2026, 14:30". */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale = DEFAULT_LOCALE,
) {
  const date = toDate(value);
  if (!date) return "—";
  return dateFormatter(
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    locale,
  ).format(date);
}

/** "3 hours ago" / "in 2 days". */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale = DEFAULT_LOCALE,
) {
  const date = toDate(value);
  if (!date) return "—";

  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const deltaSeconds = (date.getTime() - Date.now()) / 1000;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(deltaSeconds) >= seconds || unit === "second") {
      return relative.format(Math.round(deltaSeconds / seconds), unit);
    }
  }
  return relative.format(0, "second");
}

/** "Ada Lovelace" → "AL". Used for avatar fallbacks. */
export function initials(name: string | null | undefined, max = 2) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, max = 60) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** exponent).toFixed(decimals)} ${units[exponent]}`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
