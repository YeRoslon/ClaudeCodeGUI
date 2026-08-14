# Claude Code GUI

一个把本机 `claude` CLI（Claude Code）封装成桌面聊天应用的简单客户端。

- **Electron** + **React** + **TypeScript** + **electron-vite**
- 直接调用本机 `claude` CLI（`spawn`，参数数组传参，不拼 shell 命令），**不**调用 Anthropic HTTP API
- 流式回复实时显示（解析 `--output-format stream-json`）
- 多会话聊天列表，每个 Chat 独立 `session_id`，支持多轮 `--resume`
- 模型切换：Sonnet / Opus / Haiku
- 每个 Chat 指定工作目录（Project Folder）
- 聊天记录保存在 Electron `userData` 目录下的 JSON 文件，重启后仍在

## 前置要求

- 已安装并登录 Claude Code CLI：`claude --version`
- Node.js 18+

## 安装

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 使用说明

1. 点击 **+ New Chat** 创建会话
2. 点击底部 / 顶部 **Choose Folder** 选择 Claude Code 的工作目录
3. 在底部输入框输入消息，**Enter** 发送，**Shift + Enter** 换行
4. 回复过程中可点击 **Stop** 停止生成
5. 顶部下拉框切换模型（Sonnet / Opus / Haiku）
6. 左侧列表切换 / 删除会话，应用重启后历史聊天自动恢复

> 默认查找 PATH 中的 `claude` 命令。若不在 PATH 中，可设置环境变量 `CLAUDE_BIN` 指定可执行文件路径。

## 数据存放位置

聊天记录保存在 `app.getPath('userData')/chats.json`。在 Windows 上通常位于：

```
%APPDATA%\claude-code-gui\chats.json
```

## 项目结构

```
src/
├── main/          Electron 主进程：窗口、IPC、ClaudeRunner（spawn + 解析 stream-json）、JSON 存储
├── preload/       contextBridge 暴露给渲染进程的 API
├── renderer/      React 界面：会话列表、消息流、模型切换、输入框
└── shared/        主进程 / 渲染进程共享的类型定义
```
