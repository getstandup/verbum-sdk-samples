/**
 * WebSocket Text-To-Speech Example  (VSDK-593 validation)
 *
 * Demonstrates TTS via the Socket.IO WebSocket endpoint:
 *   wss://<host>/speech  (Socket.IO namespace)
 *
 * Connection query parameters:
 *   voice   – voice identifier (e.g. en-US-AriaNeural)
 *   format  – audio format   (e.g. Audio16Khz128KBitMp3)
 *   usage   – always "browser" for both browser and Node.js clients
 *
 * Event flow:
 *   Client → Server : synthesizeText  (string)
 *   Server → Client : audioStream     (ArrayBuffer)   one or more chunks
 *   Server → Client : synthesisCompleted              signals the server is done
 *   Server → Client : error           ({ message })   on failure
 *
 * VSDK-593 fixes verified by this script:
 *   VSDK-597 – synthesisCompleted is now emitted; the script resolves only
 *              after receiving it (it would hang here before the fix).
 *   VSDK-598 – audioStream carries a real ArrayBuffer, not a PassThrough
 *              stream; concatenating chunks and writing the file works
 *              correctly (before the fix, the saved file would be empty/corrupt).
 *
 * Usage:
 *   npm run websocket
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

// ---------------------------------------------------------------------------
// WebSocket TTS client
// ---------------------------------------------------------------------------

/**
 * Synthesizes a single text string via WebSocket and saves it to an MP3 file.
 * Resolves after synthesisCompleted is received — the key VSDK-597 signal.
 *
 * @param {string} text       Text to synthesize.
 * @param {string} outputFile Path for the resulting MP3.
 */
// The gateway's handleConnection is async (validates the API key via Redis).
// If synthesizeText arrives before that async work completes, the server emits
// 'No processor found for this connection'. Retry a few times with a short
// backoff to outlast the race window.
const NO_PROCESSOR_MSG = 'No processor found for this connection';
const RETRY_DELAY_MS = 300;
const MAX_RETRIES = 5;

function synthesizeWebSocket(text, outputFile) {
  return new Promise((resolve, reject) => {
    const audioChunks = [];
    let retries = 0;

    console.log(`\nConnecting to ${CONFIG.apiHost}/speech …`);
    console.log(`  voice    : ${CONFIG.voice}`);
    console.log(`  format   : ${CONFIG.audioFormat}`);
    console.log(`  usage    : browser`);

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

    const emitSynthesizeText = () => {
      console.log(`  emitting  : synthesizeText${retries > 0 ? ` (retry ${retries}/${MAX_RETRIES})` : ''}`);
      socket.emit('synthesizeText', text);
    };

    socket.on('connect', () => {
      console.log(`  connected : socket id ${socket.id}`);
      emitSynthesizeText();
    });

    socket.on('connect_error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    // VSDK-598: audioStream now carries a proper ArrayBuffer (not a PassThrough stream).
    // Each emission may be a chunk; accumulate all of them.
    socket.on('audioStream', (chunk) => {
      const buffer = Buffer.from(chunk);
      audioChunks.push(buffer);
      console.log(`  audioStream chunk received: ${buffer.byteLength} bytes (total chunks: ${audioChunks.length})`);
    });

    // VSDK-597: synthesisCompleted is now emitted after the audio stream.
    // Before the fix, this event was never sent and the promise would hang forever.
    socket.on('synthesisCompleted', () => {
      console.log(`  synthesisCompleted received`);

      const merged = Buffer.concat(audioChunks);
      fs.writeFileSync(outputFile, merged);
      console.log(`  saved to  : ${outputFile} (${merged.byteLength} bytes, ${audioChunks.length} chunk(s))`);

      socket.disconnect();
      resolve();
    });

    socket.on('error', (err) => {
      const message = err?.message ?? JSON.stringify(err);
      if (message === NO_PROCESSOR_MSG && retries < MAX_RETRIES) {
        retries++;
        console.log(`  processor not ready yet — retrying in ${RETRY_DELAY_MS}ms …`);
        setTimeout(emitSynthesizeText, RETRY_DELAY_MS);
        return;
      }
      socket.disconnect();
      reject(new Error(`Server error: ${message}`));
    });

    socket.on('disconnect', (reason) => {
      console.log(`  disconnected: ${reason}`);
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const text = 'Hello! This sentence was synthesized using the WebSocket endpoint.';

  await synthesizeWebSocket(text, path.join(__dirname, 'output-websocket.mp3'));

  console.log('\nDone! Open output-websocket.mp3 to verify the audio.');
  console.log('If synthesisCompleted was received, VSDK-597 fix is confirmed.');
  console.log('If the MP3 file contains valid audio, VSDK-598 fix is confirmed.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
