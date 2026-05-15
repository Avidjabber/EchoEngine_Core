import cron from 'node-cron';
import axios from 'axios';
import { api } from '../services/api.js';

async function checkHealth() {
  const firedAt = new Date().toISOString();
  try {
    const data = await api.health();
    console.log(`[${firedAt}] Health check OK`, data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[${firedAt}] Health check FAILED — ${err.message}`, {
        status: err.response?.status,
        data: err.response?.data,
      });
    } else {
      console.error(`[${firedAt}] Health check FAILED — unexpected error`, err);
    }
  }
}

async function hourlyJob() {
  // TODO
}

// Run immediately on startup, then every 10 minutes
checkHealth();
cron.schedule('*/10 * * * *', checkHealth);

cron.schedule('0 * * * *', hourlyJob);
