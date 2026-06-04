# Node.js Text Analysis Examples

Standalone scripts demonstrating **Text Analysis** features including sentiment analysis, named entity recognition (NER), and PII redaction.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# → edit .env and set API_KEY and API_HOST

# 3. Run a script
npm run sentiment      # Sentiment analysis → output-sentiment.json
npm run entities       # Named entity recognition → output-entities.json
npm run redact         # PII redaction → output-redact.json
```

> **Requires Node.js ≥ 18** (uses the built-in `fetch` API).

---

## Scripts

### `npm run sentiment` — `sentiment-analysis.js`

Analyzes the sentiment of text (positive, negative, neutral).

**Features:**

- Sentiment classification
- Confidence scores
- Sentence-level analysis

**Output:**

```json
{
  "text": "I love this product! It's amazing.",
  "sentiment": "positive",
  "confidence": 0.95,
  "sentences": [
    { "text": "I love this product!", "sentiment": "positive" },
    { "text": "It's amazing.", "sentiment": "positive" }
  ]
}
```

---

### `npm run entities` — `named-entity-recognition.js`

Identifies named entities (persons, locations, organizations, etc.) in text.

**Features:**

- Entity type classification
- Entity position in text
- Confidence scores

**Entity Types:**

- PERSON
- LOCATION
- ORGANIZATION
- DATE
- TIME
- MONEY
- PRODUCT
- EVENT

---

### `npm run redact` — `pii-redaction.js`

Detects and redacts personally identifiable information.

**Features:**

- PII detection
- Automatic redaction
- Original text preservation

**Redaction Categories:**

- Phone numbers
- Email addresses
- Credit card numbers
- Social Security Numbers (SSN)
- Account numbers
- Names (optional)
- Addresses (optional)

---

## Environment Variables

| Variable   | Default                 | Description                                |
| ---------- | ----------------------- | ------------------------------------------ |
| `API_KEY`  | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST` | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |

---

## API Endpoints

### POST /text-analysis/sentiment

Analyzes sentiment of the provided text.

**Request:**

```json
{
  "texts": ["I love this!", "I hate this."]
}
```

**Response:**

```json
[
  {
    "text": "I love this!",
    "sentiment": "positive",
    "confidence": 0.98
  },
  {
    "text": "I hate this.",
    "sentiment": "negative",
    "confidence": 0.97
  }
]
```

### POST /text-analysis/entities

Identifies named entities in text.

**Request:**

```json
{
  "texts": ["John works at Google in New York."]
}
```

**Response:**

```json
[
  {
    "text": "John works at Google in New York.",
    "entities": [
      { "entity": "John", "type": "PERSON", "position": 0 },
      { "entity": "Google", "type": "ORGANIZATION", "position": 15 },
      { "entity": "New York", "type": "LOCATION", "position": 31 }
    ]
  }
]
```

### POST /text-analysis/text-summarize

Generates a summary of the provided text.

**Request:**

```json
{
  "text": "Long text to summarize...",
  "summaryLength": "short"
}
```

**Response:**

```json
{
  "originalText": "Long text to summarize...",
  "summary": "Summary of the text...",
  "originalLength": 1000,
  "summaryLength": 150,
  "compressionRatio": 0.15
}
```

### POST /text-analysis/redact

Detects and redacts PII in text.

**Request:**

```json
{
  "texts": ["Call me at 555-1234 or email john@example.com"],
  "categories": ["PHONE", "EMAIL"]
}
```

**Response:**

```json
[
  {
    "original": "Call me at 555-1234 or email john@example.com",
    "redacted": "Call me at [PHONE] or email [EMAIL]",
    "detectedItems": [
      { "type": "PHONE", "value": "555-1234", "position": 11 },
      { "type": "EMAIL", "value": "john@example.com", "position": 35 }
    ]
  }
]
```

---

## Notes

- Sentiment analysis works best with complete sentences
- NER accuracy depends on text quality and language
- Summarization quality varies with text length and complexity
- PII redaction is conservative (may over-redact to ensure privacy)
