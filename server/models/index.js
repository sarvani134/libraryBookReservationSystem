import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const text = { type: String, trim: true, maxlength: 300 };
const requiredText = { ...text, required: true };
const count = { type: Number, min: 0, default: 0, validate: Number.isInteger };
const student = {
  studentName: requiredText,
  registrationNumber: { ...requiredText, uppercase: true, index: true },
  department: requiredText,
  year: { type: Number, min: 1, max: 4, default: 1 },
  email: { ...text, default: '' },
};
const book = new Schema(
  {
    title: requiredText,
    author: requiredText,
    isbn: text,
    description: { type: String, maxlength: 5000 },
    subject: requiredText,
    department: requiredText,
    semester: { type: Number, min: 1, max: 8, default: null },
    topics: [String],
    tags: [String],
    coverImage: String,
    totalCopies: { ...count, required: true },
    availableCopies: count,
    checkedOutCopies: count,
    reservedCopies: count,
    shelfLocation: requiredText,
    publisher: text,
    edition: text,
    publishedYear: { type: Number, min: 1800, max: 2100 },
    views: count,
    reservationCount: count,
    checkoutCount: count,
  },
  { timestamps: true },
);
book.index({
  title: 'text',
  author: 'text',
  subject: 'text',
  topics: 'text',
  tags: 'text',
  isbn: 'text',
  department: 'text',
});
export const Book = model('Book', book);
export const Checkout = model(
  'Checkout',
  new Schema(
    {
      ...student,
      bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
      checkoutDate: { type: Date, required: true },
      dueDate: { type: Date, required: true },
      standardDueDate: { type: Date, required: true },
      customReturnDate: Date,
      status: {
        type: String,
        enum: ['CHECKED_OUT', 'RETURNED', 'OVERDUE'],
        default: 'CHECKED_OUT',
      },
      returnedAt: Date,
    },
    { timestamps: true },
  ),
);
const reservation = new Schema(
  {
    ...student,
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    reservedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'COLLECTED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true },
);
reservation.index({ status: 1, expiresAt: 1 });
export const Reservation = model('Reservation', reservation);
export const Holiday = model(
  'Holiday',
  new Schema(
    {
      name: requiredText,
      date: { type: Date, required: true, index: true },
      type: { type: String, enum: ['NATIONAL', 'STATE', 'COLLEGE'], required: true },
      note: text,
    },
    { timestamps: true },
  ),
);
export const Interest = model(
  'Interest',
  new Schema(
    {
      ...student,
      bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
      status: { type: String, enum: ['WAITING', 'AVAILABLE'], default: 'WAITING' },
    },
    { timestamps: true },
  ),
);
