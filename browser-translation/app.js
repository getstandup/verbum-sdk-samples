/**
 * Browser-based Translation Client
 *
 * Demonstrates real-time text translation using REST API
 */

'use strict';

// ---------------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------------

const STATE = {
  translationHistory: [],
};

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------

const DOM = {
  apiKey: document.getElementById('apiKey'),
  apiHost: document.getElementById('apiHost'),
  sourceLanguage: document.getElementById('sourceLanguage'),
  targetLanguage: document.getElementById('targetLanguage'),
  sourceText: document.getElementById('sourceText'),
  targetText: document.getElementById('targetText'),
  translateBtn: document.getElementById('translateBtn'),
  status: document.getElementById('status'),
  historyContainer: document.getElementById('historyContainer'),
};

// ---------------------------------------------------------------------------
// Status Management
// ---------------------------------------------------------------------------

function updateStatus(message, type = 'idle') {
  DOM.status.className = `status ${type}`;
  DOM.status.textContent = '';
  const indicator = document.createElement('span');
  indicator.className = 'status-indicator';
  const text = document.createElement('span');
  text.textContent = message;
  DOM.status.appendChild(indicator);
  DOM.status.appendChild(text);
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

async function translateText() {
  const apiKey = DOM.apiKey.value.trim();
  if (!apiKey) {
    updateStatus('Error: API key is required', 'error');
    return;
  }

  const text = DOM.sourceText.value.trim();
  if (!text) {
    updateStatus('Error: Please enter text to translate', 'error');
    return;
  }

  const sourceLanguage = DOM.sourceLanguage.value || undefined;
  const targetLanguage = DOM.targetLanguage.value;
  const apiHost = DOM.apiHost.value.trim() || 'https://sdk.verbum.ai';

  try {
    updateStatus('Translating...', 'translating');
    DOM.translateBtn.disabled = true;

    const response = await fetch(`${apiHost}/v1/translator/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    // Display translation
    DOM.targetText.value = result.translatedText;

    // Add to history
    STATE.translationHistory.unshift({
      original: text,
      translated: result.translatedText,
      sourceLanguage: result.sourceLanguage || sourceLanguage,
      targetLanguage: result.targetLanguage || targetLanguage,
      confidence: result.confidence,
      timestamp: new Date(),
    });

    // Keep only last 10 translations
    if (STATE.translationHistory.length > 10) {
      STATE.translationHistory.pop();
    }

    renderHistory();

    updateStatus(
      `Translation complete ${result.confidence ? `(${(result.confidence * 100).toFixed(1)}% confidence)` : ''}`,
      'success'
    );
  } catch (error) {
    updateStatus(`Error: ${error.message}`, 'error');
    console.error('Translation error:', error);
  } finally {
    DOM.translateBtn.disabled = false;
  }
}

function copyTranslation() {
  const text = DOM.targetText.value;
  if (!text) {
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    updateStatus('Copied to clipboard!', 'success');
    setTimeout(() => updateStatus('Ready to translate...', 'idle'), 2000);
  });
}

function clearSource() {
  DOM.sourceText.value = '';
  DOM.targetText.value = '';
  DOM.sourceText.focus();
}

// ---------------------------------------------------------------------------
// History Management
// ---------------------------------------------------------------------------

function renderHistory() {
  if (STATE.translationHistory.length === 0) {
    DOM.historyContainer.innerHTML = '<p style="color: #999; font-size: 14px;">No translations yet</p>';
    return;
  }

  DOM.historyContainer.innerHTML = STATE.translationHistory
    .map(
      (item, index) => `
    <div class="history-item">
      <small>
        ${item.sourceLanguage ? item.sourceLanguage.toUpperCase() : 'Auto'} → ${
        item.targetLanguage?.toUpperCase() || 'EN'
      }
        ${item.confidence ? ` · ${(item.confidence * 100).toFixed(0)}% confidence` : ''}
        · ${formatTime(item.timestamp)}
      </small>
      <div class="history-text">
        <strong>"${escapeHtml(truncate(item.original, 100))}"</strong><br>
        <em>"${escapeHtml(truncate(item.translated, 100))}"</em>
      </div>
    </div>
  `
    )
    .join('');
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function truncate(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
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

DOM.sourceText.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to translate
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    translateText();
  }
});

// Initialize
updateStatus('Ready to translate...', 'idle');
