# Browser-based Translation Example

A complete web-based example demonstrating real-time text translation using the vcall-seamless Translation API.

---

## Features

- 🌐 Real-time text translation
- 🔄 Multiple language support
- 🎯 Auto language detection
- 📋 Translation history
- 📋 Copy to clipboard
- ⚡ Keyboard shortcuts (Ctrl/Cmd + Enter)

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
3. Select **Source Language** (leave blank for auto-detect)
4. Select **Target Language**

### 3. Translate

1. Enter text in the **Original Text** field
2. Click **"Translate"** or press **Ctrl/Cmd + Enter**
3. View the translation in the **Translated Text** field
4. Optionally copy the translation

---

## Project Structure

```
browser-translation/
├── index.html      # Main UI
├── app.js          # Translation client and logic
└── README.md       # This file
```

---

## Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| auto | Auto-detect (source only) | es | Spanish |
| en | English | fr | French |
| de | German | it | Italian |
| pt | Portuguese | zh | Chinese |
| ja | Japanese | ko | Korean |
| ar | Arabic | | |

---

## How It Works

### Translation Flow

```
User enters text
       ↓
Click "Translate"
       ↓
POST /translator/translate
    ├─ text: "user input"
    ├─ sourceLanguage: "en" (or null for auto)
    └─ targetLanguage: "es"
       ↓
Server processes translation
       ↓
Return translated text + metadata
       ↓
Display translation and add to history
```

### API Request Example

```javascript
POST /v1/translator/translate
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

### API Response Example

```json
{
  "translatedText": "Hola mundo",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "confidence": 0.98
}
```

---

## Features

### Translation History

The application keeps track of the last 10 translations:
- Original text
- Translated text
- Language pair
- Confidence score
- Timestamp

Click on any history item to quickly retranslate similar content.

### Keyboard Shortcuts

- **Ctrl + Enter** (Windows/Linux) or **Cmd + Enter** (Mac) - Translate
- **Ctrl + A** - Select all text in source field

### Language Pair Selection

- **Source Language**: Leave blank to auto-detect, or select a specific language
- **Target Language**: Required - select the language to translate to

---

## Configuration

### Default Values (in code)

```javascript
const CONFIG = {
  apiHost: 'https://sdk.verbum.ai',
  apiPathPrefix: '/v1',
};
```

### Environment Setup

No environment variables needed. All configuration is done through the UI.

---

## Performance

- **Latency**: Typically 100-500ms depending on server and text length
- **Character Limit**: No hard limit, but very long texts may be slower
- **Batch Size**: Submit one text at a time for best experience
- **Rate Limiting**: Check API documentation for rate limits

---

## Error Handling

The application handles:
- Missing API key
- Invalid API key
- Network connection failures
- API server errors
- Empty text submission
- Missing target language

Errors are displayed in the status area with helpful messages.

---

## Browser Compatibility

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- Requires Fetch API
- Requires Clipboard API (for copy button)

---

## Security Considerations

- ⚠️ **Never commit your API key** - Use environment variables or secure storage
- 🔐 API key is sent in request headers - use HTTPS in production
- 📊 Text is sent to the server for translation - ensure sensitive data policies
- 🔒 Translation results are stored only in browser memory (localStorage not used)

---

## Use Cases

1. **Customer Support** - Respond to customers in their language
2. **Documentation** - Quickly translate documentation
3. **Content Publishing** - Translate content for multilingual sites
4. **Accessibility** - Provide translated UI text
5. **Global Communication** - Translate messages in real-time

---

## Troubleshooting

### Translation Not Working
- Verify API key is correct
- Check API host is accessible
- Ensure target language is selected
- Check browser console for detailed errors

### Slow Translations
- Long texts may take longer
- Check your network connection
- Verify API server is not overloaded

### Confidence Score Missing
- Some language pairs may not return confidence scores
- This is normal and doesn't affect translation quality

### Language Not in List
- More languages may be available via the API
- Check the API documentation for the complete language list
- You can manually enter language codes in the HTML

---

## Advanced Features

### Batch Translation (Multiple Texts)

To translate multiple texts, the Node.js example in `../nodejs-translation/batch-translation.js` shows how to batch process translations with concurrency control.

### Language Detection

The API automatically detects source language if not specified. This is useful for multi-language applications.

---

## Extending the Example

### Add More Languages

Edit the `<select>` elements in `index.html`:

```html
<option value="ru">Russian</option>
<option value="hi">Hindi</option>
<option value="tr">Turkish</option>
```

### Custom Styling

Modify the CSS in `<style>` section of `index.html`:

```css
body {
  background: linear-gradient(...); /* your custom gradient */
}
```

### Integration with Other Services

Example: Store translations in a database

```javascript
async function saveTranslation(original, translated) {
  await fetch('/api/translations', {
    method: 'POST',
    body: JSON.stringify({ original, translated })
  });
}
```

---

## Related Examples

- **STT to Translation**: Transcribe speech and translate the result
- **Translation to TTS**: Translate text and synthesize the translated speech
- **Text Analysis**: Analyze sentiment of translated text

---

## API Documentation

For more details on the Translation API, see the main API documentation at your API provider.

---

## Support

For issues or questions:
- Check the browser console (F12) for error messages
- Verify your API credentials
- Contact support at your API provider
