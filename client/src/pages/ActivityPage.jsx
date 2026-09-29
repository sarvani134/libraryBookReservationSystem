import { useState } from 'react';
import { Search, ShieldCheck, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLibrary } from '../context/LibraryContext';
import { api, errorMessage } from '../services/api';
import { useResource } from '../hooks/useResource';
import { Empty, ErrorState, Modal, Skeleton } from '../components/UI';
import { DateWarning } from '../components/TransactionModal';
import { CheckoutCard, ReservationCard } from '../components/ActivityCards';
import { dateKey, formatLibraryDate } from '../../../shared/dateUtils';
export default function ActivityPage({ reservationsOnly = false }) {
  const { registration, remember, activity } = useLibrary();
  const [input, setInput] = useState(registration);
  const [tab, setTab] = useState('checkouts');
  const [confirmation, setConfirmation] = useState(null);
  const [dateEdit, setDateEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const r = activity;
  const data = r.data;
  const current = reservationsOnly ? 'reservations' : tab;
  async function confirm() {
    setBusy(true);
    try {
      const { action, record } = confirmation;
      await api.patch(
        action === 'return'
          ? `/checkouts/${record._id}/return`
          : `/reservations/${record._id}/${action}`,
      );
      toast.success(
        action === 'return'
          ? 'Book returned successfully. Thank you!'
          : action === 'collect'
            ? 'Book collected. Your 15-day checkout starts today.'
            : 'Reservation withdrawn. The copy is available again.',
      );
      setConfirmation(null);
      r.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const onAction = (action, record) => setConfirmation({ action, record });
  const checkouts = data?.checkouts.filter((c) => c.status !== 'RETURNED') || [];
  const past = data?.checkouts.filter((c) => c.status === 'RETURNED') || [];
  return (
    <div className="page activity-page">
      <div className="page-heading">
        <span className="eyebrow">YOUR LIBRARY, AT A GLANCE</span>
        <h1>{reservationsOnly ? 'A good read is waiting.' : 'Every chapter, accounted for.'}</h1>
        <p>
          {reservationsOnly
            ? 'View your reservations, collect a book, or withdraw a reservation.'
            : 'Your borrowed books, reservations, and return dates in one place.'}
        </p>
      </div>
      <form
        className="lookup-form"
        onSubmit={(e) => {
          e.preventDefault();
          remember(input.trim());
          r.reload();
        }}
      >
        <label htmlFor="registration">Registration number</label>
        <div>
          <Search size={20} />
          <input
            id="registration"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 23CSE001"
            required
          />
          <button className="btn">Find my activity</button>
        </div>
        <p>
          No account required. Try{' '}
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setInput('23CSE001');
              remember('23CSE001');
            }}
          >
            23CSE001
          </button>{' '}
          for Sara’s demo activity.
        </p>
        <p className="small">
          This demo uses registration-number lookup, not authentication. Anyone with a registration
          number can view and manage its activity.
        </p>
      </form>
      {!registration ? (
        <Empty
          title="Your next chapter starts here"
          message="Enter your registration number to find your library activity."
          action={false}
        />
      ) : r.loading || (!data && !r.error) ? (
        <Skeleton count={2} />
      ) : r.error ? (
        <ErrorState message={r.error} retry={r.reload} />
      ) : (
        <>
          <div className="activity-summary">
            <div>
              <strong>{checkouts.length}</strong>
              <span>Books borrowed</span>
            </div>
            <div>
              <strong>{data.reservations.filter((r) => r.status === 'ACTIVE').length}</strong>
              <span>Active reservations</span>
            </div>
            <div>
              <strong>{checkouts.filter((c) => c.daysRemaining < 0).length}</strong>
              <span>Overdue books</span>
            </div>
          </div>
          {data.notifications.length > 0 && (
            <div className="activity-notices">
              {data.notifications.map((n, i) => (
                <div className="notice" key={i}>
                  <CalendarDays size={19} />
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!reservationsOnly && (
            <div className="tabs">
              {[
                ['checkouts', 'Checked out', checkouts.length],
                ['reservations', 'Reservations', data.reservations.length],
                ['past', 'Past returns', past.length],
                ['interests', 'Availability alerts', data.interests.length],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  className={tab === key ? 'selected' : ''}
                  onClick={() => setTab(key)}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}
          <div className="activity-list">
            {current === 'reservations' ? (
              data.reservations.length ? (
                data.reservations.map((record) => (
                  <ReservationCard key={record._id} record={record} onAction={onAction} />
                ))
              ) : (
                <Empty
                  title="No reservations yet"
                  message="Explore books and reserve something you need."
                />
              )
            ) : current === 'interests' ? (
              data.interests.length ? (
                data.interests.map((i) => (
                  <div className="interest-card" key={i._id}>
                    <h3>{i.bookId.title}</h3>
                    <span className="status">
                      {i.bookId.availableCopies > 0 ? 'AVAILABLE NOW' : 'WAITING FOR A COPY'}
                    </span>
                    <p>
                      Saved {formatLibraryDate(i.createdAt)}. Updates appear here; email delivery is
                      not enabled.
                    </p>
                  </div>
                ))
              ) : (
                <Empty title="No availability alerts" />
              )
            ) : (current === 'past' ? past : checkouts).length ? (
              (current === 'past' ? past : checkouts).map((record) => (
                <CheckoutCard
                  key={record._id}
                  record={record}
                  onAction={onAction}
                  onDate={(record, date) => setDateEdit({ record, date })}
                />
              ))
            ) : (
              <Empty
                title={current === 'past' ? 'No past returns' : 'No books checked out'}
                message="Your next good read is just a browse away."
              />
            )}
          </div>
        </>
      )}
      {confirmation && (
        <Modal
          title={
            confirmation.action === 'return'
              ? 'Return this book?'
              : confirmation.action === 'collect'
                ? 'Collect your reservation?'
                : 'Withdraw this reservation?'
          }
          onClose={() => !busy && setConfirmation(null)}
        >
          <h3>{confirmation.record.bookId.title}</h3>
          <p>
            {confirmation.action === 'collect'
              ? 'Your reservation will become a standard 15-day checkout, starting today.'
              : confirmation.action === 'return'
                ? 'Confirm that this book has been returned to the library.'
                : 'Your reserved copy will be released for other students.'}
          </p>
          <div className="action-row">
            <button className="btn" disabled={busy} onClick={confirm}>
              {busy ? 'Saving…' : 'Confirm'}
            </button>
            <button
              className="btn btn-outline"
              disabled={busy}
              onClick={() => setConfirmation(null)}
            >
              Go back
            </button>
          </div>
        </Modal>
      )}
      {dateEdit && (
        <ReturnDateModal
          {...dateEdit}
          onClose={() => setDateEdit(null)}
          onSuccess={() => {
            r.reload();
            setDateEdit(null);
          }}
        />
      )}
    </div>
  );
}
function ReturnDateModal({ record, date: initial, onClose, onSuccess }) {
  const [date, setDate] = useState(initial || dateKey(record.dueDate));
  const [busy, setBusy] = useState(false);
  const preview = useResource(date ? `/dates/preview?date=${date}` : null);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/checkouts/${record._id}/due-date`, { date });
      toast.success('Return date updated.');
      onSuccess();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const adjusted = preview.data
    ? {
        ...preview.data,
        exceedsStandard: new Date(`${date}T00:00:00+05:30`) > new Date(record.standardDueDate),
      }
    : null;
  return (
    <Modal title="Plan your return" onClose={onClose}>
      <form onSubmit={save}>
        <h3>{record.bookId.title}</h3>
        <p>Standard due date: {formatLibraryDate(record.standardDueDate)}</p>
        <label>
          New return date
          <input
            type="date"
            required
            min={dateKey()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <DateWarning preview={adjusted} onSuggested={setDate} />
        {preview.error && (
          <p role="alert" className="error">
            {preview.error}
          </p>
        )}
        <button
          className="btn full-width"
          disabled={busy || preview.loading || !preview.data || !!preview.error}
        >
          {busy ? 'Saving…' : 'Save return date'}
        </button>
      </form>
    </Modal>
  );
}
