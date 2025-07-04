import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

/**
 * Parses the model and base URL from the request pathname.
 * The path is expected to be in the format: /<scheme>/<host>/.../<model_name>/v1/messages
 * or /<host>/.../<model_name>/v1/messages (defaulting to https).
 */
function parsePathAndModel(pathname) {
    // Remove the mandatory suffix to isolate the dynamic parts of the path.
    const dynamicPath = pathname.substring(0, pathname.lastIndexOf('/v1/messages'));
    const parts = dynamicPath.split('/').filter(p => p);
    console.log('parts',parts);
    // if (parts.length < 2) {
    //     return null;
    // }

    const modelName = parts.pop();
    let baseUrl;

    // if (parts[0].toLowerCase() === 'http' || parts[0].toLowerCase() === 'https') {
    //     const scheme = parts.shift();
    //     baseUrl = `${scheme}://${parts.join('/')}`;
    // } else {
    //     baseUrl = `https://${parts.join('/')}`;
    // }

    return { baseUrl, modelName };
}

/**
 * Recursively cleans a JSON Schema for compatibility with APIs like Google Gemini.
 */
function recursivelyCleanSchema(schema) {
    if (schema === null || typeof schema !== 'object') {
        return schema;
    }

    if (Array.isArray(schema)) {
        return schema.map(item => recursivelyCleanSchema(item));
    }

    const newSchema = {};
    for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
            if (key === '$schema' || key === 'additionalProperties') {
                continue;
            }
            newSchema[key] = recursivelyCleanSchema(schema[key]);
        }
    }

    if (newSchema.type === 'string' && newSchema.format) {
        const supportedFormats = ['date-time', 'enum'];
        if (!supportedFormats.includes(newSchema.format)) {
            delete newSchema.format;
        }
    }

    return newSchema;
}

/**
 * Converts a Claude API request to the OpenAI format.
 */
function convertClaudeToOpenAIRequest(claudeRequest, modelName) {
    const openaiMessages = [];

    if (claudeRequest.system) {
        openaiMessages.push({ role: "system", content: claudeRequest.system });
    }

    for (let i = 0; i < claudeRequest.messages.length; i++) {
        const message = claudeRequest.messages[i];
        if (message.role === 'user') {
            if (Array.isArray(message.content)) {
                const toolResults = message.content.filter(c => c.type === 'tool_result');
                const otherContent = message.content.filter(c => c.type !== 'tool_result');

                if (toolResults.length > 0) {
                    toolResults.forEach(block => {
                        openaiMessages.push({
                            role: 'tool',
                            tool_call_id: block.tool_use_id,
                            content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
                        });
                    });
                }

                if (otherContent.length > 0) {
                    openaiMessages.push({ role: "user", content: otherContent.map(block => block.type === 'text' ? {type: 'text', text: block.text} : {type: 'image_url', image_url: {url: `data:${block.source.media_type};base64,${block.source.data}`}} ) });
                }
            } else {
                openaiMessages.push({ role: "user", content: message.content });
            }
        } else if (message.role === 'assistant') {
            const textParts = [];
            const toolCalls = [];
            if (Array.isArray(message.content)) {
                message.content.forEach(block => {
                    if (block.type === 'text') {
                        textParts.push(block.text);
                    } else if (block.type === 'tool_use') {
                        toolCalls.push({
                            id: block.id,
                            type: 'function',
                            function: { name: block.name, arguments: JSON.stringify(block.input || {}) },
                        });
                    }
                });
            }
            const assistantMessage = { role: 'assistant', content: textParts.join('\n') || null};
            if (toolCalls.length > 0) {
                assistantMessage.tool_calls = toolCalls;
            }
            openaiMessages.push(assistantMessage);
        }
    }

    const openaiRequest = {
        model: modelName,
        messages: openaiMessages,
        max_tokens: claudeRequest.max_tokens,
        temperature: claudeRequest.temperature,
        top_p: claudeRequest.top_p,
        stream: claudeRequest.stream,
        stop: claudeRequest.stop_sequences,
    };

    if (claudeRequest.tools) {
        openaiRequest.tools = claudeRequest.tools.map((tool) => {
            const cleanedParameters = recursivelyCleanSchema(tool.input_schema);
            return {
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: cleanedParameters,
                },
            };
        });
    }

    if (claudeRequest.tool_choice) {
        if (claudeRequest.tool_choice.type === 'auto' || claudeRequest.tool_choice.type === 'any') {
            openaiRequest.tool_choice = 'auto';
        } else if (claudeRequest.tool_choice.type === 'tool') {
            openaiRequest.tool_choice = { type: 'function', function: { name: claudeRequest.tool_choice.name }};
        }
    }

    return openaiRequest;
}

/**
 * Converts a non-streaming OpenAI response to the Claude format.
 */
function convertOpenAIToClaudeResponse(openaiResponse, model) {
    console.log('openaiResponse',openaiResponse);
    const choice = openaiResponse.choices[0];
    const contentBlocks = [];
    if (choice.message.content) {
        contentBlocks.push({ type: 'text', text: choice.message.content });
    }
    if (choice.message.tool_calls) {
        choice.message.tool_calls.forEach((call) => {
            contentBlocks.push({
                type: 'tool_use',
                id: call.id,
                name: call.function.name,
                input: JSON.parse(call.function.arguments),
            });
        });
    }
    const stopReasonMap = { stop: "end_turn", length: "max_tokens", tool_calls: "tool_use" };
    return {
        id: openaiResponse.id,
        type: "message",
        role: "assistant",
        model: model,
        content: contentBlocks,
        stop_reason: stopReasonMap[choice.finish_reason] || "end_turn",
        usage: {
            input_tokens: openaiResponse?.usage?.prompt_tokens || 0,
            output_tokens: openaiResponse?.usage?.completion_tokens || 0,
        },
    };
}

/**
 * Handles streaming responses
 */
function handleStream(req, res, openaiResponse, model) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let initialized = false;
    let buffer = "";
    const messageId = `msg_${Math.random().toString(36).substr(2, 9)}`;
    const toolCalls = {};
    let contentBlockIndex = 0;

    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    openaiResponse.body.on('data', (chunk) => {
        if (!initialized) {
            sendEvent('message_start', { type: 'message_start', message: { id: messageId, type: 'message', role: 'assistant', model, content: [], stop_reason: null, usage: { input_tokens: 0, output_tokens: 0 } } });
            sendEvent('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
            initialized = true;
        }

        const text = chunk.toString();
        buffer += text;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.substring(6);
            // console.log('stream line',line);

            if (data.trim() === "[DONE]") {
                console.log('stream [DONE]');
                sendEvent('content_block_stop', { type: 'content_block_stop', index: 0 });
                Object.values(toolCalls).forEach(tc => {
                    if(tc.started) sendEvent('content_block_stop', { type: 'content_block_stop', index: tc.claudeIndex });
                });
                let finalStopReason = "end_turn";
                try {
                    const lastChunk = JSON.parse(lines[lines.length - 2].substring(6));
                    const finishReason = lastChunk.choices[0].finish_reason;
                    if (finishReason === 'tool_calls') finalStopReason = 'tool_use';
                    if (finishReason === 'length') finalStopReason = 'max_tokens';
                } catch {}
                sendEvent('message_delta', { type: 'message_delta', delta: { stop_reason: finalStopReason, stop_sequence: null }, usage: { output_tokens: 0 } });
                sendEvent('message_stop', { type: 'message_stop' });
                res.end();
                return;
            }

            try {
                const openaiChunk = JSON.parse(data);
                const delta = openaiChunk.choices[0]?.delta;
                if (!delta) continue;
                console.log('stream delta',delta);
                if (delta.content) {
                    sendEvent('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta.content } });
                }

                if (delta.tool_calls) {
                    for(const tc_delta of delta.tool_calls) {
                        const index = tc_delta.index;
                        if (!toolCalls[index]) {
                            toolCalls[index] = { id: '', name: '', args: '', claudeIndex: 0, started: false };
                        }
                        if (tc_delta.id) toolCalls[index].id = tc_delta.id;
                        if (tc_delta.function?.name) toolCalls[index].name = tc_delta.function.name;
                        if (tc_delta.function?.arguments) toolCalls[index].args += tc_delta.function.arguments;
                        
                        if (toolCalls[index].id && toolCalls[index].name && !toolCalls[index].started) {
                            contentBlockIndex++;
                            toolCalls[index].claudeIndex = contentBlockIndex;
                            toolCalls[index].started = true;
                            sendEvent('content_block_start', { type: 'content_block_start', index: contentBlockIndex, content_block: { type: 'tool_use', id: toolCalls[index].id, name: toolCalls[index].name, input: {} } });
                        }
                        
                        if (toolCalls[index].started && tc_delta.function?.arguments) {
                            sendEvent('content_block_delta', { type: 'content_block_delta', index: toolCalls[index].claudeIndex, delta: { type: 'input_json_delta', partial_json: tc_delta.function.arguments } });
                        }
                    }
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }
    });

    openaiResponse.body.on('error', (err) => {
        console.error('Stream error:', err);
        res.end();
    });
}

// --- Express App Setup ---

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Anthropic-Version'],
}));
// 打印所有请求日志
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}}`);
    next();
});

// Main endpoint
app.post('*/v1/messages', async (req, res) => {
    console.log('req.headers',req.headers);
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'].split(' ')[1];
    if (!apiKey) {
        return res.status(401).json({ error: 'The "x-api-key" header is missing.' });
    }

    try {
        const claudeRequest = req.body;

        // Configuration Selection
        let targetApiKey = apiKey;
        let targetModelName;
        let targetBaseUrl;

        // Check for the "haiku" specific route
        // const isHaiku = claudeRequest.model.toLowerCase().includes("haiku");

        targetBaseUrl = process.env.HAIKU_BASE_URL;
        targetApiKey = process.env.HAIKU_API_KEY;
        // Try to parse the base URL and model from the dynamic path
        const dynamicConfig = parsePathAndModel(req.path);
        if (dynamicConfig) {
            targetModelName = dynamicConfig.modelName;
        } else {
            targetModelName = process.env.HAIKU_MODEL_NAME;
        }

        if (!targetBaseUrl || !targetModelName) {
            return res.status(400).json({
                error: 'Could not determine target base URL or model name. Ensure the URL format is correct or fallback environment variables are set.'
            });
        }

        const openaiRequest = convertClaudeToOpenAIRequest(claudeRequest, targetModelName);
        console.log('openaiRequest',JSON.stringify(openaiRequest));
        const openaiResponse = await fetch(`${targetBaseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${targetApiKey}`,
            },
            body: JSON.stringify(openaiRequest),
        });

        if (!openaiResponse.ok) {
            const errorBody = await openaiResponse.text();
            console.error('errorBody',errorBody);
            return res.status(openaiResponse.status).send(errorBody);
        }

        if (claudeRequest.stream) {
            handleStream(req, res, openaiResponse, claudeRequest.model);
        } else {
            const openaiResponseData = await openaiResponse.json();
            const claudeResponse = convertOpenAIToClaudeResponse(openaiResponseData, claudeRequest.model);
            res.json(claudeResponse);
        }
    } catch (e) {
        console.error('catch',e);
        res.status(500).json({ error: e.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app; 