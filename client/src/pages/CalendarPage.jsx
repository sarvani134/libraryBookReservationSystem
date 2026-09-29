import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ArrowRight } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { useLibrary } from '../context/LibraryContext';
import { createHolidayService } from '../../../server/services/holidayService';
import { calendarDate, dateKey, formatLibraryDate } from '../../../shared/dateUtils';
import { ErrorState, Skeleton } from '../components/UI';
export default function CalendarPage() {
  const r = useResource('/holidays');
  const { config } = useLibrary();
  const [month, setMonth] = useState(() => dateKey().slice(0, 7));
  const [selected, setSelected] = useState(dateKey());
  const [year, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
  const service = createHolidayService(r.data || [], config?.rules.SATURDAYS_CLOSED);
  const detail = service.describe(calendarDate(selected));
  function move(delta) {
    const d = new Date(Date.UTC(year, m - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return (
    <div className="page">
      <div className="page-heading">
        <span className="eyebrow">MAKE TIME FOR THE LIBRARY</span>
        <h1>A little planning. More reading.</h1>
        <p>Your guide to working days, holidays, and your next visit.</p>
      </div>
      {r.loading ? (
        <Skeleton count={2} />
      ) : r.error ? (
        <ErrorState message={r.error} retry={r.reload} />
      ) : (
        <div className="calendar-layout">
          <section className="calendar">
            <div className="calendar-head">
              <h2>
                {new Intl.DateTimeFormat('en-IN', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(Date.UTC(year, m - 1, 1)))}
              </h2>
              <div className="action-row">
                <button
                  className="text-btn"
                  onClick={() => {
                    setMonth(dateKey().slice(0, 7));
                    setSelected(dateKey());
                  }}
                >
                  Today
                </button>
                <button className="icon-btn" aria-label="Previous month" onClick={() => move(-1)}>
                  <ChevronLeft />
                </button>
                <button className="icon-btn" aria-label="Next month" onClick={() => move(1)}>
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div className="weekday" key={day}>
                  {day}
                </div>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <div key={`blank${i}`} className="calendar-blank" />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const key = `${month}-${String(i + 1).padStart(2, '0')}`;
                const d = service.describe(calendarDate(key));
                return (
                  <button
                    key={key}
                    aria-label={`${key}, ${d.reason || 'Working day'}`}
                    aria-pressed={selected === key}
                    className={`calendar-day ${d.holiday?.type.toLowerCase() || (!d.working ? 'sunday' : '')} ${selected === key ? 'chosen' : ''} ${dateKey() === key ? 'today' : ''}`}
                    onClick={() => setSelected(key)}
                  >
                    <strong>{i + 1}</strong>
                    {d.reason && <small>{d.reason}</small>}
                  </button>
                );
              })}
            </div>
            <div className="calendar-legend">
              {[
                ['working', 'Working day'],
                ['sunday', 'Sunday / weekend'],
                ['national', 'National holiday'],
                ['state', 'AP holiday'],
                ['college', 'College holiday'],
              ].map(([key, label]) => (
                <span key={key}>
                  <i className={key} />
                  {label}
                </span>
              ))}
            </div>
          </section>
          <aside className="calendar-detail">
            <CalendarDays size={28} />
            <span className="eyebrow">YOUR SELECTED DAY</span>
            <h2>{formatLibraryDate(calendarDate(selected))}</h2>
            <span className={`status ${detail.working ? 'active' : 'expired'}`}>
              {detail.working ? 'LIBRARY OPEN' : 'LIBRARY CLOSED'}
            </span>
            <h3>{detail.reason || 'A good day for a library visit.'}</h3>
            {detail.holiday && (
              <p>
                {detail.holiday.type === 'STATE'
                  ? 'Andhra Pradesh'
                  : detail.holiday.type === 'NATIONAL'
                    ? 'National'
                    : 'College'}{' '}
                holiday
              </p>
            )}
            <p>{detail.holiday?.note}</p>
            {!detail.working && (
              <div className="next-working">
                <span>Next working day</span>
                <strong>{formatLibraryDate(detail.nextWorkingDay)}</strong>
                <button
                  className="text-btn"
                  onClick={() => {
                    const d = dateKey(detail.nextWorkingDay);
                    setSelected(d);
                    setMonth(d.slice(0, 7));
                  }}
                >
                  View day <ArrowRight size={16} />
                </button>
              </div>
            )}
            <p className="small muted">
              Demo calendar. College closures and state holidays must be verified against the
              approved annual calendar. Sundays are closed; Saturdays are{' '}
              {config?.rules.SATURDAYS_CLOSED ? 'closed' : 'open'}.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
