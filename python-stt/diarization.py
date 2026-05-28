"""
Speech-to-Text with Speaker Diarization Example

Demonstrates STT with speaker identification via WebSocket.
Diarization identifies different speakers in an audio stream.

Usage:
    python diarization.py
"""

import asyncio
import json
import os

import socketio
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CONFIG = {
    "api_host": os.getenv("API_HOST", "https://sdk.verbum.ai"),
    "api_key": os.getenv("API_KEY", ""),
    "language": os.getenv("LANGUAGE", "en-US"),
    "audio_file": os.getenv("AUDIO_FILE", "./sample.wav"),
    "output_file": "output-diarization.json",
}

if not CONFIG["api_key"] or CONFIG["api_key"] == "your_api_key_here":
    print("ERROR: Set API_KEY in your .env file")
    exit(1)


# ---------------------------------------------------------------------------
# Diarization STT Client
# ---------------------------------------------------------------------------


class DiarizationSTTClient:
    def __init__(self, config):
        self.config = config
        self.sio = None
        self.segments = []
        self.connected = False
        self.done = asyncio.Event()

    async def connect(self):
        """Connect to the WebSocket server"""
        print(f"\nConnecting to {self.config['api_host']}/speech...")

        self.sio = socketio.AsyncClient()

        @self.sio.event
        async def connect():
            self.connected = True
            print("✓ Connected")

        @self.sio.on("transcriptionUpdate")
        async def on_update(data):
            if "diarization" in data and "speaker" in data["diarization"]:
                speaker = f"Speaker-{data['diarization']['speaker']}"
                print(f"  [{speaker}] {data.get('transcript', '')}")

        @self.sio.on("transcriptionCompleted")
        async def on_completed(data):
            # Store segments with speaker information
            if "segments" in data:
                for segment in data["segments"]:
                    self.segments.append(
                        {
                            "speaker": f"Speaker-{segment.get('speakerId', '0')}",
                            "transcript": segment.get("transcript"),
                            "startTime": segment.get("startTime"),
                            "endTime": segment.get("endTime"),
                            "confidence": segment.get("confidence"),
                            "speakerId": segment.get("speakerId"),
                        }
                    )
                    print(
                        f"  [Speaker-{segment.get('speakerId', '0')}] "
                        f"{segment.get('transcript')} "
                        f"({segment.get('startTime', 0)}s - {segment.get('endTime', 0)}s)"
                    )

            # Store full transcript
            self.segments.append(
                {
                    "type": "full",
                    "transcript": data.get("transcript"),
                    "timestamp": str(__import__("datetime").datetime.now().isoformat()),
                }
            )

            self.done.set()

        @self.sio.on("transcriptionError")
        async def on_error(data):
            error_msg = data.get("message", "Unknown error") if isinstance(data, dict) else str(data)
            print(f"Transcription error: {error_msg}")
            self.done.set()

        @self.sio.event
        async def disconnect():
            self.connected = False

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
        """Start diarization transcription"""
        print(f"\nStarting diarization from: {self.config['audio_file']}")

        if not os.path.exists(self.config["audio_file"]):
            raise FileNotFoundError(f"Audio file not found: {self.config['audio_file']}")

        with open(self.config["audio_file"], "rb") as f:
            audio_data = f.read()

        # Start transcription with diarization enabled
        self.sio.emit(
            "startTranscription",
            {
                "language": [self.config["language"]],
                "encoding": "PCM",
                "sampleRate": 16000,
                "diarization": True,
                "diarizationSpeakerCount": None,  # Auto-detect speaker count
            },
        )

        chunk_size = 1024
        offset = 0

        try:
            while offset < len(audio_data):
                chunk = audio_data[offset : offset + chunk_size]
                offset += chunk_size
                self.sio.emit("audioStream", chunk)
                await asyncio.sleep(0.02)

            self.sio.emit("endStream")
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
        # Group segments by speaker
        speaker_map = {}
        segment_list = []

        for segment in self.segments:
            if segment.get("type") != "full":
                speaker = segment["speaker"]
                if speaker not in speaker_map:
                    speaker_map[speaker] = []
                speaker_map[speaker].append(segment)
            segment_list.append(segment)

        results = {
            "config": {
                "language": self.config["language"],
                "audioFile": os.path.basename(self.config["audio_file"]),
                "diarization": True,
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "summary": {
                "totalSpeakers": len(speaker_map),
                "speakers": list(speaker_map.keys()),
            },
            "speakerBreakdown": speaker_map,
            "allSegments": segment_list,
        }

        with open(self.config["output_file"], "w") as f:
            json.dump(results, f, indent=2)

        print(f"\nResults saved to: {self.config['output_file']}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main():
    client = DiarizationSTTClient(CONFIG)

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
