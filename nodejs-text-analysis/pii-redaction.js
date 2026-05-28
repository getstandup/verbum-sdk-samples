/**
 * PII Redaction Example
 *
 * Demonstrates PII (Personally Identifiable Information) detection and redaction:
 *   POST /text-analysis/redact
 *
 * Detects and redacts: phone numbers, emails, SSN, credit cards, account numbers, etc.
 *
 * Usage:
 *   npm run redact
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

// PII categories that can be redacted
const PII_CATEGORIES = [
  'PHONE_NUMBER',
  'EMAIL',
  'CREDIT_CARD',
  'SSN',
  'ACCOUNT_NUMBER',
  'NAME',
  'ADDRESS',
  'IP_ADDRESS',
  'URL',
];

// ---------------------------------------------------------------------------
// PII Redaction Helper
// ---------------------------------------------------------------------------

/**
 * Detects and redacts PII in provided texts
 *
 * @param {Array<string>} texts       Array of texts to redact
 * @param {Array<string>} categories  PII categories to redact
 * @returns {Promise<Array>}          Array of redaction results
 */
async function redactPII(texts, categories) {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/text-analysis/redact`;

  const body = JSON.stringify({
    texts,
    categories,
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
    // Sample texts with various PII
    const texts = [
      'Call me at 555-123-4567 or 555.987.6543 for more information.',
      'My email is john.doe@example.com and my backup is j.doe@company.org',
      'My SSN is 123-45-6789 and credit card is 4532-1234-5678-9010',
      'Send payment to account 987654321 at the New York branch.',
      'Visit our website at https://example.com or call (212) 555-0100',
      'Contact Sarah Johnson at sarah.johnson@acme.com, phone: 415-555-0123',
      'Billing address: 123 Main St, New York, NY 10001',
      'IP Address: 192.168.1.1 - Server at 10.0.0.5',
    ];

    console.log(`\nRedacting PII from ${texts.length} texts...\n`);
    console.log(`Categories to redact: ${PII_CATEGORIES.join(', ')}\n`);

    const results = await redactPII(texts, PII_CATEGORIES);

    // Display results
    results.forEach((result, index) => {
      console.log(`[Text ${index + 1}]`);
      console.log(`  Original: ${result.original}`);
      console.log(`  Redacted: ${result.redacted}`);

      if (result.detectedItems && result.detectedItems.length > 0) {
        console.log(`  Detected PII: ${result.detectedItems.length} item(s)`);
        result.detectedItems.forEach((item) => {
          console.log(`    • [${item.type}] "${item.value}"`);
        });
      } else {
        console.log('  No PII detected');
      }
      console.log();
    });

    // Calculate statistics
    let totalPIIItems = 0;
    const piiTypeStats = {};

    results.forEach((result) => {
      if (result.detectedItems) {
        totalPIIItems += result.detectedItems.length;
        result.detectedItems.forEach((item) => {
          if (!piiTypeStats[item.type]) {
            piiTypeStats[item.type] = 0;
          }
          piiTypeStats[item.type]++;
        });
      }
    });

    console.log('--- PII Statistics ---');
    console.log(`Total PII items found: ${totalPIIItems}`);
    console.log(`Texts with PII: ${results.filter((r) => r.detectedItems && r.detectedItems.length > 0).length}/${texts.length}`);

    if (Object.keys(piiTypeStats).length > 0) {
      console.log('\nPII Breakdown:');
      Object.entries(piiTypeStats).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // Save results to file
    const outputFile = path.join(__dirname, 'output-redact.json');
    const output = {
      config: {
        apiHost: CONFIG.apiHost,
        categories: PII_CATEGORIES,
        totalTexts: texts.length,
      },
      timestamp: new Date().toISOString(),
      statistics: {
        totalPIIItems,
        byType: piiTypeStats,
        textsWithPII: results.filter((r) => r.detectedItems && r.detectedItems.length > 0).length,
      },
      results: results.map((r) => ({
        original: r.original,
        redacted: r.redacted,
        piiItemCount: r.detectedItems?.length || 0,
        detectedItems: r.detectedItems?.map((item) => ({
          type: item.type,
          value: item.value,
        })) || [],
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
