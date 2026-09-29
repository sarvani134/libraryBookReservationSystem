import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { connectDatabase } from './config/db.js';
import { seedDatabase } from './seed/seedDatabase.js';
import { app } from './app.js';
import { startReservationExpiryJob } from './jobs/reservationExpiryJob.js';
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await connectDatabase(mongo.getUri());
await seedDatabase();
const port = process.env.PORT || 5000;
const job = startReservationExpiryJob();
const server = app.listen(port, () =>
  console.log(
    `Demo MongoDB + API ready at http://localhost:${port}. Data resets when stopped. Run npm run dev -w client for the frontend.`,
  ),
);
process.on('SIGINT', async () => {
  job.stop();
  server.close();
  await mongo.stop();
  process.exit(0);
});
