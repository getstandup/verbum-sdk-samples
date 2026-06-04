# Node.js STT (Speech-to-Text) Examples

Standalone scripts demonstrating **Speech-to-Text** via WebSocket, including real-time transcription and speaker diarization.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# → edit .env and set API_KEY and API_HOST

# 3. Run a script
npm run basic       # Basic transcription → output-basic.json
npm run diarization # With speaker diarization → output-diarization.json
```

> **Requires Node.js ≥ 18** (uses the `socket.io-client` library).

---

## Scripts

### `npm run basic` — `basic-transcription.js`

Basic real-time speech-to-text transcription from an audio file.

**Features:**

- Language detection and transcription
- Real-time streaming of audio chunks
- Complete transcript output

**Configuration:**

- Input: WAV audio file (8kHz or 16kHz)
- Output: `output-basic.json` containing transcript

---

### `npm run diarization` — `diarization.js`

Speech-to-text with speaker diarization (identifies multiple speakers).

**Features:**

- Multiple speaker identification
- Timing information for each speaker
- Speaker confidence scores

**Configuration:**

- Input: WAV audio file with multiple speakers
- Output: `output-diarization.json` with speaker labels

---

## Environment Variables

| Variable     | Default                 | Description                                |
| ------------ | ----------------------- | ------------------------------------------ |
| `API_KEY`    | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST`   | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |
| `LANGUAGE`   | `en-US`                 | Default language for transcription.        |
| `ENCODING`   | `PCM`                   | Audio encoding format.                     |
| `AUDIO_FILE` | `./sample.wav`          | Path to WAV audio file.                    |

---

## Audio File Requirements

- **Format:** WAV (PCM)
- **Sample Rate:** 8kHz or 16kHz
- **Channels:** Mono or Stereo
- **Encoding:** Linear PCM (16-bit)

---

## Notes

- Connect to the `listen` WebSocket namespace (e.g. `{API_HOST}/listen`)
- The server emits `speechRecognized` events with `status: 'recognizing'` (interim) or `status: 'recognized'` (final)
- Send `streamEnd` to signal the end of the audio stream
- All examples handle connection errors and reconnection
- Audio streaming is buffered for optimal performance
- Results are saved to JSON files for inspection
