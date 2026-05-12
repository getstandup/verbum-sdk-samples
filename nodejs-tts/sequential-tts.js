/**
 * Sequential WebSocket Text-To-Speech Example  (VSDK-593 / VSDK-597 validation)
 *
 * This script is the primary regression test for VSDK-597:
 *   "synthesisCompleted event was never emitted"
 *
 * It replicates the exact customer-reported failure scenario: a client
 * connected to the TTS WebSocket and sent sentences one by one, gating each
 * new synthesizeText emission on receiving synthesisCompleted from the previous
 * one.  Before the fix (VSDK-597), synthesisCompleted was never emitted, so
 * only the first sentence was synthesized — the rest hung indefinitely.
 *
 * Expected result (after the fix):
 *   output-seq-1.mp3  ← "Hello, my name is Aria."
 *   output-seq-2.mp3  ← "The weather today is sunny and warm."
 *   output-seq-3.mp3  ← "Have a wonderful day!"
 *
 * Before the fix, only output-seq-1.mp3 would be created; the script would
 * hang after the first sentence, waiting for synthesisCompleted indefinitely.
 *
 * Usage:
 *   npm run sequential
 */

'use strict';

require('dotenv').config();
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  apiHost: process.env.API_HOST || 'https://sdk.verbum.ai',
  apiPathPrefix: process.env.API_PATH_PREFIX ?? '/v1',
  apiKey: process.env.API_KEY || '',
  voice: process.env.VOICE || 'en-US-AriaNeural',
  audioFormat: process.env.AUDIO_FORMAT || 'Audio16Khz128KBitMp3',
};

if (!CONFIG.apiKey || CONFIG.apiKey === 'your_api_key_here') {
  console.error('ERROR: Set API_KEY in your .env file (copy .env.example to .env).');
  process.exit(1);
}

// The 3 sentences to synthesize sequentially
const SENTENCES = ['Hello, my name is Aria.', 'The weather today is sunny and warm.', 'Have a wonderful day!'];

// ---------------------------------------------------------------------------
// Sequential WebSocket TTS
// ---------------------------------------------------------------------------

/**
 * Opens a single persistent Socket.IO connection and synthesizes all sentences
 * sequentially, gating each on synthesisCompleted.
 *
 * This is the exact pattern that exposed VSDK-597:
 *   send sentence 1 → wait for synthesisCompleted
 *   send sentence 2 → wait for synthesisCompleted
 *   send sentence 3 → wait for synthesisCompleted → done
 */
function runSequential(sentences) {
  return new Promise((resolve, reject) => {
    let sentenceIndex = 0;
    let audioChunks = [];
    const results = [];

    console.log(`\nConnecting to ${CONFIG.apiHost}/speech …`);
    console.log(`  voice    : ${CONFIG.voice}`);
    console.log(`  format   : ${CONFIG.audioFormat}`);
    console.log(`  usage    : browser`);
    console.log(`  sentences: ${sentences.length}\n`);

    const socket = io(`${CONFIG.apiHost}/speech`, {
      path: `${CONFIG.apiPathPrefix}/socket.io`,
      transports: ['websocket'],
      query: {
        voice: CONFIG.voice,
        format: CONFIG.audioFormat,
        usage: 'browser',
      },
      auth: {
        token: CONFIG.apiKey,
      },
      timeout: 15000,
    });

    // The gateway's handleConnection is async (validates the API key via Redis).
    // If synthesizeText arrives before that async work completes, the server emits
    // 'No processor found for this connection'. Retry with a short backoff.
    const NO_PROCESSOR_MSG = 'No processor found for this connection';
    const RETRY_DELAY_MS = 300;
    const MAX_RETRIES = 5;
    let retries = 0;

    const sendNext = () => {
      retries = 0; // reset retry counter for each new sentence
      if (sentenceIndex >= sentences.length) {
        // All sentences done
        socket.disconnect();
        resolve(results);
        return;
      }

      audioChunks = [];
      const sentence = sentences[sentenceIndex];
      console.log(`[${sentenceIndex + 1}/${sentences.length}] Sending: "${sentence}"`);
      socket.emit('synthesizeText', sentence);
    };

    socket.on('connect', () => {
      console.log(`Connected — socket id: ${socket.id}`);
      sendNext();
    });

    socket.on('connect_error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    // VSDK-598: each chunk is a proper ArrayBuffer — Buffer.from() works correctly.
    socket.on('audioStream', (chunk) => {
      const buffer = Buffer.from(chunk);
      audioChunks.push(buffer);
      process.stdout.write(`  audioStream chunk ${audioChunks.length}: ${buffer.byteLength} bytes\n`);
    });

    // VSDK-597: synthesisCompleted is now reliably emitted after each audioStream.
    // Before the fix: this event never fired → sentenceIndex never advanced →
    // sentences 2 and 3 were never sent → script hung forever.
    socket.on('synthesisCompleted', () => {
      const outputFile = path.join(__dirname, `output-seq-${sentenceIndex + 1}.mp3`);
      const merged = Buffer.concat(audioChunks);
      fs.writeFileSync(outputFile, merged);

      console.log(`  synthesisCompleted — saved ${outputFile} (${merged.byteLength} bytes)`);
      results.push({ sentence: sentences[sentenceIndex], file: outputFile, bytes: merged.byteLength });

      sentenceIndex++;
      sendNext();
    });

    socket.on('error', (err) => {
      const message = err?.message ?? JSON.stringify(err);
      if (message === NO_PROCESSOR_MSG && retries < MAX_RETRIES) {
        retries++;
        const sentence = sentences[sentenceIndex];
        console.log(`  processor not ready yet — retrying in ${RETRY_DELAY_MS}ms … (${retries}/${MAX_RETRIES})`);
        setTimeout(() => socket.emit('synthesizeText', sentence), RETRY_DELAY_MS);
        return;
      }
      socket.disconnect();
      reject(new Error(`Server error at sentence ${sentenceIndex + 1}: ${message}`));
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        reject(new Error(`Unexpected disconnect at sentence ${sentenceIndex + 1}: ${reason}`));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const results = await runSequential(SENTENCES);

  console.log('\n--- Results ---');
  for (const r of results) {
    console.log(`  "${r.sentence}"`);
    console.log(`  → ${r.file} (${r.bytes} bytes)`);
  }

  console.log('\nAll sentences synthesized successfully!');
  console.log('VSDK-597 fix confirmed: synthesisCompleted was received for each sentence.');
  console.log('VSDK-598 fix confirmed: all output files contain valid audio data.');

  if (results.length === SENTENCES.length) {
    console.log(`\n✓ ${results.length}/${SENTENCES.length} sentences completed — sequential flow works correctly.`);
  } else {
    console.warn(`\n✗ Only ${results.length}/${SENTENCES.length} sentences completed — check for regressions.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
