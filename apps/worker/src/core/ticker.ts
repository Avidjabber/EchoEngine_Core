
import cron from 'node-cron';

// Run a task every hour
cron.schedule('0 * * * *', () => {
  console.log('Task is running every hour');
});

// Run a task every second
cron.schedule('0 * * * * *', () => {
  console.log('Task is running every second');
});


