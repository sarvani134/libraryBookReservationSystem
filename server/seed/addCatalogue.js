import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { Book } from '../models/index.js';
import { books } from '../data/books.js';
import { syllabusBooks } from '../data/syllabusBooks.js';
import { connectDatabase } from '../config/db.js';

// Add missing catalogue entries without resetting existing copies or reservations.
export async function addCatalogue() {
  const result = await Book.bulkWrite(
    books.map((book) => ({
      updateOne: {
        filter: { title: book.title, author: book.author },
        update: { $setOnInsert: book },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  // Attach shared theory/lab mappings to existing copies without resetting inventory.
  await Book.bulkWrite(
    syllabusBooks.map((book) => ({
      updateOne: {
        filter: { title: book.title, author: book.author },
        update: { $addToSet: { tags: { $each: book.tags }, topics: { $each: book.topics } } },
        timestamps: false,
      },
    })),
  );
  console.log(
    `Added ${result.upsertedCount} missing titles from the ${books.length}-book catalogue.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
  try {
    await connectDatabase();
    await addCatalogue();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
