/**
 * Basic Translation Example
 *
 * Demonstrates text translation via HTTP REST endpoint:
 *   POST /translator/translate
 *
 * Usage:
 *   npm run basic
 */

'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  apiHost: process.env.API_HOST || 'https://sdk.verbum.ai',
  apiPathPrefix: process.env.API_PATH_PREFIX ?? '/v1',
  apiKey: process.env.API_KEY || '',
  sourceLanguage: process.env.SOURCE_LANG || 'en',
  targetLanguage: process.env.TARGET_LANG || 'es',
};

if (!CONFIG.apiKey || CONFIG.apiKey === 'your_api_key_here') {
  console.error('ERROR: Set API_KEY in your .env file');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Translation Helper
// ---------------------------------------------------------------------------

/**
 * Translates text from source to target language
 *
 * @param {string} text           The text to translate
 * @param {string} targetLang     Target language code (e.g., 'es', 'fr')
 * @param {string} [sourceLang]   Source language code (auto-detect if omitted)
 * @returns {Promise<Object>}     Translation result
 */
async function translateText(text, targetLang, sourceLang = null) {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/translator/translate`;

  const body = JSON.stringify({
    text,
    targetLanguage: targetLang,
    ...(sourceLang && { sourceLanguage: sourceLang }),
  });

  console.log(`\nTranslating to ${targetLang}:`);
  console.log(`  Original: "${text}"`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey,
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorBody}`);
  }

  const result = await response.json();
  console.log(`  Translated: "${result.translatedText}"`);

  return result;
}

/**
 * Get list of supported languages
 */
async function getLanguages() {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/translator/languages`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': CONFIG.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get languages: HTTP ${response.status}`);
  }

  return await response.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  try {
    // Get available languages (just to show the feature exists)
    console.log('Available languages:', CONFIG.apiHost);
    const langs = await getLanguages();
    console.log(`Found ${langs.languages?.length || 0} supported languages`);

    // Example texts to translate
    const texts = [
      'Hello, how are you today?',
      'The weather is nice this morning.',
      'I would like to order a coffee, please.',
    ];

    const results = [];

    // Translate each text
    for (const text of texts) {
      const result = await translateText(text, CONFIG.targetLanguage, CONFIG.sourceLanguage);
      results.push({
        original: text,
        sourceLanguage: CONFIG.sourceLanguage,
        targetLanguage: CONFIG.targetLanguage,
        translated: result.translatedText,
        confidence: result.confidence,
        sourceLanguageDetected: result.sourceLanguage,
      });
    }

    // Save results to file
    const outputFile = path.join(__dirname, 'output-basic.json');
    const output = {
      config: {
        apiHost: CONFIG.apiHost,
        sourceLanguage: CONFIG.sourceLanguage,
        targetLanguage: CONFIG.targetLanguage,
      },
      timestamp: new Date().toISOString(),
      results,
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
