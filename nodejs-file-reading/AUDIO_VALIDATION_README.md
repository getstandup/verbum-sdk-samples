# Audio File Validation and Dynamic STT Configuration

## Overview

This document describes the improvements made to the WebSocket Speech-to-Text client to support automatic audio file validation and dynamic STT options configuration based on detected audio properties.

## Key Improvements

### 1. **Strict Audio Validation**

The client now validates that audio files meet the API requirements:

- ✅ **Sample Rate**: Only 8kHz and 16kHz are supported
- ✅ **Format**: PCM format required
- ✅ **Channels**: Mono (1 channel) required
- ✅ **Bit Depth**: 16-bit required

**Error Handling**: Throws descriptive errors for unsupported formats instead of warnings.

```javascript
// Example error messages:
'Unsupported sample rate: 44100Hz (supported: 8000Hz, 16000Hz)';
'Unsupported channel count: 2 (expected mono=1)';
'Unsupported bit depth: 8-bit (expected 16-bit)';
```

### 2. **Dynamic STT Options Configuration**

The client automatically detects audio properties and updates STT options:

- 🔧 **Auto-detection**: Reads sample rate from WAV file header
- 🔧 **Dynamic Update**: Updates `sttOptions.sampleRate` before connection
- 🔧 **Duration Calculation**: Accurately calculates expected duration
- 🔧 **Marker Tone**: Adjusts recognition marker tone to match sample rate

### 3. **Enhanced Workflow**

The execution flow now follows this sequence:

1. **Validate Configuration** - Check basic STT options
2. **Load Audio File** - Read and validate WAV file
3. **Update STT Options** - Dynamically configure based on detected properties
4. **Connect to Server** - Establish WebSocket connection with correct parameters
5. **Stream Audio** - Process and send audio data

## Code Changes

### New Method: `updateSTTOptionsFromAudio()`

```javascript
updateSTTOptionsFromAudio() {
  if (!this.detectedSampleRate) {
    throw new Error('No audio file loaded - cannot update STT options');
  }

  console.log('🔧 Updating STT options based on detected audio properties...');

  // Update the sample rate in STT options
  this.config.sttOptions.sampleRate = this.detectedSampleRate;

  // Calculate and display expected duration
  const expectedDurationSeconds = this.audioBuffer.length / (this.detectedSampleRate * 2);
  console.log(`   Updated expected duration: ~${expectedDurationSeconds.toFixed(2)}s`);
}
```

### Enhanced `extractPCMFromWAV()` Method

```javascript
// Strict validation instead of warnings
if (sampleRate !== 8000 && sampleRate !== 16000) {
  throw new Error(`Unsupported sample rate: ${sampleRate}Hz (supported: 8000Hz, 16000Hz)`);
}

// Store detected sample rate for dynamic configuration
this.detectedSampleRate = sampleRate;

// Dynamic marker tone generation
const markerLength = Math.round(this.detectedSampleRate * 0.05 * 2); // 50ms marker
```

### Updated Main Function

```javascript
async function main() {
  const client = new WebSocketSTTClient(CONFIG);

  try {
    // Validate configuration
    client.validateConfig();

    // Load audio file with validation
    await client.loadAudioFile();

    // Update STT options based on detected audio properties
    client.updateSTTOptionsFromAudio();

    // Connect to WebSocket server with correct configuration
    await client.connect();

    // Start streaming audio
    await client.startStreaming();

    // ... rest of the workflow
  } catch (error) {
    console.error('💥 Application error:', error.message);
    process.exit(1);
  }
}
```

## Testing Results

### Test 1: 8kHz Audio File (`test_mono_3-2.wav`)

```
📊 WAV file info:
   Audio Format: 1 (1=PCM)
   Channels: 1
   Sample Rate: 8000Hz
   Bits per Sample: 16
✅ Audio validation passed - Sample rate: 8000Hz

🔧 Updating STT options based on detected audio properties...
   Original sample rate setting: 8000Hz
   Detected sample rate: 8000Hz
   Updated expected duration: ~26.15s at 8000Hz 16-bit
✅ STT options updated successfully
```

### Test 2: 16kHz Audio File (`TalkForAFewSeconds16.wav`)

```
📊 WAV file info:
   Audio Format: 1 (1=PCM)
   Channels: 1
   Sample Rate: 16000Hz
   Bits per Sample: 16
✅ Audio validation passed - Sample rate: 16000Hz

🔧 Updating STT options based on detected audio properties...
   Original sample rate setting: 8000Hz
   Detected sample rate: 16000Hz
   Updated expected duration: ~7.96s at 16000Hz 16-bit
✅ STT options updated successfully
```

### Test 3: Unsupported Sample Rate (44.1kHz)

```
📊 WAV file info:
   Audio Format: 1 (1=PCM)
   Channels: 1
   Sample Rate: 44100Hz
   Bits per Sample: 16
❌ Failed to load audio file: Unsupported sample rate: 44100Hz (supported: 8000Hz, 16000Hz)
```

## Benefits

1. **🛡️ Robust Error Handling**: Clear error messages for unsupported audio formats
2. **🔄 Automatic Configuration**: No manual sample rate configuration needed
3. **📊 Accurate Metrics**: Precise duration calculations for monitoring
4. **🎯 Optimized Processing**: Marker tones adjusted for optimal recognition
5. **⚡ Improved Reliability**: Validation prevents runtime failures

## Usage Examples

### Example 1: Load 8kHz Audio File

```javascript
const CONFIG = {
  serverUrl: 'ws://localhost:3000',
  apiKey: 'your-api-key',
  audioFile: './audio-8khz.wav', // 8kHz file
  sttOptions: {
    language: ['en-US'],
    encoding: 'PCM',
    sampleRate: 8000, // Will be auto-detected and confirmed
    // ... other options
  },
};

const client = new WebSocketSTTClient(CONFIG);
await client.loadAudioFile(); // Detects 8kHz
client.updateSTTOptionsFromAudio(); // Confirms sampleRate: 8000
await client.connect(); // Connects with correct params
```

### Example 2: Load 16kHz Audio File

```javascript
const CONFIG = {
  serverUrl: 'ws://localhost:3000',
  apiKey: 'your-api-key',
  audioFile: './audio-16khz.wav', // 16kHz file
  sttOptions: {
    language: ['en-US'],
    encoding: 'PCM',
    sampleRate: 8000, // Will be auto-updated to 16000
    // ... other options
  },
};

const client = new WebSocketSTTClient(CONFIG);
await client.loadAudioFile(); // Detects 16kHz
client.updateSTTOptionsFromAudio(); // Updates sampleRate: 16000
await client.connect(); // Connects with updated params
```

## Backward Compatibility

✅ **Fully Backward Compatible**: Existing code continues to work unchanged.
✅ **Enhanced Validation**: Better error handling replaces silent warnings.
✅ **Automatic Updates**: Manual sample rate configuration still works but isn't required.

## Files Modified

- `index.js` - Main client implementation with enhanced validation and dynamic configuration
- `test-error-handling.js` - Comprehensive test suite for validation scenarios

## Future Enhancements

- 🔮 Support for additional sample rates (if API extends support)
- 🔮 Automatic language detection from audio metadata
- 🔮 Support for stereo-to-mono conversion
- 🔮 Advanced audio format conversion (MP3, FLAC, etc.)
