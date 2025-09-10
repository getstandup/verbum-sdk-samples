const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

/**
 * Real-time Speech-to-Text WebSocket Client Example
 *
 * This example demonstrates how to connect to the vcall-seamless WebSocket API
 * for real-time speech-to-text transcription using a WAV file as the audio source.
 */

// Configuration
const CONFIG = {
  // WebSocket server URL - replace with your actual server URL
  serverUrl: 'wss://sdk.verbum.ai',

  // Your API key - replace with your actual API key
  apiKey: 'YOUR_API_KEY',

  // Audio file path - Supports both 8kHz and 16kHz audio files
  audioFile: path.join(__dirname, './TalkForAFewSeconds16.wav'), // Test with 16kHz file

  // STT configuration parameters
  sttOptions: {
    language: ['en-US'], // Language for the audio file
    encoding: 'PCM', // Audio encoding format
    sampleRate: 8000, // Default sample rate - will be auto-detected and updated from audio file
    profanityFilter: 'raw', // Enable/disable profanity filtering: 'raw', 'masked', 'removed'
    diarization: false, // Enable/disable speaker diarization
    // analyzeSentiments: false, // Enable/disable sentiment analysis
    // translateTo: [], // Translation target languages (array)
    // translateModel: 'default', // Translation model ('default' or 'gpt4.1')
    // redact: [], // PII categories to redact (array)
    tags: JSON.stringify({ session: 'file-demo' }), // Custom tags for metrics
  },

  // Audio streaming configuration
  streaming: {
    chunkSize: 1024, // Audio chunk size in bytes
    intervalMs: 20, // WORKING INTERVAL: Use 20ms for better recognition
  },
};

class WebSocketSTTClient {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.isConnected = false;
    this.audioBuffer = null;
    this.streamingInterval = null;
    this.currentPosition = 0;
    this.detectedSampleRate = null; // Store the auto-detected sample rate
  }

  /**
   * Connect to the WebSocket server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔗 Connecting to WebSocket server...');

      // Create socket connection
      this.socket = io(`${this.config.serverUrl}/listen`, {
        // path: '/v1/socket.io',
        transports: ['websocket'],
        query: this.config.sttOptions,
        auth: {
          token: this.config.apiKey,
        },
        timeout: 10000,
        upgrade: true,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        console.log('📡 Socket ID:', this.socket.id);
        console.log('🔧 Query params:', this.config.sttOptions);
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        console.error('❌ Error details:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
        this.isConnected = false;
        this.stopStreaming();
      });

      this.socket.on('error', (error) => {
        console.error('🚨 Socket error:', error);
      });

      // STT response handlers
      this.socket.on('speechRecognized', (data) => {
        console.log('\n📥 Received speechRecognized event:', JSON.stringify(data, null, 2));
        this.handleSpeechResult(data);
      });

      // Add debugging for all events
      this.socket.onAny((eventName, ...args) => {
        if (eventName !== 'speechRecognized') {
          console.log(`📡 Received event: ${eventName}`, args);
        }
      });

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 15000);
    });
  }

  /**
   * Load and extract raw PCM data from WAV file
   */
  async loadAudioFile() {
    try {
      console.log('🎵 Loading audio file:', this.config.audioFile);

      // Check if file exists
      if (!fs.existsSync(this.config.audioFile)) {
        throw new Error(`Audio file not found: ${this.config.audioFile}`);
      }

      // Read WAV file as raw buffer
      const audioData = fs.readFileSync(this.config.audioFile);

      // Extract raw PCM data from WAV file (skip WAV header)
      this.audioBuffer = this.extractPCMFromWAV(audioData);

      console.log('✅ Audio file loaded and raw PCM extracted');
      console.log(`   Final buffer size: ${this.audioBuffer.length} bytes`);

      return true;
    } catch (error) {
      console.error('❌ Failed to load audio file:', error.message);
      throw error;
    }
  }

  /**
   * Update STT options based on detected audio properties
   */
  updateSTTOptionsFromAudio() {
    if (!this.detectedSampleRate) {
      throw new Error('No audio file loaded - cannot update STT options');
    }

    console.log('🔧 Updating STT options based on detected audio properties...');
    console.log(`   Original sample rate setting: ${this.config.sttOptions.sampleRate}Hz`);
    console.log(`   Detected sample rate: ${this.detectedSampleRate}Hz`);

    // Update the sample rate in STT options
    this.config.sttOptions.sampleRate = this.detectedSampleRate;

    // Update expected duration calculation based on actual sample rate
    const expectedDurationSeconds = this.audioBuffer.length / (this.detectedSampleRate * 2);
    console.log(
      `   Updated expected duration: ~${expectedDurationSeconds.toFixed(2)}s at ${this.detectedSampleRate}Hz 16-bit`
    );

    console.log('✅ STT options updated successfully');
    console.log(`   Final STT config:`, {
      sampleRate: this.config.sttOptions.sampleRate,
      language: this.config.sttOptions.language,
      encoding: this.config.sttOptions.encoding,
    });
  }

  /**
   * Extract raw PCM data from WAV file by skipping the header
   */
  extractPCMFromWAV(buffer) {
    console.log('🔄 Extracting raw PCM data from WAV file...');

    // WAV file structure:
    // Bytes 0-3: "RIFF"
    // Bytes 4-7: File size
    // Bytes 8-11: "WAVE"
    // Bytes 12-15: "fmt "
    // Bytes 16-19: Format chunk size (usually 16)
    // Bytes 20-21: Audio format (1 = PCM)
    // Bytes 22-23: Number of channels
    // Bytes 24-27: Sample rate
    // Bytes 28-31: Byte rate
    // Bytes 32-33: Block align
    // Bytes 34-35: Bits per sample
    // Bytes 36-39: "data"
    // Bytes 40-43: Data chunk size
    // Bytes 44+: Raw PCM data

    // Verify it's a valid WAV file
    const riff = buffer.toString('ascii', 0, 4);
    const wave = buffer.toString('ascii', 8, 12);

    if (riff !== 'RIFF' || wave !== 'WAVE') {
      throw new Error('Invalid WAV file format');
    }

    // Read format information
    const audioFormat = buffer.readUInt16LE(20);
    const numChannels = buffer.readUInt16LE(22);
    const sampleRate = buffer.readUInt32LE(24);
    const bitsPerSample = buffer.readUInt16LE(34);

    console.log('📊 WAV file info:');
    console.log(`   Audio Format: ${audioFormat} (1=PCM)`);
    console.log(`   Channels: ${numChannels}`);
    console.log(`   Sample Rate: ${sampleRate}Hz`);
    console.log(`   Bits per Sample: ${bitsPerSample}`);

    // Validate format requirements
    // Validate format matches our expectations
    if (audioFormat !== 1) {
      throw new Error(`Unsupported audio format: ${audioFormat} (expected PCM=1)`);
    }
    if (numChannels !== 1) {
      throw new Error(`Unsupported channel count: ${numChannels} (expected mono=1)`);
    }

    // Validate sample rate - only 8kHz and 16kHz are supported
    if (sampleRate !== 8000 && sampleRate !== 16000) {
      throw new Error(`Unsupported sample rate: ${sampleRate}Hz (supported: 8000Hz, 16000Hz)`);
    }

    if (bitsPerSample !== 16) {
      throw new Error(`Unsupported bit depth: ${bitsPerSample}-bit (expected 16-bit)`);
    }

    // Store the detected sample rate for dynamic configuration
    this.detectedSampleRate = sampleRate;
    console.log(`✅ Audio validation passed - Sample rate: ${sampleRate}Hz`);

    // Find the data chunk
    let dataOffset = 36; // Standard offset for simple WAV files

    // Look for "data" chunk marker
    while (dataOffset < buffer.length - 4) {
      const chunkId = buffer.toString('ascii', dataOffset, dataOffset + 4);
      if (chunkId === 'data') {
        const dataSize = buffer.readUInt32LE(dataOffset + 4);
        console.log(`   Data chunk size: ${dataSize} bytes`);

        // Extract raw PCM data (skip 8 bytes: 4 for "data" + 4 for size)
        const rawPcmData = buffer.slice(dataOffset + 8, dataOffset + 8 + dataSize);

        // Add a brief tone marker at the beginning to help Azure recognize the start
        const markerLength = Math.round(this.detectedSampleRate * 0.05 * 2); // 50ms marker at detected sample rate
        const enhancedData = Buffer.alloc(rawPcmData.length + markerLength);

        // Add a short 1kHz tone to mark the beginning (helps recognition systems)
        console.log('🎵 Adding recognition marker tone...');
        for (let i = 0; i < markerLength; i += 2) {
          const sampleIndex = i / 2;
          const value = Math.round(Math.sin((2 * Math.PI * 1000 * sampleIndex) / this.detectedSampleRate) * 8000);
          enhancedData.writeInt16LE(value, i);
        }

        // Copy the original audio data after the marker
        rawPcmData.copy(enhancedData, markerLength);

        console.log(`✅ Enhanced PCM data: ${enhancedData.length} bytes (marker + audio)`);
        console.log(`   Added ${markerLength} bytes recognition marker`);
        console.log(`   Original audio: ${rawPcmData.length} bytes`);

        return enhancedData;
      }

      // Move to next chunk
      const chunkSize = buffer.readUInt32LE(dataOffset + 4);
      dataOffset += 8 + chunkSize;
    }

    throw new Error('Could not find data chunk in WAV file');
  }

  /**
   * Start streaming audio to the WebSocket
   */
  startStreaming() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.audioBuffer) {
        const error = new Error('Cannot start streaming: not connected or no audio data');
        console.error('❌', error.message);
        reject(error);
        return;
      }

      console.log('🎙️  Starting audio streaming...');
      console.log(`   Chunk size: ${this.config.streaming.chunkSize} bytes`);
      console.log(`   Interval: ${this.config.streaming.intervalMs}ms`);

      this.currentPosition = 0;
      this.streamingResolve = resolve; // Store resolve for later

      this.streamingInterval = setInterval(() => {
        this.sendAudioChunk();
      }, this.config.streaming.intervalMs); // Back to original interval
    });
  }

  /**
   * Send an audio chunk to the WebSocket
   */
  sendAudioChunk() {
    if (this.currentPosition >= this.audioBuffer.length) {
      if (this.streamingInterval) {
        // Stop the interval first to prevent re-entry
        clearInterval(this.streamingInterval);
        this.streamingInterval = null;

        console.log('\n🏁 Audio streaming completed');

        // IMPORTANT FIX:
        // Now, wait for stopStreaming to finish before resolving the promise
        this.stopStreaming().then(() => {
          if (this.streamingResolve) {
            this.streamingResolve();
            this.streamingResolve = null;
          }
        });
      }
      return;
    }

    // Get next chunk of raw PCM data
    const chunkEnd = Math.min(this.currentPosition + this.config.streaming.chunkSize, this.audioBuffer.length);
    const rawChunk = this.audioBuffer.slice(this.currentPosition, chunkEnd);

    // Check if we have actual audio data (not all zeros) for logging
    let hasAudioData = false;
    for (let i = 0; i < rawChunk.length; i += 2) {
      const sample = Math.abs(rawChunk.readInt16LE(i));
      if (sample > 50) {
        // Higher threshold to avoid noise but allow low-volume speech
        hasAudioData = true;
        break;
      }
    }

    // Don't skip any chunks - send everything to ensure Azure gets all audio data

    // Process PCM data to match microphone processing
    const buffer = new ArrayBuffer(rawChunk.length);
    const view = new DataView(buffer);

    // Copy each sample with volume boost and ensure it's in the right format
    for (let i = 0; i < rawChunk.length; i += 2) {
      // Read the 16-bit sample as little-endian
      const sample = rawChunk.readInt16LE(i);

      // Apply moderate volume boost (1.1x) - less aggressive to avoid distortion
      const boostedSample = Math.max(-32768, Math.min(32767, Math.round(sample * 1.1)));

      // Write as 16-bit little-endian - exactly like the microphone code
      view.setInt16(i, boostedSample, true);
    }

    // Convert to Buffer for sending (node.js compatible)
    const processedChunk = Buffer.from(buffer);

    // Send processed PCM chunk to WebSocket
    if (this.currentPosition < this.config.streaming.chunkSize * 3) {
      console.log(
        `📤 Sending processed PCM chunk: ${processedChunk.length} bytes (${this.currentPosition}-${chunkEnd})`
      );

      // Log first few bytes for debugging
      const firstBytes = Array.from(processedChunk.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
      console.log(`   First bytes: ${firstBytes}`);

      // Log audio activity
      if (hasAudioData) {
        console.log(`   ✅ Audio activity detected in chunk`);
      } else {
        console.log(`   🔇 Silent chunk (marker/beginning)`);
      }
    }

    this.socket.emit('audioStream', processedChunk);

    // Update position
    this.currentPosition = chunkEnd;

    // Progress indicator
    const progress = ((this.currentPosition / this.audioBuffer.length) * 100).toFixed(1);
    process.stdout.write(`\r📤 Streaming progress: ${progress}%`);
  }

  /**
   * Stop audio streaming
   */
  stopStreaming() {
    return new Promise((resolve) => {
      if (this.streamingInterval) {
        clearInterval(this.streamingInterval);
        this.streamingInterval = null;
        console.log('\n⏹️  Audio streaming stopped');
      }

      // Wait a moment for any final audio processing before signaling end
      if (this.socket && this.isConnected) {
        setTimeout(() => {
          console.log('🏁 Sending streamEnd signal to server...');
          // Final check to ensure socket wasn't disconnected abruptly
          if (this.socket) {
            this.socket.emit('streamEnd');
          }
          resolve();
        }, 2000); // Wait 2 seconds before ending
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle speech recognition results
   */
  handleSpeechResult(data) {
    const { status, messageId, text, confidence, duration } = data;

    if (status === 'recognizing') {
      // Interim results (partial transcription)
      process.stdout.write(`\r🔄 Recognizing: ${text || '...'}`);
    } else if (status === 'recognized') {
      // Final results
      console.log(`\n✨ Final Result [${messageId}]:`);
      console.log(`   Text: "${text}"`);
      console.log(`   Confidence: ${confidence || 'N/A'}`);
      console.log(`   Duration: ${duration || 'N/A'}ms`);

      // Handle translations if available
      if (data.translations && data.translations.length > 0) {
        console.log('   Translations:');
        data.translations.forEach((translation) => {
          console.log(`     ${translation.to}: "${translation.text}"`);
        });
      }

      // Handle sentiment analysis if available
      if (data.sentiment) {
        console.log(`   Sentiment: ${data.sentiment.label} (${data.sentiment.score})`);
      }

      // Handle PII redaction if available
      if (data.redactedText && data.redactedText !== text) {
        console.log(`   Redacted: "${data.redactedText}"`);
      }

      console.log('─'.repeat(60));
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  async disconnect() {
    console.log('🔌 Disconnecting from server...');
    await this.stopStreaming();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    console.log('✅ Disconnected successfully');
  }

  /**
   * Validate configuration before connecting
   */
  validateConfig() {
    const required = ['language', 'encoding'];
    const missing = required.filter((key) => !this.config.sttOptions[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required STT options: ${missing.join(', ')}`);
    }

    // Validate profanityFilter is one of the allowed values
    if (!['raw', 'remove', 'mask'].includes(this.config.sttOptions.profanityFilter)) {
      throw new Error('profanityFilter must be one of: raw, remove, mask');
    }

    console.log('✅ Configuration validated');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 WebSocket Speech-to-Text File Example');
  console.log('═'.repeat(60));

  // Create client instance
  const client = new WebSocketSTTClient(CONFIG);

  try {
    // Validate configuration
    client.validateConfig();

    // Load audio file
    await client.loadAudioFile();

    // Update STT options based on detected audio properties
    client.updateSTTOptionsFromAudio();

    // Connect to WebSocket server
    await client.connect();

    // Start streaming audio and wait for completion
    await client.startStreaming();

    // Wait additional time for any final recognition results
    console.log('⏳ Waiting for final transcription results...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Disconnect
    await client.disconnect();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      client.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('💥 Application error:', error.message);
    client.disconnect();
    process.exit(1);
  }
}

// Export for potential module usage
module.exports = { WebSocketSTTClient, CONFIG };

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}
