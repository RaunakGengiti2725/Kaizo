# Environment Setup

## API Key Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit .env and add your Gemini API key:
```
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it in your .env file

## Running the Application

```bash
npm install
npm run dev
```

The app will be available at http://localhost:8080

## Features

- **AI-Powered Analysis**: Uses Google's Gemini AI for sophisticated ingredient analysis
- **Multi-Image Processing**: Analyzes front, back, and ingredients panels
- **Trust Scoring**: Provides confidence metrics for all analyses
- **Detailed Explanations**: Explains why ingredients are/aren't vegan
- **Smart Alternatives**: Suggests vegan replacements for problematic ingredients
- **Fallback System**: Works with pattern matching if AI is unavailable
