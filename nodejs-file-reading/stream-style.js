const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

/**
 * Stream-style test based on Azure's fs.createReadStream approach
 */

const CONFIG = {
  serverUrl: 'ws://localhost:3000',
  apiKey: 'OM.7Bwp3F3yhrFvgdi3jrRKlhrzsp7QdY8XjUWZa7JrTKE=',
  audioFile: path.join(__dirname, '../file-source-nodejs/whatstheweatherlike.wav'),
  sttOptions: {
    language: ['en-US'],
    encoding: 'PCM',
    sampleRate: 16000,
    profanityFilter: 'raw',
    diarization: false,
    tags: JSON.stringify({ session: 'stream-style-test' }),
  },
};

async function streamStyleTest() {
  console.log('🧪 Stream-Style Test (Azure fs.createReadStream approach)');
  console.log('=========================================================');

  const socket = io(`${CONFIG.serverUrl}/listen`, {
    transports: ['websocket'],
    query: CONFIG.sttOptions,
    auth: { token: CONFIG.apiKey },
    upgrade: true,
  });

  let gotTranscription = false;

  socket.on('connect', () => {
    console.log('✅ Connected:', socket.id);

    // Read file like Azure example: fs.createReadStream(filename).on('data', ...)
    console.log(`📁 Reading file: ${CONFIG.audioFile}`);

    const stream = fs.createReadStream(CONFIG.audioFile, {
      start: 44, // Skip WAV header
      highWaterMark: 4096, // 4KB chunks like typical file streaming
    });

    let chunkCount = 0;

    stream.on('data', (arrayBuffer) => {
      // Azure example: pushStream.write(arrayBuffer.slice());
      // We do: socket.emit('audioStream', arrayBuffer.slice());

      const chunk = arrayBuffer.slice();
      socket.emit('audioStream', chunk);

      if (chunkCount < 3) {
        console.log(`📤 Stream chunk ${chunkCount}: ${chunk.length} bytes`);

        // Check if audio data exists
        let hasAudio = false;
        for (let i = 0; i < Math.min(chunk.length, 100); i += 2) {
          if (Math.abs(chunk.readInt16LE(i)) > 50) {
            hasAudio = true;
            break;
          }
        }
        console.log(`   Audio activity: ${hasAudio ? 'YES' : 'NO'}`);
      }

      chunkCount++;
      process.stdout.write(`\r📈 Chunks sent: ${chunkCount} `);
    });

    stream.on('end', () => {
      console.log('\n🏁 File stream ended');

      // Azure example: pushStream.close();
      // We do: socket.emit('streamEnd');
      setTimeout(() => {
        console.log('📤 Sending streamEnd...');
        socket.emit('streamEnd');
      }, 1000);
    });

    stream.on('error', (error) => {
      console.error('❌ Stream error:', error);
    });
  });

  socket.on('speechRecognized', (data) => {
    if (data.status && data.text) {
      console.log('\n🎉 TRANSCRIPTION SUCCESS!');
      console.log(`Status: ${data.status}`);
      console.log(`Text: "${data.text}"`);
      console.log(`Confidence: ${data.confidence}`);
      gotTranscription = true;
    } else {
      console.log('\n📥 Received:', JSON.stringify(data, null, 2));
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  // Test timeout
  setTimeout(() => {
    console.log('\n⏰ Test completed');

    if (gotTranscription) {
      console.log('🎉 SUCCESS: Got transcription results!');
    } else {
      console.log('❌ FAILED: No transcription results');
      console.log('\n🔍 Possible issues:');
      console.log('1. Azure Speech SDK credentials invalid');
      console.log('2. Azure Speech SDK region mismatch');
      console.log('3. Server-side audio processing issue');
      console.log('4. Azure Speech SDK configuration problem');
    }

    socket.disconnect();
    process.exit(gotTranscription ? 0 : 1);
  }, 8000);
}

if (require.main === module) {
  streamStyleTest();
}
