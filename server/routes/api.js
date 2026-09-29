import { Router } from 'express';
import { Book, Reservation, Checkout, Holiday, Interest } from '../models/index.js';
import * as books from '../controllers/bookController.js';
import { activity } from '../controllers/activityController.js';
import { wrap, fail } from '../services/errors.js';
import {
  reserve,
  checkout,
  transitionReservation,
  returnBook,
  returnDate,
  studentDetails,
} from '../services/inventoryService.js';
import { createHolidayService } from '../services/holidayService.js';
import {
  calendarDate,
  calculateStandardDueDate,
  calculateReservationExpiry,
  addDays,
  startOfDay,
} from '../../shared/dateUtils.js';
import * as rules from '../../shared/libraryRules.js';
import {
  subjects,
  semesters,
  departments,
  curriculumSource,
  curriculumNote,
} from '../data/curriculum.js';
const router = Router();
const manage = (req, res, next) =>
  process.env.MANAGEMENT_ENABLED === 'false'
    ? res.status(403).json({ message: 'Demo management is disabled.' })
    : next();
router.get('/health', (req, res) => res.json({ status: 'ok', database: 'MongoDB' }));
router.get(
  '/config',
  wrap(async (req, res) =>
    res.json({
      rules,
      subjects,
      semesters,
      departments,
      curriculumSource,
      curriculumNote,
      managementEnabled: process.env.MANAGEMENT_ENABLED !== 'false',
    }),
  ),
);
router.get(
  '/stats',
  wrap(async (req, res) => {
    const all = await Book.find().lean();
    res.json({
      titles: all.length,
      copies: all.reduce((n, b) => n + b.totalCopies, 0),
      available: all.reduce((n, b) => n + b.availableCopies, 0),
      subjects: [...new Set(all.map((b) => b.subject))].length,
      departments: [...new Set(all.map((b) => b.department))].length,
      subjectCounts: Object.fromEntries(
        subjects.map((s) => [s.name, all.filter((b) => b.subject === s.name).length]),
      ),
    });
  }),
);
router.get('/books', wrap(books.listBooks));
router.get('/books/search', wrap(books.listBooks));
router.get('/books/suggestions', wrap(books.suggestBooks));
router.get('/books/:id/cover', wrap(books.getBookCover));
router.get('/books/:id', wrap(books.getBook));
router.post('/books', manage, wrap(books.createBook));
router.put('/books/:id', manage, wrap(books.updateBook));
router.delete('/books/:id', manage, wrap(books.deleteBook));
router.post(
  '/reservations',
  wrap(async (req, res) => res.status(201).json(await reserve(req.body))),
);
router.get(
  '/reservations',
  manage,
  wrap(async (req, res) =>
    res.json(await Reservation.find().populate('bookId').sort({ createdAt: -1 })),
  ),
);
router.get(
  '/reservations/student/:registrationNumber',
  wrap(async (req, res) =>
    res.json(
      await Reservation.find({
        registrationNumber: req.params.registrationNumber.toUpperCase(),
      }).populate('bookId'),
    ),
  ),
);
router.patch(
  '/reservations/:id/cancel',
  wrap(async (req, res) => res.json(await transitionReservation(req.params.id, 'CANCELLED'))),
);
router.patch(
  '/reservations/:id/collect',
  wrap(async (req, res) => res.json(await transitionReservation(req.params.id, 'COLLECTED'))),
);
router.post(
  '/checkouts',
  wrap(async (req, res) => res.status(201).json(await checkout(req.body))),
);
router.get(
  '/checkouts',
  manage,
  wrap(async (req, res) =>
    res.json(await Checkout.find().populate('bookId').sort({ createdAt: -1 })),
  ),
);
router.get(
  '/checkouts/student/:registrationNumber',
  wrap(async (req, res) =>
    res.json(
      await Checkout.find({
        registrationNumber: req.params.registrationNumber.toUpperCase(),
      }).populate('bookId'),
    ),
  ),
);
router.patch(
  '/checkouts/:id/return',
  wrap(async (req, res) => res.json(await returnBook(req.params.id))),
);
router.patch(
  '/checkouts/:id/due-date',
  wrap(async (req, res) => {
    const record = await Checkout.findById(req.params.id);
    if (!record) fail(404, 'Checkout not found.');
    const date = returnDate(req.body.date, record.checkoutDate);
    if (!date || date < startOfDay(new Date())) fail(400, 'Choose today or a future return date.');
    const updated = await Checkout.findOneAndUpdate(
      { _id: record._id, status: { $ne: 'RETURNED' } },
      { $set: { dueDate: date, customReturnDate: date, status: 'CHECKED_OUT' } },
      { new: true, runValidators: true },
    );
    if (!updated) fail(409, 'This book has already been returned.');
    res.json(updated);
  }),
);
router.get(
  '/holidays',
  wrap(async (req, res) => res.json(await Holiday.find().sort({ date: 1 }))),
);
router.post(
  '/holidays',
  manage,
  wrap(async (req, res) => {
    let date;
    try {
      date = calendarDate(req.body.date);
    } catch {
      fail(400, 'Invalid holiday date.');
    }
    res.status(201).json(
      await Holiday.create({
        name: req.body.name,
        date,
        type: req.body.type,
        note: req.body.note,
      }),
    );
  }),
);
router.delete(
  '/holidays/:id',
  manage,
  wrap(async (req, res) => {
    if (!(await Holiday.findByIdAndDelete(req.params.id))) fail(404, 'Holiday not found.');
    res.json({ message: 'Holiday removed.' });
  }),
);
router.get(
  '/dates/preview',
  wrap(async (req, res) => {
    const now = new Date();
    const standard = calculateStandardDueDate(now);
    const date = req.query.date ? returnDate(req.query.date, now) : standard;
    const service = createHolidayService(await Holiday.find().lean());
    res.json({
      checkoutDate: now,
      standardDueDate: standard,
      expiresAt: calculateReservationExpiry(now),
      selectedDate: date,
      exceedsStandard: date > standard,
      dueDay: service.describe(date),
      reminderDay: service.describe(addDays(now, rules.REMINDER_DAY)),
    });
  }),
);
router.get('/activity/:registrationNumber', wrap(activity));
router.post(
  '/interests',
  wrap(async (req, res) => {
    const student = studentDetails({
      ...req.body,
      department: req.body.department || 'Unspecified',
    });
    if (!student.email) fail(400, 'Email is required.');
    const book = await Book.findById(req.body.bookId);
    if (!book) fail(404, 'Book not found.');
    const existing = await Interest.findOne({
      bookId: book._id,
      registrationNumber: student.registrationNumber,
    });
    if (existing) return res.json(existing);
    res.status(201).json(
      await Interest.create({
        ...student,
        bookId: book._id,
        status: book.availableCopies ? 'AVAILABLE' : 'WAITING',
      }),
    );
  }),
);
export default router;
