import mongoose from 'mongoose';
import dns from 'node:dns';
import { setTimeout as delay } from 'node:timers/promises';

// Retry only connection selection/network failures, not invalid credentials or config.
export async function connectDatabaseWithRetry(
  uri = process.env.MONGODB_URI,
  { connect = connectDatabase, sleep = delay, log = console.error } = {},
) {
  let attempt = 0;
  for (;;) {
    try {
      await connect(uri);
      return;
    } catch (error) {
      if (
        ![
          'MongooseServerSelectionError',
          'MongoServerSelectionError',
          'MongoNetworkError',
          'MongoNetworkTimeoutError',
        ].includes(error.name) &&
        !['ENOTFOUND', 'ECONNREFUSED', 'ETIMEOUT', 'ETIMEDOUT', 'EAI_AGAIN'].includes(error.code)
      ) {
        throw error;
      }
      const wait = Math.min(1000 * 2 ** Math.min(attempt++, 5), 30000);
      log(
        `MongoDB is unreachable. Retrying in ${wait / 1000}s. Check Atlas Network Access (current public IP), cluster status, DNS and firewall. The API will start after the database connects. Press Ctrl+C to stop.`,
      );
      await sleep(wait);
    }
  }
}

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri)
    throw new Error(
      'MONGODB_URI is required. Copy server/.env.example to server/.env, or run npm run demo.',
    );
  // Optional workaround for networks whose DNS rejects Atlas SRV lookups.
  if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(
      process.env.MONGODB_DNS_SERVERS.split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid')
    throw new Error(
      'MongoDB must run as a replica set for atomic inventory transactions. See README.',
    );
}
