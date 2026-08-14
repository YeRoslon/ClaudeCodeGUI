你是一名资深桌面应用工程师。请直接在当前目录从 0 开始完成一个**可运行的桌面应用**，不要只给方案、教程或代码片段。

## 目标

做一个简单的 Claude Code GUI 客户端，本质是：

**把本机已经安装的 `claude` CLI 封装成桌面聊天软件。**

只做 3 个核心功能：

1. 在 GUI 中直接和 Claude Code 聊天
2. 可以切换 Claude 模型
3. 有聊天列表，可以创建、查看、切换多个历史会话

重点是功能闭环、真正能运行，不要扩展无关功能。

---

## 技术栈

使用：

* Electron
* React
* TypeScript
* Vite / electron-vite
* Node.js

可以使用 `react-markdown` 渲染回复。

本地数据使用 JSON 持久化，不需要数据库。

不要使用：

* Anthropic HTTP API
* 后端服务器
* Docker
* Next.js
* 数据库
* 账号系统
* 云同步

---

## Claude Code 集成

必须调用用户本机的 `claude` CLI，不要直接调用 Anthropic API。

使用 Node `spawn()` 启动 Claude Code，并通过参数数组传参，不要把用户输入拼接进 shell command。

首次聊天大致使用：

```bash
claude -p \
  --model sonnet \
  --output-format stream-json \
  --verbose \
  --include-partial-messages \
  "用户消息"
```

读取 stdout 的 stream-json，并把 Claude 的文本增量实时发送到 React GUI，实现流式回复。

第一次请求结束后保存 Claude 返回的：

```text
session_id
```

同一个聊天后续发送消息时使用：

```bash
claude -p \
  --resume SESSION_ID \
  --model sonnet \
  --output-format stream-json \
  --verbose \
  --include-partial-messages \
  "下一条消息"
```

不要每轮把整个历史消息重新拼接给 Claude。

如果当前 Claude Code CLI 的实际参数或 stream-json 格式与这里略有不同，请根据当前安装版本自行调整。

---

## 会话结构

每个 GUI Chat 对应一个 Claude Code session。

建议数据结构：

```ts
interface Chat {
  id: string
  claudeSessionId?: string
  title: string
  model: string
  projectPath: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}
```

聊天记录保存在：

```ts
app.getPath('userData')
```

目录下的 JSON 文件中。

应用关闭重新打开后，历史聊天必须仍然存在。

---

## 多聊天

左侧 Sidebar：

```text
+ New Chat

Chat A
Chat B
Chat C
```

支持：

* 新建聊天
* 切换聊天
* 查看历史消息
* 每个 Chat 保存独立 `session_id`
* 每个 Chat 保存独立 model
* 重启应用后恢复聊天列表

新 Chat 第一次发送消息后，可以直接取第一条消息前 20～30 个字符作为标题。

---

## 模型切换

聊天顶部放 Model Selector。

至少支持：

```text
Sonnet
Opus
Haiku
```

对应：

```text
sonnet
opus
haiku
```

默认 `sonnet`。

切换模型后：

* 更新当前 Chat 的 model
* 下一条 Claude CLI 请求使用新的 `--model`
* 不创建新 Chat
* 继续使用当前 session_id

---

## Project Folder

Claude Code 需要 working directory。

每个 Chat 保存：

```ts
projectPath
```

调用 CLI：

```ts
spawn(claudePath, args, {
  cwd: chat.projectPath
})
```

提供一个简单的：

```text
Choose Project Folder
```

按钮，通过 Electron directory picker 选择目录。

记住最近使用的目录，新聊天默认继承它。

---

## UI

界面保持非常简单：

```text
┌──────────────────────────────────────────────┐
│ Sidebar       │ Model: Sonnet   ~/project   │
│               ├──────────────────────────────┤
│ + New Chat    │                              │
│               │          Messages            │
│ Chat 1        │                              │
│ Chat 2        │                              │
│ Chat 3        │                              │
│               ├──────────────────────────────┤
│               │   Message...          Send   │
└──────────────────────────────────────────────┘
```

要求：

* 左侧聊天列表
* 顶部模型选择
* 显示当前项目目录
* 中间消息列表
* 底部输入框
* Enter 发送
* Shift + Enter 换行
* Claude 回复流式显示
* Markdown / code block 正常显示
* 当前 Chat 高亮
* UI 简洁干净

回复过程中可以提供 Stop 按钮，用来终止当前 Claude CLI 子进程。

---

## Electron 架构

保持简单清晰：

```text
React Renderer
      ↓
Preload IPC
      ↓
Electron Main
      ↓
ClaudeRunner
      ↓
claude CLI
```

Renderer 不直接访问：

```ts
child_process
fs
```

通过 preload 暴露必要 API。

建议把 Claude CLI 调用封装成：

```ts
class ClaudeRunner {
  sendMessage(...)
  stop()
}
```

ClaudeRunner 负责：

* spawn Claude CLI
* 解析 stream-json
* 提取文本增量
* 获取 session_id
* 把事件通过 IPC 发给 Renderer
* 停止生成

Renderer 只处理类似：

```ts
type ClaudeEvent =
  | { type: 'text-delta'; chatId: string; text: string }
  | { type: 'session'; chatId: string; sessionId: string }
  | { type: 'done'; chatId: string }
  | { type: 'error'; chatId: string; message: string }
```

不要让 React 直接处理 Claude CLI 的原始 JSON。

---

## MVP 范围

不要实现：

* API Key 配置
* 用户登录
* MCP 管理
* Git GUI
* Terminal
* 文件树
* Diff Viewer
* Agent 管理
* Skills 管理
* 云同步
* 自动更新
* 数据统计
* 多窗口
* 复杂设置页

只把这条链路做好：

```text
GUI
→ Claude CLI
→ 流式回复
→ 保存 session_id
→ resume 多轮聊天
→ 多 Chat
→ 模型切换
→ 本地持久化
```

---

## 完成标准

最终至少做到：

* `npm install` 可以安装
* `npm run dev` 可以启动桌面应用
* 可以选择项目目录
* 可以创建多个 Chat
* 可以发送消息给真实 Claude Code
* Claude 回复显示在 GUI
* 同一 Chat 可以继续多轮聊天
* 不同 Chat 使用不同 session
* 可以切换 Sonnet / Opus / Haiku
* 重启应用后聊天历史仍存在
* 可以继续历史 Claude session
* `npm run build` 可以通过

遇到代码、类型、构建或运行错误时直接自行修复，不要把未完成的问题留给我。

同时创建一个简洁的 README，说明安装和启动方式。

不要反复询问我技术细节。对于小的实现选择，请直接选择最简单可靠的方案并继续开发。

**优先级：能跑通 > 功能正确 > UI 美观 > 额外功能。**

现在直接开始开发整个项目。
