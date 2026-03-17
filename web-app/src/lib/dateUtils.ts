/**
 * Date formatting utilities — PKT (Pakistan Standard Time, UTC+5) aware.
 * Lightweight alternative to date-fns (zero dependency).
 *
 * All display-facing functions format dates in Asia/Karachi timezone
 * so that users always see Pakistan-local times regardless of their browser locale.
 */

const PKT_TZ = 'Asia/Karachi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parse input to a Date object, returning null for invalid values */
function toDate(dateStr: string | Date): Date | null {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return isNaN(d.getTime()) ? null : d;
}

/** Get date parts in PKT timezone */
function pktParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PKT_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(d);

  const get = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? part.value : '';
  };

  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10) - 1, // 0-indexed
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    weekday: weekdayMap[get('weekday')] ?? 0,
  };
}

export function formatDate(dateStr: string | Date): string {
  const d = toDate(dateStr);
  if (!d) return '—';
  const p = pktParts(d);
  return `${p.day} ${MONTHS[p.month]} ${p.year}`;
}

export function formatDateTime(dateStr: string | Date): string {
  const d = toDate(dateStr);
  if (!d) return '—';
  const p = pktParts(d);
  const ampm = p.hour >= 12 ? 'PM' : 'AM';
  const h12 = p.hour % 12 || 12;
  const mins = p.minute.toString().padStart(2, '0');
  return `${p.day} ${MONTHS[p.month]} ${p.year}, ${h12}:${mins} ${ampm}`;
}

export function formatTime(dateStr: string | Date): string {
  const d = toDate(dateStr);
  if (!d) return '—';
  const p = pktParts(d);
  const ampm = p.hour >= 12 ? 'PM' : 'AM';
  const h12 = p.hour % 12 || 12;
  const mins = p.minute.toString().padStart(2, '0');
  return `${h12}:${mins} ${ampm}`;
}

export function formatRelative(dateStr: string | Date): string {
  const d = toDate(dateStr);
  if (!d) return '—';
  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function getDayName(dateStr: string | Date): string {
  const d = toDate(dateStr);
  if (!d) return '';
  const p = pktParts(d);
  return DAYS[p.weekday] || '';
}

export function isToday(dateStr: string | Date): boolean {
  const d = toDate(dateStr);
  if (!d) return false;
  const dateParts = pktParts(d);
  const todayParts = pktParts(new Date());
  return dateParts.day === todayParts.day && dateParts.month === todayParts.month && dateParts.year === todayParts.year;
}

export function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function toISODate(dateStr: string | Date): string {
  const d = toDate(dateStr);
  if (!d) return '';
  // Return the date portion in PKT timezone
  const p = pktParts(d);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
