"""
HTTP Text-to-Speech Example

Demonstrates TTS via the REST HTTP endpoint:
    POST /v1/speech/synthesize

Supports both plain text and SSML (for speed/prosody control).
Saves the resulting audio as an MP3 file.

Usage:
    python http_tts.py
"""

import os
import html

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CONFIG = {
    "api_host": os.getenv("API_HOST", "https://sdk.verbum.ai"),
    "api_path_prefix": os.getenv("API_PATH_PREFIX", "/v1"),
    "api_key": os.getenv("API_KEY", ""),
    "voice": os.getenv("VOICE", "en-US-AriaNeural"),
    "audio_format": os.getenv("AUDIO_FORMAT", "Audio16Khz128KBitMp3"),
}

if not CONFIG["api_key"] or CONFIG["api_key"] == "your_api_key_here":
    print("ERROR: Set API_KEY in your .env file")
    exit(1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def build_ssml(text, voice, language, speed_rate):
    """
    Wraps plain text in SSML with a prosody rate tag.

    Args:
        text: The text to speak
        voice: The voice name
        language: The BCP-47 language code (e.g. "en-US")
        speed_rate: Prosody rate multiplier (e.g. 1.5 = 150% speed)

    Returns:
        SSML string
    """
    safe_text = html.escape(text)
    return f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{language}">
  <voice name="{voice}">
    <prosody rate="{speed_rate}">
      {safe_text}
    </prosody>
  </voice>
</speak>"""


def synthesize_http(text, text_type, output_file):
    """
    Synthesizes text via HTTP POST and saves it to an MP3 file.

    Args:
        text: The text (or SSML) to synthesize
        text_type: Content type ('plain' or 'ssml')
        output_file: Path of the file to write
    """
    url = f"{CONFIG['api_host']}{CONFIG['api_path_prefix']}/speech/synthesize"

    body = {
        "text": text,
        "type": text_type,
        "voice": CONFIG["voice"],
        "audioFormat": CONFIG["audio_format"],
    }

    print(f"\nPOST {url}")
    print(f"  type     : {text_type}")
    print(f"  voice    : {CONFIG['voice']}")
    print(f"  format   : {CONFIG['audio_format']}")

    response = requests.post(
        url,
        json=body,
        headers={"x-api-key": CONFIG["api_key"]},
    )

    if not response.ok:
        raise Exception(f"HTTP {response.status_code}: {response.text}")

    # Write audio to file
    with open(output_file, "wb") as f:
        f.write(response.content)

    print(f"  saved to : {output_file} ({len(response.content)} bytes)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    try:
        # Example 1: Plain text at normal speed
        plain_text = (
            "Hello! This is a plain text synthesis using the HTTP endpoint."
        )
        synthesize_http(
            plain_text,
            "plain",
            "output-http-plain.mp3",
        )

        # Example 2: SSML with custom speed (1.4x)
        ssml = build_ssml(
            "This sentence is synthesized via SSML at one-point-four times the normal speed.",
            CONFIG["voice"],
            "en-US",
            1.4,
        )
        synthesize_http(
            ssml,
            "ssml",
            "output-http-ssml.mp3",
        )

        print(
            "\nAll done! Open output-http-plain.mp3 and output-http-ssml.mp3 to verify the audio."
        )

    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
