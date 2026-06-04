# Node.js Translation Examples

Standalone scripts demonstrating **Translation** via HTTP REST endpoint, including basic translation, batch translation, and language detection.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# → edit .env and set API_KEY and API_HOST

# 3. Run a script
npm run basic         # Translate a single text → output-basic.json
npm run batch         # Translate multiple texts → output-batch.json
```

> **Requires Node.js ≥ 18** (uses the built-in `fetch` API).

---

## Scripts

### `npm run basic` — `basic-translation.js`

Translates a single text string to a target language.

**Features:**

- Single text translation
- Language detection
- Confidence scores

**Example:**

```json
{
  "text": "Hello, how are you?",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "translatedText": "Hola, ¿cómo estás?"
}
```

---

### `npm run batch` — `batch-translation.js`

Translates multiple texts in a single request.

**Features:**

- Multiple text translation
- Batch processing
- Individual result tracking

**Output:**

```json
{
  "translations": [
    { "original": "text1", "translated": "texto1" },
    { "original": "text2", "translated": "texto2" }
  ]
}
```

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

Run `npm run basic` to test with the default language pair.

---

## API Endpoints

### GET /translator/languages

Lists all supported languages.

**Response:**

```json
{
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "es", "name": "Spanish" }
  ]
}
```

### POST /translator/translate

Translates text from source to target language.

**Request:**

```json
{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

**Response:**

```json
{
  "translatedText": "Hola mundo",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "confidence": 0.95
}
```

---

## Notes

- Language detection is automatic if `sourceLanguage` is not provided
- Translation accuracy varies by language pair
- Batch translation is optimized for throughput
