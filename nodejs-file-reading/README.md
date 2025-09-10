# WebSocket Speech-to-Text File Example

This Node.js application demonstrates how to connect to the vcall-seamless WebSocket API for real-time speech-to-text transcription using a WAV file as the audio source.

## Features

- ✅ Real-time WebSocket connection to STT API
- 🎵 WAV file audio streaming with automatic validation
- � **Dynamic audio configuration** - Auto-detects sample rate and updates STT options
- 🛡️ **Strict audio validation** - Ensures 8kHz/16kHz, PCM, mono, 16-bit compatibility
- �📝 Live transcription with interim and final results
- 🌍 Support for translation to multiple languages
- 🔒 PII (Personally Identifiable Information) redaction
- 😊 Sentiment analysis integration
- 👥 Speaker diarization support
- 📊 Progress tracking and detailed logging
- ⚡ **Enhanced error handling** with descriptive messages

## Audio Requirements

**Supported Sample Rates:**

- 8000 Hz (8kHz) - Standard quality
- 16000 Hz (16kHz) - High quality (recommended)

**Required Format:**

- Format: WAV with PCM encoding
- Channels: Mono (1 channel)
- Bit Depth: 16-bit
- Supported Files: `.wav` files meeting the above criteria

**Automatic Validation:**
The client now automatically validates audio files and throws descriptive errors for unsupported formats:

- `"Unsupported sample rate: 44100Hz (supported: 8000Hz, 16000Hz)"`
- `"Unsupported channel count: 2 (expected mono=1)"`
- `"Unsupported bit depth: 8-bit (expected 16-bit)"`

## Prerequisites

- Node.js 18.0.0 or higher
- A valid API key for the vcall-seamless service
- A WAV audio file meeting the format requirements (8kHz or 16kHz, mono, 16-bit PCM)

## Installation

1. Navigate to this directory:

   ```bash
   cd /workspace/vcall-seamless/user-cases/nodejs-file-reading
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Dynamic Audio Configuration

🚀 **NEW**: The client now automatically detects audio properties and configures STT options dynamically!

### How It Works

1. **Audio Detection**: Reads WAV file header to detect sample rate, format, and channels
2. **Automatic Validation**: Ensures audio meets API requirements (8kHz/16kHz, PCM, mono, 16-bit)
3. **Dynamic Configuration**: Updates `sttOptions.sampleRate` based on detected audio properties
4. **Optimized Processing**: Adjusts recognition markers and duration calculations

### Example Workflow

```javascript
const client = new WebSocketSTTClient(CONFIG);

// 1. Load and validate audio file
await client.loadAudioFile();
// Output: ✅ Audio validation passed - Sample rate: 16000Hz

// 2. Update STT options automatically
client.updateSTTOptionsFromAudio();
// Output: 🔧 Updated sample rate: 8000Hz → 16000Hz

// 3. Connect with correct configuration
await client.connect();
// Output: 📡 Connected with sampleRate: 16000
```

### Supported Scenarios

| Audio File        | Auto-Detection   | Result                                |
| ----------------- | ---------------- | ------------------------------------- |
| `audio-8khz.wav`  | 8000Hz detected  | `sttOptions.sampleRate = 8000`        |
| `audio-16khz.wav` | 16000Hz detected | `sttOptions.sampleRate = 16000`       |
| `audio-44khz.wav` | 44100Hz detected | ❌ **Error**: Unsupported sample rate |

## Sample Rate Configuration

The client automatically resamples audio to match the server's expected sample rate. The server supports two sample rates:

- **8000 Hz**: Standard quality, smaller bandwidth
- **16000 Hz**: High quality, larger bandwidth (recommended for better accuracy)

> 🎯 **Note**: With the new auto-detection feature, you typically don't need to manually configure sample rates. The client automatically detects and configures the correct sample rate from your audio file.

### Manual Configuration (Optional)

If you need to override the automatic detection:

### Using 8000 Hz

```javascript
const CONFIG = {
  audioFile: './audio-8khz.wav',
  sttOptions: {
    sampleRate: 8000, // Will be confirmed by auto-detection
    // ... other options
  },
};
```

### Using 16000 Hz

```javascript
const CONFIG = {
  audioFile: './audio-16khz.wav',
  sttOptions: {
    sampleRate: 16000, // Will be confirmed by auto-detection
    // ... other options
  },
};
```

## Configuration

### 1. Update API Settings

Edit the `CONFIG` object in `index.js`:

```javascript
const CONFIG = {
  // Replace with your actual server URL
  serverUrl: 'ws://localhost:3000',

  // Replace with your actual API key
  apiKey: 'your-api-key-here',

  // Audio file path - will be auto-validated
  audioFile: path.join(__dirname, 'your-audio-file.wav'),

  // STT options - sampleRate will be auto-detected and updated
  sttOptions: {
    language: ['en-US'], // Primary language
    encoding: 'PCM', // Audio encoding (required)
    sampleRate: 8000, // Default - will be auto-updated based on audio file
    profanityFilter: 'raw', // Profanity filtering: 'raw', 'masked', 'removed'
    diarization: false, // Speaker identification
    // analyzeSentiments: false, // Sentiment analysis
    // translateTo: [], // Target languages for translation
    // translateModel: 'default', // Translation model
    // redact: [], // PII categories to redact
    tags: JSON.stringify({ session: 'file-demo' }),
  },
};
```

### 2. Add Audio File

Place your WAV audio file in this directory or update the `audioFile` path in the configuration.

**Audio Requirements:**

- **Format**: WAV with PCM encoding
- **Sample Rate**: 8000 Hz or 16000 Hz (automatically detected)
- **Channels**: Mono (1 channel) - required
- **Bit Depth**: 16-bit - required

> ⚠️ **Important**: The client now strictly validates audio format. Files that don't meet these requirements will throw descriptive errors instead of attempting to process incompatible audio.

## Usage

### Basic Usage

```bash
node index.js
```

### Using npm scripts

```bash
npm start
```

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Testing Error Handling

Test the audio validation with different file formats:

```bash
node test-error-handling.js
```

## Configuration Options

### Language Settings

```javascript
sttOptions: {
  language: ['en-US'], // Single language
  // OR
  language: ['en-US', 'es-ES'], // Multiple languages supported
  // Supported languages include: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, th, tr, and many more
}
```

### Translation

```javascript
sttOptions: {
  translateTo: ['es', 'fr', 'de'], // Translate to Spanish, French, German
  translateModel: 'default'        // Translation model
}
```

### PII Redaction

```javascript
sttOptions: {
  redact: ["general", "pii", "financial", "corporate"], // Redact sensitive information
}
```

Available PII categories:

- **General** - General redaction categories include common types of personally identifiable information (PII) that can appear in a wide variety of contexts.
- **Personally Identifiable Information (PII)** - PII redaction categories encompass highly sensitive information that can uniquely identify individuals.
- **Financial** - Financial redaction categories cover information related to financial transactions, banking, and tax identification.
- **Corporate** - Corporate redaction categories focus on information related to organizations and businesses.

### Speaker Diarization

```javascript
sttOptions: {
  diarization: true; // Enable speaker identification
}
```

### Sentiment Analysis

```javascript
sttOptions: {
  analyzeSentiments: true; // Enable sentiment analysis
}
```

## Example Output

```
🚀 WebSocket Speech-to-Text File Example
════════════════════════════════════════════════════════════
✅ Configuration validated
🎵 Loading audio file: /path/to/TalkForAFewSeconds16.wav
� Extracting raw PCM data from WAV file...
📊 WAV file info:
   Audio Format: 1 (1=PCM)
   Channels: 1
   Sample Rate: 16000Hz
   Bits per Sample: 16
✅ Audio validation passed - Sample rate: 16000Hz
🎵 Adding recognition marker tone...
✅ Enhanced PCM data: 254718 bytes (marker + audio)
✅ Audio file loaded and raw PCM extracted
🔧 Updating STT options based on detected audio properties...
   Original sample rate setting: 8000Hz
   Detected sample rate: 16000Hz
   Updated expected duration: ~7.96s at 16000Hz 16-bit
✅ STT options updated successfully
🔗 Connecting to WebSocket server...
✅ Connected to WebSocket server
📡 Socket ID: abc123xyz
🔧 Query params: { sampleRate: 16000, language: ['en-US'], encoding: 'PCM' }
🎙️  Starting audio streaming...
📤 Streaming progress: 25.3%
🔄 Recognizing: I'll talk for a few...
✨ Final Result:
   Text: "I'll talk for a few seconds so you can recognize my voice in the future."
   Confidence: 0.8954437
   Duration: 5.96ms
────────────────────────────────────────────────────────────
🏁 Audio streaming completed
```

## Error Handling

The application includes comprehensive error handling for:

- **Audio Format Validation**: Clear error messages for unsupported formats
  - `"Unsupported sample rate: 44100Hz (supported: 8000Hz, 16000Hz)"`
  - `"Unsupported channel count: 2 (expected mono=1)"`
  - `"Unsupported bit depth: 8-bit (expected 16-bit)"`
- **Network connection issues**
- **Invalid audio files**
- **Authentication failures**
- **API rate limiting**
- **Service unavailability**

## Audio Format Support

### Supported Formats

✅ **WAV files with:**

- Sample Rate: 8000 Hz or 16000 Hz
- Channels: Mono (1 channel)
- Bit Depth: 16-bit
- Encoding: PCM

### Automatic Processing

The application automatically:

- ✅ Detects and validates audio properties
- ✅ Updates STT configuration based on detected sample rate
- ✅ Generates optimized recognition markers
- ✅ Calculates accurate duration and progress tracking

### Unsupported Formats

❌ **Will throw errors for:**

- Non-WAV files
- Sample rates other than 8kHz/16kHz (22kHz, 44.1kHz, 48kHz, etc.)
- Stereo or multi-channel audio
- Non-PCM encoding
- Bit depths other than 16-bit

## Advanced Usage

### Custom Audio Processing

The `extractPCMFromWAV` method includes automatic validation and sample rate detection. For custom processing, you can extend the `WebSocketSTTClient` class.

### Batch Processing

For processing multiple files:

```javascript
const audioFiles = ['file1.wav', 'file2.wav', 'file3.wav'];

for (const file of audioFiles) {
  const config = { ...CONFIG, audioFile: file };
  const client = new WebSocketSTTClient(config);

  try {
    await client.loadAudioFile();
    client.updateSTTOptionsFromAudio();
    await client.connect();
    await client.startStreaming();
    await client.disconnect();
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}
```

### Testing Audio Validation

Use the included test script to validate different audio formats:

```bash
node test-error-handling.js
```

This will test:

- ✅ Valid 8kHz files
- ✅ Valid 16kHz files
- ❌ Invalid sample rates (throws errors)

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Verify the server URL is correct
   - Check network connectivity
   - Ensure the API key is valid

2. **Audio File Validation Errors**

   - `Unsupported sample rate`: Use 8kHz or 16kHz WAV files only
   - `Unsupported channel count`: Convert to mono audio
   - `Unsupported bit depth`: Use 16-bit audio files
   - `Invalid WAV file format`: Ensure file is a valid WAV with PCM encoding

3. **Audio File Not Found**

   - Verify the file path in the configuration
   - Ensure the file exists and is readable

4. **Authentication Failed**

   - Check your API key is correct
   - Verify the API key has appropriate permissions

5. **No Transcription Results**

   - ✅ **Auto-Configuration**: Sample rate is now automatically detected and configured
   - Verify audio contains speech content
   - Try a different language code in the `language` array
   - Check that your audio file is not corrupted

6. **Dynamic Configuration Issues**
   - Ensure `loadAudioFile()` is called before `updateSTTOptionsFromAudio()`
   - Verify the audio file meets format requirements
   - Check console output for validation messages

### Debug Mode

For detailed debugging:

- ✅ **Auto-validation output**: Check console for audio validation results
- ✅ **Dynamic configuration logs**: Monitor sample rate detection and updates
- Check WebSocket connection events
- Verify audio buffer size and chunk transmission
- Enable server-side logging if available

### Example Debug Output

```
🎵 Loading audio file: ./test-audio.wav
📊 WAV file info:
   Audio Format: 1 (1=PCM)
   Channels: 1
   Sample Rate: 16000Hz
   Bits per Sample: 16
✅ Audio validation passed - Sample rate: 16000Hz
🔧 Updating STT options based on detected audio properties...
   Original sample rate setting: 8000Hz
   Detected sample rate: 16000Hz
✅ STT options updated successfully
```

## Project Files

- `index.js` - Main WebSocket STT client with audio validation and dynamic configuration
- `stress-test.js` - Stress testing tool for concurrent connections
- `test-error-handling.js` - Audio validation testing script
- `AUDIO_VALIDATION_README.md` - Detailed documentation of validation features
- Sample audio files:
  - `test_mono_3-2.wav` - 8kHz Spanish audio sample
  - `TalkForAFewSeconds16.wav` - 16kHz English audio sample
  - `whatstheweatherlike.wav` - 16kHz English audio sample

## API Reference

For complete API documentation, refer to the main vcall-seamless documentation.

## Support

For issues and questions, please refer to the main project documentation or contact support.
