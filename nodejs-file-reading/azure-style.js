const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

/**
 * Azure-Style WAV File Reader for Speech-to-Text
 * Based on Azure SDK example: send raw chunks without over-processing
 */

// Configuration
const CONFIG = {
  serverUrl: 'ws://localhost:3000',
  apiKey: 'OM.7Bwp3F3yhrFvgdi3jrRKlhrzsp7QdY8XjUWZa7JrTKE=',
  audioFile: path.join(__dirname, '../file-source-nodejs/test_mono_3-2.wav'),
  sttOptions: {
    language: ['es-ES'],
    encoding: 'PCM',
    sampleRate: 8000,
    profanityFilter: 'raw',
    diarization: false,
    tags: JSON.stringify({
      company: 'OneMeta',
      session: 'azure-style-test',
      environment: 'local',
    }),
  },
};

class AzureStyleReader {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.isConnected = false;
    this.transcriptionResults = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔗 Connecting to WebSocket server...');

      this.socket = io(`${this.config.serverUrl}/listen`, {
        transports: ['websocket'],
        query: this.config.sttOptions,
        auth: { token: this.config.apiKey },
        upgrade: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected:', this.socket.id);
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        reject(error);
      });

      this.socket.on('speechRecognized', (data) => {
        console.log('\n🎉 TRANSCRIPTION RECEIVED:', JSON.stringify(data, null, 2));
        this.handleSpeechResult(data);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        this.isConnected = false;
      });

      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  async streamAudioAzureStyle() {
    return new Promise((resolve, reject) => {
      console.log('🎵 Starting Azure-style audio streaming...');
      console.log(`📁 File: ${this.config.audioFile}`);

      // Extract PCM data from WAV file first
      const audioData = fs.readFileSync(this.config.audioFile);

      // Simple WAV header skip (44 bytes for standard WAV)
      let audioBuffer = audioData.slice(44);

      // If that doesn't work, find the data chunk properly
      if (audioBuffer.length < 1000) {
        console.log('🔧 Using proper WAV data chunk extraction...');
        let dataOffset = 36;
        while (dataOffset < audioData.length - 8) {
          const chunkId = audioData.toString('ascii', dataOffset, dataOffset + 4);
          if (chunkId === 'data') {
            const dataSize = audioData.readUInt32LE(dataOffset + 4);
            audioBuffer = audioData.slice(dataOffset + 8, dataOffset + 8 + dataSize);
            break;
          }
          const chunkSize = audioData.readUInt32LE(dataOffset + 4);
          dataOffset += 8 + chunkSize;
        }
      }

      console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);
      console.log(`⏱️  Duration: ~${(audioBuffer.length / (16000 * 2)).toFixed(2)}s`);

      // Create a readable stream from the buffer (Azure style)
      let position = 0;
      let chunkCount = 0;
      const chunkSize = 4096; // Azure uses larger chunks

      const sendNextChunk = () => {
        if (position >= audioBuffer.length) {
          console.log('\n🏁 All chunks sent, closing stream...');

          // Send close signal (like Azure: pushStream.close())
          setTimeout(() => {
            console.log('📤 Sending streamEnd signal...');
            this.socket.emit('streamEnd');
            resolve();
          }, 1000);

          return;
        }

        // Get chunk (like Azure: arrayBuffer.slice())
        const end = Math.min(position + chunkSize, audioBuffer.length);
        const chunk = audioBuffer.slice(position, end);

        // Send raw chunk (minimal processing like Azure)
        this.socket.emit('audioStream', chunk);

        if (chunkCount < 5) {
          console.log(`📤 Chunk ${chunkCount}: ${chunk.length} bytes`);

          // Check audio activity
          let hasAudio = false;
          for (let i = 0; i < chunk.length; i += 2) {
            if (Math.abs(chunk.readInt16LE(i)) > 100) {
              hasAudio = true;
              break;
            }
          }
          console.log(`   Audio detected: ${hasAudio ? 'YES' : 'NO'}`);
        }

        position = end;
        chunkCount++;

        const progress = ((position / audioBuffer.length) * 100).toFixed(1);
        process.stdout.write(`\r📈 Progress: ${progress}% `);

        // Schedule next chunk (faster than our previous attempts)
        setTimeout(sendNextChunk, 10); // Very fast like file reading
      };

      // Start sending chunks
      sendNextChunk();
    });
  }

  handleSpeechResult(data) {
    const { status, id, text, confidence, language } = data;

    if (status === 'recognizing') {
      process.stdout.write(`\r🔄 Recognizing: "${text || '...'}" `);
    } else if (status === 'recognized') {
      console.log(`\n✨ FINAL: "${text}"`);
      console.log(`   Language: ${language}, Confidence: ${confidence}`);

      this.transcriptionResults.push({ id, text, confidence, language });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  printResults() {
    console.log('\n📋 TRANSCRIPTION RESULTS');
    console.log('='.repeat(50));

    if (this.transcriptionResults.length === 0) {
      console.log('❌ No transcription results received');
      return;
    }

    const fullText = this.transcriptionResults.map((r) => r.text).join(' ');
    console.log(`✅ SUCCESS: "${fullText}"`);
    console.log(`📊 Segments: ${this.transcriptionResults.length}`);
  }
}

async function main() {
  console.log('🚀 Azure-Style WAV File Reader Test');
  console.log('=====================================');

  const reader = new AzureStyleReader(CONFIG);

  process.on('SIGINT', () => {
    console.log('\n🛑 Interrupted');
    reader.printResults();
    reader.disconnect();
    process.exit(0);
  });

  try {
    await reader.connect();
    await reader.streamAudioAzureStyle();

    console.log('\n⏳ Waiting for final results...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    reader.printResults();
    reader.disconnect();
  } catch (error) {
    console.error('💥 Error:', error.message);
    reader.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
