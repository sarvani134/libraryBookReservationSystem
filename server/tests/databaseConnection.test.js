import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectDatabaseWithRetry } from '../config/db.js';

test('temporary connection failures retry with capped backoff and recover', async () => {
  const waits = [];
  let attempts = 0;
  await connectDatabaseWithRetry('test-uri', {
    connect: async (uri) => {
      assert.equal(uri, 'test-uri');
      if (++attempts <= 7) {
        const error = new Error('unreachable');
        error.name = 'MongooseServerSelectionError';
        throw error;
      }
    },
    sleep: async (ms) => waits.push(ms),
    log: () => {},
  });
  assert.equal(attempts, 8);
  assert.deepEqual(waits, [1000, 2000, 4000, 8000, 16000, 30000, 30000]);
});

test('authentication and configuration errors fail immediately', async () => {
  for (const error of [
    new Error('missing URI'),
    Object.assign(new Error('authentication failed'), { name: 'MongoServerError', code: 18 }),
  ]) {
    await assert.rejects(
      connectDatabaseWithRetry('test-uri', {
        connect: async () => {
          throw error;
        },
        sleep: async () => assert.fail('must not retry'),
      }),
      (actual) => actual === error,
    );
  }
});
