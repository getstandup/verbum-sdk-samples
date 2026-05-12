# Node.js TTS Examples

Standalone scripts that demonstrate **Text-To-Speech** via both the **HTTP** REST endpoint and the **Socket.IO WebSocket** endpoint.  
These scripts are also the manual regression suite for **VSDK-593** (TTS WebSocket customer-reported failures).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# → edit .env and set API_KEY and API_HOST

# 3. Run a script
npm run http         # HTTP synthesis → output-http-plain.mp3 + output-http-ssml.mp3
npm run websocket    # WebSocket synthesis → output-websocket.mp3
npm run sequential   # Sequential WebSocket synthesis → output-seq-1/2/3.mp3
```

> **Requires Node.js ≥ 18** (the HTTP script uses the built-in `fetch` API).

---

## Scripts

### `npm run http` — `http-tts.js`

Uses the REST endpoint to synthesize audio and save it as an MP3 file.

| Step         | Detail                                    |
| ------------ | ----------------------------------------- |
| Endpoint     | `POST /v1/speech/synthesize`              |
| Auth         | `x-api-key` request header                |
| Request body | `{ text, type, voice, audioFormat }`      |
| Response     | Binary audio stream (MP3 / chosen format) |

Two examples are run in sequence:

1. **Plain text** at normal speed → `output-http-plain.mp3`
2. **SSML** with `<prosody rate="1.4">` for custom speed → `output-http-ssml.mp3`

---

### `npm run websocket` — `websocket-tts.js`

Uses the Socket.IO endpoint for a single synthesis and saves the result.

| Step             | Detail                             |
| ---------------- | ---------------------------------- |
| Namespace        | `/speech`                          |
| Path             | `/v1/socket.io`                    |
| Connection query | `voice`, `format`, `usage=browser` |
| Auth             | `auth.token` (API key)             |

**Event flow:**

```
client  →  server : synthesizeText   "text to speak"
server  →  client : audioStream      ArrayBuffer  (may fire multiple times — one per chunk)
server  →  client : synthesisCompleted            (server is done; safe to send next message)
server  →  client : error            { message }  (on failure instead of the above two)
```

**VSDK-593 fixes validated:**

- **VSDK-598**: `audioStream` carries a proper `ArrayBuffer` — `Buffer.from(chunk)` works and the saved file is valid audio.  
  _Before the fix, the server returned a non-serializable Node.js `PassThrough` stream; the client received garbage or an empty object._

- **VSDK-597**: `synthesisCompleted` is received after `audioStream` — the script resolves successfully.  
  _Before the fix, `synthesisCompleted` was never emitted; the script would hang indefinitely after receiving the audio chunks._

---

### `npm run sequential` — `sequential-tts.js`

**The primary VSDK-597 regression test.**

Sends 3 sentences sequentially over a single persistent connection, gating each `synthesizeText` emission on the receipt of `synthesisCompleted` from the previous one.  
This replicates the exact customer-reported failure scenario.

```
connect
  → emit synthesizeText("sentence 1")
    ← audioStream (chunk 1…N)
    ← synthesisCompleted          ← VSDK-597: was never emitted before the fix
  → emit synthesizeText("sentence 2")
    ← audioStream
    ← synthesisCompleted
  → emit synthesizeText("sentence 3")
    ← audioStream
    ← synthesisCompleted
disconnect
```

**Expected output (after the fixes):**

```
output-seq-1.mp3   ← "Hello, my name is Aria."
output-seq-2.mp3   ← "The weather today is sunny and warm."
output-seq-3.mp3   ← "Have a wonderful day!"
```

**Before VSDK-597 fix:** only `output-seq-1.mp3` was created; the script would hang forever waiting for `synthesisCompleted` before sending sentence 2.

---

## Environment Variables

| Variable       | Default                 | Description                                |
| -------------- | ----------------------- | ------------------------------------------ |
| `API_KEY`      | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST`     | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |
| `VOICE`        | `en-US-AriaNeural`      | Voice identifier to use for synthesis.     |
| `AUDIO_FORMAT` | `Audio16Khz128KBitMp3`  | Audio output format.                       |

---

## Notes

- `usage: 'browser'` must always be set for WebSocket connections — this applies to both browser and Node.js clients.  
  Using `usage: 'stream'` was one of the VSDK-598 root causes (it triggered the `PassThrough` branch in the processor).
- The HTTP endpoint supports SSML for fine-grained prosody control (speed, pitch, volume). The WebSocket endpoint accepts plain text only.
- Audio chunks from multiple `audioStream` events are accumulated and merged with `Buffer.concat()` before writing — a single synthesis may produce more than one chunk.
