"""
Sentiment Analysis Example

Demonstrates sentiment analysis via HTTP REST endpoint:
    POST /text-analysis/sentiment

Usage:
    python sentiment_analysis.py
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
}

if not CONFIG["api_key"] or CONFIG["api_key"] == "your_api_key_here":
    print("ERROR: Set API_KEY in your .env file")
    exit(1)


# ---------------------------------------------------------------------------
# Sentiment Analysis Helper
# ---------------------------------------------------------------------------


def analyze_sentiment(texts):
    """
    Analyzes sentiment of provided texts.

    Args:
        texts: List of texts to analyze

    Returns:
        List of sentiment results
    """
    url = f"{CONFIG['api_host']}{CONFIG['api_path_prefix']}/text-analysis/sentiment"

    response = requests.post(
        url,
        json={"texts": texts},
        headers={"x-api-key": CONFIG["api_key"]},
    )

    if not response.ok:
        raise Exception(f"HTTP {response.status_code}: {response.text}")

    return response.json()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    try:
        # Sample texts with various sentiments
        texts = [
            "I absolutely love this product! It exceeded my expectations.",
            "This is the worst experience I have ever had.",
            "The service was okay, nothing special.",
            "Amazing quality and fantastic customer support!",
            "I am very disappointed with this purchase.",
            "The weather is nice today.",
            "I feel great and excited about the future!",
            "This is horrible and I want a refund.",
            "It works as expected.",
            "I could not be happier with my decision!",
        ]

        print(f"\nAnalyzing sentiment of {len(texts)} texts...\n")

        results = analyze_sentiment(texts)

        # Display results with emoji icons
        sentiment_icons = {
            "positive": "😊",
            "negative": "😞",
            "neutral": "😐",
        }

        for result in results:
            sentiment = result.get("sentiment", "neutral").lower()
            icon = sentiment_icons.get(sentiment, "❓")
            confidence = (result.get("confidence", 0) * 100)

            print(
                f"{icon} [{sentiment.upper():8}] ({confidence:5.1f}%) "
                f"\"{result['text']}\""
            )

        # Calculate statistics
        sentiment_counts = {
            "positive": len([r for r in results if r.get("sentiment", "").lower() == "positive"]),
            "negative": len([r for r in results if r.get("sentiment", "").lower() == "negative"]),
            "neutral": len([r for r in results if r.get("sentiment", "").lower() == "neutral"]),
        }

        avg_confidence = sum(r.get("confidence", 0) for r in results) / len(results)

        print("\n--- Summary ---")
        print(
            f"Positive: {sentiment_counts['positive']} "
            f"({(sentiment_counts['positive'] / len(texts) * 100):.1f}%)"
        )
        print(
            f"Negative: {sentiment_counts['negative']} "
            f"({(sentiment_counts['negative'] / len(texts) * 100):.1f}%)"
        )
        print(
            f"Neutral:  {sentiment_counts['neutral']} "
            f"({(sentiment_counts['neutral'] / len(texts) * 100):.1f}%)"
        )
        print(f"Average Confidence: {(avg_confidence * 100):.1f}%")

        # Save results to file
        output = {
            "config": {
                "apiHost": CONFIG["api_host"],
                "totalTexts": len(texts),
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "statistics": sentiment_counts,
            "averageConfidence": avg_confidence,
            "results": [
                {
                    "text": r["text"],
                    "sentiment": r.get("sentiment"),
                    "confidence": r.get("confidence"),
                }
                for r in results
            ],
        }

        with open("output-sentiment.json", "w") as f:
            json.dump(output, f, indent=2)

        print("\nResults saved to: output-sentiment.json")

    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
