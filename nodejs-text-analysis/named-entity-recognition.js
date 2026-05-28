/**
 * Named Entity Recognition (NER) Example
 *
 * Demonstrates entity extraction via HTTP REST endpoint:
 *   POST /text-analysis/entities
 *
 * Identifies: persons, locations, organizations, dates, times, money, products, events
 *
 * Usage:
 *   npm run entities
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
// NER Helper
// ---------------------------------------------------------------------------

/**
 * Identifies named entities in provided texts
 *
 * @param {Array<string>} texts   Array of texts to analyze
 * @returns {Promise<Array>}      Array of NER results
 */
async function extractEntities(texts) {
  const url = `${CONFIG.apiHost}${CONFIG.apiPathPrefix}/text-analysis/entities`;

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
    // Sample texts with various entities
    const texts = [
      'Apple Inc. was founded by Steve Jobs in Cupertino, California on April 1, 1976.',
      'CEO Tim Cook announced the iPhone 15 launch on September 12, 2023 in San Francisco.',
      'Microsoft and Google compete in the cloud computing market, with prices ranging from $100 to $10,000 per month.',
      'Dr. John Smith, a renowned physicist from MIT, will speak at the Conference on January 15, 2024.',
      'The meeting is scheduled for tomorrow at 2:30 PM in the New York office.',
      'Sarah Johnson earned $50,000 for her work on the Tesla project in Austin, Texas.',
    ];

    console.log(`\nExtracting entities from ${texts.length} texts...\n`);

    const results = await extractEntities(texts);

    // Entity type color mapping for console output
    const entityColors = {
      PERSON: '👤',
      LOCATION: '📍',
      ORGANIZATION: '🏢',
      DATE: '📅',
      TIME: '🕐',
      MONEY: '💰',
      PRODUCT: '📦',
      EVENT: '🎪',
    };

    // Display results
    results.forEach((result, index) => {
      console.log(`\n[Text ${index + 1}] "${result.text}"`);

      if (!result.entities || result.entities.length === 0) {
        console.log('  No entities found');
        return;
      }

      // Group entities by type
      const entitiesByType = {};
      result.entities.forEach((entity) => {
        if (!entitiesByType[entity.type]) {
          entitiesByType[entity.type] = [];
        }
        entitiesByType[entity.type].push(entity);
      });

      // Display grouped entities
      Object.entries(entitiesByType).forEach(([type, entities]) => {
        const icon = entityColors[type] || '❓';
        console.log(`\n  ${icon} ${type}:`);
        entities.forEach((entity) => {
          console.log(`     • "${entity.entity}" (confidence: ${(entity.confidence * 100).toFixed(1)}%)`);
        });
      });
    });

    // Calculate statistics
    let totalEntities = 0;
    const typeStats = {};

    results.forEach((result) => {
      if (result.entities) {
        totalEntities += result.entities.length;
        result.entities.forEach((entity) => {
          if (!typeStats[entity.type]) {
            typeStats[entity.type] = 0;
          }
          typeStats[entity.type]++;
        });
      }
    });

    console.log('\n--- Entity Statistics ---');
    console.log(`Total entities found: ${totalEntities}`);
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Save results to file
    const outputFile = path.join(__dirname, 'output-entities.json');
    const output = {
      config: {
        apiHost: CONFIG.apiHost,
        totalTexts: texts.length,
      },
      timestamp: new Date().toISOString(),
      statistics: {
        totalEntities,
        byType: typeStats,
      },
      results: results.map((r) => ({
        text: r.text,
        entityCount: r.entities?.length || 0,
        entities: r.entities?.map((e) => ({
          entity: e.entity,
          type: e.type,
          confidence: e.confidence,
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
