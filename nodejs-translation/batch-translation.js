/**
 * Batch Translation Example
 *
 * Demonstrates translating multiple texts efficiently.
 * Shows how to handle multiple translations with error handling.
 *
 * Usage:
 *   npm run batch
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
// Batch Translation Helper
// ---------------------------------------------------------------------------

/**
 * Translates a single text
 *
 * @param {string} text           The text to translate
 * @param {string} targetLang     Target language code
 * @param {string} [sourceLang]   Source language code
 * @returns {Promise<Object>}     Translation result
 */
async function translateText(text, targetLang, sourceLang = null) {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/translator/translate`;

  const body = JSON.stringify({
    text,
    targetLanguage: targetLang,
    ...(sourceLang && { sourceLanguage: sourceLang }),
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

/**
 * Translates multiple texts in batch with concurrency control
 *
 * @param {Array<string>} texts      Array of texts to translate
 * @param {string} targetLang        Target language code
 * @param {number} [concurrency=3]   Max concurrent requests
 * @returns {Promise<Array>}         Array of translation results
 */
async function batchTranslate(texts, targetLang, concurrency = 3) {
  const results = [];
  const errors = [];

  // Process texts in batches to avoid overwhelming the API
  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);

    // Translate all texts in batch concurrently
    const promises = batch.map((text, index) =>
      translateText(text, targetLang, CONFIG.sourceLanguage)
        .then((result) => ({
          index: i + index,
          original: text,
          success: true,
          ...result,
        }))
        .catch((error) => ({
          index: i + index,
          original: text,
          success: false,
          error: error.message,
        }))
    );

    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result.success) {
        results.push(result);
        console.log(`[${result.index + 1}] ✓ "${result.original}"`);
      } else {
        errors.push(result);
        console.log(`[${result.index + 1}] ✗ "${result.original}" - ${result.error}`);
      }
    }
  }

  return { results, errors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  try {
    // Sample texts to translate
    const texts = [
      'Good morning!',
      'The quick brown fox jumps over the lazy dog.',
      'Machine translation is powered by advanced neural networks.',
      'How much does this cost?',
      'I love learning new languages.',
      'The sunset is beautiful this evening.',
      'Could you please help me with this?',
      'Technology makes communication easier.',
      'What time is the meeting tomorrow?',
      'I enjoyed our conversation very much.',
    ];

    console.log(`\nBatch translating ${texts.length} texts from ${CONFIG.sourceLanguage} to ${CONFIG.targetLanguage}...`);
    console.log('Using concurrency: 3\n');

    const startTime = Date.now();
    const { results, errors } = await batchTranslate(texts, CONFIG.targetLanguage, 3);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\nCompleted in ${duration}s`);
    console.log(`Success: ${results.length}/${texts.length}`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}/${texts.length}`);
    }

    // Save results to file
    const outputFile = path.join(__dirname, 'output-batch.json');
    const output = {
      config: {
        apiHost: CONFIG.apiHost,
        sourceLanguage: CONFIG.sourceLanguage,
        targetLanguage: CONFIG.targetLanguage,
        totalTexts: texts.length,
        concurrency: 3,
      },
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      statistics: {
        successful: results.length,
        failed: errors.length,
        totalProcessed: texts.length,
      },
      successfulTranslations: results.map((r) => ({
        original: r.original,
        translated: r.translatedText,
        confidence: r.confidence,
      })),
      failedTranslations: errors.map((e) => ({
        original: e.original,
        error: e.error,
      })),
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`Results saved to: ${outputFile}`);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
