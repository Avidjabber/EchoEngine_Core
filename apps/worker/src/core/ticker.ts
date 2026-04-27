const SECONDS = 60; // Seconds per tick

startTicker();

var thisHour : number;
var lastHour: number;

export default async function startTicker() {
  console.log("Ticker started");
  lastHour = new Date().getHours();
  setInterval(checkTime, SECONDS * 1000);
}

async function checkTime() {
  thisHour = new Date().getHours();
  if (thisHour !== lastHour) {
    console.log("Current hour:", thisHour);
    lastHour = thisHour;
  }
}