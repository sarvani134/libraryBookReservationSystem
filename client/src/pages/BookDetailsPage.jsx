import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, MapPin, ArrowLeft } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { useLibrary } from '../context/LibraryContext';
import { Cover, Skeleton, ErrorState } from '../components/UI';
import BookCollection from '../components/BookCollection';
import TransactionModal from '../components/TransactionModal';
export default function BookDetailsPage() {
  const { bookId } = useParams();
  const r = useResource(`/books/${bookId}`);
  const { bookmarks, toggleBookmark, activity } = useLibrary();
  const [type, setType] = useState(null);
  if (r.loading)
    return (
      <div className="page">
        <Skeleton />
      </div>
    );
  if (r.error) return <ErrorState message={r.error} retry={r.reload} />;
  const b = r.data.book;
  const reserved = activity.data?.reservations.some(
    (record) => record.status === 'ACTIVE' && record.bookId?._id === b._id,
  );
  return (
    <div className="page">
      <Link to="/books" className="text-link">
        <ArrowLeft size={16} /> Back to the collection
      </Link>
      <section className="book-detail">
        <div className="detail-cover">
          <Cover book={b} large />
          <p>
            <MapPin size={16} /> Find it on shelf <strong>{b.shelfLocation}</strong>
          </p>
        </div>
        <div>
          <span className="eyebrow">{b.subject}</span>
          <h1>{b.title}</h1>
          <p className="detail-author">by {b.author}</p>
          <div className="chips">
            <span>{b.department}</span>
            <span>{b.semester ? `Semester ${b.semester}` : 'Semester not assigned'}</span>
          </div>
          <p className="description">{b.description}</p>
          <div className="inventory-box">
            <strong className={b.availableCopies ? 'green' : 'error'}>
              {b.availableCopies
                ? `${b.availableCopies} copies available`
                : 'Currently unavailable'}
            </strong>
            <span>
              {b.totalCopies} total · {b.checkedOutCopies} checked out · {b.reservedCopies} reserved
            </span>
          </div>
          <div className="detail-actions">
            <button
              className="btn"
              disabled={reserved}
              onClick={() => setType(b.availableCopies ? 'reserve' : 'interest')}
            >
              {reserved ? 'Reserved' : b.availableCopies ? 'Reserve book' : 'Notify when available'}
            </button>
            <button
              className="btn btn-outline"
              disabled={!b.availableCopies}
              onClick={() => setType('checkout')}
            >
              Checkout
            </button>
            <button
              className="icon-btn"
              aria-label="Toggle reading list"
              onClick={() => toggleBookmark(b._id)}
            >
              <Bookmark fill={bookmarks.includes(b._id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          <dl className="book-facts">
            {[
              ['ISBN', b.isbn || 'Not catalogued'],
              ['Edition', b.edition || 'Not catalogued'],
              ['Published', b.publishedYear || 'Not catalogued'],
              ['Publisher', b.publisher || 'Not catalogued'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h3>What’s inside</h3>
          <div className="chips">
            {b.topics.map((t) => (
              <Link key={t} to={`/books?q=${encodeURIComponent(t)}`}>
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">KEEP EXPLORING</span>
            <h2>You may also like</h2>
            <p>Related subjects, topics, and semester companions.</p>
          </div>
        </div>
        <BookCollection books={r.data.recommendations} reload={r.reload} />
      </section>
      {type && (
        <TransactionModal
          book={b}
          type={type}
          onClose={() => {
            setType(null);
            r.reload();
          }}
        />
      )}
    </div>
  );
}
