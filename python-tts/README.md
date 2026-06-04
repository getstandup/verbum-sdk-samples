# Python TTS (Text-to-Speech) Examples

Standalone scripts demonstrating **Text-To-Speech** via HTTP REST endpoint, including basic synthesis and SSML support.

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
python http_tts.py
```

> **Requires Python 3.8+**

---

## Scripts

### `http_tts.py`

Text-to-speech synthesis via HTTP REST endpoint.

**Features:**

- Plain text and SSML support
- Prosody control (speed, pitch, volume)
- Multiple audio formats

**Output:** `output-http-plain.mp3`, `output-http-ssml.mp3`

---

## Environment Variables

| Variable       | Default                 | Description                                |
| -------------- | ----------------------- | ------------------------------------------ |
| `API_KEY`      | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST`     | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |
| `VOICE`        | `en-US-AriaNeural`      | Voice identifier to use for synthesis.     |
| `AUDIO_FORMAT` | `Audio16Khz128KBitMp3`  | Audio output format.                       |

---

## Audio Formats

- `Audio16Khz128KBitMp3` - MP3 16kHz 128kbps (default)
- `Audio16Khz64KBitMp3` - MP3 16kHz 64kbps
- `Audio48Khz96KBitMp3` - MP3 48kHz 96kbps
- `Ogg16Khz16Bit` - OGG Vorbis 16kHz

---

## Voice Selection

Examples:

- English (US): `en-US-AriaNeural`, `en-US-GuyNeural`, `en-US-AmberNeural`
- English (UK): `en-GB-RyanNeural`, `en-GB-SoniaNeural`
- Spanish: `es-ES-AlvaroNeural`, `es-ES-ConchitaNeural`
- French: `fr-FR-AlainNeural`, `fr-FR-YvetteNeural`
- German: `de-DE-BerndNeural`, `de-DE-KatjaNeural`

---

## Dependencies

```
requests>=2.28.0
python-dotenv>=0.21.0
```

---

## SSML Support

The HTTP endpoint supports SSML (Speech Synthesis Markup Language) for fine-grained control:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-AriaNeural">
    <prosody rate="1.5">This sentence is spoken at 1.5x speed.</prosody>
    <prosody pitch="+20%">This sentence has higher pitch.</prosody>
    <prosody volume="90">This sentence is quieter.</prosody>
  </voice>
</speak>
```

---

## Notes

- The HTTP endpoint supports SSML for fine-grained control
- Audio chunks may be received in multiple events; accumulate them with proper buffering
