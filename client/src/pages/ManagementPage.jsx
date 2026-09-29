import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { useLibrary } from '../context/LibraryContext';
import { api, errorMessage } from '../services/api';
import { Modal, ErrorState, Skeleton } from '../components/UI';
import { dateKey, formatLibraryDate } from '../../../shared/dateUtils';
export default function ManagementPage() {
  const { config } = useLibrary();
  const [tab, setTab] = useState('books');
  const r = useResource(`/${tab}`);
  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const input = Object.fromEntries(new FormData(e.currentTarget));
      if (tab === 'books') {
        input.topics = input.topics
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
        input.tags = input.tags
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
        if (!input.semester) input.semester = null;
        if (!input.publishedYear) input.publishedYear = null;
      }
      await api[edit._id ? 'put' : 'post'](`/${tab}${edit._id ? `/${edit._id}` : ''}`, input);
      toast.success('Saved successfully.');
      setEdit(null);
      r.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    setBusy(true);
    try {
      await api.delete(`/${tab}/${remove._id}`);
      toast.success('Removed.');
      setRemove(null);
      r.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (config && !config.managementEnabled)
    return (
      <div className="page">
        <h1>Demo management is disabled.</h1>
      </div>
    );
  const records = tab === 'books' ? r.data?.books : r.data;
  return (
    <div className="page manage-page">
      <div className="page-heading">
        <span className="eyebrow">DEVELOPMENT WORKSPACE</span>
        <h1>Demo Library Management</h1>
        <p>Manage the collection and calendar. This demo route is intentionally unauthenticated.</p>
      </div>
      <div className="notice amber">
        Use only with demo data. Management can be disabled with MANAGEMENT_ENABLED=false.
      </div>
      <div className="results-bar">
        <div className="tabs">
          {['books', 'holidays', 'reservations', 'checkouts'].map((t) => (
            <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        {['books', 'holidays'].includes(tab) && (
          <button className="btn" onClick={() => setEdit({})}>
            <Plus size={16} />
            Add {tab === 'books' ? 'book' : 'holiday'}
          </button>
        )}
      </div>
      {r.loading ? (
        <Skeleton count={2} />
      ) : r.error ? (
        <ErrorState message={r.error} retry={r.reload} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tab === 'holidays' ? 'Holiday' : 'Book'}</th>
                <th>{tab === 'books' ? 'Subject' : tab === 'holidays' ? 'Type' : 'Student'}</th>
                <th>{tab === 'books' ? 'Inventory' : tab === 'holidays' ? 'Date' : 'Status'}</th>
                <th>{['books', 'holidays'].includes(tab) ? 'Actions' : 'Dates'}</th>
              </tr>
            </thead>
            <tbody>
              {records?.map((item) => (
                <tr key={item._id}>
                  <td>{item.title || item.name || item.bookId?.title}</td>
                  <td>
                    {item.subject ||
                      item.type ||
                      `${item.studentName} · ${item.registrationNumber}`}
                  </td>
                  <td>
                    {tab === 'books'
                      ? `${item.availableCopies} available / ${item.totalCopies} total`
                      : tab === 'holidays'
                        ? formatLibraryDate(item.date)
                        : item.status}
                  </td>
                  <td>
                    {['books', 'holidays'].includes(tab) ? (
                      <div className="action-row">
                        {tab === 'books' && (
                          <button
                            className="icon-btn"
                            aria-label={`Edit ${item.title}`}
                            onClick={() => setEdit(item)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button
                          className="icon-btn error"
                          aria-label={`Delete ${item.title || item.name}`}
                          onClick={() => setRemove(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      formatLibraryDate(item.expiresAt || item.dueDate)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records?.length && <p className="empty">No records yet.</p>}
        </div>
      )}
      {edit && (
        <Modal
          title={`${edit._id ? 'Edit' : 'Add'} ${tab === 'books' ? 'book' : 'holiday'}`}
          onClose={() => !busy && setEdit(null)}
        >
          <form onSubmit={save}>
            <div className="form-grid">
              {tab === 'books' ? (
                <>
                  <Field label="Title" name="title" value={edit.title} required />
                  <Field label="Author" name="author" value={edit.author} required />
                  <label>
                    Subject
                    <select name="subject" defaultValue={edit.subject}>
                      {edit.subject && !config?.subjects.some((s) => s.name === edit.subject) && (
                        <option>{edit.subject}</option>
                      )}
                      {config?.subjects.map((s) => (
                        <option key={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Department
                    <select name="department" defaultValue={edit.department}>
                      {config?.departments.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Semester"
                    name="semester"
                    value={edit.semester ?? ''}
                    type="number"
                    min={1}
                    max={8}
                  />
                  <Field
                    label="Total copies"
                    name="totalCopies"
                    value={edit.totalCopies ?? 1}
                    type="number"
                    min={(edit.checkedOutCopies || 0) + (edit.reservedCopies || 0)}
                    required
                  />
                  <Field
                    label="Shelf location"
                    name="shelfLocation"
                    value={edit.shelfLocation}
                    required
                  />
                  <Field label="ISBN (verified only)" name="isbn" value={edit.isbn} />
                  <Field label="Edition" name="edition" value={edit.edition} />
                  <Field
                    label="Publication year"
                    name="publishedYear"
                    value={edit.publishedYear}
                    type="number"
                    min={1800}
                    max={2100}
                  />
                  <Field label="Publisher" name="publisher" value={edit.publisher} />
                  <Field label="Cover URL" name="coverImage" value={edit.coverImage} type="url" />
                  <label className="full">
                    Description
                    <textarea name="description" defaultValue={edit.description} rows={3} />
                  </label>
                  <Field
                    label="Topics (comma separated)"
                    name="topics"
                    value={edit.topics?.join(', ')}
                  />
                  <Field label="Tags (comma separated)" name="tags" value={edit.tags?.join(', ')} />
                </>
              ) : (
                <>
                  <Field label="Holiday name" name="name" required />
                  <Field label="Date" name="date" type="date" required />
                  <label>
                    Type
                    <select name="type">
                      <option>NATIONAL</option>
                      <option>STATE</option>
                      <option>COLLEGE</option>
                    </select>
                  </label>
                  <Field label="Notes / source" name="note" />
                </>
              )}
            </div>
            <button className="btn full-width" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Confirm deletion" onClose={() => !busy && setRemove(null)}>
          <p>
            Remove <strong>{remove.title || remove.name}</strong>? Books with transaction history
            are protected.
          </p>
          <div className="action-row">
            <button className="btn danger" disabled={busy} onClick={destroy}>
              {busy ? 'Removing…' : 'Delete'}
            </button>
            <button className="btn btn-outline" onClick={() => setRemove(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Field({ label, name, value, ...props }) {
  return (
    <label>
      {label}
      <input name={name} defaultValue={value ?? ''} {...props} />
    </label>
  );
}
