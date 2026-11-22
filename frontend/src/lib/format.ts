const DEFAULT_CURRENCY = 'CAD';

// One Intl.NumberFormat per currency, built on first use and reused — listings
// now carry their own currency (CAD/USD/GBP/AUD) based on the host's country.
const currencyFormatters = new Map<string, Intl.NumberFormat>();

const formatterFor = (currencyCode: string) => {
  let formatter = currencyFormatters.get(currencyCode);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currencyCode, formatter);
  }
  return formatter;
};

const dateTime = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const dateOnly = new Intl.DateTimeFormat('en-CA', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export const formatMoney = (
  value: number | string | undefined | null,
  currencyCode: string = DEFAULT_CURRENCY
) => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return formatterFor(currencyCode || DEFAULT_CURRENCY).format(amount);
};

/** "14%" / "5%" — trims a trailing ".0" since most rates here are whole numbers. */
export const formatPercent = (rate: number) => {
  const trimmed = Number.isInteger(rate) ? rate : Math.round(rate * 10) / 10;
  return `${trimmed}%`;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTime.format(parsed);
};

export const formatToday = () => dateOnly.format(new Date());

/** Hours between two datetime-local strings; 0 when the range is invalid. */
export const hoursBetween = (start?: string, end?: string) => {
  if (!start || !end) return 0;
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
  return (to - from) / 3_600_000;
};

export const formatDuration = (hours: number) => {
  if (hours <= 0) return '—';
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  const parts: string[] = [];
  if (whole > 0) parts.push(`${whole} hr${whole === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} min`);
  return parts.join(' ');
};

/** `now` rounded up to the next 15 minutes, as a datetime-local value. */
export const nextQuarterHourLocal = (offsetHours = 0) => {
  const date = new Date();
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  date.setHours(date.getHours() + offsetHours);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};
