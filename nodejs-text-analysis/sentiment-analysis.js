/**
 * Sentiment Analysis Example
 *
 * Demonstrates sentiment analysis via HTTP REST endpoint:
 *   POST /text-analysis/sentiment
 *
 * Usage:
 *   npm run sentiment
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
};

if (!CONFIG.apiKey || CONFIG.apiKey === 'your_api_key_here') {
  console.error('ERROR: Set API_KEY in your .env file');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Sentiment Analysis Helper
// ---------------------------------------------------------------------------

/**
 * Analyzes sentiment of provided texts
 *
 * @param {Array<string>} texts   Array of texts to analyze
 * @returns {Promise<Array>}      Array of sentiment results
 */
async function analyzeSentiment(texts) {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/text-analysis/sentiment`;

  const body = JSON.stringify({ texts });

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

  return await response.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  try {
    // Sample texts with various sentiments
    const texts = [
      'I absolutely love this product! It exceeded my expectations.',
      'This is the worst experience I have ever had.',
      'The service was okay, nothing special.',
      'Amazing quality and fantastic customer support!',
      'I am very disappointed with this purchase.',
      'The weather is nice today.',
      'I feel great and excited about the future!',
      'This is horrible and I want a refund.',
      'It works as expected.',
      'I could not be happier with my decision!',
    ];

    console.log(`\nAnalyzing sentiment of ${texts.length} texts...\n`);

    const results = await analyzeSentiment(texts);

    // Display results
    results.forEach((result, index) => {
      const sentiment = result.sentiment.toUpperCase();
      const icon = {
        POSITIVE: '😊',
        NEGATIVE: '😞',
        NEUTRAL: '😐',
      }[sentiment] || '❓';

      console.log(`${icon} [${sentiment}] (${(result.confidence * 100).toFixed(1)}%) "${result.text}"`);
    });

    // Calculate statistics
    const sentimentCounts = {
      positive: results.filter((r) => r.sentiment === 'positive').length,
      negative: results.filter((r) => r.sentiment === 'negative').length,
      neutral: results.filter((r) => r.sentiment === 'neutral').length,
    };

    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    console.log('\n--- Summary ---');
    console.log(`Positive: ${sentimentCounts.positive} (${((sentimentCounts.positive / texts.length) * 100).toFixed(1)}%)`);
    console.log(`Negative: ${sentimentCounts.negative} (${((sentimentCounts.negative / texts.length) * 100).toFixed(1)}%)`);
    console.log(`Neutral:  ${sentimentCounts.neutral} (${((sentimentCounts.neutral / texts.length) * 100).toFixed(1)}%)`);
    console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

    // Save results to file
    const outputFile = path.join(__dirname, 'output-sentiment.json');
    const output = {
      config: {
        apiHost: CONFIG.apiHost,
        totalTexts: texts.length,
      },
      timestamp: new Date().toISOString(),
      statistics: sentimentCounts,
      averageConfidence: avgConfidence,
      results: results.map((r) => ({
        text: r.text,
        sentiment: r.sentiment,
        confidence: r.confidence,
      })),
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
