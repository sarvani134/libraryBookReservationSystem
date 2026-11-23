import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
const { connectDatabaseWithRetry } = await import('./config/db.js');
try {
  await connectDatabaseWithRetry();
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
