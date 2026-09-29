import { Link } from 'react-router-dom';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Cover } from './UI';
export default function BookCard({ book, onAction }) {
  const { bookmarks, toggleBookmark, activity } = useLibrary();
  const reserved = activity.data?.reservations.some(
    (r) => r.status === 'ACTIVE' && r.bookId?._id === book._id,
  );
  return (
    <article className="book-card">
      <div className="book-image">
        <Link to={`/books/${book._id}`} tabIndex={-1} aria-hidden="true">
          <Cover book={book} />
        </Link>
        <button
          className={`save-book ${bookmarks.includes(book._id) ? 'saved' : ''}`}
          onClick={() => toggleBookmark(book._id)}
          aria-label={`${bookmarks.includes(book._id) ? 'Remove' : 'Save'} ${book.title}`}
        >
          <Bookmark size={17} fill={bookmarks.includes(book._id) ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="book-content">
        <span className="book-subject">{book.subject}</span>
        <Link to={`/books/${book._id}`} className="book-title">
          {book.title}
        </Link>
        <p className="book-author">{book.author}</p>
        <p className="book-meta">
          {book.department} <span>·</span>{' '}
          {book.semester ? `Semester ${book.semester}` : 'Semester not assigned'}
        </p>
        <div className="book-status">
          <span
            className={`availability ${book.availableCopies === 0 ? 'unavailable' : book.availableCopies === 1 ? 'low' : ''}`}
          >
            <i />
            {book.availableCopies === 0
              ? 'Currently unavailable'
              : book.availableCopies === 1
                ? 'Only 1 left'
                : `${book.availableCopies} available`}
          </span>
          <span>of {book.totalCopies}</span>
        </div>
        <p className="book-meta">
          {book.reservedCopies} reserved · {book.checkedOutCopies} borrowed
        </p>
        <div className="book-actions">
          <button
            className="btn btn-small btn-soft"
            disabled={reserved}
            onClick={() => onAction(book, book.availableCopies ? 'reserve' : 'interest')}
          >
            {reserved ? 'Reserved' : book.availableCopies ? 'Reserve' : 'Notify me'}
          </button>
          <button
            className="text-btn"
            disabled={!book.availableCopies}
            onClick={() => onAction(book, 'checkout')}
          >
            Checkout <ArrowUpRight size={14} />
          </button>
        </div>
        <Link className="details-link" to={`/books/${book._id}`}>
          View details →
        </Link>
      </div>
    </article>
  );
}
