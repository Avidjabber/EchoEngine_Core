
import cron from 'node-cron';

// Run a task every hour
cron.schedule('0 * * * *', () => {
  hourlyTask();
});

function hourlyTask() {
  console.log('This task runs every hour');
}
