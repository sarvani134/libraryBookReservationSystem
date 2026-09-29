import { readFileSync } from 'node:fs';
const publishedCovers = JSON.parse(
  readFileSync(new URL('../data/bookCovers.json', import.meta.url), 'utf8'),
);
export function withPublishedCover(book) {
  const cover = publishedCovers[book.title];
  return cover && cover.author === book.author && !book.coverImage
    ? { ...book, coverImage: cover.image, coverSource: cover.source }
    : book;
}
const cache = new Map();
const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export async function findGoogleCover(book, fetcher = fetch) {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', `intitle:${book.title} inauthor:${book.author.split(/[&,]/)[0]}`);
  url.searchParams.set('maxResults', '5');
  if (process.env.GOOGLE_BOOKS_API_KEY)
    url.searchParams.set('key', process.env.GOOGLE_BOOKS_API_KEY);
  const response = await fetcher(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) return null;
  const data = await response.json();
  const title = normalize(book.title);
  const authorWords = normalize(book.author)
    .split(' ')
    .filter((word) => word.length > 3);
  const item = data.items?.find(
    ({ volumeInfo: info }) =>
      info &&
      normalize(info.title) === title &&
      info.authors?.some((author) =>
        authorWords.some((word) => normalize(author).split(' ').includes(word)),
      ) &&
      info.imageLinks,
  );
  if (!item) return null;
  const links = item.volumeInfo.imageLinks;
  const image =
    links.extraLarge ||
    links.large ||
    links.medium ||
    links.small ||
    links.thumbnail ||
    links.smallThumbnail;
  if (!image) return null;
  return {
    image: image.replace(/^http:/, 'https:'),
    source: `https://books.google.com/books?id=${encodeURIComponent(item.id)}`,
  };
}
export async function googleCover(book) {
  const published = publishedCovers[book.title];
  if (published && published.author === book.author) return published;
  const key = `${book.title}|${book.author}`;
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.promise;
  if (cache.size >= 1000) cache.delete(cache.keys().next().value);
  const promise = findGoogleCover(book).catch(() => null);
  cache.set(key, { promise, expires: Date.now() + 60 * 60 * 1000 });
  return promise;
}
