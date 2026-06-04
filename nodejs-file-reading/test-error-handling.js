const { WebSocketSTTClient, CONFIG } = require('./index.js');
const fs = require('fs');
const path = require('path');

/**
 * Test error handling for unsupported sample rates
 */
async function testErrorHandling() {
  console.log('🧪 Testing error handling for unsupported sample rates');
  console.log('═'.repeat(60));

  // Create a modified config that points to a non-existent file with fake sample rate
  const testConfig = {
    ...CONFIG,
    audioFile: path.join(__dirname, './fake-unsupported.wav'),
  };

  // Create a fake WAV file with 44.1kHz sample rate (unsupported)
  console.log('📝 Creating fake WAV file with 44.1kHz sample rate...');

  // Read an existing WAV file as template
  const originalWav = fs.readFileSync(CONFIG.audioFile);
  const fakeWav = Buffer.from(originalWav);

  // Modify the sample rate in the WAV header (bytes 24-27)
  // Set it to 44100 Hz (0x0000AC44 in little-endian)
  fakeWav.writeUInt32LE(44100, 24);

  // Write the fake file
  fs.writeFileSync(testConfig.audioFile, fakeWav);
  console.log('✅ Created fake WAV file with 44.1kHz sample rate');

  // Test 1: Unsupported sample rate
  console.log('\n🎯 Test 1: Unsupported sample rate (44.1kHz)');
  const client1 = new WebSocketSTTClient(testConfig);

  try {
    await client1.loadAudioFile();
    console.log('❌ ERROR: Should have thrown an error for unsupported sample rate');
  } catch (error) {
    console.log('✅ SUCCESS: Caught expected error:', error.message);
  }

  // Test 2: Valid 8kHz file
  console.log('\n🎯 Test 2: Valid 8kHz file');
  const valid8kConfig = {
    ...CONFIG,
    audioFile: path.join(__dirname, './test_mono_3-2.wav'),
  };
  const client2 = new WebSocketSTTClient(valid8kConfig);

  try {
    await client2.loadAudioFile();
    client2.updateSTTOptionsFromAudio();
    console.log('✅ SUCCESS: 8kHz file loaded and STT options updated');
    console.log(`   Sample rate: ${client2.detectedSampleRate}Hz`);
    console.log(`   STT config sample rate: ${client2.config.sttOptions.sampleRate}Hz`);
  } catch (error) {
    console.log('❌ ERROR: Should not have thrown an error:', error.message);
  }

  // Test 3: Valid 16kHz file
  console.log('\n🎯 Test 3: Valid 16kHz file');
  const valid16kConfig = {
    ...CONFIG,
    audioFile: path.join(__dirname, './TalkForAFewSeconds16.wav'),
  };
  const client3 = new WebSocketSTTClient(valid16kConfig);

  try {
    await client3.loadAudioFile();
    client3.updateSTTOptionsFromAudio();
    console.log('✅ SUCCESS: 16kHz file loaded and STT options updated');
    console.log(`   Sample rate: ${client3.detectedSampleRate}Hz`);
    console.log(`   STT config sample rate: ${client3.config.sttOptions.sampleRate}Hz`);
  } catch (error) {
    console.log('❌ ERROR: Should not have thrown an error:', error.message);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  if (fs.existsSync(testConfig.audioFile)) {
    fs.unlinkSync(testConfig.audioFile);
    console.log('✅ Removed fake WAV file');
  }

  console.log('\n🎉 Error handling tests completed!');
}

// Run tests
testErrorHandling().catch((error) => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
