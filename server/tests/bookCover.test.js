import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGoogleCover, withPublishedCover } from '../services/bookCoverService.js';
test('saved published covers apply to existing catalogue books without changing inventory', () => {
  const book = {
    title: 'Head First Java',
    author: 'Kathy Sierra, Bert Bates & Trisha Gee',
    availableCopies: 3,
    coverImage: '',
  };
  const result = withPublishedCover(book);
  assert.match(result.coverImage, /^\/covers\/\d+\.jpg$/);
  assert.equal(result.availableCopies, 3);
  assert.equal(
    withPublishedCover({ ...book, coverImage: 'https://example.com/custom.jpg' }).coverImage,
    'https://example.com/custom.jpg',
  );
});
const book = { title: 'Head First Java', author: 'Kathy Sierra & Bert Bates' };
test('Google covers match title and author and select the largest provided image', async () => {
  const fetcher = async () => ({
    ok: true,
    json: async () => ({
      items: [
        {
          id: 'wrong',
          volumeInfo: {
            title: 'Other Book',
            authors: ['Kathy Sierra'],
            imageLinks: { large: 'https://example.com/wrong' },
          },
        },
        {
          id: 'matched',
          volumeInfo: {
            title: 'Head First Java',
            authors: ['Kathy Sierra'],
            imageLinks: {
              thumbnail: 'http://example.com/small',
              large: 'http://example.com/large',
            },
          },
        },
      ],
    }),
  });
  assert.deepEqual(await findGoogleCover(book, fetcher), {
    image: 'https://example.com/large',
    source: 'https://books.google.com/books?id=matched',
  });
  assert.equal(await findGoogleCover(book, async () => ({ ok: false })), null);
});
