import mongoose from 'mongoose';
import { Book, Checkout, Reservation, Interest } from '../models/index.js';
import { fail } from './errors.js';
import {
  calculateReservationExpiry,
  calculateStandardDueDate,
  calendarDate,
  startOfDay,
} from '../../shared/dateUtils.js';
export function studentDetails(input) {
  const result = {};
  for (const field of ['studentName', 'registrationNumber', 'department']) {
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > 150)
      fail(400, `${field} is required (maximum 150 characters).`);
    result[field] = input[field].trim();
  }
  result.registrationNumber = result.registrationNumber.toUpperCase();
  result.year = Number(input.year || 1);
  if (!Number.isInteger(result.year) || result.year < 1 || result.year > 4)
    fail(400, 'Year must be between 1 and 4.');
  result.email = String(input.email || '').trim();
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
    fail(400, 'Enter a valid email.');
  return result;
}
export function returnDate(input, checkoutDate) {
  if (!input) return null;
  let date;
  try {
    date = calendarDate(input);
  } catch {
    fail(400, 'Enter a valid return date.');
  }
  if (date < startOfDay(checkoutDate)) fail(400, 'Return date cannot be before checkout date.');
  return date;
}
export async function transact(fn) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
async function changeInventory(bookId, deltas, session, requireAvailable = false) {
  const book = await Book.findOneAndUpdate(
    { _id: bookId, ...(requireAvailable ? { availableCopies: { $gt: 0 } } : {}) },
    { $inc: deltas },
    { new: true, session },
  );
  if (!book)
    fail(409, 'This book is no longer available. Another student may have reserved the last copy.');
  if (
    book.availableCopies < 0 ||
    book.reservedCopies < 0 ||
    book.checkedOutCopies < 0 ||
    book.availableCopies + book.reservedCopies + book.checkedOutCopies !== book.totalCopies
  )
    fail(409, 'Inventory conflict. Please try again.');
  if (book.availableCopies > 0)
    await Interest.updateMany(
      { bookId, status: 'WAITING' },
      { $set: { status: 'AVAILABLE' } },
      { session },
    );
  return book;
}
export async function reserve(input, now = new Date()) {
  const student = studentDetails(input);
  return transact(async (session) => {
    await changeInventory(
      input.bookId,
      { availableCopies: -1, reservedCopies: 1, reservationCount: 1 },
      session,
      true,
    );
    const [record] = await Reservation.create(
      [
        {
          ...student,
          bookId: input.bookId,
          reservedAt: now,
          expiresAt: calculateReservationExpiry(now),
        },
      ],
      { session },
    );
    return record;
  });
}
export async function checkout(input, now = new Date()) {
  const student = studentDetails(input);
  const custom = returnDate(input.customReturnDate, now);
  return transact(async (session) => {
    await changeInventory(
      input.bookId,
      { availableCopies: -1, checkedOutCopies: 1, checkoutCount: 1 },
      session,
      true,
    );
    const standardDueDate = calculateStandardDueDate(now);
    const [record] = await Checkout.create(
      [
        {
          ...student,
          bookId: input.bookId,
          checkoutDate: now,
          standardDueDate,
          dueDate: custom || standardDueDate,
          customReturnDate: custom,
        },
      ],
      { session },
    );
    return record;
  });
}
export async function transitionReservation(id, status, now = new Date()) {
  return transact(async (session) => {
    const reservation = await Reservation.findOneAndUpdate(
      {
        _id: id,
        status: 'ACTIVE',
        ...(status === 'EXPIRED' ? { expiresAt: { $lte: now } } : { expiresAt: { $gt: now } }),
      },
      { $set: { status } },
      { new: true, session },
    );
    if (!reservation) fail(409, 'Reservation has already expired or is no longer active.');
    await changeInventory(
      reservation.bookId,
      status === 'COLLECTED'
        ? { reservedCopies: -1, checkedOutCopies: 1, checkoutCount: 1 }
        : { reservedCopies: -1, availableCopies: 1 },
      session,
    );
    if (status === 'COLLECTED') {
      const { studentName, registrationNumber, department, year, email, bookId } = reservation;
      const standardDueDate = calculateStandardDueDate(now);
      await Checkout.create(
        [
          {
            studentName,
            registrationNumber,
            department,
            year,
            email,
            bookId,
            checkoutDate: now,
            standardDueDate,
            dueDate: standardDueDate,
          },
        ],
        { session },
      );
    }
    return reservation;
  });
}
export async function expireReservations(now = new Date()) {
  const records = await Reservation.find({ status: 'ACTIVE', expiresAt: { $lte: now } }).select(
    '_id',
  );
  for (const record of records) {
    try {
      await transitionReservation(record._id, 'EXPIRED', now);
    } catch (error) {
      if (error.status !== 409) throw error;
    }
  }
  return records.length;
}
export async function returnBook(id, now = new Date()) {
  return transact(async (session) => {
    const record = await Checkout.findOneAndUpdate(
      { _id: id, status: { $in: ['CHECKED_OUT', 'OVERDUE'] } },
      { $set: { status: 'RETURNED', returnedAt: now } },
      { new: true, session },
    );
    if (!record) fail(409, 'This checkout has already been returned or does not exist.');
    await changeInventory(record.bookId, { checkedOutCopies: -1, availableCopies: 1 }, session);
    return record;
  });
}
