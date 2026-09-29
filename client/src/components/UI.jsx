import { api } from '../services/api';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, SearchX, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Empty({
  title = 'Nothing here just yet',
  message = 'Discover a book for your next chapter.',
  action = true,
}) {
  return (
    <div className="empty">
      <SearchX size={36} />
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <Link className="btn" to="/books">
          Explore the collection <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="empty error" role="alert">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      <button className="btn" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function Skeleton({ count = 4 }) {
  return (
    <div className="book-grid" aria-label="Loading books" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    // React autofocus happens before showModal; explicitly focus the form after opening.
    const firstField = dialog.querySelector('input:not([disabled]), select:not([disabled])');
    (firstField || dialog.querySelector('button'))?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          <span className="eyebrow">CAMPUS LIBRARY</span>
          <h2 id="modal-title">{title}</h2>
        </div>
        <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Cover({ book, large = false }) {
  const container = useRef();
  const [remote, setRemote] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setRemote(null);
    setFailed(false);
    if (book.coverImage || !book._id) return;
    const controller = new AbortController();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        api
          .get(`/books/${book._id}/cover`, { signal: controller.signal })
          .then(({ data }) => {
            if (!controller.signal.aborted) setRemote(data.cover);
          })
          .catch(() => {});
      },
      { rootMargin: '100px' },
    );
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [book._id, book.coverImage]);
  const image = !failed && (book.coverImage || remote?.image);
  const index = [...book.title].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 6;
  return (
    <div
      ref={container}
      title={book.coverSource || remote?.source ? 'Published book cover' : undefined}
      className={`cover cover-${index} ${large ? 'large' : ''} ${!image ? 'cover-placeholder' : ''}`}
      role="img"
      aria-label={`${book.title} ${image ? 'book cover' : 'cover unavailable'}`}
    >
      {image ? (
        <img
          src={image}
          loading="lazy"
          alt={book.title}
          onError={(e) => {
            setFailed(true);
          }}
        />
      ) : null}
      <div className="cover-text">
        <span className="cover-edition">Cover unavailable</span>
        <strong>{book.title}</strong>
        <span className="cover-author">{book.author}</span>
        <BookOpen size={16} />
      </div>
    </div>
  );
}
