# Verbum SDK Samples

> **Real-time Speech-to-Text API examples and code samples**

Welcome to the Verbum SDK samples repository! This collection provides comprehensive examples and code samples demonstrating how to integrate the **Verbum API** for real-time speech-to-text transcription in your applications.

##  Quick Start

### Prerequisites

1. **Get your API Key** - Sign up at [Verbum SDK Portal](https://sdk.verbum.ai/) to get your API key
2. **Choose your platform** - Select the appropriate sample for your technology stack

### Getting Started

The Verbum API uses WebSocket connections with Socket.IO for real-time communication. Each sample demonstrates how to establish a connection, configure audio settings, send audio data, and handle transcription results.

## 📋 Available Samples

### 🌐 Browser-based Examples

#### 🎤 Browser Speech-to-Text

**Location:** [`browser-stt/`](./browser-stt/)

A web-based example for real-time Speech-to-Text transcription using the Verbum API via WebSocket.

**Features:**
- Real-time audio transcription
- Multiple language support
- Optional speaker diarization, sentiment analysis, and PII redaction
- Live transcript display
- Results storage

**Quick Start:**
```bash
# Open index.html directly or use a local server
cd browser-stt
python -m http.server 8000
# Then visit http://localhost:8000
```

#### 📝 Browser Text Analysis

**Location:** [`browser-text-analysis/`](./browser-text-analysis/)

A web-based example for text analysis: sentiment analysis, named entity recognition, and PII redaction.

**Features:**
- Sentiment analysis
- Named entity recognition (NER)
- PII redaction
- Real-time results

**Quick Start:**
```bash
cd browser-text-analysis
python -m http.server 8000
# Then visit http://localhost:8000
```

#### 🌐 Browser Translation

**Location:** [`browser-translation/`](./browser-translation/)

A web-based example for real-time text translation using the Verbum API.

**Features:**
- Real-time text translation
- Multiple language support
- Auto language detection
- Translation history

**Quick Start:**
```bash
cd browser-translation
python -m http.server 8000
# Then visit http://localhost:8000
```

---

### 🟢 Node.js Speech-to-Text (STT)

**Location:** [`nodejs-stt/`](./nodejs-stt/)

Standalone scripts for real-time Speech-to-Text via WebSocket, including diarization, sentiment analysis, and PII redaction.

**Features:**
- Real-time and file-based transcription
- Speaker diarization
- Sentiment analysis
- PII redaction

**Quick Start:**
```bash
cd nodejs-stt
npm install
cp .env.example .env
# Edit .env to set your API_KEY
npm run basic       # Basic transcription
npm run diarization # With speaker diarization
npm run sentiment   # With sentiment analysis
npm run redact      # With PII redaction
npm run mixed       # Multiple features
```

### 🟢 Node.js Text Analysis

**Location:** [`nodejs-text-analysis/`](./nodejs-text-analysis/)

Standalone scripts for text analysis: sentiment analysis, NER, summarization, and PII redaction.

**Features:**
- Sentiment analysis
- Named entity recognition
- Text summarization
- PII redaction

**Quick Start:**
```bash
cd nodejs-text-analysis
npm install
cp .env.example .env
# Edit .env to set your API_KEY
npm run sentiment      # Sentiment analysis
npm run entities       # Named entity recognition
npm run summarize      # Text summarization
npm run redact         # PII redaction
npm run combined       # All features together
```

### 🟢 Node.js Translation

**Location:** [`nodejs-translation/`](./nodejs-translation/)

Standalone scripts for translation via HTTP REST endpoint, including basic, batch, and multilingual translation.

**Features:**
- Basic and batch translation
- Multilingual support
- Language detection

**Quick Start:**
```bash
cd nodejs-translation
npm install
cp .env.example .env
# Edit .env to set your API_KEY
npm run languages     # List available languages
npm run basic         # Translate a single text
npm run batch         # Translate multiple texts
npm run multilingual  # Translate to multiple languages
```

---

### 🐍 Python Real-time Microphone Transcription

**Location:** [`python-real-time/`](./python-real-time/)

A complete Python implementation that captures audio from your microphone and streams it to Verbum API for real-time transcription.

**Features:**
- Real-time microphone audio capture using PyAudio
- Automatic audio resampling and format conversion
- Cross-platform support (Windows, macOS, Linux)
- Graceful error handling and device selection
- Configurable transcription options

**Quick Start:**
```bash
cd python-real-time
pip install -r requirements.txt
# Edit microphone_transcription.py to add your API key
python microphone_transcription.py
```

### 🟢 Node.js File-based Transcription

**Location:** [`nodejs-file-reading/`](./nodejs-file-reading/)

A Node.js implementation that reads WAV audio files and streams them to Verbum API for transcription with automatic audio validation and configuration.

**Features:**
- WAV file audio streaming with automatic validation
- Dynamic audio configuration (auto-detects sample rate)
- Strict audio format validation (8kHz/16kHz, PCM, mono, 16-bit)
- Enhanced error handling with descriptive messages
- Support for translation, sentiment analysis, and PII redaction
- Progress tracking and detailed logging

**Quick Start:**
```bash
cd nodejs-file-reading
npm install
# Edit index.js to add your API key
node index.js
```

### 🔊 Node.js Text-to-Speech

**Location:** [`nodejs-tts/`](./nodejs-tts/)

A Node.js implementation demonstrating Text-to-Speech synthesis via both the HTTP REST endpoint and the Socket.IO WebSocket endpoint. Includes sequential synthesis to validate multi-turn WebSocket sessions.

**Features:**
- HTTP REST synthesis with plain text and SSML support
- WebSocket (Socket.IO) streaming synthesis
- Sequential multi-sentence synthesis over a single persistent connection
- Configurable voice, audio format, and API host via environment variables
- Outputs audio as MP3 files

**Quick Start:**
```bash
cd nodejs-tts
npm install
cp .env.example .env
# Edit .env to set your API_KEY
npm run http         # HTTP synthesis → output-http-plain.mp3 + output-http-ssml.mp3
npm run websocket    # WebSocket synthesis → output-websocket.mp3
npm run sequential   # Sequential synthesis → output-seq-1/2/3.mp3
```

> **Requires Node.js ≥ 18**

---

### 🐍 Python Examples

#### 🎤 Real-time Microphone Transcription

**Location:** [`python-real-time/`](./python-real-time/)

A Python script for real-time transcription from your microphone using Socket.IO.

**Features:**
- Real-time microphone audio capture
- Automatic resampling and format conversion
- WebSocket connection to Verbum API
- Configurable parameters

**Quick Start:**
```bash
cd python-real-time
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Edit microphone_transcription.py to add your API key
python microphone_transcription.py
```

#### 🟣 Python Speech-to-Text (STT)

**Location:** [`python-stt/`](./python-stt/)

Standalone scripts for file-based and advanced STT (diarization, sentiment, PII).

**Quick Start:**
```bash
cd python-stt
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your API_KEY
python basic_transcription.py
python diarization.py
python sentiment_analysis.py
python pii_redaction.py
python mixed_features.py
```

#### 🟣 Python Text Analysis

**Location:** [`python-text-analysis/`](./python-text-analysis/)

Standalone scripts for sentiment analysis, NER, summarization, and PII redaction.

**Quick Start:**
```bash
cd python-text-analysis
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your API_KEY
python sentiment_analysis.py
python named_entity_recognition.py
python text_summarization.py
python pii_redaction.py
python combined_analysis.py
```

#### 🟣 Python Translation

**Location:** [`python-translation/`](./python-translation/)

Standalone scripts for translation (basic, batch, multilingual).

**Quick Start:**
```bash
cd python-translation
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your API_KEY
python get_languages.py
python basic_translation.py
python batch_translation.py
python multilingual_translation.py
```

#### 🟣 Python Text-to-Speech (TTS)

**Location:** [`python-tts/`](./python-tts/)

Standalone scripts for TTS via HTTP and WebSocket.

**Quick Start:**
```bash
cd python-tts
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your API_KEY
python http_tts.py
python websocket_tts.py
python sequential_tts.py
```

## 🎛️ API Configuration Options

The Verbum API supports extensive configuration through query parameters:

### Basic Parameters

```python
config = {
    'serverUrl': 'wss://sdk.verbum.ai/listen',
    'apiKey': 'YOUR_API_KEY',
    'sttOptions': {
        # Core settings
        'language': ['en-US'],         # Array of BCP-47 language codes (max 2)
        'encoding': 'PCM',             # Audio format: PCM or OPUS
        
        # PCM Audio requirements:
        # - Sample Rate: 8 kHz only
        # - Channels: Mono (1 channel)
        # - Bit Depth: 16 bits per sample
        # - Encoding: Little-endian, signed integer
        
        # OPUS Audio requirements:
        # - Sample Rate: 16 kHz
        # - Channels: Mono (1 channel)
        # - Bit Rate: 25.6 kbps
        # - Container Format: WebM
        
        # Enhancement features
        'profanityFilter': 'masked',   # 'raw', 'masked', 'removed'
        'diarization': True,           # Speaker identification
        'analyzeSentiments': True,     # Sentiment analysis
        'translateTo': ['es', 'fr'],   # Translation targets (ISO 639-1, max 10)
        'redact': ['general', 'pii'],  # Redaction categories
        
        # Metadata
        'tags': {'session': 'demo', 'user': 'example'}  # Max 5 string values
    }
}
```

### Supported Languages

The API supports multiple languages including:
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `es-MX` - Spanish (Mexico)
- `es-ES` - Spanish (Spain)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `it-IT` - Italian (Italy)
- `pt-BR` - Portuguese (Brazil)
- And many more...

### Audio Format Requirements

- **PCM Format:**
  - Sample Rate: 8 kHz only
  - Channels: Mono (1 channel)
  - Bit Depth: 16-bit
  - Encoding: Little-endian, signed integer

- **OPUS Format:**
  - Sample Rate: 16 kHz
  - Channels: Mono (1 channel)  
  - Bit Rate: 25.6 kbps
  - Container: WebM with Opus codec

- **Batch Processing Supported Formats:**
  - WAV (PCM Uncompressed) - Recommended
  - MP3, OGG (Opus), FLAC, AMR, MP4, WMA

## 📡 API Endpoints and Events

### WebSocket Connection
```
wss://sdk.verbum.ai/v1/socket.io/listen
```

### Authentication
Include your API key in the Socket.IO auth object:
```javascript
auth: { token: 'YOUR_API_KEY' }
```

### Socket.IO Configuration
- **Path:** `/v1/socket.io`
- **Namespace:** `/listen` (optional, but recommended)
- **Transport:** `websocket`

### Socket.IO Events

#### Client to Server
| Event | Description | Payload |
|-------|-------------|---------|
| `audioStream` | Send audio data | `Buffer` - Audio bytes |
| `streamEnd` | Signal end of stream | `null` |

#### Server to Client
| Event | Description | Payload |
|-------|-------------|---------|
| `speechRecognized` | Transcription result | `SpeechResult` object |

### Speech Result Object

```json
{
  "id": "unique-id",
  "status": "recognized",        // 'recognizing' or 'recognized'
  "text": "Hello world",
  "confidence": 0.95,           // Number (0-1) for recognized, string for recognizing
  "duration": 1.5,              // Duration in seconds
  "offset": 0.5,                // Offset from start in seconds
  "language": "en-US",          // Detected BCP-47 language code
  "speakerId": "SPEAKER_00",    // If diarization enabled
  "translations": [
    {
      "to": "es",
      "text": "Hola mundo"
    }
  ],
  "sentimentAnalysis": {
    "label": "positive",
    "score": 0.8
  },
  "redacted": [                 // Array of redacted PII entities
    {
      "text": "example@email.com",
      "confidenceScore": 0.95
    }
  ],
  "words": [                    // Available for 'recognized' status
    {
      "word": "Hello",
      "startTimeSeconds": 0.5,
      "endTimeSeconds": 0.8,
      "duration": 0.3
    }
  ]
}
```

## 🔐 Authentication

The Verbum API uses token-based authentication. Include your API key in the Socket.IO auth object:

```python
auth = {'token': 'YOUR_API_KEY'}
```

You can obtain your API key from the [Verbum SDK Portal](https://sdk.verbum.ai).

## 🛠️ SDK Integration

### Implementation Approaches

Each sample demonstrates different integration patterns for the Verbum API:

**Real-time Streaming**: Shows how to capture live audio from microphones and stream it continuously to the API for instant transcription results.

**File Processing**: Demonstrates how to process pre-recorded audio files, with automatic format validation and optimized streaming for batch transcription tasks.

**Cross-platform Support**: Examples include platform-specific optimizations and error handling for Windows, macOS, and Linux environments.

### Key Integration Concepts

- **WebSocket Connection Management**: Establishing and maintaining stable connections with proper authentication
- **Audio Format Handling**: Converting various audio formats to meet API requirements (PCM, specific sample rates, mono channel)
- **Real-time Data Streaming**: Efficiently chunking and sending audio data while maintaining timing accuracy
- **Result Processing**: Handling both interim (partial) and final transcription results
- **Error Recovery**: Implementing robust error handling for network issues, audio device problems, and API errors

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your API key is correct
   - Check network connectivity
   - Ensure WebSocket connections are allowed through firewalls

2. **Audio Not Recognized**
   - Verify audio format (PCM, 8kHz, mono, 16-bit)
   - Check microphone permissions
   - Ensure audio data is being sent correctly

3. **Poor Transcription Quality**
   - Reduce background noise
   - Speak clearly and at normal pace
   - Check microphone quality and positioning
   - Verify correct language setting


**Ready to get started?** Choose a sample from the repository and follow the setup instructions. Happy coding! 🚀

*For more information about Verbum API features visit [Verbum SDK Documentation](https://sdk-docs.verbum.ai/#/)*
