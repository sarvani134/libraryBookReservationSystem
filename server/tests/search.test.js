import { test } from 'node:test';
import assert from 'node:assert/strict';
import { books } from '../data/books.js';
import { searchScore, searchSuggestions, textScore } from '../services/searchService.js';
test('search tolerates missing and swapped letters without matching unrelated words', () => {
  const os = books.find((b) => b.title === 'Operating System Concepts');
  assert.ok(searchScore(os, 'oprating systms') > 0);
  assert.ok(textScore('Python Programming', 'pyhton') > 0);
  assert.equal(searchScore(os, 'zzzzzzzz'), 0);
  assert.ok(
    textScore('Operating Systems', 'operating') > textScore('Operating Systems', 'oprating'),
  );
});
test('suggestions use catalogue entries, support synonyms and limit results', () => {
  assert.ok(searchSuggestions(books, 'pyhton').some((s) => s.text.includes('Python')));
  assert.ok(searchSuggestions(books, 'DBMS').some((s) => s.text === 'Database Management Systems'));
  assert.ok(searchSuggestions(books, 'co').length <= 8);
  assert.deepEqual(searchSuggestions(books, ''), []);
});
