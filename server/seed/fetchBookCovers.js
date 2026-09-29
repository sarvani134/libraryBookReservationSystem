import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { books } from '../data/books.js';
import { syllabusBooks } from '../data/syllabusBooks.js';

const manifestPath = new URL('../data/bookCovers.json', import.meta.url);
const folder = new URL('../../client/public/covers/', import.meta.url);
await mkdir(folder, { recursive: true });
let manifest = {};
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch {}
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim();
const selectedBooks = process.argv.includes('--syllabus') ? syllabusBooks : books;
for (const [index, book] of selectedBooks.entries()) {
  if (manifest[book.title]) continue;
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('title', book.title);
    url.searchParams.set('author', book.author.split(/[&,]/)[0]);
    url.searchParams.set('limit', '10');
    url.searchParams.set('fields', 'key,title,author_name,cover_i');
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Search HTTP ${response.status}`);
    const data = await response.json();
    const authors = normalize(book.author)
      .split(' ')
      .filter((word) => word.length > 3);
    const match = data.docs.find(
      (item) =>
        item.cover_i &&
        normalize(item.title) === normalize(book.title) &&
        item.author_name?.some((author) =>
          authors.some((word) => normalize(author).split(' ').includes(word)),
        ),
    );
    if (!match) {
      console.log(`No exact cover: ${book.title}`);
      continue;
    }
    const sourceImage = `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg?default=false`;
    const image = await fetch(sourceImage, { signal: AbortSignal.timeout(15000) });
    if (!image.ok || !image.headers.get('content-type')?.startsWith('image/'))
      throw new Error('Cover unavailable');
    const filename = `${match.cover_i}.jpg`;
    await writeFile(new URL(filename, folder), Buffer.from(await image.arrayBuffer()));
    manifest[book.title] = {
      image: `/covers/${filename}`,
      source: `https://openlibrary.org${match.key}`,
      sourceImage,
      author: book.author,
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`${index + 1}/${selectedBooks.length}: saved ${book.title}`);
  } catch (error) {
    console.log(`${book.title}: ${error.message}`);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
}
console.log(`Real covers saved: ${Object.keys(manifest).length}/${books.length}`);
