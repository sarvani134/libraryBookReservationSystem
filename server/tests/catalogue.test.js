import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { books } from '../data/books.js';

test('20 additional titles have complete metadata, distinct ISBNs and local JPEG covers', () => {
  const additions = JSON.parse(
    readFileSync(new URL('../data/additionalBooks.json', import.meta.url)),
  );
  assert.equal(additions.length, 20);
  assert.equal(new Set(additions.map((book) => book.isbn)).size, 20);
  assert.equal(new Set(books.map((book) => book.title.toLowerCase())).size, books.length);
  for (const entry of additions) {
    const book = books.find((book) => book.isbn === entry.isbn);
    for (const key of [
      'title',
      'author',
      'publisher',
      'edition',
      'description',
      'subject',
      'department',
      'shelfLocation',
    ])
      assert.ok(book[key], `${entry.isbn}: ${key}`);
    assert.match(book.isbn, /^\d{13}$/);
    assert.ok(Number.isInteger(book.publishedYear));
    assert.ok(book.topics.length > 0);
    const cover = new URL(`../../client/public${book.coverImage}`, import.meta.url);
    assert.ok(statSync(cover).size > 2000);
    assert.equal(readFileSync(cover).subarray(0, 2).toString('hex'), 'ffd8');
  }
  assert.ok(books.every((book) => book.totalCopies === 50 && book.availableCopies === 50));
});
