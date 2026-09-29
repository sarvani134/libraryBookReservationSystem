import { test, expect } from '@playwright/test';
import { books } from '../server/data/books.js';
test('desktop homepage, discovery, details and reading list', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find the right book/ })).toBeVisible();
  await expect(page.locator('.book-card')).toHaveCount(4);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.getByRole('searchbox').count();
  await page.getByRole('combobox', { name: 'Search library' }).fill('deadlocks');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.book-card')).toHaveCount(3);
  await page.getByLabel('Semester', { exact: true }).selectOption('3');
  await expect(page.locator('.book-card')).toHaveCount(3);
  await page.getByRole('link', { name: 'Operating System Concepts', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Operating System Concepts', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('2 copies available', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle reading list' }).click();
  await page.getByRole('link', { name: 'My reading list', exact: true }).first().click();
  await expect(page.locator('.book-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.book-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('reservation, collection, custom return warning and return workflow', async ({ page }) => {
  await page.goto('/books?q=Operating%20System%20Concepts');
  await expect(page.locator('.book-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Reserve', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Student name').fill('Browser Test');
  await dialog.getByLabel('Registration number').fill('BROWSER001');
  await dialog.getByRole('button', { name: 'Confirm reservation' }).click();
  await expect(dialog.getByText('A good read, reserved.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('Only 1 left')).toBeVisible();
  await page.getByRole('link', { name: 'Reservations', exact: true }).click();
  await expect(page.locator('.activity-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Collect & checkout' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('.activity-card .status')).toHaveText('COLLECTED');
  await page.getByRole('link', { name: 'My Activity', exact: true }).click();
  await expect(page.locator('.activity-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Change return date', exact: true }).click();
  const futureSunday = new Date();
  futureSunday.setUTCDate(futureSunday.getUTCDate() + 30);
  while (futureSunday.getUTCDay() !== 0) futureSunday.setUTCDate(futureSunday.getUTCDate() + 1);
  await page.getByLabel('New return date').fill(futureSunday.toISOString().slice(0, 10));
  await expect(page.getByText('Library holiday: Sunday', { exact: true })).toBeVisible();
  await expect(page.getByText(/exceeds the standard/)).toBeVisible();
  await page.getByRole('button', { name: /Use suggested date/ }).click();
  await page.getByRole('button', { name: 'Save return date', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Return book', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No books checked out' })).toBeVisible();
  await page.goto('/books?q=Operating%20System%20Concepts');
  await expect(page.getByText('2 available', { exact: true })).toBeVisible();
});
test('Sara day-14 notification, calendar selection, unavailable book and errors', async ({
  page,
}) => {
  await page.goto('/activity');
  await page.getByLabel('Registration number', { exact: true }).fill('23CSE001');
  await page.getByRole('button', { name: 'Find my activity' }).click();
  await expect(page.getByText('Book due tomorrow', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.locator('.notification-panel')).toContainText('Book due tomorrow');
  await page.goto('/calendar');
  await expect(page.locator('.calendar-day')).toHaveCount(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  );
  await page.locator('.calendar-day.sunday').first().click();
  await expect(page.getByText('LIBRARY CLOSED', { exact: true })).toBeVisible();
  await expect(page.getByText('Next working day', { exact: true })).toBeVisible();
  await page.goto('/books?q=The%20Algorithm%20Design%20Manual');
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled();
  await page.getByRole('button', { name: 'Notify me' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/books?q=Quantum%20Networking');
  await expect(page.getByRole('heading', { name: 'No books found' })).toBeVisible();
  await page.route('**/api/books?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test service unavailable' }),
    }),
  );
  await page.goto('/books?q=error');
  await expect(page.getByRole('alert')).toContainText('Test service unavailable');
});
test('mobile navigation, catalogue, dialog focus and responsive calendar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.book-card')).toHaveCount(4);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'Browse Books', exact: true }).click();
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Subject', { exact: true }).selectOption('Operating Systems');
  await expect(page.locator('.book-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Reserve', exact: true }).first().click();
  await expect(page.getByLabel('Student name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/calendar');
  await expect(page.locator('.calendar')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/calendar-mobile.png', fullPage: true });
});
test('demo management adds, edits and removes a book and holiday', async ({ page }) => {
  await page.goto('/manage');
  await expect(page.getByRole('heading', { name: 'Demo Library Management' })).toBeVisible();
  await page.getByRole('button', { name: 'Add book', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Temporary Browser Test Book');
  await dialog.getByLabel('Author', { exact: true }).fill('Test Author');
  await dialog.getByLabel('Shelf location').fill('TEST-1');
  await dialog.getByLabel('Total copies').fill('2');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Edit Temporary Browser Test Book', exact: true }).click();
  await page.getByLabel('Total copies').fill('3');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Temporary Browser Test Book' }),
  ).toContainText('3 available / 3 total');
  await page
    .getByRole('button', { name: 'Delete Temporary Browser Test Book', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Temporary Browser Test Book', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'holidays', exact: true }).click();
  await page.getByRole('button', { name: 'Add holiday', exact: true }).click();
  await page.getByLabel('Holiday name').fill('Temporary Browser Holiday');
  await page.getByLabel('Date', { exact: true }).fill('2027-06-01');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Delete Temporary Browser Holiday', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Temporary Browser Holiday', { exact: true })).toHaveCount(0);
});

test('browse full catalogue, reserve and withdraw with updated copy counts', async ({ page }) => {
  await page.goto('/books');
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await page.goto('/books?q=Operating%20System%20Concepts');
  const card = page.locator('.book-card');
  await expect(card.locator('.book-author')).toContainText('Abraham Silberschatz');
  await expect(card).toContainText('0 reserved');
  await card.getByRole('button', { name: 'Reserve', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Student name').fill('Withdrawal Test');
  await dialog.getByLabel('Registration number').fill('WITHDRAW001');
  await dialog.getByRole('button', { name: 'Confirm reservation' }).click();
  await expect(dialog.getByText('A good read, reserved.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(card).toContainText('1 reserved');
  await expect(card.getByRole('button', { name: 'Reserved', exact: true })).toBeDisabled();
  await page.reload();
  await expect(card.getByRole('button', { name: 'Reserved', exact: true })).toBeDisabled();
  await expect(card).toContainText('Only 1 left');
  await page.getByRole('link', { name: 'View or withdraw my reservations' }).click();
  await page.getByRole('button', { name: 'Withdraw reservation', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('.activity-card .status')).toHaveText('CANCELLED');
  await page.goto('/books?q=Operating%20System%20Concepts');
  await expect(card).toContainText('0 reserved');
  await expect(card.getByRole('button', { name: 'Reserve', exact: true })).toBeEnabled();
  await expect(card).toContainText('2 available');
});

test('autocomplete accepts keyboard selection and misspelled searches', async ({ page }) => {
  await page.goto('/books');
  const search = page.getByRole('combobox', { name: 'Search library' });
  await search.fill('pyhton');
  await expect(page.getByRole('option').filter({ hasText: 'Python' }).first()).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('.book-card').first()).toBeVisible();
  await page.goto('/books?q=oprating%20systms');
  await expect(page.locator('.book-card')).toHaveCount(3);
});

test('catalogue displays locally saved real book covers', async ({ page }) => {
  await page.goto('/books?q=Head%20First%20Java');
  const card = page.locator('.book-card');
  await expect(card).toHaveCount(1);
  const cover = card.locator('.cover img');
  await expect(cover).toHaveAttribute('src', /\/covers\/.*\.jpg/);
  await expect
    .poll(() => cover.evaluate((img) => img.complete && img.naturalWidth > 100))
    .toBe(true);
  await page.screenshot({ path: 'test-results/real-book-cover.png', fullPage: true });
});

test('all catalogue covers fit their image areas at desktop, tablet and mobile widths', async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/books');
    await expect(page.locator('.book-card')).toHaveCount(books.length);
    const overlaps = await page.locator('.book-card').evaluateAll((cards) =>
      cards
        .filter((card) => {
          const area = card.querySelector('.book-image').getBoundingClientRect();
          const cover = card.querySelector('.cover').getBoundingClientRect();
          const content = card.querySelector('.book-content').getBoundingClientRect();
          return (
            cover.bottom > area.bottom + 1 ||
            cover.top < area.top - 1 ||
            cover.left < area.left - 1 ||
            cover.right > area.right + 1 ||
            cover.bottom > content.top + 1
          );
        })
        .map((card) => card.querySelector('.book-title').textContent),
    );
    expect(overlaps, `Cover overflow at ${width}px`).toEqual([]);
  }
});
