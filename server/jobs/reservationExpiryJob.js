import cron from 'node-cron';
import { expireReservations } from '../services/inventoryService.js';
let running;
export function sweepReservations() {
  if (!running)
    running = expireReservations().finally(() => {
      running = null;
    });
  return running;
}
export const startReservationExpiryJob = () =>
  cron.schedule('* * * * *', () => sweepReservations().catch(console.error), {
    timezone: 'Asia/Kolkata',
  });
