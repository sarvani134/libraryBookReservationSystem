import { googleCover, withPublishedCover } from '../services/bookCoverService.js';
import { Book, Checkout, Reservation, Interest } from '../models/index.js';
import { searchScore, searchSuggestions } from '../services/searchService.js';
import { recommendationScore } from '../services/recommendationService.js';
import { transact } from '../services/inventoryService.js';
import { fail } from '../services/errors.js';
const editable = [
  'title',
  'author',
  'isbn',
  'description',
  'subject',
  'department',
  'semester',
  'topics',
  'tags',
  'coverImage',
  'shelfLocation',
  'publisher',
  'edition',
  'publishedYear',
];
const fields = (body) =>
  Object.fromEntries(editable.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
export async function suggestBooks(req, res) {
  const query = String(req.query.q || '')
    .trim()
    .slice(0, 120);
  if (query.length < 2) return res.json({ suggestions: [] });
  const books = await Book.find().select('title author subject topics tags department isbn').lean();
  res.json({ suggestions: searchSuggestions(books, query) });
}
export async function listBooks(req, res) {
  const q = req.query;
  let books = await Book.find().lean();
  const facets = {
    authors: [...new Set(books.map((b) => b.author))].sort(),
    years: [...new Set(books.map((b) => b.publishedYear).filter(Boolean))].sort((a, b) => b - a),
  };
  books = books
    .map((b) => ({ ...b, relevance: searchScore(b, String(q.q || '')) }))
    .filter(
      (b) =>
        b.relevance > 0 &&
        (!q.department || b.department === q.department) &&
        (!q.subject || b.subject === q.subject || b.tags?.includes(q.subject)) &&
        (!q.semester || b.semester === Number(q.semester)) &&
        (!q.author || b.author === q.author) &&
        (!q.year || b.publishedYear === Number(q.year)) &&
        (!(q.available === 'true' || q.availability === 'available') || b.availableCopies > 0) &&
        (q.availability !== 'reserved' || b.reservedCopies > 0) &&
        (q.availability !== 'unavailable' || b.availableCopies === 0),
    );
  const sorts = {
    title: (a, b) => a.title.localeCompare(b.title),
    availability: (a, b) => b.availableCopies - a.availableCopies,
    newest: (a, b) =>
      (b.publishedYear || 0) - (a.publishedYear || 0) ||
      new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) =>
      b.checkoutCount * 3 +
      b.reservationCount * 2 +
      b.views -
      (a.checkoutCount * 3 + a.reservationCount * 2 + a.views),
    relevance: (a, b) => b.relevance - a.relevance,
  };
  books.sort(sorts[q.sort] || sorts.relevance);
  res.json({ books: books.map(withPublishedCover), total: books.length, facets });
}
export async function getBook(req, res) {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true },
  ).lean();
  if (!book) fail(404, 'Book not found.');
  const others = await Book.find({ _id: { $ne: book._id } }).lean();
  const recommendations = others
    .map((b) => ({ ...b, score: recommendationScore(book, b) }))
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  res.json({
    book: withPublishedCover(book),
    recommendations: recommendations.map(withPublishedCover),
  });
}
export async function createBook(req, res) {
  const total = Number(req.body.totalCopies);
  if (!Number.isInteger(total) || total < 0)
    fail(400, 'Total copies must be a nonnegative integer.');
  res
    .status(201)
    .json(await Book.create({ ...fields(req.body), totalCopies: total, availableCopies: total }));
}
export async function updateBook(req, res) {
  const book = await transact(async (session) => {
    const b = await Book.findById(req.params.id).session(session);
    if (!b) fail(404, 'Book not found.');
    Object.assign(b, fields(req.body));
    if (req.body.totalCopies !== undefined) {
      const total = Number(req.body.totalCopies);
      if (!Number.isInteger(total) || total < b.checkedOutCopies + b.reservedCopies)
        fail(400, 'Total copies cannot be below the number borrowed or reserved.');
      b.totalCopies = total;
      b.availableCopies = total - b.checkedOutCopies - b.reservedCopies;
    }
    await b.save({ session });
    if (b.availableCopies > 0)
      await Interest.updateMany(
        { bookId: b._id, status: 'WAITING' },
        { $set: { status: 'AVAILABLE' } },
        { session },
      );
    return b;
  });
  res.json(book);
}
export async function deleteBook(req, res) {
  await transact(async (session) => {
    const book = await Book.findById(req.params.id).session(session);
    if (!book) fail(404, 'Book not found.');
    if (book.checkedOutCopies || book.reservedCopies)
      fail(409, 'Return or cancel active transactions before deleting this book.');
    if (
      (await Checkout.exists({ bookId: book._id }).session(session)) ||
      (await Reservation.exists({ bookId: book._id }).session(session)) ||
      (await Interest.exists({ bookId: book._id }).session(session))
    )
      fail(
        409,
        'This book has transaction history. Set total copies to zero to preserve those records.',
      );
    await book.deleteOne({ session });
  });
  res.json({ message: 'Book deleted.' });
}

export async function getBookCover(req, res) {
  const book = await Book.findById(req.params.id).lean();
  if (!book) fail(404, 'Book not found.');
  const cover = book.coverImage
    ? { image: book.coverImage, source: null }
    : await googleCover(book);
  res.json({ cover });
}
