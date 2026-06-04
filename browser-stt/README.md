# Browser-based Speech-to-Text (STT) Example

A complete web-based example demonstrating real-time Speech-to-Text transcription using the vcall-seamless API via WebSocket.

---

## Features

- 🎤 Real-time audio transcription
- 🔊 Support for multiple languages
- 👥 Optional speaker diarization
- 😊 Optional sentiment analysis
- 🔒 Optional PII redaction
- 📊 Live transcript display
- 💾 Results storage

---

## Quick Start

### 1. Open in Browser

Simply open `index.html` in a web browser. No build step required!

```bash
# Option 1: Direct file open
open index.html

# Option 2: Local development server (Python)
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Node.js development server
npx http-server
```

### 2. Configure

1. Enter your **API Key** (required)
2. Optionally update the **API Host** (default: `https://sdk.verbum.ai`)
3. Select your desired **Language**
4. Select an **Audio File** (WAV format recommended)
5. Enable additional features if desired (diarization, sentiment, redaction)

### 3. Run

Click **"Start Transcription"** to begin. The application will:

- Connect to the vcall-seamless WebSocket server
- Stream the audio file in chunks
- Display interim and final transcripts in real-time
- Show analysis results if features are enabled

---

## File Format Requirements

- **Format**: WAV (PCM)
- **Sample Rate**: 8kHz or 16kHz
- **Channels**: Mono or Stereo
- **Encoding**: Linear PCM (16-bit)

### Converting Audio Files

Using FFmpeg:

```bash
# Convert MP3 to WAV (16kHz)
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav

# Convert from any format to WAV
ffmpeg -i input.mp4 -ar 16000 -ac 1 output.wav
```

---

## Project Structure

```
browser-stt/
├── index.html      # Main UI
├── app.js          # WebSocket client and logic
└── README.md       # This file
```

---

## How It Works

### Connection Flow

```
User enters API Key
       ↓
Click "Start Transcription"
       ↓
Connect to WebSocket (Socket.IO)
       ↓
Emit "startTranscription" event
       ↓
Stream audio chunks via "audioStream"
       ↓
Receive transcripts via "speechRecognized"
  (status: 'recognizing' = interim, 'recognized' = final)
       ↓
Emit "streamEnd" when done
       ↓
Disconnect
```

### Key Events

**Client → Server:**

- `startTranscription` - Initialize transcription with options
- `audioStream` - Send audio chunk (binary data)
- `streamEnd` - Signal end of audio

**Server → Client:**

- `speechRecognized` - Transcript event (check `status` field: `'recognizing'` = interim, `'recognized'` = final)
- `transcriptionError` - Error occurred

---

## Configuration Details

### Environment Variables (in code)

The application uses the following defaults, which can be changed in the HTML/JS:

```javascript
const CONFIG = {
  apiHost: 'https://sdk.verbum.ai',
  pathPrefix: '/v1',
};
```

### Socket.IO Query Parameters

When connecting, the client sends:

```javascript
query: {
  token: apiKey,
  language: selectedLanguage,
  usage: 'browser'  // Important: always 'browser'
}
```

---

## Supported Languages

- `en-US` - English (US)
- `en-GB` - English (UK)
- `es-ES` - Spanish
- `fr-FR` - French
- `de-DE` - German
- `it-IT` - Italian
- `pt-BR` - Portuguese (Brazil)
- `zh-CN` - Mandarin Chinese
- `ja-JP` - Japanese
- `ko-KR` - Korean

---

## Error Handling

The application handles:

- Connection failures
- Invalid API keys
- File read errors
- Transcription timeouts
- WebSocket disconnections

Errors are displayed in the status area with detailed messages.

---

## Performance Notes

- Audio chunks are sent at **20ms intervals** to simulate real-time streaming
- Default chunk size is **1024 bytes**
- Maximum timeout is **5 minutes** for long audio files
- Interim results display with every `transcriptionUpdate`
- Final results accumulate in the transcript area

---

## Browser Compatibility

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- Requires WebSocket support
- Requires FileReader API

---

## Troubleshooting

### Connection Issues

- Verify API key is correct
- Check that API host is accessible
- Ensure CORS is enabled on the server

### No Transcription Appearing

- Verify audio file format (WAV, PCM recommended)
- Check that language is set correctly
- Ensure audio is not corrupted

### Sentiment/PII Features Not Working

- These are placeholder implementations in the browser
- For production, integrate with the actual `/text-analysis/*` endpoints

---

## Example Use Cases

1. **Live Support Transcription** - Transcribe customer calls in real-time
2. **Meeting Notes** - Automatically transcribe and analyze meetings
3. **Accessibility** - Provide live captions for audio content
4. **Call Center** - Monitor and transcribe support calls
5. **Training** - Record and transcribe training sessions

---

## Security Considerations

- ⚠️ **Never commit your API key** - Use environment variables or secure storage
- 🔐 API key is sent in the WebSocket query (use HTTPS/WSS in production)
- 🔒 Audio data is sent over WebSocket - ensure secure connection
- 📊 Sentiment/PII analysis is simulated in browser - use API for production

---

## API Documentation

For more details, see:

- `/translator/` - Translation API
- `/text-analysis/` - Text analysis API
- `/speech/synthesize` - Text-to-Speech API

---

## Support

For issues or questions:

- Check the console (F12) for error messages
- Verify your API credentials
- Ensure your audio file format is correct
- Contact support at your API provider
