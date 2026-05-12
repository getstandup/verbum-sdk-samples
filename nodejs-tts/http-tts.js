/**
 * HTTP Text-To-Speech Example
 *
 * Demonstrates TTS via the REST HTTP endpoint:
 *   POST /v1/speech/synthesize
 *
 * Supports both plain text and SSML (for speed/prosody control).
 * Saves the resulting audio as an MP3 file.
 *
 * Usage:
 *   npm run http
 */

'use strict';

require('dotenv').config();
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
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wraps plain text in SSML with a prosody rate tag.
 * @param {string} text       The text to speak.
 * @param {string} voice      The voice name.
 * @param {string} language   The BCP-47 language code (e.g. "en-US").
 * @param {number} speedRate  Prosody rate multiplier (e.g. 1.5 = 150% speed).
 */
function buildSSML(text, voice, language, speedRate) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
  <voice name="${voice}">
    <prosody rate="${speedRate}">
      ${text}
    </prosody>
  </voice>
</speak>`;
}

/**
 * Synthesizes text via HTTP POST and saves it to an MP3 file.
 *
 * @param {string}  text       The text (or SSML) to synthesize.
 * @param {'plain'|'ssml'} type  Content type.
 * @param {string}  outputFile  Path of the file to write.
 */
async function synthesizeHttp(text, type, outputFile) {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/speech/synthesize`;

  const body = JSON.stringify({
    text,
    type,
    voice: CONFIG.voice,
    audioFormat: CONFIG.audioFormat,
  });

  console.log(`\nPOST ${url}`);
  console.log(`  type     : ${type}`);
  console.log(`  voice    : ${CONFIG.voice}`);
  console.log(`  format   : ${CONFIG.audioFormat}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey,
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorBody}`);
  }

  const audioBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputFile, Buffer.from(audioBuffer));
  console.log(`  saved to : ${outputFile} (${audioBuffer.byteLength} bytes)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // --- Example 1: plain text at normal speed ---
  const plainText = 'Hello! This is a plain text synthesis using the HTTP endpoint.';
  await synthesizeHttp(plainText, 'plain', path.join(__dirname, 'output-http-plain.mp3'));

  // --- Example 2: SSML with custom speed (1.4x) ---
  const ssml = buildSSML(
    'This sentence is synthesized via SSML at one-point-four times the normal speed.',
    CONFIG.voice,
    'en-US',
    1.4
  );
  await synthesizeHttp(ssml, 'ssml', path.join(__dirname, 'output-http-ssml.mp3'));

  console.log('\nAll done! Open output-http-plain.mp3 and output-http-ssml.mp3 to verify the audio.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
