import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { Book, Holiday } from '../models/index.js';
import { books } from '../data/books.js';
import { holidaySeeds } from '../data/holidays.js';
import { connectDatabase } from '../config/db.js';
import { addDays } from '../../shared/dateUtils.js';
import { checkout } from '../services/inventoryService.js';
export async function seedDatabase() {
  if (await Book.countDocuments())
    return console.log('Database already contains books; seed left existing data unchanged.');
  const inserted = await Book.insertMany(books);
  await Holiday.insertMany(holidaySeeds());
  const os = inserted.find((b) => b.title === 'Operating System Concepts');
  for (let i = 1; i <= 3; i++)
    await checkout({
      bookId: os._id,
      studentName: `Demo borrower ${i}`,
      registrationNumber: `DEMO00${i}`,
      department: 'CSE',
      year: 2,
    });
  const saraBook = inserted.find((b) => b.title === 'Computer Networks');
  const yesterday = addDays(new Date(), -14);
  await checkout(
    {
      bookId: saraBook._id,
      studentName: 'Sara',
      registrationNumber: '23CSE001',
      department: 'CSE',
      year: 3,
    },
    yesterday,
  );
  const unavailable = inserted.find((b) => b.title === 'The Algorithm Design Manual');
  for (let i = 0; i < unavailable.totalCopies; i++)
    await checkout({
      bookId: unavailable._id,
      studentName: `Demo reader ${i}`,
      registrationNumber: `DEMO10${i}`,
      department: 'CSE',
      year: 2,
    });
  console.log(
    `Seeded ${inserted.length} books. Sara: 23CSE001. Operating System Concepts: 2 of 5 available.`,
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
  try {
    await connectDatabase();
    await seedDatabase();
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
