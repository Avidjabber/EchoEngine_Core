var spt = 60; // Seconds per tick

startTicker();

export default async function startTicker() {
  console.log("Ticker started");
  setInterval(tickAction, spt * 1000);
}

export async function SetSPT(seconds: number) {
  spt = seconds;
  startTicker();
}

function tickAction() { console.log("Tick"); } // TODO: This will be the main function that runs every tick.
