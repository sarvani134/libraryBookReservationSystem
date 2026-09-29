import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarDate,
  dateKey,
  calculateStandardDueDate,
  calculateReservationExpiry,
  getDaysRemaining,
  getDaysOverdue,
  isSameCalendarDay,
  addDays,
} from '../../shared/dateUtils.js';
import { createHolidayService } from '../services/holidayService.js';
import { searchScore } from '../services/searchService.js';
import { recommendationScore } from '../services/recommendationService.js';
import { books } from '../data/books.js';
test('standard due date is 15 calendar days later', () =>
  assert.equal(dateKey(calculateStandardDueDate(calendarDate('2026-09-01'))), '2026-09-16'));
test('reservation expires at midnight IST on the fourth day, not 72 hours after creation', () => {
  const expiry = calculateReservationExpiry(new Date('2026-09-20T23:30:00+05:30'));
  assert.equal(expiry.toISOString(), '2026-09-22T18:30:00.000Z');
  assert.ok(new Date('2026-09-22T23:59:59+05:30') < expiry);
  assert.equal(new Date('2026-09-23T00:00:00+05:30').getTime(), expiry.getTime());
});
test('India calendar stays correct across UTC day boundaries', () =>
  assert.equal(dateKey(new Date('2026-09-22T19:00:00Z')), '2026-09-23'));
test('invalid and normalized overflow calendar dates are rejected', () => {
  for (const value of ['2026-02-30', 'hello', '2026-13-01', '2026-1-01'])
    assert.throws(() => calendarDate(value));
});
test('year and leap-day boundaries are handled', () => {
  assert.equal(dateKey(addDays(calendarDate('2028-02-28'), 1)), '2028-02-29');
  assert.equal(dateKey(addDays(calendarDate('2026-12-31'), 1)), '2027-01-01');
});
test('days remaining and overdue use calendar dates', () => {
  assert.equal(
    getDaysRemaining(calendarDate('2026-09-16'), new Date('2026-09-15T23:00:00+05:30')),
    1,
  );
  assert.equal(getDaysOverdue(calendarDate('2026-09-16'), calendarDate('2026-09-19')), 3);
  assert.ok(isSameCalendarDay('2026-09-15T19:00:00Z', '2026-09-16T12:00:00+05:30'));
});
const holidays = [
  { name: 'Monday closure', date: calendarDate('2026-09-21'), type: 'COLLEGE' },
  { name: 'Tuesday closure', date: calendarDate('2026-09-22'), type: 'STATE' },
];
test('detects configured holidays and Sundays', () => {
  const s = createHolidayService(holidays);
  assert.ok(s.isHoliday(calendarDate('2026-09-21')));
  assert.equal(s.getHolidayForDate(calendarDate('2026-09-21')).name, 'Monday closure');
  assert.equal(s.isWorkingDay(calendarDate('2026-09-20')), false);
  assert.equal(s.isWorkingDay(calendarDate('2026-09-23')), true);
});
test('next working day skips Sunday and multiple consecutive holidays', () =>
  assert.equal(
    dateKey(createHolidayService(holidays).getNextWorkingDay(calendarDate('2026-09-20'))),
    '2026-09-23',
  ));
test('Saturday closure is configurable', () => {
  assert.ok(createHolidayService().isWorkingDay(calendarDate('2026-09-19')));
  assert.equal(createHolidayService([], true).isWorkingDay(calendarDate('2026-09-19')), false);
});
test('topic search finds graphs, deadlocks, TCP and DBMS', () => {
  for (const [query, expected] of [
    ['deadlocks', 'Operating System Concepts'],
    ['TCP', 'Computer Networks'],
    ['graphs', 'Discrete Mathematics and Its Applications'],
    ['DBMS', 'Database System Concepts'],
    ['dynamic programming', 'Introduction to Algorithms'],
  ])
    assert.ok(
      searchScore(
        books.find((b) => b.title === expected),
        query,
      ) > 0,
    );
  assert.equal(searchScore(books[0], 'Quantum Networking'), 0);
});
test('recommendations favor subject and overlapping topics', () => {
  const os = books.find((b) => b.title === 'Operating System Concepts');
  assert.ok(
    recommendationScore(
      os,
      books.find((b) => b.title === 'Modern Operating Systems'),
    ) > recommendationScore(os, books[0]),
  );
});
test('seed contains 60–100 unique real textbook titles without invented ISBNs', () => {
  assert.ok(books.length >= 60 && books.length <= 100);
  assert.equal(new Set(books.map((b) => b.title)).size, books.length);
  assert.ok(books.every((b) => !b.isbn));
});
