
import cron from 'node-cron';

// Run a task every hour
cron.schedule('0 * * * *', () => {
  hourlyTask();
});

// Run a task every second
cron.schedule('* * * * * *', () => {
  console.log('Task is running every second');
});

function hourlyTask() {
  console.log('This task runs every hour');
}
