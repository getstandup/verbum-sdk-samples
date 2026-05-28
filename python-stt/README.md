# Python STT (Speech-to-Text) Examples

Standalone scripts demonstrating **Speech-to-Text** via WebSocket, including real-time transcription, diarization, sentiment analysis, and PII redaction.

---

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure credentials
cp .env.example .env
# → edit .env and set API_KEY and API_HOST

# 4. Run a script
python basic_transcription.py
python diarization.py
python sentiment_analysis.py
python pii_redaction.py
python mixed_features.py
```

> **Requires Python 3.8+**

---

## Scripts

### `basic_transcription.py`

Basic real-time speech-to-text transcription from an audio file.

**Features:**
- Language detection and transcription
- Real-time streaming of audio chunks
- Complete transcript output

**Output:** `output-basic.json`

---

### `diarization.py`

Speech-to-text with speaker diarization (identifies multiple speakers).

**Features:**
- Multiple speaker identification
- Timing information for each speaker
- Speaker confidence scores

**Output:** `output-diarization.json`

---

### `sentiment_analysis.py`

Speech-to-text with real-time sentiment analysis.

**Features:**
- Automatic sentiment scoring
- Sentiment for each sentence/paragraph
- Confidence scores

**Output:** `output-sentiment.json`

---

### `pii_redaction.py`

Speech-to-text with automatic PII redaction.

**Features:**
- Detects and redacts personally identifiable information
- Categories: phone numbers, emails, credit cards, SSN, etc.
- Redacted and original transcripts

**Output:** `output-redact.json`

---

### `mixed_features.py`

Combines diarization, sentiment analysis, and PII redaction in one example.

**Features:**
- Multiple features applied in sequence
- Complete analysis of audio content
- Complex use case demonstration

**Output:** `output-mixed.json`

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

## Dependencies

```
python-socketio>=5.5.0
python-dotenv>=0.21.0
aiofiles>=23.0.0
```

---

## Notes

- WebSocket connections require `usage: 'browser'` in the connection query
- All examples handle connection errors and reconnection
- Audio streaming is buffered for optimal performance
- Results are saved to JSON files for inspection
