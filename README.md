
# Claude-to-OpenAI API 代理

这是一个部署在 Cloudflare Workers 上的 TypeScript 项目，它充当一个代理服务器，能够将 [Claude API](https://docs.anthropic.com/claude/reference/messages_post) 格式的请求转换为 [OpenAI API](https://platform.openai.com/docs/api-reference/chat/create) 格式。这使得任何与 Claude API 兼容的客户端（例如 [Claude Code CLI](https://www.npmjs.com/package/@anthropic-ai/claude-code)）都能够与任何支持 OpenAI API 格式的服务进行通信。

## ✨ 功能特性

- **动态路由**: 无需修改代码，即可将请求代理到任意 OpenAI 兼容的 API 端点。API 的目标地址和模型名称可以直接在请求 URL 中指定。
- **Claude API 兼容**: 完全支持 `/v1/messages` 端点，包括流式响应和非流式响应。
- **Tool Calling (函数调用)转换**: 自动将 Claude 的 `tools` 格式转换为 OpenAI 的格式，并对 `input_schema` 进行清理，以确保与 Google Gemini 等严格的 API 兼容。
- **Haiku 模型快捷方式**: 通过环境变量，为特定的 "Haiku" 模型配置了固定的路由，方便快速调用。
- **简易配置脚本**: 提供 `claude_proxy.sh` 脚本，帮助用户一键配置本地的 Claude Code CLI，以使用此代理。
- **轻松部署**: 可以一键部署到 Cloudflare Workers 全球网络。

## 🚀 工作原理

### 动态路由

本代理最核心的功能是动态路由。你可以在客户端（如 Claude Code CLI）发起的请求 URL 中直接嵌入目标 API 的地址和模型名称。

URL 格式如下:
```
https://<你的-worker-域名>/<协议>/<目标API域名>/<路径>/<模型名称>/v1/messages
```

**示例**:

假设你的 Worker 部署在 `my-proxy.workers.dev`。你想通过 Groq API 使用 `llama3-70b-8192` 模型，你可以将 Claude Code 的 `ANTHROPIC_BASE_URL` 设置为：

```
https://my-proxy.workers.dev/https/api.groq.com/openai/v1/llama3-70b-8192
```
*（注意：URL 的末尾不需要 `/v1/messages`，代理会自动处理。）*

当一个请求发送到这个地址时，代理会：
1.  解析 URL，提取出目标 Base URL: `https://api.groq.com/openai/v1`。
2.  解析出模型名称: `llama3-70b-8192`。
3.  将请求头中的 `x-api-key` 作为 `Authorization: Bearer <key>` 转发给目标 API。
4.  将 Claude 格式的请求体转换为 OpenAI 格式，然后发送到 `https://api.groq.com/openai/v1/chat/completions`。
5.  将收到的 OpenAI 格式响应转换回 Claude 格式，并返回给客户端。

## 部署到 Cloudflare

### 步骤 1: 安装 Wrangler CLI

[Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 是 Cloudflare 的官方命令行工具，用于管理 Workers 项目。

```bash
npm install -g wrangler
```

### 步骤 2: 配置 `wrangler.toml`

`wrangler.toml` 是项目的配置文件。你可以根据需要修改其中的 `[vars]` 部分，为 "Haiku" 模型设置一个备用或默认的 API 端点。

```toml
# wrangler.toml

# ... (其他配置)

[vars]
# 当请求的模型名称包含 "haiku" 时，将使用以下配置
HAIKU_MODEL_NAME = "gpt-4o-mini" # 目标模型名称
HAIKU_BASE_URL   = "https://api.your-provider.com/v1" # 目标 API 地址
HAIKU_API_KEY    = "sk-your-secret-key" # 目标 API 的密钥
```

### 步骤 3: 部署

在项目根目录下运行以下命令即可将 Worker 部署到你的 Cloudflare 账户：

```bash
npx wrangler deploy
```

部署成功后，你将获得一个 `*.workers.dev` 的域名，这就是你的代理地址。

## ⚙️ 配置 Claude Code CLI

我们提供了一个方便的 `claude_proxy.sh` 脚本来自动配置你的 Claude Code CLI。

### 如何使用:

1.  **修改脚本**: 打开 `claude_proxy.sh` 文件，找到并修改以下变量：
    - `API_KEY`: 你的 API 密钥。这个密钥将作为 `x-api-key` 发送给代理。
    - `OPEN_AI_URL`: 你的代理服务地址和目标 API 地址的组合。例如，如果你的 Worker 部署在 `my-proxy.workers.dev`，你想访问 `api.groq.com/openai/v1`，则这里应填 `my-proxy.workers.dev/https/api.groq.com/openai/v1`。
    - `OPEN_MODEL`: 你希望使用的默认模型名称。

    **示例**:
    ```bash
    # claude_proxy.sh

    # ...
    readonly API_KEY="gsk_YourGroqAPIKey"
    readonly OPEN_AI_URL="my-proxy.workers.dev/https/api.groq.com/openai/v1"
    readonly OPEN_MODEL="llama3-70b-8192"
    # ...
    ```

2.  **运行脚本**: 在终端中执行脚本。
    ```bash
    chmod +x ./claude_proxy.sh
    ./claude_proxy.sh
    ```

3.  **完成**: 脚本会自动更新 `~/.claude/settings.json` 文件。现在，当你使用 `claude` 命令时，所有请求都将通过你部署的 Cloudflare Worker 代理。

## 💻 本地开发

如果你想在本地运行和测试此 Worker，可以使用以下命令：

```bash
npx wrangler dev
```

这将在本地启动一个服务器（通常是 `http://localhost:8787`），你可以用它来进行开发和调试。

**注意**: 在本地开发时，你需要创建一个 `.dev.vars` 文件来存储环境变量，否则 Worker 无法获取 `wrangler.toml` 中定义的 `[vars]`。

**`.dev.vars` 文件示例**:
```
HAIKU_MODEL_NAME="gpt-4o-mini"
HAIKU_BASE_URL="https://api.your-provider.com/v1"
HAIKU_API_KEY="sk-your-secret-key"
```
