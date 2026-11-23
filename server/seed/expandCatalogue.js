// One-time, reviewable catalogue import. Downloads edition metadata and local covers.
import { writeFile, mkdir, readFile } from 'node:fs/promises';
const selections = [
  ['9781491946008', 2, '1st', ['Python', 'Data model', 'Iterators', 'Concurrency']],
  ['9780134853987', 2, '2nd', ['Python', 'Functions', 'Classes', 'Testing']],
  ['9781491957660', 2, '2nd', ['Python', 'Pandas', 'NumPy', 'Data analysis']],
  ['9780321349606', 1, '1st', ['Java', 'Threads', 'Concurrency', 'Synchronization']],
  ['9780596007126', 9, '1st', ['Design patterns', 'Objects', 'Software design']],
  ['9780134757599', 9, '2nd', ['Refactoring', 'Testing', 'Code quality']],
  ['9780135957059', 9, '2nd', ['Software design', 'Debugging', 'Automation']],
  ['9781449373320', 5, '1st', ['Databases', 'Replication', 'Transactions', 'Distributed systems']],
  ['9781934356555', 5, '1st', ['SQL', 'Database design', 'Queries', 'Normalization']],
  ['9781617292231', 4, '1st', ['Algorithms', 'Searching', 'Sorting', 'Graphs']],
  ['9780321295354', 4, '1st', ['Algorithms', 'Greedy algorithms', 'Dynamic programming']],
  ['9780134092669', 8, '3rd', ['Computer systems', 'Memory', 'Processors', 'Linking']],
  ['9780131411555', 7, '3rd', ['Sockets', 'TCP/IP', 'Network programming']],
  ['9781118026472', 14, '2nd', ['Web security', 'Authentication', 'Security testing']],
  ['9781593278267', 15, '1st', ['Cryptography', 'Encryption', 'Authentication']],
  ['9781491952023', 10, '7th', ['JavaScript', 'HTML', 'DOM', 'Web development']],
  ['9781617295263', 12, '1st', ['Machine learning', 'Neural networks', 'PyTorch']],
  ['9781617294433', 12, '1st', ['Deep learning', 'Python', 'Neural networks']],
  ['9781492046530', 13, '2nd', ['Kubernetes', 'Containers', 'Cloud', 'Deployment']],
  ['9781491903995', 26, '1st', ['C++', 'Objects', 'Classes', 'Software design']],
];
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.json();
}
await mkdir(new URL('../../client/public/covers/', import.meta.url), { recursive: true });
const target = new URL('../data/additionalBooks.json', import.meta.url);
const entries = (
  await readFile(target, 'utf8')
    .then(JSON.parse)
    .catch(() => [])
).filter((book) => selections.some(([isbn]) => isbn === book.isbn));
for (const [isbn, subjectIndex, edition, topics] of selections) {
  if (entries.some((book) => book.isbn === isbn)) continue;
  const source = `https://openlibrary.org/isbn/${isbn}.json`;
  const data = await json(source);
  const work =
    !data.authors && data.works?.[0]
      ? await json(`https://openlibrary.org${data.works[0].key}.json`)
      : null;
  const authorRefs = data.authors || work?.authors?.map((item) => item.author);
  if (!authorRefs) throw new Error(`Missing authors: ${isbn}`);
  const authors = await Promise.all(
    authorRefs.map(({ key }) => json(`https://openlibrary.org${key}.json`)),
  );
  const sourceImage = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  const response = await fetch(sourceImage, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/'))
    throw new Error(`Missing cover: ${isbn}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 2000) throw new Error(`Invalid cover: ${isbn}`);
  await writeFile(new URL(`../../client/public/covers/${isbn}.jpg`, import.meta.url), bytes);
  entries.push({
    title: data.title,
    author: authors.map((a) => a.name).join(' & '),
    isbn,
    publisher: data.publishers[0],
    publishedYear: Number(data.publish_date.match(/\d{4}/)[0]),
    edition,
    subjectIndex,
    topics,
    coverImage: `/covers/${isbn}.jpg`,
    source,
    sourceImage,
  });
  console.log(`Imported ${entries.length}/20: ${data.title}`);
  await writeFile(target, JSON.stringify(entries, null, 2) + '\n');
}
// Correct duplicated work-level author aliases and publisher catalogue inconsistencies.
const corrections = {
  9781118026472: {
    title: "The Web Application Hacker's Handbook",
    author: 'Dafydd Stuttard & Marcus Pinto',
  },
  9781491952023: { title: 'JavaScript: The Definitive Guide' },
  9781617295263: {
    title: 'Deep Learning with PyTorch',
    author: 'Eli Stevens & Luca Antiga & Thomas Viehmann',
  },
  9781492046530: { title: 'Kubernetes: Up and Running' },
  9780596007126: {
    title: 'Head First Design Patterns',
    author: 'Eric Freeman & Elisabeth Robson & Bert Bates & Kathy Sierra',
    source: 'https://www.oreilly.com/library/view/head-first-design/0596007124/',
  },
  9780134757599: { publisher: 'Addison-Wesley Professional' },
  9780135957059: {
    publisher: 'Addison-Wesley Professional',
    source:
      'https://www.pearson.com/en-us/subject-catalog/p/pragmatic-programmer-the-your-journey-to-mastery-20th-anniversary-edition/P200000000337/9780135956915',
  },
  9781934356555: {
    title: 'SQL Antipatterns',
    publishedYear: 2010,
    source: 'https://pragprog.com/titles/bksqla/sql-antipatterns/',
  },
  9780131411555: { author: 'W. Richard Stevens & Bill Fenner & Andrew M. Rudoff' },
};
await writeFile(
  target,
  JSON.stringify(
    entries.map((book) => ({ ...book, ...corrections[book.isbn] })),
    null,
    2,
  ) + '\n',
);
