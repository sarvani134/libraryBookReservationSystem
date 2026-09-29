import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { app } from '../app.js';
import { Book, Reservation, Checkout, Holiday, Interest } from '../models/index.js';
import {
  reserve,
  checkout,
  expireReservations,
  returnBook,
  transitionReservation,
} from '../services/inventoryService.js';
import {
  calendarDate,
  dateKey,
  addDays,
  calculateStandardDueDate,
} from '../../shared/dateUtils.js';
import { books } from '../data/books.js';
import { seedDatabase } from '../seed/seedDatabase.js';
import { updateCurriculum } from '../seed/updateCurriculum.js';
import { addCatalogue } from '../seed/addCatalogue.js';
let mongo, book;
const student = { studentName: 'Sara', registrationNumber: '23CSE001', department: 'CSE', year: 3 };
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([
    Book.init(),
    Reservation.init(),
    Checkout.init(),
    Holiday.init(),
    Interest.init(),
  ]);
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  await Promise.all([
    Book.deleteMany({}),
    Reservation.deleteMany({}),
    Checkout.deleteMany({}),
    Holiday.deleteMany({}),
    Interest.deleteMany({}),
  ]);
  book = await Book.create({
    ...books.find((b) => b.title === 'Operating System Concepts'),
    totalCopies: 1,
    availableCopies: 1,
  });
});
const input = () => ({ ...student, bookId: book._id });
test('adding the catalogue twice preserves existing reservations and stock', async () => {
  await reserve(input());
  await addCatalogue();
  await addCatalogue();
  assert.equal(await Book.countDocuments(), books.length);
  await counts(0, 0, 1);
  assert.equal(await Reservation.countDocuments({ bookId: book._id }), 1);
});

test('syllabus catalogue supports all eight subjects and shared lab books', async () => {
  await addCatalogue();
  const { syllabusBooks } = await import('../data/syllabusBooks.js');
  for (const subject of new Set(
    syllabusBooks.flatMap((b) =>
      b.tags.filter(
        (tag) =>
          syllabusBooks.some((entry) => entry.subject === tag) || tag === 'Computer Networks Lab',
      ),
    ),
  )) {
    const { body } = await request(app)
      .get('/api/books')
      .query({ subject, semester: 5 })
      .expect(200);
    assert.ok(body.books.length >= 2, subject);
  }
  const { body } = await request(app)
    .get('/api/books')
    .query({ subject: 'Computer Networks Lab' })
    .expect(200);
  assert.deepEqual(body.books.map((b) => b.title).sort(), [
    'Computer Networks',
    'Data Communications and Networking',
  ]);
});
test('curriculum updates preserve inventory and history and can be repeated', async () => {
  await reserve(input());
  await Book.updateOne({ _id: book._id }, { $set: { semester: 4 } });
  await updateCurriculum();
  await updateCurriculum();
  const updated = await Book.findById(book._id);
  assert.equal(updated.semester, 3);
  await counts(0, 0, 1);
  assert.equal(await Reservation.countDocuments({ bookId: book._id }), 1);
});

test('curriculum config preserves courses and leaves electives unassigned', async () => {
  const { body } = await request(app).get('/api/config').expect(200);
  assert.equal(body.subjects.length, 75);
  assert.equal(body.subjects.find((s) => s.code === '24CS11RC01').semester, 5);
  assert.equal(body.subjects.find((s) => s.code === '24CT11RC20').semester, 4);
  assert.equal(body.subjects.find((s) => s.code === '24CI11RC03').semester, 6);
  assert.equal(body.subjects.find((s) => s.code === '24CS11PE01').semester, null);
  assert.deepEqual(body.semesters[7].subjects, []);
});
async function counts(a, c, r) {
  const b = await Book.findById(book._id);
  assert.deepEqual([b.availableCopies, b.checkedOutCopies, b.reservedCopies], [a, c, r]);
  assert.equal(b.availableCopies + b.checkedOutCopies + b.reservedCopies, b.totalCopies);
}
test('reserve decreases inventory, rejects unavailable book', async () => {
  await reserve(input());
  await counts(0, 0, 1);
  await assert.rejects(() => reserve(input()), { status: 409 });
  await counts(0, 0, 1);
});
test('concurrent reservations cannot acquire the same last copy', async () => {
  const outcomes = await Promise.allSettled(Array.from({ length: 6 }, () => reserve(input())));
  assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(await Reservation.countDocuments(), 1);
  await counts(0, 0, 1);
});
test('expiry preserves valid dates, releases once at day-four midnight', async () => {
  const r = await reserve(input(), new Date('2026-09-20T16:00:00+05:30'));
  await expireReservations(new Date('2026-09-22T23:59:59+05:30'));
  await counts(0, 0, 1);
  await expireReservations(calendarDate('2026-09-23'));
  await expireReservations(calendarDate('2026-09-24'));
  await counts(1, 0, 0);
  assert.equal((await Reservation.findById(r._id)).status, 'EXPIRED');
});
test('cancel releases once and refuses repeated cancellation', async () => {
  const r = await reserve(input());
  await transitionReservation(r._id, 'CANCELLED');
  await counts(1, 0, 0);
  await assert.rejects(() => transitionReservation(r._id, 'CANCELLED'), { status: 409 });
});
test('collect moves a reserved copy to checkout without increasing availability', async () => {
  const r = await reserve(input());
  await transitionReservation(r._id, 'COLLECTED');
  await counts(0, 1, 0);
  const c = await Checkout.findOne();
  assert.equal(dateKey(c.dueDate), dateKey(calculateStandardDueDate(c.checkoutDate)));
  await assert.rejects(() => transitionReservation(r._id, 'COLLECTED'), { status: 409 });
  assert.equal(await Checkout.countDocuments(), 1);
});
test('checkout and return preserve inventory, duplicate return rejected', async () => {
  const c = await checkout(input());
  await counts(0, 1, 0);
  await returnBook(c._id);
  await counts(1, 0, 0);
  await assert.rejects(() => returnBook(c._id), { status: 409 });
  assert.ok((await Checkout.findById(c._id)).returnedAt);
});
test('concurrent checkout and reservation share inventory protection', async () => {
  const outcomes = await Promise.allSettled([checkout(input()), reserve(input())]);
  assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
  const b = await Book.findById(book._id);
  assert.equal(b.availableCopies, 0);
  assert.equal(b.checkedOutCopies + b.reservedCopies, 1);
});
test('failed transaction validation rolls back the book update', async () => {
  await assert.rejects(() => checkout({ ...input(), email: 'invalid' }));
  await counts(1, 0, 0);
  assert.equal(await Checkout.countDocuments(), 0);
});
test('custom dates reject past and malformed dates and accept later dates', async () => {
  const now = calendarDate('2026-09-01');
  await assert.rejects(() => checkout({ ...input(), customReturnDate: '2026-08-31' }, now), {
    status: 400,
  });
  await assert.rejects(() => checkout({ ...input(), customReturnDate: '2026-02-30' }, now), {
    status: 400,
  });
  const c = await checkout({ ...input(), customReturnDate: '2026-09-20' }, now);
  assert.equal(dateKey(c.dueDate), '2026-09-20');
  assert.equal(dateKey(c.standardDueDate), '2026-09-16');
});
test('API search and combined subject/semester/availability filters load MongoDB data', async () => {
  await Book.insertMany(books.filter((b) => b.title !== book.title));
  const response = await request(app)
    .get('/api/books?q=deadlocks&subject=Operating%20Systems&semester=3&available=true')
    .expect(200);
  assert.equal(response.body.total, 3);
  assert.ok(response.body.books.every((b) => b.subject === 'Operating Systems'));
  assert.equal((await request(app).get('/api/books?semester=8&department=CSE')).body.total, 0);
});
test('API fetch expires stale reservations before returning books', async () => {
  await reserve(input(), addDays(new Date(), -4));
  const response = await request(app).get(`/api/books/${book._id}`).expect(200);
  assert.equal(response.body.book.availableCopies, 1);
  await counts(1, 0, 0);
});
test('day-14 reminder and holiday warning appear in activity lookup', async () => {
  const now = new Date();
  const c = await checkout(input(), addDays(now, -14));
  await Holiday.create({ name: 'Demo reminder holiday', date: addDays(now, 0), type: 'COLLEGE' });
  const response = await request(app).get('/api/activity/23cse001').expect(200);
  const record = response.body.checkouts[0];
  assert.equal(record.isReminderDay, true);
  assert.equal(record.daysRemaining, 1);
  assert.equal(record.reminderDay.working, false);
  assert.ok(response.body.notifications.some((n) => n.title === 'Book due tomorrow'));
  assert.ok(response.body.notifications.some((n) => n.title === 'Library Holiday Notice'));
});
test('overdue begins after due calendar day and returned books stop notifying', async () => {
  const c = await checkout(input(), addDays(new Date(), -18));
  let response = await request(app).get('/api/activity/23CSE001');
  assert.equal(response.body.checkouts[0].status, 'OVERDUE');
  assert.equal(response.body.checkouts[0].daysRemaining, -3);
  await returnBook(c._id);
  response = await request(app).get('/api/activity/23CSE001');
  assert.equal(response.body.notifications.length, 0);
});
test('date preview warns on a holiday and suggests next working day', async () => {
  const standard = calculateStandardDueDate(new Date());
  await Holiday.create({ name: 'Library closed', date: standard, type: 'COLLEGE' });
  const response = await request(app).get('/api/dates/preview').expect(200);
  assert.equal(response.body.dueDay.working, false);
  assert.ok(response.body.dueDay.nextWorkingDay);
});
test('due-date update cannot reopen returned checkout', async () => {
  const c = await checkout(input());
  await request(app)
    .patch(`/api/checkouts/${c._id}/due-date`)
    .send({ date: dateKey(addDays(new Date(), 20)) })
    .expect(200);
  await returnBook(c._id);
  await request(app)
    .patch(`/api/checkouts/${c._id}/due-date`)
    .send({ date: dateKey(addDays(new Date(), 21)) })
    .expect(409);
  await counts(1, 0, 0);
});
test('management refuses copy reduction below borrowed copies and preserves history', async () => {
  const c = await checkout(input());
  await request(app).put(`/api/books/${book._id}`).send({ totalCopies: 0 }).expect(400);
  await request(app).delete(`/api/books/${book._id}`).expect(409);
  await returnBook(c._id);
  await request(app).delete(`/api/books/${book._id}`).expect(409);
  await request(app).put(`/api/books/${book._id}`).send({ totalCopies: 0 }).expect(200);
});
test('availability interest produces in-app alert when a book is returned', async () => {
  const c = await checkout(input());
  await request(app)
    .post('/api/interests')
    .send({ ...input(), email: 'sara@example.com' })
    .expect(201);
  await returnBook(c._id);
  const response = await request(app).get('/api/activity/23CSE001');
  assert.ok(response.body.notifications.some((n) => n.title === 'A book is available'));
});
test('API validates IDs, required student fields, holidays and unknown routes', async () => {
  await request(app).get('/api/books/invalid').expect(400);
  await request(app).post('/api/reservations').send({ bookId: book._id }).expect(400);
  await request(app)
    .post('/api/holidays')
    .send({ name: 'Invalid', date: '2026-02-30', type: 'STATE' })
    .expect(400);
  await request(app).get('/api/no-such-route').expect(404);
  await counts(1, 0, 0);
});
test('seed produces 60–100 books and requested OS demo inventory without duplicating data', async () => {
  await Book.deleteMany({});
  await seedDatabase();
  const os = await Book.findOne({ title: 'Operating System Concepts' });
  assert.deepEqual(
    [os.totalCopies, os.availableCopies, os.checkedOutCopies, os.reservedCopies],
    [5, 2, 3, 0],
  );
  const count = await Book.countDocuments();
  assert.ok(count >= 60 && count <= 100);
  await seedDatabase();
  assert.equal(await Book.countDocuments(), count);
});
