const { WebSocketSTTClient, CONFIG } = require('./index.js');
const os = require('os');

/**
 * ============================================================================
 * WebSocket Stress & Benchmark Test Tool
 * ============================================================================
 *
 * This script launches multiple concurrent WebSocket clients to stress test
 * the speech-to-text API.
 *
 * Usage:
 * node stress-test.js --clients <number> [--ramp-up-ms <ms>]
 *
 * Arguments:
 *   --clients:      (Required) The number of concurrent clients to simulate.
 *   --ramp-up-ms:   (Optional) The total time in milliseconds to spread out
 *                   the start of each client connection. Defaults to 2000ms.
 *
 * Example:
 * node stress-test.js --clients 50 --ramp-up-ms 5000
 * (This will start 50 clients over a period of 5 seconds).
 */

// --- Helper Functions ---

/**
 * Parses command-line arguments.
 */
function parseArgs() {
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split('=');
    acc[key.replace('--', '')] = value;
    return acc;
  }, {});

  if (!args.clients || isNaN(parseInt(args.clients, 10))) {
    console.error('❌ Missing or invalid required argument: --clients=<number>');
    console.log('Usage: node stress-test.js --clients <number>');
    process.exit(1);
  }

  return {
    numClients: parseInt(args.clients, 10),
    rampUpMs: parseInt(args.rampUpMs, 10) || 2000,
  };
}

/**
 * A simple promise-based delay.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the full lifecycle for a single WebSocket client.
 * @param {number} id - A unique identifier for the client.
 * @param {boolean} silent - Suppress individual client console logs.
 * @returns {Promise<object>} A promise that resolves with the client's stats.
 */
async function runSingleClient(id, silent = true) {
  const stats = {
    id,
    status: 'pending',
    error: null,
    connectionTime: null,
    firstResultTime: null,
    totalTranscriptionTime: null,
  };

  // Suppress logs from the client class to keep the summary clean
  const originalLog = console.log;
  if (silent) {
    console.log = () => {};
  }

  const client = new WebSocketSTTClient(CONFIG);
  const startTime = Date.now();

  try {
    await client.loadAudioFile();
    await client.connect();
    stats.connectionTime = Date.now() - startTime;

    let firstResultReceived = false;
    client.socket.on('speechRecognized', () => {
      if (!firstResultReceived) {
        stats.firstResultTime = Date.now() - (startTime + stats.connectionTime);
        firstResultReceived = true;
      }
    });

    await client.startStreaming();
    stats.totalTranscriptionTime = Date.now() - startTime;
    stats.status = 'success';
  } catch (error) {
    stats.status = 'failed';
    stats.error = error.message;
  } finally {
    if (client.socket) {
      await client.disconnect();
    }
    if (silent) {
      console.log = originalLog; // Restore console.log
    }
  }
  return stats;
}

/**
 * Prints the final summary report.
 */
function printReport(results, duration) {
  const successfulClients = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'success');
  const failedClients = results.filter((r) => r.status === 'rejected' || r.value.status === 'failed');

  const avgConnectionTime =
    successfulClients.reduce((sum, r) => sum + r.value.connectionTime, 0) / successfulClients.length || 0;
  const avgFirstResultTime =
    successfulClients.reduce((sum, r) => sum + r.value.firstResultTime, 0) / successfulClients.length || 0;

  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 STRESS TEST COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Total Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`CPU Cores: ${os.cpus().length}`);
  console.log('');
  console.log('--- RESULTS ---');
  console.log(`✅ Successful Clients: ${successfulClients.length}`);
  console.log(`❌ Failed Clients:     ${failedClients.length}`);
  console.log('');
  console.log('--- PERFORMANCE (for successful clients) ---');
  console.log(`⏱️  Average Connection Time:   ${avgConnectionTime.toFixed(2)}ms`);
  console.log(`⏱️  Average Time to 1st Result: ${avgFirstResultTime.toFixed(2)}ms`);
  console.log('═'.repeat(60));

  if (failedClients.length > 0) {
    console.log('\n--- FAILURE DETAILS ---');
    const errorSummary = failedClients.reduce((acc, r) => {
      const errorMsg = r.reason?.message || r.value?.error || 'Unknown Error';
      acc[errorMsg] = (acc[errorMsg] || 0) + 1;
      return acc;
    }, {});
    for (const [error, count] of Object.entries(errorSummary)) {
      console.log(`- [${count}x] ${error}`);
    }
    console.log('═'.repeat(60));
  }
}

// --- Main Execution ---

async function main() {
  const { numClients, rampUpMs } = parseArgs();
  const overallStartTime = Date.now();

  console.log('🚀 Starting WebSocket Stress Test...');
  console.log(`Simulating ${numClients} concurrent clients over ${rampUpMs}ms.`);
  console.log('Each client will connect, stream a file, and disconnect.');
  console.log('Please wait, this may take a while...');

  const clientPromises = [];
  const delayPerClient = rampUpMs / numClients;

  for (let i = 0; i < numClients; i++) {
    const clientPromise = runSingleClient(i + 1).then((stats) => {
      process.stdout.write(stats.status === 'success' ? '✅' : '❌');
      return stats;
    });
    clientPromises.push(clientPromise);
    await delay(delayPerClient);
  }

  const results = await Promise.allSettled(clientPromises);
  const overallDuration = Date.now() - overallStartTime;

  printReport(results, overallDuration);
}

main().catch((error) => {
  console.error('\n💥 An unexpected error occurred during the test:', error);
  process.exit(1);
});
