"""
Basic Speech-to-Text Example

Demonstrates STT via WebSocket with real-time streaming using python-socketio.

Usage:
    python basic_transcription.py
"""

import asyncio
import json
import os
from pathlib import Path

import socketio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CONFIG = {
    "api_host": os.getenv("API_HOST", "https://sdk.verbum.ai"),
    "api_key": os.getenv("API_KEY", ""),
    "language": os.getenv("LANGUAGE", "en-US"),
    "audio_file": os.getenv("AUDIO_FILE", "./sample.wav"),
    "output_file": "output-basic.json",
}

if not CONFIG["api_key"] or CONFIG["api_key"] == "your_api_key_here":
    print("ERROR: Set API_KEY in your .env file")
    exit(1)


# ---------------------------------------------------------------------------
# STT Client
# ---------------------------------------------------------------------------


class STTClient:
    def __init__(self, config):
        self.config = config
        self.sio = None
        self.transcripts = []
        self.current_transcript = ""
        self.connected = False
        self.done = asyncio.Event()

    async def connect(self):
        """Connect to the WebSocket server and initialize the transcription session"""
        print(f"\nConnecting to {self.config['api_host']}/speech...")

        self.sio = socketio.AsyncClient()

        @self.sio.event
        async def connect():
            self.connected = True
            print("✓ Connected")

        @self.sio.on("transcriptionUpdate")
        async def on_transcription_update(data):
            self.current_transcript = data.get("transcript", "")
            print(f"  [interim] {self.current_transcript}")

        @self.sio.on("transcriptionCompleted")
        async def on_transcription_completed(data):
            self.current_transcript = data.get("transcript", "")
            print(f"  [final] {self.current_transcript}")
            self.transcripts.append(
                {
                    "transcript": self.current_transcript,
                    "language": data.get("language"),
                    "confidence": data.get("confidence"),
                    "timestamp": str(__import__("datetime").datetime.now().isoformat()),
                }
            )

        @self.sio.on("transcriptionError")
        async def on_transcription_error(data):
            error_msg = data.get("message", "Unknown error") if isinstance(data, dict) else str(data)
            print(f"Transcription error: {error_msg}")
            self.done.set()

        @self.sio.event
        async def disconnect():
            self.connected = False
            print("Disconnected")

        try:
            await self.sio.connect(
                f"{self.config['api_host']}/speech",
                auth={"token": self.config["api_key"]},
                transports=["websocket"],
                headers={"language": self.config["language"], "usage": "browser"},
            )
        except Exception as e:
            print(f"Connection failed: {e}")
            raise

    async def start_transcription(self):
        """Start transcription and stream audio file"""
        print(f"\nStarting transcription from: {self.config['audio_file']}")

        # Check if file exists
        if not os.path.exists(self.config["audio_file"]):
            raise FileNotFoundError(f"Audio file not found: {self.config['audio_file']}")

        # Read audio file
        with open(self.config["audio_file"], "rb") as f:
            audio_data = f.read()

        # Emit start event with STT options
        self.sio.emit(
            "startTranscription",
            {
                "language": [self.config["language"]],
                "encoding": "PCM",
                "sampleRate": 16000,
            },
        )

        # Stream audio chunks
        chunk_size = 1024
        offset = 0

        try:
            while offset < len(audio_data):
                chunk = audio_data[offset : offset + chunk_size]
                offset += chunk_size

                # Send audio chunk
                self.sio.emit("audioStream", chunk)
                # Simulate real-time streaming (20ms interval)
                await asyncio.sleep(0.02)

            # Signal end of stream
            self.sio.emit("endStream")

            # Wait for completion with timeout
            await asyncio.wait_for(self.done.wait(), timeout=300)
        except asyncio.TimeoutError:
            print("Transcription timeout")
            raise

    async def disconnect(self):
        """Disconnect from the server"""
        if self.sio:
            await self.sio.disconnect()
            print("Disconnected")

    def save_results(self):
        """Save results to JSON file"""
        results = {
            "config": {
                "language": self.config["language"],
                "audioFile": os.path.basename(self.config["audio_file"]),
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "transcripts": self.transcripts,
            "fullTranscript": " ".join(t["transcript"] for t in self.transcripts),
        }

        with open(self.config["output_file"], "w") as f:
            json.dump(results, f, indent=2)

        print(f"\nResults saved to: {self.config['output_file']}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main():
    client = STTClient(CONFIG)

    try:
        await client.connect()
        await client.start_transcription()
        client.save_results()
    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)
    finally:
        await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
