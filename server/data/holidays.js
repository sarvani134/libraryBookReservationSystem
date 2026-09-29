import { calendarDate } from '../../shared/dateUtils.js';
export function holidaySeeds(year = new Date().getFullYear()) {
  return [
    ['Republic Day', `${year}-01-26`, 'NATIONAL', ''],
    ['Independence Day', `${year}-08-15`, 'NATIONAL', ''],
    ['Gandhi Jayanti', `${year}-10-02`, 'NATIONAL', ''],
    [
      'Christmas',
      `${year}-12-25`,
      'STATE',
      'Illustrative library closure; verify against the annual state notification.',
    ],
    [
      'Sankranti — demo calendar',
      `${year}-01-15`,
      'STATE',
      'Illustrative date; replace with the approved Andhra Pradesh holiday calendar.',
    ],
    [
      'College Foundation Day — demo',
      `${year}-09-15`,
      'COLLEGE',
      'Demo closure for testing reminders; not an official college holiday.',
    ],
    [
      'Semester break — demo',
      `${year}-09-16`,
      'COLLEGE',
      'Demo closure for testing consecutive holidays.',
    ],
  ].map(([name, date, type, note]) => ({ name, date: calendarDate(date), type, note }));
}
