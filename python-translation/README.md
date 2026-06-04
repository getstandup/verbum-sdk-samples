# Python Translation Examples

Standalone scripts demonstrating **Translation** via HTTP REST endpoint, including basic translation, batch translation, and language detection.

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
python basic_translation.py
python batch_translation.py
```

> **Requires Python 3.8+**

---

## Scripts

### `basic_translation.py`

Translates a single text string to a target language.

**Features:**

- Single text translation
- Language detection
- Confidence scores

**Output:** `output-basic.json`

---

### `batch_translation.py`

Translates multiple texts in a single or concurrent requests.

**Features:**

- Multiple text translation
- Batch processing with concurrency control
- Individual result tracking
- Performance metrics

**Output:** `output-batch.json`

---

## Environment Variables

| Variable      | Default                 | Description                                |
| ------------- | ----------------------- | ------------------------------------------ |
| `API_KEY`     | —                       | **Required.** Your vcall-seamless API key. |
| `API_HOST`    | `https://sdk.verbum.ai` | Base URL of the API (no trailing slash).   |
| `SOURCE_LANG` | `en`                    | Source language code (auto-detect if null) |
| `TARGET_LANG` | `es`                    | Default target language code               |

---

## Supported Languages

Common language codes:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic
- `ru` - Russian

Run `python basic_translation.py` to see the complete list.

---

## API Endpoints

### GET /translator/languages

Lists all supported languages.

### POST /translator/translate

Translates text from source to target language.

---

## Dependencies

```
requests>=2.28.0
python-dotenv>=0.21.0
aiohttp>=3.8.0
```

---

## Notes

- Language detection is automatic if `sourceLanguage` is not provided
- Translation accuracy varies by language pair
- Batch translation is optimized for throughput with configurable concurrency
