import { Checkout, Reservation, Interest, Holiday } from '../models/index.js';
import { createHolidayService } from '../services/holidayService.js';
import { dateKey, addDays, getDaysRemaining, startOfDay } from '../../shared/dateUtils.js';
import { REMINDER_DAY } from '../../shared/libraryRules.js';
export async function activity(req, res) {
  const registrationNumber = req.params.registrationNumber.trim().toUpperCase();
  const [checkouts, reservations, interests, holidays] = await Promise.all([
    Checkout.find({ registrationNumber }).populate('bookId').sort({ createdAt: -1 }).lean(),
    Reservation.find({ registrationNumber }).populate('bookId').sort({ createdAt: -1 }).lean(),
    Interest.find({ registrationNumber }).populate('bookId').sort({ createdAt: 1 }).lean(),
    Holiday.find().lean(),
  ]);
  const service = createHolidayService(holidays);
  const now = new Date();
  const notifications = [];
  for (const c of checkouts) {
    if (c.status === 'RETURNED') continue;
    c.daysRemaining = getDaysRemaining(c.dueDate, now);
    if (c.dueDate < startOfDay(now)) c.status = 'OVERDUE';
    c.dueDay = service.describe(c.dueDate);
    c.reminderDay = service.describe(addDays(c.checkoutDate, REMINDER_DAY));
    c.isReminderDay = dateKey(now) === c.reminderDay.date;
    if (c.daysRemaining <= 1)
      notifications.push({
        title:
          c.daysRemaining < 0
            ? 'Book overdue'
            : c.daysRemaining === 0
              ? 'Book due today'
              : 'Book due tomorrow',
        message: `${c.bookId?.title} · Due ${dateKey(c.dueDate)}`,
      });
    else if (c.isReminderDay)
      notifications.push({
        title: 'Day-14 borrowing reminder',
        message: `${c.bookId?.title} · Your planned return date is ${dateKey(c.dueDate)}.`,
      });
    if (!c.dueDay.working || (c.isReminderDay && !c.reminderDay.working))
      notifications.push({
        title: 'Library Holiday Notice',
        message: `${c.bookId?.title} · ${!c.dueDay.working ? c.dueDay.reason : c.reminderDay.reason}`,
      });
  }
  for (const r of reservations)
    if (r.status === 'ACTIVE' && getDaysRemaining(r.expiresAt, now) <= 1)
      notifications.push({
        title: 'Reservation expiring soon',
        message: `Collect ${r.bookId?.title} before ${dateKey(r.expiresAt)}.`,
      });
  for (const i of interests)
    if (i.status === 'AVAILABLE' && i.bookId?.availableCopies > 0)
      notifications.push({
        title: 'A book is available',
        message: `${i.bookId.title} is back on the shelf. Copies are first come, first served.`,
      });
  res.json({ checkouts, reservations, interests, notifications });
}
