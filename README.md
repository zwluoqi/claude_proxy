# Claude Code 代理配置工具

[![Shell Script](https://img.shields.io/badge/Shell-Script-green.svg)](https://www.gnu.org/software/bash/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🚀 一键配置 Claude Code 命令行工具，通过代理服务访问大语言模型

## 📋 功能特性

- ✅ **自动安装检查** - 检查并安装 Claude Code 工具
- ⚙️ **智能配置** - 自动配置 `~/.claude/settings.json` 文件
- 🔧 **多种更新方式** - 支持 `jq` 或 `python3` 更新 JSON 配置
- 💾 **安全备份** - 更新前自动备份原配置文件
- 🌐 **代理支持** - 设置代理 API 地址和密钥

## 🛠️ 系统要求

- **Node.js** 和 **npm** (用于安装 Claude Code)
- **Bash** 环境
- **jq** 或 **python3** (可选，用于 JSON 处理)

## 🚀 快速开始

### 1. 配置参数

打开脚本文件 `claude_proxy.sh`，找到 **"重点: 需要替换的内容"** 部分，修改以下变量：

```bash
# 🔑 API 密钥
API_KEY="your_api_key_here"

# 🌐 代理服务地址
OPEN_AI_URL="不带https://的地址/v1"

# 🤖 模型名称
OPEN_MODEL="gemini-1.5-pro"
```

### 2. 运行脚本

```bash
# 添加执行权限
chmod +x claude_proxy.sh

# 运行脚本
./claude_proxy.sh
```

### 3. 开始使用

配置完成后，即可在命令行中使用 Claude：

```bash
claude "Hello, world!"
```

## 📁 文件结构

```
~/.claude/
├── settings.json           # 主配置文件
└── settings.json.backup    # 自动备份文件
```

## ⚙️ 配置说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `API_KEY` | 你的 API 密钥 | `sk-xxx...` |
| `OPEN_AI_URL` | 代理服务地址 | `tbai.xin/v1` |
| `OPEN_MODEL` | 使用的模型名称 | `gemini-1.5-pro` |

## 🔧 工作原理

1. **检查环境** - 验证必要的依赖是否安装
2. **安装工具** - 如果未安装，自动安装 Claude Code
3. **备份配置** - 保存现有配置文件
4. **更新设置** - 使用 JSON 处理工具更新配置
5. **验证完成** - 确认配置更新成功

## ⚠️ 注意事项

- 📝 请确保 API 密钥的安全性，不要在公共仓库中暴露
- 🔄 脚本会修改 `~/.claude/settings.json` 文件
- 💾 每次运行都会创建配置文件的备份
- 🌐 确保代理服务地址可以正常访问

## 🐛 故障排除

### 
