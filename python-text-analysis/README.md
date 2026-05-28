# Python Text Analysis Examples

Standalone scripts demonstrating **Text Analysis** features including sentiment analysis, named entity recognition (NER), text summarization, and PII redaction.

---

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure credentials
cp .env.example .env
# → edit .env and set API_KEY and API_HOST

# 4. Run a script
python sentiment_analysis.py
python named_entity_recognition.py
python text_summarization.py
python pii_redaction.py
python combined_analysis.py
```

> **Requires Python 3.8+**

---

## Scripts

### `sentiment_analysis.py`

Analyzes the sentiment of text (positive, negative, neutral).

**Features:**
- Sentiment classification
- Confidence scores
- Batch analysis

**Output:** `output-sentiment.json`

---

### `named_entity_recognition.py`

Identifies named entities (persons, locations, organizations, etc.) in text.

**Features:**
- Entity type classification
- Entity position in text
- Confidence scores

**Output:** `output-entities.json`

---

### `text_summarization.py`

Generates concise summaries of longer texts.

**Features:**
- Automatic summarization
- Configurable summary length
- Key point extraction

**Output:** `output-summary.json`

---

### `pii_redaction.py`

Detects and redacts personally identifiable information.

**Features:**
- PII detection
- Automatic redaction
- Original text preservation

**Output:** `output-redact.json`

---

### `combined_analysis.py`

Applies multiple analysis features to the same text.

**Features:**
- Running multiple analyses in parallel
- Aggregating results
- Complex use case demonstration

**Output:** `output-combined.json`

---

## Environment Variables

| Variable       | Default                 | Description                                |
| -------------- | ----------------------- | ------------------------------------------ |
| `API_KEY`      | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST`     | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |

---

## API Endpoints

### POST /text-analysis/sentiment
Analyzes sentiment of the provided text.

### POST /text-analysis/entities
Identifies named entities in text.

### POST /text-analysis/text-summarize
Generates a summary of the provided text.

### POST /text-analysis/redact
Detects and redacts PII in text.

---

## Dependencies

```
requests>=2.28.0
python-dotenv>=0.21.0
aiohttp>=3.8.0
```

---

## Notes

- Sentiment analysis works best with complete sentences
- NER accuracy depends on text quality and language
- Summarization quality varies with text length and complexity
- PII redaction is conservative (may over-redact to ensure privacy)
