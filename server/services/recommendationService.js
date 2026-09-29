export function recommendationScore(book, other) {
  return (
    (book.subject === other.subject ? 5 : 0) +
    (book.semester === other.semester ? 2 : 0) +
    (book.department === other.department ? 1 : 0) +
    other.tags.filter((t) => book.tags.includes(t)).length +
    other.topics.filter((t) => book.topics.includes(t)).length * 2
  );
}
