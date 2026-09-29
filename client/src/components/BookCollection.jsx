import { useState } from 'react';
import BookCard from './BookCard';
import TransactionModal from './TransactionModal';
import { Empty } from './UI';
export default function BookCollection({ books, reload }) {
  const [action, setAction] = useState(null);
  const [changed, setChanged] = useState(false);
  return (
    <>
      {books.length ? (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onAction={(book, type) => setAction({ book, type })}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No books found"
          message="Try another subject, author, or a broader search. Clear filters to explore the full collection."
        />
      )}
      {action && (
        <TransactionModal
          {...action}
          onClose={() => {
            setAction(null);
            if (changed) {
              reload?.();
              setChanged(false);
            }
          }}
          onSuccess={() => setChanged(true)}
        />
      )}
    </>
  );
}
