import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
const { connectDatabase } = await import('./config/db.js');
try {
  await connectDatabase();
  const { addCatalogue } = await import('./seed/addCatalogue.js');
  await addCatalogue();
  const { app } = await import('./app.js');
  const { startReservationExpiryJob, sweepReservations } =
    await import('./jobs/reservationExpiryJob.js');
  await sweepReservations();
  const job = startReservationExpiryJob();
  const server = app.listen(process.env.PORT || 5000, () =>
    console.log(`Campus Library API: http://localhost:${process.env.PORT || 5000}`),
  );
  process.on('SIGINT', () => {
    job.stop();
    server.close(() => process.exit(0));
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
