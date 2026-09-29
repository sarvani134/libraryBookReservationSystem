const synonyms = [
  ['computer networks', 'networking', 'tcp', 'tcp/ip', 'routing', 'network security'],
  ['dbms', 'database', 'sql'],
  ['dsa', 'data structures', 'algorithms'],
  ['oop', 'object oriented programming'],
  ['c programming', 'programming in c'],
  ['math', 'mathematics', 'calculus'],
  ['ai', 'artificial intelligence'],
  ['ml', 'machine learning'],
];
const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Damerau-Levenshtein also accepts adjacent swapped letters (e.g. pyhton).
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
export function textScore(text, query) {
  const value = normalize(text);
  const q = normalize(query).slice(0, 120);
  if (!q || !value) return 0;
  if (value === q) return 100;
  if (value.startsWith(q)) return 80;
  if (value.includes(q)) return 60;
  const words = value.split(' ');
  return q.split(' ').every((token) =>
    words.some((word) => {
      if (word.startsWith(token)) return true;
      if (token.length < 4) return false;
      const limit = token.length >= 8 ? 2 : 1;
      return Math.abs(word.length - token.length) <= limit && distance(word, token) <= limit;
    }),
  )
    ? 20
    : 0;
}
export function searchScore(book, query) {
  if (!query.trim()) return 1;
  const fields = [
    book.title,
    book.author,
    book.subject,
    ...(book.topics || []),
    ...(book.tags || []),
    book.isbn,
    book.department,
  ].filter(Boolean);
  const q = query.trim().toLowerCase().slice(0, 120);
  const terms = [q, ...synonyms.filter((group) => group.includes(q)).flat()];
  return Math.max(
    ...terms.flatMap((term) =>
      fields.map((field, i) => textScore(field, term) * (i === 0 ? 2 : 1)),
    ),
    textScore(fields.join(' '), q),
  );
}
export function searchSuggestions(books, query) {
  if (normalize(query).length < 2) return [];
  const candidates = new Map();
  for (const book of books) {
    for (const [type, values] of [
      ['Title', [book.title]],
      ['Subject', [book.subject]],
      ['Author', [book.author]],
      ['Topic', book.topics || []],
    ]) {
      for (const text of values) {
        const score = textScore(text, query);
        if (score && !candidates.has(normalize(text)))
          candidates.set(normalize(text), { text, type, score });
      }
    }
  }
  // Synonyms link searches such as DBMS to actual catalogue subjects.
  for (const book of books.filter((book) => searchScore(book, query) > 0)) {
    if (!candidates.has(normalize(book.subject)))
      candidates.set(normalize(book.subject), {
        text: book.subject,
        type: 'Related subject',
        score: 10,
      });
  }
  return [...candidates.values()]
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text))
    .slice(0, 8)
    .map(({ text, type }) => ({ text, type }));
}
