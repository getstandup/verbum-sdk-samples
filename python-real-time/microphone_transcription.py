#!/usr/bin/env python3
"""
Real-time Speech-to-Text WebSocket Client for Microphone Input

This script captures audio from the default microphone device and sends it
to the Verbum API WebSocket for real-time transcription using socket.io.
"""

import asyncio
import json
import logging
import platform
import signal
import sys
import time
import threading
from typing import Optional
import urllib.parse

import numpy as np
import pyaudio
import socketio
from scipy import signal as scipy_signal

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MicrophoneTranscriptionClient:
    """WebSocket client for real-time microphone transcription using Verbum API"""
    
    def __init__(self, config: dict):
        self.config = config
        self.is_connected = False
        self.is_recording = False
        self.audio_stream = None
        self.pyaudio_instance = None
        self.loop = None
        self.audio_queue = asyncio.Queue()
        
        # Audio processing parameters
        self.sample_rate = 8000  # Target sample rate for Verbum API
        self.channels = 1  # Mono
        self.sample_width = 2  # 16-bit
        self.chunk_size = config['streaming']['chunkSize']
        self.input_sample_rate = 44100  # Most common microphone sample rate
        
        # Windows-specific audio parameters
        self.is_windows = platform.system() == "Windows"
        if self.is_windows:
            # Windows often works better with smaller buffer sizes
            self.frames_per_buffer = max(512, self.chunk_size // 4)
        else:
            self.frames_per_buffer = self.chunk_size // 2
        
        # Create Socket.IO client with proper configuration
        self.sio = socketio.AsyncClient(logger=False, engineio_logger=False)

        # Setup event handlers
        self._setup_event_handlers()
    
    def _setup_event_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        async def connect():
            logger.info("✅ Connected to WebSocket server")
            logger.info(f"📡 Socket ID: {self.sio.sid}")
            self.is_connected = True
        
        @self.sio.event
        async def connect_error(data):
            logger.error(f"❌ Connection error: {data}")
            self.is_connected = False
        
        @self.sio.event
        async def disconnect():
            logger.info("🔌 Disconnected from server")
            self.is_connected = False
            # Don't automatically stop recording here, let main handle it
        
        @self.sio.event(namespace='/listen')
        async def connect():
            logger.info("✅ Connected to WebSocket server (/listen namespace)")
            logger.info(f"📡 Socket ID: {self.sio.sid}")
            self.is_connected = True
        
        @self.sio.event(namespace='/listen')
        async def connect_error(data):
            logger.error(f"❌ Connection error (/listen): {data}")
            self.is_connected = False
        
        @self.sio.event(namespace='/listen')
        async def disconnect():
            logger.info("🔌 Disconnected from server (/listen)")
            self.is_connected = False
        
        @self.sio.event(namespace='/listen')
        async def speechRecognized(data):
            logger.info(f"\n📥 Received speechRecognized event: {json.dumps(data, indent=2)}")
            self._handle_speech_result(data)
        
        # Add error event handler
        @self.sio.event
        async def error(data):
            logger.error(f"🚨 Socket error: {data}")
        
        # Add any other events that might be sent by the server
        @self.sio.event
        async def message(data):
            logger.info(f"📨 Received message: {data}")
        
        # Add a catch-all event handler
        # @self.sio.on('*')
        # async def catch_all(event, *args):
            # logger.info(f"📡 Received event '{event}' with args: {args}")
        
        # Add namespace-specific catch-all
        # @self.sio.on('*', namespace='/listen')
        # async def catch_all_listen(event, *args):
            # logger.info(f"📡 Received event '{event}' in /listen namespace with args: {args}")
    
    def _handle_speech_result(self, data: dict):
        """Handle speech recognition results"""
        status = data.get('status')
        message_id = data.get('messageId')
        text = data.get('text', '')
        confidence = data.get('confidence')
        duration = data.get('duration')
        
        if status == 'recognizing':
            # Interim results (partial transcription)
            print(f"\r🔄 Recognizing: {text or '...'}", end='', flush=True)
        elif status == 'recognized':
            # Final results
            print(f"\n✨ Final Result [{message_id}]:")
            print(f"   Text: \"{text}\"")
            print(f"   Confidence: {confidence or 'N/A'}")
            print(f"   Duration: {duration or 'N/A'}ms")
            
            # Handle translations if available
            if data.get('translations'):
                print("   Translations:")
                for translation in data['translations']:
                    print(f"     {translation['to']}: \"{translation['text']}\"")
            
            # Handle sentiment analysis if available
            if data.get('sentiment'):
                sentiment = data['sentiment']
                print(f"   Sentiment: {sentiment['label']} ({sentiment['score']})")
            
            # Handle PII redaction if available
            if data.get('redactedText') and data['redactedText'] != text:
                print(f"   Redacted: \"{data['redactedText']}\"")
            
            print("─" * 60)
    
    def _resample_audio(self, audio_data: np.ndarray, original_rate: int, target_rate: int) -> np.ndarray:
        """Resample audio data from original_rate to target_rate"""
        if original_rate == target_rate:
            return audio_data
        
        # Calculate resampling ratio
        ratio = target_rate / original_rate
        
        # Use scipy.signal.resample for high-quality resampling
        resampled_length = int(len(audio_data) * ratio)
        resampled_data = scipy_signal.resample(audio_data, resampled_length)
        
        return resampled_data.astype(np.int16)
    
    def _process_audio_chunk(self, raw_audio: bytes) -> bytes:
        """Process raw audio chunk to match API requirements"""
        # Convert bytes to numpy array (assuming 16-bit samples)
        audio_array = np.frombuffer(raw_audio, dtype=np.int16)
        
        # Resample if necessary
        if self.input_sample_rate != self.sample_rate:
            audio_array = self._resample_audio(audio_array, self.input_sample_rate, self.sample_rate)
        
        # Apply light volume boost (similar to JS example)
        audio_array = np.clip(audio_array * 1.1, -32768, 32767).astype(np.int16)
        
        # Convert back to bytes
        return audio_array.tobytes()
    
    def _find_best_microphone(self) -> Optional[int]:
        """Find the best available microphone device on Windows"""
        if not self.pyaudio_instance:
            return None
        
        try:
            # Get device count
            device_count = self.pyaudio_instance.get_device_count()
            
            # Look for microphone devices
            microphone_devices = []
            
            for i in range(device_count):
                try:
                    device_info = self.pyaudio_instance.get_device_info_by_index(i)
                    
                    # Check if device supports input
                    if device_info['maxInputChannels'] > 0:
                        device_name = device_info['name'].lower()
                        
                        # Prioritize devices with specific keywords
                        priority = 0
                        if 'logitech' in device_name or 'logitec' in device_name:
                            priority = 3  # Highest priority for Logitech
                        elif 'microphone' in device_name or 'mic' in device_name:
                            priority = 2
                        elif 'headset' in device_name or 'headphone' in device_name:
                            priority = 1
                        
                        # Test if the device supports our target sample rates
                        supported_rates = []
                        test_rates = [44100, 48000, 16000, 8000]  # Common rates
                        
                        for rate in test_rates:
                            try:
                                # Test if this rate is supported
                                if self.pyaudio_instance.is_format_supported(
                                    rate=rate,
                                    input_device=i,
                                    input_channels=1,
                                    input_format=pyaudio.paInt16
                                ):
                                    supported_rates.append(rate)
                            except Exception:
                                continue
                        
                        # Only include devices that support at least one sample rate
                        if supported_rates:
                            microphone_devices.append({
                                'index': i,
                                'name': device_info['name'],
                                'priority': priority,
                                'default_sample_rate': device_info['defaultSampleRate'],
                                'supported_rates': supported_rates,
                                'channels': device_info['maxInputChannels']
                            })
                        
                except Exception as e:
                    # Skip devices that can't be queried
                    continue
            
            if not microphone_devices:
                logger.warning("No compatible microphone devices found, using default")
                return None
            
            # Sort by priority (highest first), then by whether they support 44100Hz
            microphone_devices.sort(key=lambda x: (
                x['priority'], 
                44100 in x['supported_rates'],
                len(x['supported_rates'])
            ), reverse=True)
            
            # Log available devices
            logger.info("Available microphone devices:")
            for device in microphone_devices[:5]:  # Show top 5
                rates_str = ', '.join(str(r) for r in device['supported_rates'][:3])
                if len(device['supported_rates']) > 3:
                    rates_str += f", +{len(device['supported_rates'])-3} more"
                    
                logger.info(f"   {device['index']}: {device['name']} "
                          f"(supported: {rates_str}Hz, {device['channels']} ch, priority: {device['priority']})")
            
            # Return the best device index
            best_device = microphone_devices[0]
            
            # Update the input sample rate to the best supported rate
            if 44100 in best_device['supported_rates']:
                self.input_sample_rate = 44100
            elif 48000 in best_device['supported_rates']:
                self.input_sample_rate = 48000
            elif best_device['supported_rates']:
                self.input_sample_rate = int(best_device['supported_rates'][0])
            
            logger.info(f"Selected sample rate: {self.input_sample_rate}Hz for device {best_device['index']}")
            
            return best_device['index']
            
        except Exception as e:
            logger.warning(f"Error finding microphone devices: {e}")
            return None
    
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """PyAudio callback function for audio capture"""
        if status:
            logger.warning(f"Audio callback status: {status}")
        
        if self.is_recording and self.is_connected:
            try:
                # Process the audio chunk
                processed_audio = self._process_audio_chunk(in_data)
                
                # On Windows, we need to handle the async call differently
                if self.is_windows and self.loop:
                    # Schedule the coroutine safely for Windows
                    try:
                        self.loop.call_soon_threadsafe(
                            lambda: asyncio.create_task(self.sio.emit('audioStream', processed_audio, namespace='/listen'))
                        )
                    except RuntimeError:
                        # Fallback if loop is not running
                        pass
                else:
                    # For other platforms or if no loop reference
                    asyncio.create_task(self.sio.emit('audioStream', processed_audio, namespace='/listen'))
                
            except Exception as e:
                logger.error(f"Error processing audio chunk: {e}")
        
        return (in_data, pyaudio.paContinue)
    
    async def connect(self):
        """Connect to the WebSocket server"""
        logger.info("🔗 Connecting to WebSocket server...")
        
        # Store the current event loop for Windows compatibility
        self.loop = asyncio.get_running_loop()
        
        try:
            # Build query parameters from STT options (excluding auth token)
            query_params = {}
            stt_options = self.config.get('sttOptions', {})

            for key, value in stt_options.items():
                if isinstance(value, list):
                    # Convert list to a comma-separated string, like 'en-US,es-ES'
                    query_params[key] = ','.join(map(str, value))
                elif key == 'tags' and isinstance(value, dict):
                    # In your TS code, you use JSON.stringify. The Python equivalent is json.dumps.
                    # We don't URL-encode it here; urlencode will handle it in the next step.
                    query_params[key] = json.dumps(value)
                else:
                    # Convert all other values to their string representation
                    query_params[key] = str(value)
            
            # 2. Safely build the query string using urllib
            # This handles special characters and formatting correctly.
            query_string = urllib.parse.urlencode(query_params)
            
            # Connect to the server following JavaScript client pattern
            server_url = f"{self.config['serverUrl']}/listen"
            full_url = f"{server_url}?{query_string}"
            
            logger.info(f"🔧 Connecting to: {server_url}")
            logger.info(f"🔧 Full URL: {full_url}")
            logger.info(f"🔧 Auth token: {self.config['apiKey'][:10]}...")
            logger.info(f"🔧 Query params: {query_params}")
            
            await self.sio.connect(
                url=full_url,
                namespaces=['/listen'],
                socketio_path='/v1/socket.io',
                transports=['websocket'],
                auth={'token': self.config['apiKey']}
            )
            logger.info("✅ Successfully connected to Socket.IO server!")
        except Exception as e:
            logger.error(f"❌ Failed to connect: {e}")
            # It can be helpful to log the full exception for debugging
            # import traceback
            # logger.error(traceback.format_exc()) 
            raise
    
    def start_recording(self):
        """Start recording audio from microphone"""
        if self.is_recording:
            logger.warning("Recording is already active")
            return
        
        logger.info("🎤 Starting microphone recording...")
        logger.info(f"   Target format: {self.sample_rate}Hz, {self.channels} channel, 16-bit")
        logger.info(f"   Input format: {self.input_sample_rate}Hz (will be resampled)")
        logger.info(f"   Chunk size: {self.chunk_size} bytes")
        logger.info(f"   Platform: {platform.system()}")
        
        try:
            # Initialize PyAudio
            self.pyaudio_instance = pyaudio.PyAudio()
            
            # Find the best microphone device
            input_device_index = self._find_best_microphone()
            
            # Get device info and log selection
            if input_device_index is not None:
                device_info = self.pyaudio_instance.get_device_info_by_index(input_device_index)
                logger.info(f"   Using device: {device_info['name']} (Index: {input_device_index})")
                logger.info(f"   Device sample rate: {self.input_sample_rate}Hz")
            else:
                logger.info("   Using default input device")
                logger.info(f"   Default sample rate: {self.input_sample_rate}Hz")
            
            # Open audio stream with Windows-optimized settings
            stream_params = {
                'format': pyaudio.paInt16,
                'channels': self.channels,
                'rate': self.input_sample_rate,
                'input': True,
                'frames_per_buffer': self.frames_per_buffer,
                'stream_callback': self._audio_callback,
                'start': False
            }
            
            # Add device index if we found a specific one
            if input_device_index is not None:
                stream_params['input_device_index'] = input_device_index
            
            # Try to open the audio stream with fallback sample rates
            for attempt_rate in [self.input_sample_rate, 44100, 48000, 16000]:
                try:
                    stream_params['rate'] = attempt_rate
                    logger.info(f"   Attempting to open stream with {attempt_rate}Hz...")
                    self.audio_stream = self.pyaudio_instance.open(**stream_params)
                    if attempt_rate != self.input_sample_rate:
                        logger.info(f"   Successfully opened with fallback rate: {attempt_rate}Hz")
                        self.input_sample_rate = attempt_rate
                    break
                except Exception as e:
                    logger.warning(f"   Failed to open with {attempt_rate}Hz: {e}")
                    if attempt_rate == 16000:  # Last attempt
                        raise e
                    continue
            
            # Start the stream
            self.audio_stream.start_stream()
            self.is_recording = True
            
            logger.info("✅ Microphone recording started")
            logger.info("🎙️  Speak into your microphone...")
            
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            if self.is_windows:
                logger.error("Windows troubleshooting:")
                logger.error("- Ensure microphone permissions are granted")
                logger.error("- Check Windows Sound settings")
                logger.error("- Try running as administrator if needed")
            raise
    
    async def stop_recording(self):
        """Stop recording audio"""
        if not self.is_recording:
            return
        
        logger.info("⏹️  Stopping microphone recording...")
        self.is_recording = False
        
        try:
            if self.audio_stream:
                self.audio_stream.stop_stream()
                self.audio_stream.close()
                self.audio_stream = None
            
            if self.pyaudio_instance:
                self.pyaudio_instance.terminate()
                self.pyaudio_instance = None
            
            # Send stream end signal
            if self.is_connected:
                await self.sio.emit('streamEnd', namespace='/listen')
                logger.info("🏁 Sent streamEnd signal to server")
            
            logger.info("✅ Recording stopped successfully")
            
        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
    
    async def disconnect(self):
        """Disconnect from the WebSocket server"""
        logger.info("🔌 Disconnecting from server...")
        
        await self.stop_recording()
        
        if self.is_connected:
            await self.sio.disconnect()
        
        logger.info("✅ Disconnected successfully")


# Configuration
CONFIG = {
    # WebSocket server URL - replace with your actual server URL
    'serverUrl': 'wss://sdk.verbum.ai',
    
    # Your API key - replace with your actual API key
    'apiKey': "API_KEY",

    # STT configuration parameters
    'sttOptions': {
        'language': 'es-MX',  # Language for the audio (changed to Spanish Mexico)
        'encoding': 'PCM',  # Audio encoding format
        'sampleRate': 8000,  # Sample rate (will match our processed audio)
        # 'profanityFilter': 'raw',  # Enable/disable profanity filtering: 'raw', 'masked', 'removed'
        # 'diarization': False,  # Enable/disable speaker diarization
        # 'analyzeSentiments': False,  # Enable/disable sentiment analysis
        # 'translateTo': [],  # Translation target languages (array)
        # 'translateModel': 'default',  # Translation model ('default' or 'gpt4.1')
        # 'redact': [],  # PII categories to redact (array)
        'tags': json.dumps({'session': 'microphone-demo'}),  # Custom tags for metrics
    },
    
    # Audio streaming configuration
    'streaming': {
        'chunkSize': 1024,  # Audio chunk size in bytes
        'intervalMs': 20,  # Interval for audio processing
    },
}


async def main():
    """Main execution function"""
    print("🚀 WebSocket Speech-to-Text Microphone Example")
    print(f"📱 Platform: {platform.system()}")
    print("=" * 60)
    
    # Create client instance
    client = MicrophoneTranscriptionClient(CONFIG)
    
    # Setup graceful shutdown with Windows compatibility
    shutdown_event = asyncio.Event()
    
    def signal_handler(signum, frame):
        print("\n\n🛑 Shutting down gracefully...")
        shutdown_event.set()
    
    # Register signal handlers (Windows has limited signal support)
    if platform.system() != "Windows":
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    else:
        # On Windows, only SIGINT (Ctrl+C) is supported
        signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Connect to WebSocket server
        await client.connect()
        
        # Wait a moment to ensure connection is stable
        await asyncio.sleep(1)
        
        # Check if we're still connected after initial connection
        if not client.is_connected:
            logger.error("💥 Connection lost immediately after connecting")
            logger.error("This might indicate:")
            logger.error("- Invalid API key")
            logger.error("- Incorrect query parameters")
            logger.error("- Server rejecting the connection")
            return
        
        # Start recording
        client.start_recording()
        
        # Keep the script running
        print("\n💡 Press Ctrl+C to stop recording and exit")
        
        # Wait for shutdown signal or connection loss
        while client.is_connected and client.is_recording and not shutdown_event.is_set():
            try:
                await asyncio.wait_for(shutdown_event.wait(), timeout=1.0)
                break
            except asyncio.TimeoutError:
                continue
    
    except KeyboardInterrupt:
        print("\n\n🛑 Received interrupt signal")
    except Exception as error:
        logger.error(f"💥 Application error: {error}")
        if platform.system() == "Windows":
            logger.error("Windows-specific troubleshooting:")
            logger.error("- Check Windows Defender/Antivirus settings")
            logger.error("- Verify Python has microphone permissions")
            logger.error("- Ensure no other applications are using the microphone")
    finally:
        await client.disconnect()


if __name__ == "__main__":
    # Check if required packages are available
    try:
        import pyaudio
        import socketio
        import numpy as np
        import scipy.signal
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("\n📦 Install required packages with:")
        if platform.system() == "Windows":
            print("pip install pyaudio python-socketio numpy scipy")
            print("\n🪟 Windows-specific notes:")
            print("- PyAudio should install automatically on Windows")
            print("- If PyAudio fails, try: pip install pipwin && pipwin install pyaudio")
            print("- Or download PyAudio wheel from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio")
        else:
            print("pip install pyaudio python-socketio numpy scipy")
        sys.exit(1)
    
    # Check PyAudio functionality on Windows
    if platform.system() == "Windows":
        try:
            pa = pyaudio.PyAudio()
            device_count = pa.get_device_count()
            if device_count == 0:
                print("⚠️  Warning: No audio devices detected")
            pa.terminate()
        except Exception as e:
            print(f"⚠️  Warning: PyAudio test failed: {e}")
            print("   This might indicate audio driver issues on Windows")
    
    # Run the main function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        if platform.system() == "Windows":
            print("\n🔧 Windows troubleshooting steps:")
            print("1. Run Windows Update to ensure audio drivers are current")
            print("2. Check Device Manager for audio device issues")
            print("3. Test microphone in Windows Sound settings")
            print("4. Try running Python as administrator")
            print("5. Disable Windows audio enhancements if present")
