# Campus Library

A complete MERN library discovery, reservation, checkout, and return-planning application designed for B.Tech students at **Gayatri Vidya Parishad College of Engineering for Women (GVPW), Visakhapatnam**. Independent portfolio/student project; not an official college service.

No login, signup, passwords, accounts, or JWTs. Students provide lightweight transaction details and look up activity by registration number.

## Quick demo — no MongoDB installation needed

Requirements: Node.js 22 or newer, npm, and internet access for the first dependency/MongoDB binary download. Tested with Node.js 24 on Windows.

From the existing project folder:

```powershell
cd C:\Users\SARVANI\Desktop\saraFiles\libraryManagement\libraryBookReservationSystem
npm install
npm run build
npm run demo
```

Open **http://localhost:5000**. This serves the built React application and Express API, backed by an actual temporary MongoDB replica set. All transactions persist across page refreshes while the process runs. **Demo data resets when the process stops.** This is not a browser-only mock or an in-memory JavaScript database.

For live frontend development, keep `npm run demo` running and use a second terminal:

```powershell
npm run dev -w client
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to port 5000. Do not run `npm run dev` and `npm run demo` together: both start an API server on port 5000.

On PowerShell installations that block `npm.ps1`, substitute `npm.cmd` for `npm` and `npx.cmd` for `npx`.

## Features

- Responsive, editorial-style homepage, illustrated book covers, subject discovery, and eight semester filters.
- 74 real textbook titles, 72 supplied curriculum courses, seven department filters, and live MongoDB-derived statistics.
- Search across titles, authors, subjects, topics, tags, department, and ISBN. Synonyms connect searches such as DBMS/SQL and TCP/networking. Search for `deadlocks`, `graphs`, or `dynamic programming`.
- Combined department, semester, subject, availability, author, and publication-year filters. Relevance, title, availability, newest, and popularity sorting.
- Detailed book pages, shelf locations, scored recommendations, persistent local reading lists, and recent searches.
- Three-calendar-day reservations with server-authoritative expiry, cancellation, and collection into a checkout.
- Fifteen-day borrowing, return confirmation, overdue status, day-14 reminders, and custom planned return dates.
- Central holiday service, India-time calendar, consecutive closure handling, configurable Saturdays, and holiday-aware return suggestions.
- Registration-number activity lookup, reservation countdowns, and an in-app notification center.
- Availability-interest records and in-app alerts when copies are released. No email provider is required; email delivery is not implemented.
- Clearly separated demo management for books, copy counts, holidays, reservations, and checkouts.
- Native keyboard-friendly dialogs, focus states, skeleton loaders, empty states, API errors, and toast notifications.

## Persistent MongoDB setup

Inventory changes use multi-document MongoDB transactions. **A replica set is required**, including for local development; an ordinary standalone MongoDB instance is deliberately rejected at startup.

### Option A: Docker Desktop

The included Compose configuration creates a single-node replica set with a persistent named volume, exposed only on the local machine:

```powershell
docker compose up -d --wait
Copy-Item server/.env.example server/.env
npm run seed
npm run dev
```

The MongoDB health check initializes `rs0`. Connect using:

```text
mongodb://127.0.0.1:27017/campus-library?replicaSet=rs0
```

`docker compose down` stops the database while preserving its volume. Do not remove the volume if you want to keep your data.

### Option B: Existing MongoDB or Atlas

Use a configured MongoDB replica set or an Atlas connection string in `server/.env`. For a locally installed MongoDB, run `mongod` with `--replSet rs0` and initialize it once using `mongosh`:

```javascript
rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] });
```

Then:

```powershell
npm install
npm run seed
npm run dev
```

You can also start the apps separately:

```powershell
# Terminal 1, from the project root
cd server
npm install
npm run seed
npm run dev
```

```powershell
# Terminal 2, from the project root
cd client
npm install
npm run dev
```

### Environment variables

`server/.env` (copy from `.env.example`):

| Variable             | Default/example                                           | Purpose                                                  |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `PORT`               | `5000`                                                    | Express port                                             |
| `MONGODB_URI`        | `mongodb://127.0.0.1:27017/campus-library?replicaSet=rs0` | Persistent MongoDB replica set                           |
| `CLIENT_URL`         | `http://localhost:5173`                                   | Allowed cross-origin frontend                            |
| `MANAGEMENT_ENABLED` | `true`                                                    | Set `false` to disable management API mutations/listings |

`client/.env` is optional. By default the frontend requests same-origin `/api`. For separate deployment:

```text
VITE_API_URL=http://localhost:5000/api
```

Use `CLIENT_URL` matching the exact frontend origin in that case. `.env` files are gitignored; no secrets are included.

For production-style local serving:

```powershell
npm run build
npm start
```

Express serves `client/dist` and falls back to `index.html` for frontend routes, so refreshing `/books/:id`, `/activity`, or `/calendar` works. Unknown `/api` routes return JSON 404s instead of HTML.

## Architecture and study guide

```text
libraryBookReservationSystem/
  client/
    src/
      components/      Cards, dialogs, search, navigation, activity cards
      context/         Library configuration, browser reading list, activity
      hooks/           Cancellable API loading with stale-response protection
      pages/           Home, browse, details, categories, activity, calendar, management
      services/        Shared Axios client and error handling
      styles.css       Responsive design, states, and book illustrations
  server/
    config/            MongoDB replica-set connection check
    controllers/       Book discovery/management and activity notifications
    data/              Books, editable curriculum, annual holiday seeds
    jobs/              Cron and request-triggered reservation expiry
    models/            Mongoose Book, Checkout, Reservation, Holiday, Interest schemas
    routes/            REST routes and request validation
    seed/              Non-destructive initial database seed
    services/          Inventory transactions, holiday rules, search, recommendations
    tests/             Date tests and actual MongoDB integration tests
    app.js             Express middleware, API, static frontend, error handler
    server.js          Persistent-database entry point
    demo.js            Temporary MongoDB replica set + seeded demo server
  shared/
    libraryRules.js    Borrowing constants and timezone
    dateUtils.js       India-calendar calculations shared with the frontend
  e2e/                 Real-browser workflow tests
```

Suggested reading order: `shared/libraryRules.js` → `shared/dateUtils.js` → `server/models/index.js` → `server/services/inventoryService.js` → `server/routes/api.js` → `client/src/components/TransactionModal.jsx` → `client/src/pages/ActivityPage.jsx`.

The catalogue is intentionally small. Search computes relevance across the seeded collection in memory after loading MongoDB documents, enabling clear synonym logic without Atlas Search. For a large library, move ranking/filtering into indexed database queries and add pagination.

## Borrowing and inventory rules

Rules are centralized in `shared/libraryRules.js`:

```javascript
CHECKOUT_PERIOD_DAYS = 15;
RESERVATION_PERIOD_DAYS = 3;
REMINDER_DAY = 14;
TIME_ZONE = 'Asia/Kolkata';
SATURDAYS_CLOSED = false;
```

The invariant is always:

```text
availableCopies + checkedOutCopies + reservedCopies = totalCopies
```

Every reservation, checkout, collection, cancellation, expiry, and return updates the transaction record and book counts inside the same MongoDB transaction. Acquiring a copy conditionally updates a book only when `availableCopies > 0`. MongoDB retries write conflicts. Concurrent students cannot both reserve the last copy. Conditional status transitions prevent repeated returns/cancellations from releasing inventory twice.

Management cannot reduce copies below current borrowed/reserved counts. Books with transaction/interest history cannot be deleted; setting copies to zero preserves historical references.

### Checkouts and custom returns

- A September 1 checkout has a September 16 standard due date: 15 **calendar days**, not working days.
- The standard due date is retained separately when a custom planned date is chosen.
- Custom dates before checkout are rejected; changing an existing plan also requires today or later.
- Dates beyond the standard window are allowed with an explicit warning, as requested. No fine/payment policy is imposed.
- A holiday return date is not silently changed. The student sees the closure, can accept a suggested working date, choose another date, or keep the plan.
- A book becomes overdue on the calendar day **after** its effective due date. `OVERDUE` is derived when activity is retrieved; returned books do not produce due reminders.
- Day 14 triggers a reminder; holiday reminders and non-working due dates include suggestions. Custom dates additionally get a due-tomorrow reminder one day before the effective due date.

### Reservations and automatic expiry

The supplied September 20–23 example defines a **calendar-day** hold: September 20, 21, and 22 are valid; expiry is September 23 at **00:00 IST**. This intentionally is not a rolling 72-hour timer for an afternoon reservation.

`jobs/reservationExpiryJob.js` runs every minute and before API reads/mutations. Active reservations with `expiresAt <= now` transition to `EXPIRED`, releasing their copy transactionally. A server restart catches up at startup/next request. An offline server cannot run cron; the first request after restarting catches up. The browser countdown is informational, not authoritative. Records remain for history; no TTL deletes them.

## Holiday configuration and curriculum

`server/services/holidayService.js` exports a reusable service with `isHoliday`, `isWorkingDay`, `getHolidayForDate`, `getNextWorkingDay`, and `describe`. Holidays are MongoDB `Date` objects. `shared/dateUtils.js` uses calendar midnight in Asia/Kolkata and validates `YYYY-MM-DD` inputs before comparing dates.

Manage closures in `/manage` → Holidays, or update `server/data/holidays.js` before the initial seed. National, Andhra Pradesh, and college holidays have distinct calendar styles. Sundays close automatically; Saturdays are configured in `shared/libraryRules.js`. Working-day suggestions skip consecutive closures, with a bounded search rather than an infinite loop.

**The holiday seed is an illustrative demo calendar, not an official annual AP/college holiday list.** September 15 and 16 are explicitly labelled demo closures for testing. Replace/add dates from the approved annual holiday notification, including movable festivals such as Ugadi and Diwali. The management UI supports all dates and types without code changes.

Curriculum configuration lives in `server/data/curriculum.js`, with the supplied 72-course list preserved in `server/data/courses.json`. Course names, codes, labs, categories and semesters follow that list. Electives have no assigned semester, and no Semester 8 courses were supplied. PDF paths are reference metadata; the PDFs themselves are not bundled. Existing book departments and textbook associations remain discovery suggestions.

After updating an existing database, run `npm run update:curriculum -w server` from the project root (or `npm run update:curriculum` from `server`). This updates subject and semester fields for known seed titles, preserving book IDs, stock counts and borrowing history. New seeds and demo runs use the corrected mappings automatically. Books outside the supplied curriculum remain available with no assigned semester.

Seed titles/authors are real. Shelves, counts, mappings, and descriptions are demo data. ISBNs and unverified edition/publication metadata are deliberately omitted. Add verified metadata through management to exercise publication-year filters. Covers use original CSS illustrations by default; add a cover URL to use a remote/Open Library image, with graceful fallback when it fails.

## Demo walkthrough

1. Start the demo and browse **Operating System Concepts**: total 5, available 2, checked out 3, reserved 0.
2. Reserve using Sara / `23CSE001` / CSE. Available becomes 1 and reserved becomes 1.
3. Open Reservations. Cancel to restore availability or collect to convert the hold into a 15-day checkout.
4. Open My Activity. Sara also has a separately seeded **Computer Networks** checkout, created 14 calendar days ago, due tomorrow. The notification appears immediately.
5. Change a return plan to an upcoming Sunday. The dialog warns and offers the next working date. Add a holiday on the following Monday to demonstrate skipping consecutive closures.
6. Return a borrowed book. The active checkout moves to Past Returns and the available count increases once.
7. Search **The Algorithm Design Manual** to see an unavailable title and save an availability alert. Returning a copy through its demo borrower’s activity produces an in-app alert.

Seed is non-destructive: if books already exist, it exits without changing existing records. To modify an existing catalogue, use management. Tests prove the historical September 1/16 scenario without changing your computer’s clock.

## REST API

All routes are prefixed with `/api`. Errors return `{ "message": "..." }` and appropriate HTTP status codes.

| Method              | Route                                                   | Purpose                                              |
| ------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| GET                 | `/health`, `/config`, `/stats`                          | Health, configurable discovery/rules, actual counts  |
| GET                 | `/books`, `/books/search`                               | Search, combine filters, sort                        |
| GET                 | `/books/:id`                                            | Details and scored recommendations                   |
| POST / PUT / DELETE | `/books`, `/books/:id`, `/books/:id`                    | Demo book management                                 |
| POST / GET          | `/reservations`                                         | Create a hold / management listing                   |
| GET                 | `/reservations/student/:registrationNumber`             | Student reservation history                          |
| PATCH               | `/reservations/:id/cancel`, `/reservations/:id/collect` | Release or collect a hold                            |
| POST / GET          | `/checkouts`                                            | Checkout / management listing                        |
| GET                 | `/checkouts/student/:registrationNumber`                | Student checkout history                             |
| PATCH               | `/checkouts/:id/return`                                 | Confirm a return                                     |
| PATCH               | `/checkouts/:id/due-date`                               | Update planned date, body `{ "date": "YYYY-MM-DD" }` |
| GET / POST / DELETE | `/holidays`, `/holidays`, `/holidays/:id`               | Calendar and holiday management                      |
| GET                 | `/dates/preview?date=YYYY-MM-DD`                        | Server-authoritative dates and holiday suggestions   |
| GET                 | `/activity/:registrationNumber`                         | Checkouts, reservations, alerts, reminders           |
| POST                | `/interests`                                            | Record interest in unavailable books                 |

Example combined filter:

```text
/api/books?q=deadlocks&department=CSE&semester=4&availability=available&sort=title
```

Other query keys: `subject`, `author`, `year`; availability values: `available`, `reserved`, `unavailable`. `available=true` is also supported. Sort values: `relevance`, `title`, `availability`, `newest`, `popular`.

Reservation/checkout body:

```json
{
  "bookId": "a MongoDB book ObjectId",
  "studentName": "Sara",
  "registrationNumber": "23CSE001",
  "department": "CSE",
  "year": 3,
  "email": "",
  "customReturnDate": "2026-10-08"
}
```

Omit `customReturnDate` for the standard checkout. Reservations ignore that field. Registration numbers are trimmed and normalized to uppercase.

## Verification

```powershell
npm test
npm run build
npm run test:e2e
npm run format:check
```

Unit/integration tests start their own isolated actual MongoDB replica set. They cover India-time date boundaries, 15-day checkouts, fourth-day expiry, holidays, Sundays/Saturdays, consecutive closures, search, recommendations, inventory, concurrent last-copy requests, cancellation, collection, repeated returns, custom dates, day-14 activity, overdue, management protections, availability alerts, and seed inventory.

Browser tests use installed Google Chrome headlessly and launch their own isolated demo on port 5010, with no changes to your running demo/database. Run `npm run build` first. If Chrome is unavailable, install Chromium with `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.js`.

Browser coverage includes desktop discovery, filtering, reading-list persistence, reservation → collection → return, custom-date holiday warnings, Sara’s notification, calendar interaction, empty/error states, mobile navigation/layout, dialog keyboard interaction, and book/holiday management. Screenshots are generated in `test-results/`.

## Screenshots

After browser tests, inspect `test-results/home-desktop.png`, `test-results/home-mobile.png`, and `test-results/calendar-mobile.png`. Add selected screenshots to a `docs/screenshots/` folder for a published portfolio README.

## Scope and future enhancements

This intentionally unauthenticated demo uses registration-number lookup. Registration numbers are **not secrets or access control**; anyone who knows one can view and modify its transactions. Do not use real student personal data in a public deployment. Browser storage only remembers bookmarks, recent searches, and the last lookup number; it is not an authenticated session.

Future work: optional institution-approved access controls for real deployment, email delivery, pagination/database-side search for large collections, verified edition/ISBN import, approved annual calendar import, fine policies, and optional FIFO waitlists/subject landing pages. No paid AI service, Firebase, or Supabase is used.

## Browse and load the book catalogue

The catalogue contains 74 full book titles with authors. Browse `/books` to search and filter, see available, reserved and borrowed copy counts, and reserve a copy. Use **View or withdraw my reservations**, look up your registration number, and choose **Withdraw reservation** to release your hold.

To add all missing catalogue titles to an existing or empty MongoDB database, run `npm run catalogue:add -w server` from the project root, or `npm run catalogue:add` inside `server`. Existing books, inventory and reservations are preserved. For the temporary seeded demo, run `npm run demo` from the project root.

### Published book covers

Downloaded book covers live in `client/public/covers`. `server/data/bookCovers.json` records the matched title, author, source page and original image URL. The catalogue API applies these images to existing books without changing inventory or reservations. Run `node server/seed/fetchBookCovers.js` to retrieve missing exact title/author matches from Open Library. Google Books remains a fallback; unavailable images show a neutral placeholder. Covers may depict a different edition because catalogue editions are unspecified.
