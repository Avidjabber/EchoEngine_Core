import cron from 'node-cron';
import axios from 'axios';
import { api } from '../services/api.js';

async function checkHealth() {
  const firedAt = new Date().toISOString();

  // API
  try {
    const data = await api.health();
    console.log(`[${firedAt}] API health OK`, data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[${firedAt}] API health FAILED — ${err.message}`, { status: err.response?.status, data: err.response?.data });
    } else {
      console.error(`[${firedAt}] API health FAILED — unexpected error`, err);
    }
  }

  // Bot
  const botUrl = process.env.BOT_INTERNAL_URL ?? 'http://localhost:4000';
  try {
    await axios.get(`${botUrl}/health`, { timeout: 5000 });
    console.log(`[${firedAt}] Bot health OK`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[${firedAt}] Bot health FAILED — ${err.message}`, { status: err.response?.status });
    } else {
      console.error(`[${firedAt}] Bot health FAILED — unexpected error`, err);
    }
  }
}

async function hourlyJob() {
  const firedAt = new Date().toISOString();

  try {
    const result = await api.post<{ ticked: number; skipped: number }>('/weather-sim/tick-all');
    console.log(`[${firedAt}] Weather tick-all OK`, result);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[${firedAt}] Weather tick-all FAILED — ${err.message}`, { status: err.response?.status, data: err.response?.data });
    } else {
      console.error(`[${firedAt}] Weather tick-all FAILED — unexpected error`, err);
    }
  }
}

// Run immediately on startup, then every 10 minutes
checkHealth();
cron.schedule('*/10 * * * *', checkHealth);

cron.schedule('0 * * * *', hourlyJob);
