import { CHECKOUT_PERIOD_DAYS, RESERVATION_PERIOD_DAYS, TIME_ZONE } from './libraryRules.js';
const DAY = 86400000;
export function dateKey(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid date');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a valid YYYY-MM-DD date');
  const date = new Date(`${value}T00:00:00+05:30`);
  if (!Number.isFinite(date.getTime()) || dateKey(date) !== value)
    throw new Error('Invalid calendar date');
  return date;
}
export const startOfDay = (value) => calendarDate(dateKey(value));
export const addDays = (value, days) => new Date(startOfDay(value).getTime() + days * DAY);
export const calculateStandardDueDate = (value) => addDays(value, CHECKOUT_PERIOD_DAYS);
// Three calendar dates, including the creation date; expires at midnight IST on day four.
export const calculateReservationExpiry = (value) => addDays(value, RESERVATION_PERIOD_DAYS);
export const getDaysRemaining = (value, now = new Date()) =>
  Math.round((startOfDay(value) - startOfDay(now)) / DAY);
export const getDaysOverdue = (value, now) => Math.max(0, -getDaysRemaining(value, now));
export const isSameCalendarDay = (a, b) => dateKey(a) === dateKey(b);
export const formatLibraryDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
export const weekday = (value) => new Date(`${dateKey(value)}T12:00:00Z`).getUTCDay();
