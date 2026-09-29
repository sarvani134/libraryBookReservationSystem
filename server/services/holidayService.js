import { dateKey, weekday, addDays } from '../../shared/dateUtils.js';
import { SATURDAYS_CLOSED } from '../../shared/libraryRules.js';
export function createHolidayService(holidays = [], saturdaysClosed = SATURDAYS_CLOSED) {
  const getHolidayForDate = (date) => holidays.find((h) => dateKey(h.date) === dateKey(date));
  const isHoliday = (date) => Boolean(getHolidayForDate(date));
  const isWorkingDay = (date) =>
    weekday(date) !== 0 && !(saturdaysClosed && weekday(date) === 6) && !isHoliday(date);
  const getNextWorkingDay = (date) => {
    let candidate = addDays(date, 1);
    for (let i = 0; i < 370; i++, candidate = addDays(candidate, 1))
      if (isWorkingDay(candidate)) return candidate;
    throw new Error('No working day found within one year');
  };
  const describe = (date) => ({
    date: dateKey(date),
    working: isWorkingDay(date),
    holiday: getHolidayForDate(date),
    reason:
      getHolidayForDate(date)?.name ||
      (weekday(date) === 0 ? 'Sunday' : saturdaysClosed && weekday(date) === 6 ? 'Saturday' : null),
    nextWorkingDay: isWorkingDay(date) ? null : getNextWorkingDay(date),
  });
  return { getHolidayForDate, isHoliday, isWorkingDay, getNextWorkingDay, describe };
}
