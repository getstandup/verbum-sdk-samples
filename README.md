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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Ready to get started?** Choose a sample from the repository and follow the setup instructions. Happy coding! 🚀

*For more information about Verbum API features and pricing, visit [verbum.ai](https://verbum.ai)*
