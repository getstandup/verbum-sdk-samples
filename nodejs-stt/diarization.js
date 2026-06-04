/**
 * Speech-to-Text with Speaker Diarization Example
 *
 * Demonstrates STT with speaker identification via WebSocket.
 * Diarization identifies different speakers in an audio stream.
 *
 * Usage:
 *   npm run diarization
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
  outputFile: path.join(__dirname, 'output-diarization.json'),
};

if (!CONFIG.apiKey || CONFIG.apiKey === 'your_api_key_here') {
  console.error('ERROR: Set API_KEY in your .env file');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Diarization STT Client
// ---------------------------------------------------------------------------

class DiarizationSTTClient {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.segments = [];
    this.currentSegment = null;
  }

  /**
   * Connect to the WebSocket server
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

      // Listen for transcription results with diarization info
      this.socket.on('speechRecognized', (data) => {
        const status = data.status || '';
        if (status === 'recognizing') {
          if (data.speakerId) {
            const speaker = `Speaker-${data.speakerId}`;
            console.log(`  [${speaker}] ${data.text}`);
          }
        } else if (status === 'recognized') {
          if (data.segments) {
            // Store segments with speaker information
            data.segments.forEach((segment) => {
              this.segments.push({
                speaker: `Speaker-${segment.speakerId || '0'}`,
                transcript: segment.transcript,
                startTime: segment.startTime,
                endTime: segment.endTime,
                confidence: segment.confidence,
                speakerId: segment.speakerId,
              });
              console.log(
                `  [Speaker-${segment.speakerId || '0'}] ${segment.transcript} (${segment.startTime}s - ${
                  segment.endTime
                }s)`
              );
            });
          }

          // Also store the full transcript
          this.segments.push({
            type: 'full',
            transcript: data.text,
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
   * Start diarization transcription
   */
  async startTranscription() {
    console.log(`\nStarting diarization from: ${this.config.audioFile}`);

    if (!fs.existsSync(this.config.audioFile)) {
      throw new Error(`Audio file not found: ${this.config.audioFile}`);
    }

    const audioData = fs.readFileSync(this.config.audioFile);
    const chunkSize = 1024;

    return new Promise((resolve, reject) => {
      let offset = 0;

      // Start transcription with diarization enabled
      this.socket.emit('startTranscription', {
        language: [this.config.language],
        encoding: 'PCM',
        sampleRate: 16000,
        diarization: true, // Enable speaker diarization
        diarizationSpeakerCount: null, // Auto-detect speaker count, or set to specific number (2, 3, etc.)
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

        this.socket.emit('audioStream', chunk);
      }, 20);

      const timeout = setTimeout(() => {
        clearInterval(streamInterval);
        reject(new Error('Transcription timeout'));
      }, 300000);

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
    // Group segments by speaker for easier reading
    const speakerMap = {};
    const segmentList = [];

    this.segments.forEach((segment) => {
      if (segment.type !== 'full') {
        if (!speakerMap[segment.speaker]) {
          speakerMap[segment.speaker] = [];
        }
        speakerMap[segment.speaker].push(segment);
      }
      segmentList.push(segment);
    });

    const results = {
      config: {
        language: this.config.language,
        audioFile: path.basename(this.config.audioFile),
        diarization: true,
      },
      timestamp: new Date().toISOString(),
      summary: {
        totalSpeakers: Object.keys(speakerMap).length,
        speakers: Object.keys(speakerMap),
      },
      speakerBreakdown: speakerMap,
      allSegments: segmentList,
    };

    fs.writeFileSync(this.config.outputFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${this.config.outputFile}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const client = new DiarizationSTTClient(CONFIG);

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
