# Browser-based Text Analysis Example

A complete web-based example demonstrating text analysis features including sentiment analysis, named entity recognition (NER), and PII redaction using the vcall-seamless API.

---

## Features

- 😊 **Sentiment Analysis** - Classify text as positive, negative, or neutral
- 🏷️ **Named Entity Recognition** - Extract persons, locations, organizations, dates, etc.
- 🔒 **PII Redaction** - Detect and redact sensitive personal information
- 🎯 **Flexible Feature Selection** - Enable/disable features as needed
- 📊 **Real-time Results** - See results as soon as analysis completes
- ⚡ **Keyboard Shortcut** - Ctrl/Cmd + Enter to analyze

---

## Quick Start

### 1. Open in Browser

Simply open `index.html` in a web browser:

```bash
# Option 1: Direct file open
open index.html

# Option 2: Local development server (Python)
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Node.js development server
npx http-server
```

### 2. Configure

1. Enter your **API Key** (required)
2. Optionally update the **API Host** (default: `https://sdk.verbum.ai`)
3. Select which **Analysis Features** to enable

### 3. Analyze

1. Enter text in the **"Text to Analyze"** field
2. Click **"Analyze"** or press **Ctrl/Cmd + Enter**
3. View the results below

---

## Project Structure

```
browser-text-analysis/
├── index.html      # Main UI with styling
├── app.js          # Analysis client and logic
└── README.md       # This file
```

---

## Analysis Features

### 1. Sentiment Analysis

Classifies the overall sentiment of the text.

**Output:**
- Sentiment: `positive`, `negative`, or `neutral`
- Confidence: 0-100%

**Example:**
```
Input:  "I love this product! It's amazing."
Output: POSITIVE (98%)
```

### 2. Named Entity Recognition (NER)

Identifies and classifies named entities in the text.

**Entity Types:**
- **PERSON** - People's names
- **LOCATION** - Geographic locations, cities, countries
- **ORGANIZATION** - Companies, organizations
- **DATE** - Dates and date expressions
- **TIME** - Time expressions
- **MONEY** - Monetary amounts
- **PRODUCT** - Product names
- **EVENT** - Named events

**Example:**
```
Input:  "Apple Inc. was founded by Steve Jobs in Cupertino."
Output:
  PERSON: Steve Jobs
  ORGANIZATION: Apple Inc.
  LOCATION: Cupertino
```

### 3. PII Redaction

Detects personally identifiable information and redacts it.

**PII Categories Detected:**
- Phone numbers (e.g., 555-123-4567)
- Email addresses (e.g., john@example.com)
- Credit card numbers (e.g., 4532-1234-5678-9010)
- Social Security Numbers (e.g., 123-45-6789)
- Account numbers
- Names (optional)
- Addresses (optional)

**Example:**
```
Input:  "Call me at 555-1234 or email john@example.com"
Output: "Call me at [PHONE_NUMBER] or email [EMAIL]"

Detected:
  [PHONE_NUMBER] 555-1234
  [EMAIL] john@example.com
```

---

## How It Works

### Analysis Flow

```
User enters text
       ↓
Select features to enable
       ↓
Click "Analyze"
       ↓
For each enabled feature:
    ├─ POST /text-analysis/sentiment (if enabled)
    ├─ POST /text-analysis/entities (if enabled)
    └─ POST /text-analysis/redact (if enabled)
       ↓
Collect all results
       ↓
Display comprehensive analysis
```

### API Requests

#### Sentiment Analysis
```javascript
POST /v1/text-analysis/sentiment
{
  "texts": ["I love this product!"]
}
```

#### Entity Extraction
```javascript
POST /v1/text-analysis/entities
{
  "texts": ["Apple was founded by Steve Jobs."]
}
```

#### PII Redaction
```javascript
POST /v1/text-analysis/redact
{
  "texts": ["Call 555-1234 or email john@example.com"],
  "categories": ["PHONE_NUMBER", "EMAIL", "CREDIT_CARD", "SSN", "ACCOUNT_NUMBER"]
}
```

---

## Configuration

### Default Values (in code)

```javascript
const CONFIG = {
  apiHost: 'https://sdk.verbum.ai',
  apiPathPrefix: '/v1',
};
```

### Enabling/Disabling Features

Click the feature buttons to toggle them:
- 😊 **Sentiment** - Sentiment analysis
- 🏷️ **Entities** - Named entity recognition
- 🔒 **PII Redact** - Personally identifiable information redaction

---

## Performance

- **Latency**: Typically 100-500ms depending on text length and server
- **Text Length**: Works with short snippets to long documents
- **Concurrent Requests**: Features are analyzed in parallel for better performance
- **Batch Processing**: Can be extended for batch analysis (see Node.js examples)

---

## Error Handling

The application handles:
- Missing API key
- Invalid API key
- Network connection failures
- API server errors
- Empty text submission
- No features selected

Errors are displayed in the status area with helpful messages.

---

## Browser Compatibility

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- Requires Fetch API
- Requires ES6+ support

---

## Security Considerations

- ⚠️ **Never commit your API key** - Use environment variables or secure storage
- 🔐 API key is sent in request headers - use HTTPS in production
- 📊 Text is sent to the server for analysis - ensure sensitive data policies
- 🔒 Results are stored only in browser memory (not in localStorage)

---

## Use Cases

### Customer Support
- Analyze customer feedback sentiment
- Extract key information from support tickets
- Redact sensitive customer information before analysis

### Content Moderation
- Detect negative sentiment in user comments
- Extract entities for context understanding
- Identify and redact sensitive information

### Data Privacy
- Find and redact PII before sharing documents
- Ensure GDPR/HIPAA compliance
- Protect customer data

### Business Intelligence
- Analyze sentiment of customer reviews
- Extract key entities from business documents
- Categorize and classify text content

### Accessibility
- Generate summaries of long texts
- Extract key information for quick scanning
- Identify important entities in documents

---

## Advanced Features

### Batch Analysis

For analyzing multiple texts, see the Node.js example in `../nodejs-text-analysis/combined-analysis.js`:

```javascript
const texts = [
  "First text to analyze",
  "Second text to analyze",
  "Third text to analyze"
];

for (const text of texts) {
  await analyzeText(text);
}
```

### Custom PII Categories

Modify the categories in the redaction request:

```javascript
const categories = [
  'PHONE_NUMBER',
  'EMAIL',
  'CREDIT_CARD',
  'SSN',
  'ACCOUNT_NUMBER',
  // Add more categories as needed
];
```

### Save Results

Store analysis results in a database:

```javascript
async function saveAnalysisResults(text, results) {
  await fetch('/api/analysis', {
    method: 'POST',
    body: JSON.stringify({ text, results })
  });
}
```

---

## Troubleshooting

### No Results Showing
- Verify API key is correct
- Check that at least one feature is enabled
- Ensure text is not empty
- Check browser console for errors

### Some Features Not Working
- Features fail silently to allow partial results
- Check the network tab in browser dev tools
- Verify API server is accessible
- Ensure your API plan includes these features

### Slow Analysis
- Longer texts take more time to process
- Multiple features may reduce performance
- Check your network connection
- Verify API server is not overloaded

### Incorrect Results
- Text analysis quality depends on text clarity
- Proper punctuation and grammar improve results
- Ambiguous text may produce lower confidence scores
- Entity recognition works best with proper names

---

## Extending the Example

### Add More Languages Support

Text analysis features work in multiple languages. The UI currently assumes English, but you can extend it:

```javascript
// Add language selection
<select id="language">
  <option value="en">English</option>
  <option value="es">Spanish</option>
  <option value="fr">French</option>
</select>

// Pass language to API requests
body: JSON.stringify({
  texts: [text],
  language: selectedLanguage
})
```

### Custom Result Display

Modify the `renderResults()` function to customize how results are displayed:

```javascript
function renderResults(results) {
  // Custom rendering logic here
  // Add graphs, charts, or other visualizations
}
```

### Integration with Other Services

Example: Analyze transcribed speech

```javascript
// 1. Transcribe speech using STT
const transcript = await transcribeSpeech(audioFile);

// 2. Analyze the transcript
const analysis = await analyzeText(transcript);

// 3. Display results
displayResults(analysis);
```

---

## Related Examples

- **STT + Analysis**: Transcribe speech and analyze sentiment
- **Translation + Analysis**: Translate text and analyze the translation
- **Multi-feature Pipeline**: Combine STT, translation, and analysis

---

## API Documentation

For detailed API documentation, see:
- `/text-analysis/sentiment` - Sentiment analysis endpoint
- `/text-analysis/entities` - NER endpoint
- `/text-analysis/redact` - PII redaction endpoint

---

## Support

For issues or questions:
- Check the browser console (F12) for detailed error messages
- Verify your API credentials are correct
- Ensure your API plan includes these features
- Contact your API provider's support team

---

## Performance Benchmarks

| Text Length | Sentiment | Entities | Redaction | Total |
|-------------|-----------|----------|-----------|-------|
| < 100 chars | ~50ms | ~100ms | ~80ms | ~230ms |
| 100-500 chars | ~80ms | ~150ms | ~120ms | ~350ms |
| 500-2000 chars | ~150ms | ~300ms | ~200ms | ~650ms |

*Benchmarks are approximate and depend on server load and network latency.*

---

## Privacy & Data

- Text is sent to the server for analysis
- Results are not permanently stored (unless you save them)
- No tracking or logging of personal data beyond standard server logs
- Ensure compliance with your data privacy regulations
