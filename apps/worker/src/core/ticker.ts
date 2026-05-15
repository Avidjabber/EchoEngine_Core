
import cron from 'node-cron';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

async function checkHealth() {
  const firedAt = new Date().toISOString();
  try {
    const res = await axios.get(`${API_BASE_URL}/health`);
    console.log(`[${firedAt}] Health check OK — status ${res.status}`, res.data);
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
