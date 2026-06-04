/**
 * Basic Speech-to-Text Example
 *
 * Demonstrates STT via WebSocket with real-time streaming:
 *   Namespace: /listen
 *   Events: startTranscription, audioStream, streamEnd (client→server)
 *           speechRecognized (server→client)
 *
 * Usage:
 *   npm run basic
 */

'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { io } = require('socket.io-client');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  apiHost: process.env.API_HOST || 'https://sdk.verbum.ai',
  apiKey: process.env.API_KEY || '',
  language: process.env.LANGUAGE || 'en-US',
  audioFile: process.env.AUDIO_FILE || path.join(__dirname, './sample.wav'),
  outputFile: path.join(__dirname, 'output-basic.json'),
};

if (!CONFIG.apiKey || CONFIG.apiKey === 'your_api_key_here') {
  console.error('ERROR: Set API_KEY in your .env file');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// STT Client
// ---------------------------------------------------------------------------

class STTClient {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.transcripts = [];
    this.currentTranscript = '';
  }

  /**
   * Connect to the WebSocket server and initialize the transcription session
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`\nConnecting to ${this.config.apiHost}/listen...`);

      this.socket = io(`${this.config.apiHost}/listen`, {
        query: {
          token: this.config.apiKey,
          language: this.config.language,
          usage: 'browser',
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('✓ Connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        reject(new Error(error));
      });

      // Listen for transcription results
      this.socket.on('speechRecognized', (data) => {
        const status = data.status || '';
        this.currentTranscript = data.text || '';
        if (status === 'recognizing') {
          console.log(`  [interim] ${this.currentTranscript}`);
        } else if (status === 'recognized') {
          console.log(`  [final] ${this.currentTranscript}`);
          this.transcripts.push({
            transcript: this.currentTranscript,
            language: data.language,
            confidence: data.confidence,
            timestamp: new Date().toISOString(),
          });
        }
      });

      this.socket.on('transcriptionError', (error) => {
        console.error('Transcription error:', error);
        reject(new Error(error.message || 'Transcription failed'));
      });
    });
  }

  /**
   * Start transcription and stream audio file
   */
  async startTranscription() {
    console.log(`\nStarting transcription from: ${this.config.audioFile}`);

    // Check if file exists
    if (!fs.existsSync(this.config.audioFile)) {
      throw new Error(`Audio file not found: ${this.config.audioFile}`);
    }

    const audioData = fs.readFileSync(this.config.audioFile);
    const chunkSize = 1024;

    return new Promise((resolve, reject) => {
      let offset = 0;

      // Emit the start event with STT options
      this.socket.emit('startTranscription', {
        language: [this.config.language],
        encoding: 'PCM',
        sampleRate: 16000,
      });

      const streamInterval = setInterval(() => {
        if (offset >= audioData.length) {
          clearInterval(streamInterval);
          this.socket.emit('streamEnd');
          resolve();
          return;
        }

        const chunk = audioData.slice(offset, offset + chunkSize);
        offset += chunkSize;

        // Send audio chunk
        this.socket.emit('audioStream', chunk);
      }, 20); // 20ms interval for realistic streaming

      // Handle stream end
      const timeout = setTimeout(() => {
        clearInterval(streamInterval);
        reject(new Error('Transcription timeout'));
      }, 300000); // 5 minute timeout

      this.socket.once('speechRecognized', (data) => {
        if (data.status === 'recognized') {
          clearTimeout(timeout);
        }
      });
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Disconnected');
    }
  }

  /**
   * Save results to JSON file
   */
  saveResults() {
    const results = {
      config: {
        language: this.config.language,
        audioFile: path.basename(this.config.audioFile),
      },
      timestamp: new Date().toISOString(),
      transcripts: this.transcripts,
      fullTranscript: this.transcripts.map((t) => t.transcript).join(' '),
    };

    fs.writeFileSync(this.config.outputFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${this.config.outputFile}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const client = new STTClient(CONFIG);

  try {
    await client.connect();
    await client.startTranscription();
    client.saveResults();
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    client.disconnect();
  }
}

main();
