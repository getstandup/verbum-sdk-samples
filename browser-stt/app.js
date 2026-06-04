/**
 * Browser-based Speech-to-Text Client
 *
 * Demonstrates real-time STT via WebSocket using Socket.IO
 */

'use strict';

// ---------------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------------

const STATE = {
  socket: null,
  isConnected: false,
  isTranscribing: false,
  audioFile: null,
  interimTranscript: '',
  finalTranscript: '',
  results: [],
  interimResults: [],
};

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------

const DOM = {
  apiKey: document.getElementById('apiKey'),
  apiHost: document.getElementById('apiHost'),
  language: document.getElementById('language'),
  audioFile: document.getElementById('audioFile'),
  diarization: document.getElementById('diarization'),
  sentiment: document.getElementById('sentiment'),
  redact: document.getElementById('redact'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  clearBtn: document.getElementById('clearBtn'),
  status: document.getElementById('status'),
  interimTranscript: document.getElementById('interimTranscript'),
  finalTranscript: document.getElementById('finalTranscript'),
  results: document.getElementById('results'),
  resultsSection: document.getElementById('resultsSection'),
};

// ---------------------------------------------------------------------------
// Status Management
// ---------------------------------------------------------------------------

function updateStatus(message, type = 'connecting') {
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
// Socket.IO Connection
// ---------------------------------------------------------------------------

function connectWebSocket() {
  const apiKey = DOM.apiKey.value.trim();
  if (!apiKey) {
    updateStatus('Error: API key is required', 'error');
    return Promise.reject(new Error('API key required'));
  }

  const apiHost = DOM.apiHost.value.trim() || 'https://sdk.verbum.ai';
  const language = DOM.language.value;

  return new Promise((resolve, reject) => {
    updateStatus('Connecting to server...', 'connecting');

    STATE.socket = io(`${apiHost}/listen`, {
      query: {
        token: apiKey,
        language: language,
        usage: 'browser',
      },
      transports: ['websocket'],
    });

    STATE.socket.on('connect', () => {
      STATE.isConnected = true;
      updateStatus('Connected', 'connected');
      resolve();
    });

    STATE.socket.on('connect_error', (error) => {
      updateStatus(`Connection error: ${error.message}`, 'error');
      reject(error);
    });

    STATE.socket.on('speechRecognized', (data) => {
      const status = data.status || '';
      if (status === 'recognizing') {
        STATE.interimTranscript = data.text || '';
        renderTranscript();
      } else if (status === 'recognized') {
        const transcript = data.text || '';
        if (transcript && !STATE.finalTranscript.includes(transcript)) {
          STATE.finalTranscript += (STATE.finalTranscript ? ' ' : '') + transcript;
        }

        // Store result with metadata
        STATE.results.push({
          transcript: transcript,
          language: data.language,
          confidence: data.confidence,
          timestamp: new Date().toISOString(),
        });

        STATE.interimTranscript = '';
        renderTranscript();

        // Check if user wants additional analysis
        if (DOM.sentiment.checked || DOM.redact.checked) {
          analyzeTranscript(transcript);
        }
      }
    });

    STATE.socket.on('transcriptionError', (error) => {
      updateStatus(`Transcription error: ${error.message || 'Unknown error'}`, 'error');
      STATE.isTranscribing = false;
      DOM.startBtn.disabled = false;
      DOM.stopBtn.disabled = true;
    });

    STATE.socket.on('disconnect', () => {
      STATE.isConnected = false;
      if (!STATE.isTranscribing) {
        updateStatus('Disconnected', 'error');
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Audio Processing
// ---------------------------------------------------------------------------

async function startTranscription() {
  if (!DOM.audioFile.files.length) {
    updateStatus('Error: Please select an audio file', 'error');
    return;
  }

  // Connect if not already connected
  if (!STATE.isConnected) {
    try {
      await connectWebSocket();
    } catch (error) {
      return;
    }
  }

  STATE.isTranscribing = true;
  DOM.startBtn.disabled = true;
  DOM.stopBtn.disabled = false;
  updateStatus('Transcribing...', 'transcribing');

  const audioFile = DOM.audioFile.files[0];
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioData = new Uint8Array(arrayBuffer);

  // Emit start transcription event
  STATE.socket.emit('startTranscription', {
    language: [DOM.language.value],
    encoding: 'PCM',
    sampleRate: 16000,
    diarization: DOM.diarization.checked,
  });

  // Stream audio in chunks
  const chunkSize = 1024;
  let offset = 0;

  const streamInterval = setInterval(() => {
    if (offset >= audioData.length) {
      clearInterval(streamInterval);
      STATE.socket.emit('streamEnd');
      STATE.isTranscribing = false;
      DOM.startBtn.disabled = false;
      DOM.stopBtn.disabled = true;
      updateStatus('Transcription complete', 'connected');
      return;
    }

    const chunk = audioData.slice(offset, offset + chunkSize);
    offset += chunkSize;

    STATE.socket.emit('audioStream', Buffer.from(chunk));
  }, 20);

  // Set timeout for long files
  setTimeout(() => {
    if (STATE.isTranscribing) {
      stopTranscription();
    }
  }, 300000); // 5 minute timeout
}

function stopTranscription() {
  if (STATE.socket && STATE.isTranscribing) {
    STATE.socket.emit('streamEnd');
    STATE.isTranscribing = false;
    DOM.startBtn.disabled = false;
    DOM.stopBtn.disabled = true;
    updateStatus('Stopped', 'connected');
  }
}

// ---------------------------------------------------------------------------
// Transcript Rendering
// ---------------------------------------------------------------------------

function renderTranscript() {
  DOM.interimTranscript.textContent = STATE.interimTranscript;
  DOM.finalTranscript.textContent = STATE.finalTranscript;
}

function clearTranscript() {
  STATE.interimTranscript = '';
  STATE.finalTranscript = '';
  STATE.results = [];
  STATE.interimResults = [];
  DOM.resultsSection.style.display = 'none';
  DOM.results.innerHTML = '';
  renderTranscript();
}

// ---------------------------------------------------------------------------
// Text Analysis (Simulated/Placeholder)
// ---------------------------------------------------------------------------

async function analyzeTranscript(transcript) {
  // This is a placeholder for text analysis
  // In a real implementation, you would call the text-analysis API

  const analysisResult = {
    transcript: transcript,
    timestamp: new Date().toISOString(),
  };

  // Simulate sentiment analysis if enabled
  if (DOM.sentiment.checked) {
    analysisResult.sentiment = analyzeSentiment(transcript);
  }

  // Simulate PII detection if enabled
  if (DOM.redact.checked) {
    analysisResult.piiDetected = detectPII(transcript);
  }

  if (DOM.sentiment.checked || DOM.redact.checked) {
    STATE.interimResults.push(analysisResult);
    renderResults();
  }
}

function analyzeSentiment(text) {
  // Simple sentiment analysis based on keywords
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'wonderful', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'poor', 'worst', 'horrible'];

  const lowerText = text.toLowerCase();
  let positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length;
  let negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function detectPII(text) {
  const detectedPII = [];

  // Simple PII patterns (not production-grade)
  const patterns = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
    SSN: /\d{3}-\d{2}-\d{4}/g,
    CREDIT_CARD: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        detectedPII.push({ type, value: match });
      });
    }
  }

  return detectedPII;
}

function renderResults() {
  if (STATE.interimResults.length === 0) {
    DOM.resultsSection.style.display = 'none';
    return;
  }

  DOM.resultsSection.style.display = 'block';
  DOM.results.innerHTML = STATE.interimResults
    .map((result) => {
      let html = `<div class="result-item">`;
      html += `<div class="result-label">Transcript</div>`;
      html += `<div class="result-value">${escapeHtml(result.transcript)}</div>`;

      if (result.sentiment) {
        html += `<div class="result-label" style="margin-top: 8px;">Sentiment</div>`;
        html += `<div class="result-value">${result.sentiment}</div>`;
      }

      if (result.piiDetected && result.piiDetected.length > 0) {
        html += `<div class="result-label" style="margin-top: 8px;">PII Detected</div>`;
        html += `<div class="result-value">`;
        result.piiDetected.forEach((item) => {
          html += `<div>${item.type}: ${escapeHtml(item.value)}</div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      return html;
    })
    .join('');
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

DOM.audioFile.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    console.log(`Selected file: ${file.name} (${file.size} bytes)`);
  }
});

// Initialize
updateStatus('Ready to connect...', 'connecting');
