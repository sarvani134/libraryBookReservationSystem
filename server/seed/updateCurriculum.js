import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { Book } from '../models/index.js';
import { books } from '../data/books.js';
import { connectDatabase } from '../config/db.js';

// Update only study metadata of known seed titles; preserve IDs and all inventory/history.
export async function updateCurriculum() {
  const result = await Book.bulkWrite(
    books.map(({ title, author, subject, semester }) => ({
      updateOne: {
        filter: {
          title,
          author,
          $or: [{ subject: { $ne: subject } }, { semester: { $ne: semester } }],
        },
        update: { $set: { subject, semester } },
      },
    })),
  );
  console.log(`Updated curriculum mappings for ${result.modifiedCount} books.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
  try {
    await connectDatabase();
    await updateCurriculum();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
