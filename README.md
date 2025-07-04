# Claude-to-OpenAI API Proxy

This is a Node.js server that acts as a proxy, converting API requests from the Claude format to the OpenAI format. It enables using OpenAI-compatible APIs (like OpenAI, Azure OpenAI, Google Gemini, Ollama, etc.) with clients designed for the Claude API.

## Features

- Full support for the `/v1/messages` endpoint
- Dynamic Routing: Routes requests to any OpenAI-compatible API
- Handles tool calls (function calling)
- Supports streaming responses (Server-Sent Events)
- Dynamically selects API endpoints and keys based on model name or URL path

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   HAIKU_MODEL_NAME=your-haiku-model-name
   HAIKU_BASE_URL=your-haiku-base-url
   HAIKU_API_KEY=your-haiku-api-key
   ```

## Development

Run the development server:
```bash
npm run dev
```

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Usage

Send requests to the proxy server just like you would to the Claude API. The server will automatically convert them to the OpenAI format.

Example request:
```bash
curl -X POST http://localhost:3000/https/api.groq.com/openai/v1/llama3-70b-8192/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "llama3-70b-8192",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1000
  }'
```

The proxy will:
1. Convert the request to OpenAI format
2. Forward it to the specified API endpoint
3. Convert the response back to Claude format
4. Return the response to the client

## Environment Variables

- `PORT`: The port number for the server (default: 3000)
- `HAIKU_MODEL_NAME`: Model name for the Haiku route
- `HAIKU_BASE_URL`: Base URL for the Haiku API
- `HAIKU_API_KEY`: API key for the Haiku service
