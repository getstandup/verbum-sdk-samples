
# Real-time Speech-to-Text Microphone Transcription


This Python script (`microphone_transcription.py`) captures audio from your default microphone device and streams it to the Verbum API WebSocket for real-time transcription using Socket.IO.


## Features

- 🎤 Real-time microphone audio capture
- 🔄 Automatic audio resampling to 8kHz, 16-bit, mono PCM
- 🌐 WebSocket connection to Verbum API using Socket.IO
- 📝 Real-time transcription with interim and final results
- 🎛️ Configurable audio processing parameters
- 🛑 Graceful shutdown handling


## Requirements

### 1. Python Version
- Python 3.8 or newer (Python 3.13+ recommended)

### 2. Virtual Environment (Recommended)
Create and activate a virtual environment:

```bash
python -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
```

### 3. Install Dependencies
Install all required packages using:

```bash
pip install -r requirements.txt
```

#### requirements.txt includes:
- python-socketio[asyncio]>=5.8.0
- python-socketio[client]==5.13.0
- aiohttp==3.12.15
- websocket-client==1.8.0
- scipy>=1.10.0
- numpy==2.3.2
- PyAudio>=0.2.11
- sounddevice==0.5.2
- requests==2.32.5
- python-dotenv==1.1.1

#### System dependencies:
- **Linux:** `sudo apt-get install portaudio19-dev python3-pyaudio`
- **macOS:** `brew install portaudio`
- **Windows:**
   - If `pip install pyaudio` fails, try:
      ```powershell
      pip install pipwin
      pipwin install pyaudio
      ```
   - Or download a pre-built wheel from [Gohlke's site](https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio)

### Windows-Specific Setup

1. **Microphone Permissions**: Ensure Python has microphone access in Windows Privacy settings
2. **Audio Drivers**: Update audio drivers through Windows Update or Device Manager
3. **Antivirus**: Add Python and the script to antivirus exceptions if needed
4. **Administrator Rights**: May be required for some audio device access


## Configuration

1. **API Key**: Edit `microphone_transcription.py` and set your Verbum API key in the `CONFIG` dictionary:
   ```python
   'apiKey': 'YOUR_API_KEY',
   ```
2. **Server URL**: Update `serverUrl` if needed (default: `wss://sdk.verbum.ai`)
3. **Audio Settings**: Modify the audio parameters in the `CONFIG` dictionary if needed


## Usage

1. **Activate your virtual environment**
   ```bash
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Linux/macOS:
   source venv/bin/activate
   ```
2. **Connect your microphone and ensure it is working**
3. **Edit `microphone_transcription.py` to set your API key and any config changes**
4. **Run the script**
   ```bash
   python microphone_transcription.py
   ```
5. **Speak into your microphone**
6. **View real-time transcription results in the terminal**
7. **Press `Ctrl+C` to stop recording and exit**


## How It Works

- Captures audio from your default microphone device
- Resamples audio from the microphone's native sample rate (usually 44.1kHz) to 8kHz
- Converts to mono (1 channel) if needed
- Ensures 16-bit PCM format
- Applies light volume boost for better recognition
- Sends audio chunks via WebSocket to Verbum API


## Output

- **Interim Results**: Shows partial transcription as you speak
- **Final Results**: Shows completed transcription with confidence scores
- **Additional Features**: Displays translations, sentiment analysis, and PII redaction if enabled


## Troubleshooting

### General Issues
1. **Microphone not found**: Check your default audio input device
2. **Permission errors**: Ensure the script has microphone access permissions
3. **Connection errors**: Verify your API key and internet connection
4. **Audio quality**: Check microphone levels and background noise

### Windows-Specific Issues
1. **PyAudio installation fails**:
   - Try: `pip install pipwin && pipwin install pyaudio`
   - Download wheel from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
   - Run Command Prompt as Administrator

2. **Microphone access denied**:
   - Go to Windows Settings > Privacy & Security > Microphone
   - Enable "Allow apps to access your microphone"
   - Enable "Allow desktop apps to access your microphone"

3. **No audio devices detected**:
   - Update audio drivers via Device Manager
   - Check Windows Sound settings
   - Restart audio services: `services.msc` → Windows Audio

4. **Audio quality issues**:
   - Disable Windows audio enhancements
   - Set microphone as default recording device
   - Adjust microphone levels in Sound Control Panel

5. **Script crashes or hangs**:
   - Run as Administrator
   - Add Python to Windows Defender exceptions
   - Close other applications using the microphone


## Configuration Options

You can modify the `CONFIG` dictionary in `microphone_transcription.py` to customize:
- Language settings
- Profanity filtering
- Speaker diarization
- Sentiment analysis
- Translation options
- PII redaction
- Audio chunk size and processing intervals
