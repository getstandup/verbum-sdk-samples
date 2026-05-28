# Node.js STT (Speech-to-Text) Examples

Standalone scripts demonstrating **Speech-to-Text** via WebSocket, including real-time transcription, diarization, sentiment analysis, and PII redaction.

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
npm run sentiment   # With sentiment analysis → output-sentiment.json
npm run redact      # With PII redaction → output-redact.json
npm run mixed       # Multiple features → output-mixed.json
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

### `npm run sentiment` — `sentiment-analysis.js`

Speech-to-text with real-time sentiment analysis.

**Features:**
- Automatic sentiment scoring (positive/negative/neutral)
- Sentiment for each sentence/paragraph
- Confidence scores

**Configuration:**
- Input: WAV audio file
- Output: `output-sentiment.json` with transcript and sentiment labels

---

### `npm run redact` — `pii-redaction.js`

Speech-to-text with automatic PII redaction.

**Features:**
- Detects and redacts personally identifiable information
- Categories: phone numbers, emails, credit cards, SSN, etc.
- Redacted and original transcripts

**Configuration:**
- Input: WAV audio file
- Output: `output-redact.json` with redacted content

---

### `npm run mixed` — `mixed-features.js`

Combines diarization, sentiment analysis, and PII redaction in one example.

**Features:**
- Multiple features applied in sequence
- Complete analysis of audio content
- Complex use case demonstration

**Configuration:**
- Input: WAV audio file
- Output: `output-mixed.json` with all analyses

---

## Environment Variables

| Variable       | Default                 | Description                                |
| -------------- | ----------------------- | ------------------------------------------ |
| `API_KEY`      | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST`     | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |
| `LANGUAGE`     | `en-US`                 | Default language for transcription.        |
| `ENCODING`     | `PCM`                   | Audio encoding format.                     |
| `AUDIO_FILE`   | `./sample.wav`          | Path to WAV audio file.                    |

---

## Audio File Requirements

- **Format:** WAV (PCM)
- **Sample Rate:** 8kHz or 16kHz
- **Channels:** Mono or Stereo
- **Encoding:** Linear PCM (16-bit)

---

## Notes

- WebSocket connections require `usage: 'browser'` in the connection query
- All examples handle connection errors and reconnection
- Audio streaming is buffered for optimal performance
- Results are saved to JSON files for inspection
