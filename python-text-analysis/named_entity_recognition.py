"""
Named Entity Recognition (NER) Example

Demonstrates entity extraction via HTTP REST endpoint:
    POST /text-analysis/entities

Usage:
    python named_entity_recognition.py
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
# NER Helper
# ---------------------------------------------------------------------------


def extract_entities(texts):
    """
    Identifies named entities in provided texts.

    Args:
        texts: List of texts to analyze

    Returns:
        List of NER results
    """
    url = f"{CONFIG['api_host']}{CONFIG['api_path_prefix']}/text-analysis/entities"

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
        # Sample texts with various entities
        texts = [
            "Apple Inc. was founded by Steve Jobs in Cupertino, California on April 1, 1976.",
            "CEO Tim Cook announced the iPhone 15 launch on September 12, 2023 in San Francisco.",
            "Microsoft and Google compete in the cloud computing market, with prices ranging from $100 to $10,000 per month.",
            "Dr. John Smith, a renowned physicist from MIT, will speak at the Conference on January 15, 2024.",
            "The meeting is scheduled for tomorrow at 2:30 PM in the New York office.",
            "Sarah Johnson earned $50,000 for her work on the Tesla project in Austin, Texas.",
        ]

        print(f"\nExtracting entities from {len(texts)} texts...\n")

        results = extract_entities(texts)

        # Entity type icons
        entity_icons = {
            "PERSON": "👤",
            "LOCATION": "📍",
            "ORGANIZATION": "🏢",
            "DATE": "📅",
            "TIME": "🕐",
            "MONEY": "💰",
            "PRODUCT": "📦",
            "EVENT": "🎪",
        }

        # Display results
        for result_idx, result in enumerate(results, 1):
            print(f"\n[Text {result_idx}] \"{result['text']}\"")

            entities = result.get("entities", [])
            if not entities:
                print("  No entities found")
                continue

            # Group entities by type
            entities_by_type = {}
            for entity in entities:
                entity_type = entity.get("type", "UNKNOWN")
                if entity_type not in entities_by_type:
                    entities_by_type[entity_type] = []
                entities_by_type[entity_type].append(entity)

            # Display grouped entities
            for entity_type, type_entities in sorted(entities_by_type.items()):
                icon = entity_icons.get(entity_type, "❓")
                print(f"\n  {icon} {entity_type}:")
                for entity in type_entities:
                    confidence = (entity.get("confidence", 0) * 100)
                    print(
                        f"     • \"{entity['entity']}\" "
                        f"(confidence: {confidence:.1f}%)"
                    )

        # Calculate statistics
        total_entities = 0
        type_stats = {}

        for result in results:
            entities = result.get("entities", [])
            total_entities += len(entities)
            for entity in entities:
                entity_type = entity.get("type", "UNKNOWN")
                if entity_type not in type_stats:
                    type_stats[entity_type] = 0
                type_stats[entity_type] += 1

        print("\n--- Entity Statistics ---")
        print(f"Total entities found: {total_entities}")
        for entity_type, count in sorted(type_stats.items()):
            print(f"  {entity_type}: {count}")

        # Save results to file
        output = {
            "config": {
                "apiHost": CONFIG["api_host"],
                "totalTexts": len(texts),
            },
            "timestamp": str(__import__("datetime").datetime.now().isoformat()),
            "statistics": {
                "totalEntities": total_entities,
                "byType": type_stats,
            },
            "results": [
                {
                    "text": r["text"],
                    "entityCount": len(r.get("entities", [])),
                    "entities": [
                        {
                            "entity": e["entity"],
                            "type": e.get("type"),
                            "confidence": e.get("confidence"),
                        }
                        for e in r.get("entities", [])
                    ],
                }
                for r in results
            ],
        }

        with open("output-entities.json", "w") as f:
            json.dump(output, f, indent=2)

        print("\nResults saved to: output-entities.json")

    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
