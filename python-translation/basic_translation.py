"""
Basic Translation Example

Demonstrates text translation via HTTP REST endpoint:
    POST /translator/translate

Usage:
    python basic_translation.py
"""

import json
import os

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
    "source_language": os.getenv("SOURCE_LANG", "en"),
    "target_language": os.getenv("TARGET_LANG", "es"),
}

if not CONFIG["api_key"] or CONFIG["api_key"] == "your_api_key_here":
    print("ERROR: Set API_KEY in your .env file")
    exit(1)


# ---------------------------------------------------------------------------
# Translation Helper
# ---------------------------------------------------------------------------


def translate_text(text, target_lang, source_lang=None):
    """
    Translates text from source to target language.

    Args:
        text: The text to translate
        target_lang: Target language code (e.g., 'es', 'fr')
        source_lang: Source language code (auto-detect if omitted)

    Returns:
        Translation result dictionary
    """
    url = f"{CONFIG['api_host']}{CONFIG['api_path_prefix']}/translator/translate"

    body = {
        "text": text,
        "targetLanguage": target_lang,
    }
    if source_lang:
        body["sourceLanguage"] = source_lang

    print(f"\nTranslating to {target_lang}:")
    print(f"  Original: \"{text}\"")

    response = requests.post(
        url,
        json=body,
        headers={"x-api-key": CONFIG["api_key"]},
    )

    if not response.ok:
        raise Exception(f"HTTP {response.status_code}: {response.text}")

    result = response.json()
    print(f"  Translated: \"{result.get('translatedText')}\"")

    return result


def get_languages():
    """Get list of supported languages"""
    url = f"{CONFIG['api_host']}{CONFIG['api_path_prefix']}/translator/languages"

    response = requests.get(
        url,
        headers={"x-api-key": CONFIG["api_key"]},
    )

    if not response.ok:
        raise Exception(f"Failed to get languages: HTTP {response.status_code}")

    return response.json()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    try:
        # Get available languages
        print(f"Available languages: {CONFIG['api_host']}")
        langs = get_languages()
        print(f"Found {len(langs.get('languages', []))} supported languages")

        # Example texts to translate
        texts = [
            "Hello, how are you today?",
            "The weather is nice this morning.",
            "I would like to order a coffee, please.",
        ]

        results = []

        # Translate each text
        for text in texts:
            result = translate_text(
                text, CONFIG["target_language"], CONFIG["source_language"]
            )
            results.append(
                {
                    "original": text,
                    "sourceLanguage": CONFIG["source_language"],
                    "targetLanguage": CONFIG["target_language"],
                    "translated": result.get("translatedText"),
                    "confidence": result.get("confidence"),
                    "sourceLanguageDetected": result.get("sourceLanguage"),
                }
            )

        # Save results to file
        output = {
            "config": {
                "apiHost": CONFIG["api_host"],
                "sourceLanguage": CONFIG["source_language"],
                "targetLanguage": CONFIG["target_language"],
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "results": results,
        }

        with open("output-basic.json", "w") as f:
            json.dump(output, f, indent=2)

        print("\nResults saved to: output-basic.json")

    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
