var spt = 60; // Seconds per tick

var ticker: NodeJS.Timeout;
startTicker();

export default async function startTicker() {
  console.log("Ticker started");
  clearInterval(ticker);
  ticker = setInterval(tickAction, spt * 1000);
}

export async function stopTicker() {
  clearInterval(ticker as NodeJS.Timeout);
  console.log("Ticker stopped");
}

export async function SetSPT(seconds: number) {
  spt = seconds;
  startTicker();
}

function tickAction() { console.log("Tick"); } // TODO: This will be the main function that runs every tick.
