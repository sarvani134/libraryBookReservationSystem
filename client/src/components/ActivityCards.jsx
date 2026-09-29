import { useEffect, useState } from 'react';
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react';
import { formatLibraryDate, dateKey } from '../../../shared/dateUtils';
import { Cover } from './UI';
export function Countdown({ expiresAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const hours = Math.max(0, Math.floor((new Date(expiresAt) - now) / 3600000));
  return (
    <span>
      Expires in {Math.floor(hours / 24)} days {hours % 24} hours
    </span>
  );
}
export function ReservationCard({ record, onAction }) {
  return (
    <article className="activity-card">
      <Cover book={record.bookId} />
      <div className="activity-content">
        <span className={`status ${record.status.toLowerCase()}`}>{record.status}</span>
        <h3>{record.bookId.title}</h3>
        <p>
          Reserved {formatLibraryDate(record.reservedAt)} · Expires{' '}
          {formatLibraryDate(record.expiresAt)}, midnight IST
        </p>
        {record.status === 'ACTIVE' ? (
          <>
            <div className="remaining">
              <Clock size={16} />
              <Countdown expiresAt={record.expiresAt} />
            </div>
            <div className="action-row">
              <button className="btn btn-small" onClick={() => onAction('collect', record)}>
                Collect & checkout
              </button>
              <button className="text-btn" onClick={() => onAction('cancel', record)}>
                Withdraw reservation
              </button>
            </div>
          </>
        ) : (
          record.status === 'EXPIRED' && <p>The book has been released for other students.</p>
        )}
      </div>
    </article>
  );
}
export function CheckoutCard({ record, onAction, onDate }) {
  const [dismissed, setDismissed] = useState(false);
  const holiday = !record.dueDay?.working || (record.isReminderDay && !record.reminderDay?.working);
  const suggested = !record.dueDay?.working
    ? record.dueDay?.nextWorkingDay
    : record.reminderDay?.nextWorkingDay;
  return (
    <article className="activity-card">
      <Cover book={record.bookId} />
      <div className="activity-content">
        <span className={`status ${record.status.toLowerCase()}`}>
          {record.status.replace('_', ' ')}
        </span>
        <h3>{record.bookId.title}</h3>
        <p>
          Checked out {formatLibraryDate(record.checkoutDate)} · Due{' '}
          {formatLibraryDate(record.dueDate)}
        </p>
        {record.status === 'RETURNED' ? (
          <p>
            <CheckCircle2 size={14} /> Returned {formatLibraryDate(record.returnedAt)}. Thank you!
          </p>
        ) : (
          <>
            <div className={`remaining ${record.daysRemaining < 0 ? 'error' : ''}`}>
              <Clock size={16} />
              {record.daysRemaining < 0
                ? `Overdue by ${-record.daysRemaining} days`
                : record.daysRemaining === 0
                  ? 'Due today'
                  : record.daysRemaining === 1
                    ? 'Your book is due tomorrow.'
                    : `${record.daysRemaining} days remaining`}
            </div>
            {holiday && !dismissed && (
              <div className="notice amber">
                <CalendarDays size={20} />
                <div>
                  <strong>Library Holiday Notice</strong>
                  {record.isReminderDay && !record.reminderDay.working && (
                    <p>
                      Your day-14 reminder falls on {formatLibraryDate(record.reminderDay.date)}:{' '}
                      {record.reminderDay.reason}.
                    </p>
                  )}
                  {!record.dueDay.working && <p>Your due date falls on {record.dueDay.reason}.</p>}
                  <p>
                    Current due date: {formatLibraryDate(record.dueDate)}. Suggested return:{' '}
                    {formatLibraryDate(suggested)}.
                  </p>
                  <div className="action-row">
                    <button className="text-btn" onClick={() => onDate(record, dateKey(suggested))}>
                      Change to next working day
                    </button>
                    <button className="text-btn" onClick={() => setDismissed(true)}>
                      Keep current due date
                    </button>
                    <button className="text-btn" onClick={() => onDate(record)}>
                      Choose another date
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="action-row">
              <button className="btn btn-small" onClick={() => onAction('return', record)}>
                Return book
              </button>
              <button className="text-btn" onClick={() => onDate(record)}>
                Change return date
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
