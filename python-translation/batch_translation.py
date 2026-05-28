"""
Batch Translation Example

Demonstrates translating multiple texts efficiently with concurrency control.

Usage:
    python batch_translation.py
"""

import asyncio
import json
import os
import time

import aiohttp
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
# Batch Translation Helper
# ---------------------------------------------------------------------------


async def translate_text(session, text, target_lang, source_lang=None):
    """
    Translates a single text via HTTP request.

    Args:
        session: aiohttp ClientSession
        text: The text to translate
        target_lang: Target language code
        source_lang: Source language code (optional)

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

    try:
        async with session.post(
            url,
            json=body,
            headers={"x-api-key": CONFIG["api_key"]},
        ) as response:
            if response.status == 200:
                return await response.json()
            else:
                error_text = await response.text()
                raise Exception(f"HTTP {response.status}: {error_text}")
    except Exception as error:
        raise Exception(f"Translation failed: {str(error)}")


async def batch_translate(texts, target_lang, concurrency=3):
    """
    Translates multiple texts with concurrency control.

    Args:
        texts: List of texts to translate
        target_lang: Target language code
        concurrency: Maximum concurrent requests

    Returns:
        Tuple of (successful_results, failed_results)
    """
    results = []
    errors = []

    async with aiohttp.ClientSession() as session:
        # Process texts in batches
        for i in range(0, len(texts), concurrency):
            batch = texts[i : i + concurrency]

            # Translate all texts in batch concurrently
            tasks = [
                translate_text(
                    session,
                    text,
                    target_lang,
                    CONFIG["source_language"],
                )
                for text in batch
            ]

            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for idx, result in enumerate(batch_results):
                original_idx = i + idx
                original_text = batch[idx]

                if isinstance(result, Exception):
                    errors.append(
                        {
                            "index": original_idx,
                            "original": original_text,
                            "error": str(result),
                        }
                    )
                    print(f"[{original_idx + 1}] ✗ \"{original_text}\" - {result}")
                else:
                    results.append(
                        {
                            "index": original_idx,
                            "original": original_text,
                            **result,
                        }
                    )
                    print(f"[{original_idx + 1}] ✓ \"{original_text}\"")

    return results, errors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main():
    try:
        # Sample texts to translate
        texts = [
            "Good morning!",
            "The quick brown fox jumps over the lazy dog.",
            "Machine translation is powered by advanced neural networks.",
            "How much does this cost?",
            "I love learning new languages.",
            "The sunset is beautiful this evening.",
            "Could you please help me with this?",
            "Technology makes communication easier.",
            "What time is the meeting tomorrow?",
            "I enjoyed our conversation very much.",
        ]

        print(
            f"\nBatch translating {len(texts)} texts "
            f"from {CONFIG['source_language']} to {CONFIG['target_language']}..."
        )
        print("Using concurrency: 3\n")

        start_time = time.time()
        results, errors = await batch_translate(texts, CONFIG["target_language"], 3)
        duration = time.time() - start_time

        print(f"\nCompleted in {duration:.2f}s")
        print(f"Success: {len(results)}/{len(texts)}")
        if errors:
            print(f"Errors: {len(errors)}/{len(texts)}")

        # Save results to file
        output = {
            "config": {
                "apiHost": CONFIG["api_host"],
                "sourceLanguage": CONFIG["source_language"],
                "targetLanguage": CONFIG["target_language"],
                "totalTexts": len(texts),
                "concurrency": 3,
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "duration": f"{duration:.2f}s",
            "statistics": {
                "successful": len(results),
                "failed": len(errors),
                "totalProcessed": len(texts),
            },
            "successfulTranslations": [
                {
                    "original": r["original"],
                    "translated": r.get("translatedText"),
                    "confidence": r.get("confidence"),
                }
                for r in results
            ],
            "failedTranslations": [
                {
                    "original": e["original"],
                    "error": e["error"],
                }
                for e in errors
            ],
        }

        with open("output-batch.json", "w") as f:
            json.dump(output, f, indent=2)

        print("Results saved to: output-batch.json")

    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)


if __name__ == "__main__":
    asyncio.run(main())
