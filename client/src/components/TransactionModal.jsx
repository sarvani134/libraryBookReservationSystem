import { useState } from 'react';
import { CalendarDays, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from './UI';
import { api, errorMessage } from '../services/api';
import { useResource } from '../hooks/useResource';
import { useLibrary } from '../context/LibraryContext';
import { dateKey, formatLibraryDate } from '../../../shared/dateUtils';
import { CHECKOUT_PERIOD_DAYS, RESERVATION_PERIOD_DAYS } from '../../../shared/libraryRules';
export function DateWarning({ preview, onSuggested }) {
  if (!preview) return null;
  return (
    <>
      {preview.exceedsStandard && (
        <div className="notice amber">
          <Info size={18} />
          <span>This date exceeds the standard {CHECKOUT_PERIOD_DAYS}-day borrowing window.</span>
        </div>
      )}
      {!preview.dueDay.working && (
        <div className="notice amber">
          <CalendarDays size={20} />
          <div>
            <strong>Library holiday: {preview.dueDay.reason}</strong>
            <p>
              {formatLibraryDate(preview.selectedDate)} is a non-working day. Next working day:{' '}
              {formatLibraryDate(preview.dueDay.nextWorkingDay)}.
            </p>
            <button
              type="button"
              className="text-btn"
              onClick={() => onSuggested(dateKey(preview.dueDay.nextWorkingDay))}
            >
              Use suggested date →
            </button>
            <p className="small">
              Or choose another date above. You may keep this date as your plan.
            </p>
            <button type="button" className="text-btn" onClick={() => onSuggested('')}>
              Choose another date
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export default function TransactionModal({ book, type, onClose, onSuccess }) {
  const { config, registration, remember, activity } = useLibrary();
  const [custom, setCustom] = useState(false);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);
  const preview = useResource(`/dates/preview${custom && date ? `?date=${date}` : ''}`);
  const title =
    type === 'reserve'
      ? 'Reserve your next read'
      : type === 'checkout'
        ? 'Make it your next chapter'
        : 'Be first to know';
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const form = Object.fromEntries(new FormData(e.currentTarget));
      const { data } = await api.post(
        type === 'reserve' ? '/reservations' : type === 'checkout' ? '/checkouts' : '/interests',
        {
          ...form,
          bookId: book._id,
          ...(custom && type === 'checkout' ? { customReturnDate: date } : {}),
        },
      );
      remember(form.registrationNumber);
      activity.reload();
      setSuccess(data);
      onSuccess?.();
      toast.success(
        type === 'reserve'
          ? 'Book reserved successfully!'
          : type === 'checkout'
            ? 'Checkout successful!'
            : 'Availability alert saved.',
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={success ? 'You’re all set!' : title} onClose={onClose}>
      {success ? (
        <div className="success-state">
          <CheckCircle2 size={50} />
          <h3>
            {type === 'reserve'
              ? 'A good read, reserved.'
              : type === 'checkout'
                ? 'Happy reading.'
                : 'We’ve saved your interest.'}
          </h3>
          <p>{book.title}</p>
          {type === 'reserve' ? (
            <p>
              We’ll hold your copy until{' '}
              <strong>{formatLibraryDate(success.expiresAt)}, 12:00 AM IST</strong>. Please collect
              it before then.
            </p>
          ) : type === 'checkout' ? (
            <p>
              Return due <strong>{formatLibraryDate(success.dueDate)}</strong>. Check My Activity
              for reminders.
            </p>
          ) : (
            <p>
              An in-app alert will appear in My Activity when a copy is available. Email delivery is
              not enabled.
            </p>
          )}
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="modal-book">
            <span>{book.subject}</span>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
          </div>
          <div className="form-grid">
            <label>
              Student name
              <input
                name="studentName"
                autoFocus
                required
                maxLength={150}
                placeholder="Your full name"
              />
            </label>
            <label>
              Registration number
              <input
                name="registrationNumber"
                defaultValue={registration}
                required
                maxLength={150}
                placeholder="e.g. 23CSE001"
              />
            </label>
            {type !== 'interest' && (
              <>
                <label>
                  Department
                  <select name="department" required>
                    {(config?.departments || ['CSE']).map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Year
                  <select name="year">
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="full">
              Email {type !== 'interest' && <span>(optional)</span>}
              <input
                name="email"
                type="email"
                required={type === 'interest'}
                placeholder="you@example.com"
              />
            </label>
          </div>
          {type === 'checkout' && (
            <fieldset>
              <legend>Return date</legend>
              <label className="radio">
                <input type="radio" checked={!custom} onChange={() => setCustom(false)} />
                Standard {CHECKOUT_PERIOD_DAYS}-day checkout
              </label>
              <label className="radio">
                <input type="radio" checked={custom} onChange={() => setCustom(true)} />
                Choose custom return date
              </label>
              {custom && (
                <label>
                  I plan to return this book on
                  <input
                    type="date"
                    min={dateKey()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
              )}
            </fieldset>
          )}
          {type !== 'interest' && (
            <>
              {preview.data && (
                <div className="date-summary">
                  <div>
                    <span>{type === 'reserve' ? 'Reserve from' : 'Checkout date'}</span>
                    <strong>{formatLibraryDate(preview.data.checkoutDate)}</strong>
                  </div>
                  <CalendarDays size={24} />
                  <div>
                    <span>{type === 'reserve' ? 'Expires · midnight IST' : 'Return due'}</span>
                    <strong>
                      {formatLibraryDate(
                        type === 'reserve' ? preview.data.expiresAt : preview.data.selectedDate,
                      )}
                    </strong>
                  </div>
                </div>
              )}
              {type === 'checkout' && (
                <DateWarning
                  preview={preview.data}
                  onSuggested={(d) => {
                    setCustom(true);
                    setDate(d);
                  }}
                />
              )}
              {preview.error && (
                <p role="alert" className="error">
                  {preview.error}
                </p>
              )}
              <p className="small muted">
                {type === 'reserve'
                  ? `${RESERVATION_PERIOD_DAYS} calendar days, including today. Collect at the library desk before expiry.`
                  : 'Dates are shown in India Standard Time. You can update your return plan in My Activity.'}
              </p>
            </>
          )}
          <button
            className="btn full-width"
            disabled={busy || (type !== 'interest' && (preview.loading || !!preview.error))}
          >
            {busy
              ? 'Saving…'
              : type === 'reserve'
                ? 'Confirm reservation'
                : type === 'checkout'
                  ? 'Confirm checkout'
                  : 'Save availability alert'}
          </button>
          <p className="modal-foot">
            No account needed. Your details are saved with this transaction.
          </p>
        </form>
      )}
    </Modal>
  );
}
