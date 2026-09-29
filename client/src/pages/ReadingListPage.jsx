import { useResource } from '../hooks/useResource';
import { useLibrary } from '../context/LibraryContext';
import BookCollection from '../components/BookCollection';
import { Skeleton, ErrorState, Empty } from '../components/UI';
export default function ReadingListPage() {
  const { bookmarks } = useLibrary();
  const r = useResource('/books');
  const books = r.data?.books.filter((b) => bookmarks.includes(b._id)) || [];
  return (
    <div className="page">
      <div className="page-heading">
        <span className="eyebrow">A SHELF OF YOUR OWN</span>
        <h1>Saved for a curious day.</h1>
        <p>Your reading list stays in this browser. No account needed.</p>
      </div>
      {r.loading ? (
        <Skeleton />
      ) : r.error ? (
        <ErrorState message={r.error} retry={r.reload} />
      ) : books.length ? (
        <BookCollection books={books} reload={r.reload} />
      ) : (
        <Empty
          title="Make room for your next read"
          message="Tap the bookmark on any book to save it to your reading list."
        />
      )}
    </div>
  );
}
