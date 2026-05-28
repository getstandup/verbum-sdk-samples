/**
 * Browser-based Text Analysis Client
 *
 * Demonstrates sentiment analysis, NER, and PII redaction
 */

'use strict';

// ---------------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------------

const STATE = {
  activeFeatures: new Set(['sentiment']),
  analysisResults: null,
};

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------

const DOM = {
  apiKey: document.getElementById('apiKey'),
  apiHost: document.getElementById('apiHost'),
  textInput: document.getElementById('textInput'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  status: document.getElementById('status'),
  results: document.getElementById('results'),
  resultsContent: document.getElementById('resultsContent'),
};

// ---------------------------------------------------------------------------
// Status Management
// ---------------------------------------------------------------------------

function updateStatus(message, type = 'idle') {
  DOM.status.className = `status ${type}`;
  DOM.status.innerHTML = `
    <span class="status-indicator"></span>
    <span>${message}</span>
  `;
}

// ---------------------------------------------------------------------------
// Feature Management
// ---------------------------------------------------------------------------

function toggleFeature(button, feature) {
  button.classList.toggle('active');

  if (button.classList.contains('active')) {
    STATE.activeFeatures.add(feature);
  } else {
    STATE.activeFeatures.delete(feature);
  }
}

// ---------------------------------------------------------------------------
// Text Analysis
// ---------------------------------------------------------------------------

async function analyzeText() {
  const apiKey = DOM.apiKey.value.trim();
  if (!apiKey) {
    updateStatus('Error: API key is required', 'error');
    return;
  }

  const text = DOM.textInput.value.trim();
  if (!text) {
    updateStatus('Error: Please enter text to analyze', 'error');
    return;
  }

  if (STATE.activeFeatures.size === 0) {
    updateStatus('Error: Please select at least one feature', 'error');
    return;
  }

  const apiHost = DOM.apiHost.value.trim() || 'https://sdk.verbum.ai';

  try {
    updateStatus('Analyzing text...', 'analyzing');
    DOM.analyzeBtn.disabled = true;

    const results = {};

    // Sentiment Analysis
    if (STATE.activeFeatures.has('sentiment')) {
      try {
        const response = await fetch(`${apiHost}/v1/text-analysis/sentiment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({ texts: [text] }),
        });

        if (response.ok) {
          const data = await response.json();
          results.sentiment = data[0] || null;
        }
      } catch (error) {
        console.warn('Sentiment analysis failed:', error);
      }
    }

    // Entity Extraction
    if (STATE.activeFeatures.has('entities')) {
      try {
        const response = await fetch(`${apiHost}/v1/text-analysis/entities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({ texts: [text] }),
        });

        if (response.ok) {
          const data = await response.json();
          results.entities = data[0] || null;
        }
      } catch (error) {
        console.warn('Entity extraction failed:', error);
      }
    }

    // PII Redaction
    if (STATE.activeFeatures.has('redact')) {
      try {
        const response = await fetch(`${apiHost}/v1/text-analysis/redact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            texts: [text],
            categories: ['PHONE_NUMBER', 'EMAIL', 'CREDIT_CARD', 'SSN', 'ACCOUNT_NUMBER'],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          results.redaction = data[0] || null;
        }
      } catch (error) {
        console.warn('PII redaction failed:', error);
      }
    }

    STATE.analysisResults = results;
    renderResults(results);

    updateStatus('Analysis complete', 'success');
  } catch (error) {
    updateStatus(`Error: ${error.message}`, 'error');
    console.error('Analysis error:', error);
  } finally {
    DOM.analyzeBtn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Result Rendering
// ---------------------------------------------------------------------------

function renderResults(results) {
  if (!results || Object.keys(results).length === 0) {
    DOM.results.style.display = 'none';
    return;
  }

  DOM.results.style.display = 'block';
  let html = '';

  // Sentiment Results
  if (results.sentiment) {
    const sentiment = results.sentiment;
    const sentimentClass = `sentiment-${sentiment.sentiment || 'neutral'}`;
    const icon = {
      positive: '😊',
      negative: '😞',
      neutral: '😐',
    }[sentiment.sentiment] || '❓';

    html += `
      <div class="result-section">
        <div class="section-title">Sentiment Analysis</div>
        <div class="result-item">
          <div>
            ${icon} <strong>${(sentiment.sentiment || 'neutral').toUpperCase()}</strong>
            <span class="sentiment-badge ${sentimentClass}">
              ${((sentiment.confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // Entity Results
  if (results.entities && results.entities.entities && results.entities.entities.length > 0) {
    const entities = results.entities.entities;
    const groupedEntities = {};

    entities.forEach((entity) => {
      if (!groupedEntities[entity.type]) {
        groupedEntities[entity.type] = [];
      }
      groupedEntities[entity.type].push(entity);
    });

    html += `<div class="result-section">`;
    html += `<div class="section-title">Named Entities (${entities.length})</div>`;

    Object.entries(groupedEntities).forEach(([type, entityList]) => {
      html += `<div style="margin-bottom: 12px;">`;
      html += `<div class="entity-type">${type}</div>`;
      entityList.forEach((entity) => {
        html += `<div class="result-item" style="margin-left: 0; margin-bottom: 6px;">
          "${escapeHtml(entity.entity)}"
          <small style="color: #999; margin-left: 8px;">(${((entity.confidence || 0) * 100).toFixed(0)}%)</small>
        </div>`;
      });
      html += `</div>`;
    });

    html += `</div>`;
  }

  // PII Redaction Results
  if (results.redaction) {
    const redaction = results.redaction;
    html += `<div class="result-section">`;
    html += `<div class="section-title">PII Detected</div>`;

    if (redaction.detectedItems && redaction.detectedItems.length > 0) {
      html += `<div style="margin-bottom: 12px;">`;
      html += `<strong>Detected ${redaction.detectedItems.length} PII item(s):</strong>`;
      redaction.detectedItems.forEach((item) => {
        html += `<div class="pii-item">[${item.type}] ${escapeHtml(item.value)}</div>`;
      });
      html += `</div>`;

      html += `<div style="margin-top: 12px;">`;
      html += `<strong>Redacted text:</strong>`;
      html += `<div style="background: white; padding: 12px; border-radius: 4px; margin-top: 8px; word-break: break-word;">
        ${escapeHtml(redaction.redacted)}
      </div>`;
      html += `</div>`;
    } else {
      html += `<div class="result-item">No PII detected in the text.</div>`;
    }

    html += `</div>`;
  }

  DOM.resultsContent.innerHTML = html;
}

function clearText() {
  DOM.textInput.value = '';
  DOM.results.style.display = 'none';
  DOM.resultsContent.innerHTML = '';
  DOM.textInput.focus();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ---------------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------------

DOM.textInput.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to analyze
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    analyzeText();
  }
});

// Initialize
updateStatus('Ready to analyze...', 'idle');
