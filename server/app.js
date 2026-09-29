import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import router from './routes/api.js';
import { errorHandler, wrap } from './services/errors.js';
import { sweepReservations } from './jobs/reservationExpiryJob.js';
export const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use(
  '/covers',
  express.static(fileURLToPath(new URL('../client/public/covers/', import.meta.url))),
);
app.use(
  '/api',
  wrap(async (req, res, next) => {
    await sweepReservations();
    next();
  }),
  router,
);
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));
const client = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
if (existsSync(client)) {
  app.use(express.static(client));
  app.get('*', (req, res) => res.sendFile(path.join(client, 'index.html')));
}
app.use(errorHandler);
