"""
PII Redaction Example

Demonstrates PII (Personally Identifiable Information) detection and redaction:
    POST /text-analysis/redact

Usage:
    python pii_redaction.py
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

# PII categories that can be redacted
PII_CATEGORIES = [
    "PHONE_NUMBER",
    "EMAIL",
    "CREDIT_CARD",
    "SSN",
    "ACCOUNT_NUMBER",
    "NAME",
    "ADDRESS",
    "IP_ADDRESS",
    "URL",
]


# ---------------------------------------------------------------------------
# PII Redaction Helper
# ---------------------------------------------------------------------------


def redact_pii(texts, categories):
    """
    Detects and redacts PII in provided texts.

    Args:
        texts: List of texts to redact
        categories: List of PII categories to redact

    Returns:
        List of redaction results
    """
    url = f"{CONFIG['api_host']}{CONFIG['api_path_prefix']}/text-analysis/redact"

    response = requests.post(
        url,
        json={
            "texts": texts,
            "categories": categories,
        },
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
        # Sample texts with various PII
        texts = [
            "Call me at 555-123-4567 or 555.987.6543 for more information.",
            "My email is john.doe@example.com and my backup is j.doe@company.org",
            "My SSN is 123-45-6789 and credit card is 4532-1234-5678-9010",
            "Send payment to account 987654321 at the New York branch.",
            "Visit our website at https://example.com or call (212) 555-0100",
            "Contact Sarah Johnson at sarah.johnson@acme.com, phone: 415-555-0123",
            "Billing address: 123 Main St, New York, NY 10001",
            "IP Address: 192.168.1.1 - Server at 10.0.0.5",
        ]

        print(f"\nRedacting PII from {len(texts)} texts...\n")
        print(f"Categories to redact: {', '.join(PII_CATEGORIES)}\n")

        results = redact_pii(texts, PII_CATEGORIES)

        # Display results
        for result_idx, result in enumerate(results, 1):
            print(f"[Text {result_idx}]")
            print(f"  Original: {result.get('original')}")
            print(f"  Redacted: {result.get('redacted')}")

            detected_items = result.get("detectedItems", [])
            if detected_items:
                print(f"  Detected PII: {len(detected_items)} item(s)")
                for item in detected_items:
                    print(f"    • [{item.get('type')}] \"{item.get('value')}\"")
            else:
                print("  No PII detected")
            print()

        # Calculate statistics
        total_pii_items = 0
        pii_type_stats = {}

        for result in results:
            detected_items = result.get("detectedItems", [])
            total_pii_items += len(detected_items)
            for item in detected_items:
                item_type = item.get("type", "UNKNOWN")
                if item_type not in pii_type_stats:
                    pii_type_stats[item_type] = 0
                pii_type_stats[item_type] += 1

        print("--- PII Statistics ---")
        print(f"Total PII items found: {total_pii_items}")

        texts_with_pii = len([r for r in results if r.get("detectedItems", [])])
        print(f"Texts with PII: {texts_with_pii}/{len(texts)}")

        if pii_type_stats:
            print("\nPII Breakdown:")
            for pii_type, count in sorted(pii_type_stats.items()):
                print(f"  {pii_type}: {count}")

        # Save results to file
        output = {
            "config": {
                "apiHost": CONFIG["api_host"],
                "categories": PII_CATEGORIES,
                "totalTexts": len(texts),
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "statistics": {
                "totalPIIItems": total_pii_items,
                "byType": pii_type_stats,
                "textsWithPII": texts_with_pii,
            },
            "results": [
                {
                    "original": r.get("original"),
                    "redacted": r.get("redacted"),
                    "piiItemCount": len(r.get("detectedItems", [])),
                    "detectedItems": [
                        {
                            "type": item.get("type"),
                            "value": item.get("value"),
                        }
                        for item in r.get("detectedItems", [])
                    ],
                }
                for r in results
            ],
        }

        with open("output-redact.json", "w") as f:
            json.dump(output, f, indent=2)

        print("\nResults saved to: output-redact.json")

    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
