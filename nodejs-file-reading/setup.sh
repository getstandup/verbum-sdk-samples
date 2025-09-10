#!/bin/bash

# Quick setup script for the WebSocket STT File Example

echo "🚀 Setting up WebSocket STT File Example..."
echo "════════════════════════════════════════════"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if sample audio file exists
if [ ! -f "sample-audio.wav" ]; then
    echo "⚠️  Sample audio file not found"
    echo "   Place your WAV file as 'sample-audio.wav' in this directory"
    echo "   Or update the audioFile path in the configuration"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the API key in index.js or .env file"
echo "2. Ensure your audio file is in place"
echo "3. Run the example:"
echo "   npm start"
echo ""
echo "For advanced examples:"
echo "   node advanced-example.js multilingual"
echo "   node advanced-example.js secure"
echo "   node advanced-example.js meeting"
echo ""
echo "📖 See README.md for detailed documentation"
