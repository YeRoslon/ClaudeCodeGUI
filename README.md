# Claude Code GUI

一个把本机 `claude` CLI（Claude Code）封装成桌面聊天应用的简单客户端。

- **Electron** + **React** + **TypeScript** + **electron-vite**
- 直接调用本机 `claude` CLI（`spawn`，参数数组传参，不拼 shell 命令），**不**调用 Anthropic HTTP API
- 流式回复实时显示（解析 `--output-format stream-json`）
- 多会话聊天列表，每个 Chat 独立 `session_id`，支持多轮 `--resume`
- 模型切换：DeepSeek V4 Flash / DeepSeek Chat（内置，可在设置里添加更多模型）
- 内置设置界面：直接在应用里配置每个模型的接口地址和 API Key，不依赖环境变量
- 全局选择一个工作目录（Project Folder），所有会话在其中运行
- 直接对话即可联网搜索（查天气、搜资料），内置中英文界面切换
- 聊天记录保存在 Electron `userData` 目录下的 JSON 文件，重启后仍在

## 快速开始（从零克隆到跑起来）

**环境要求**

- Node.js 18+
- 已安装并登录 Claude Code CLI（`claude --version` 能显示版本号）

**步骤**

```bash
# 1. 克隆仓库
git clone https://github.com/YeRoslon/ClaudeCodeGUI.git
cd ClaudeCodeGUI

# 2. 装依赖
npm install

# 3. 启动（配置见下方「模型配置」）
npm run dev
```

> 国内网络装依赖时，`npm install` 下载 Electron 二进制直连 GitHub 经常被重置。
> 建议先设镜像再装：
>
> ```bash
> npm config set registry https://registry.npmmirror.com
> set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
> npm install
> ```

**几点说明**

- 本项目的启动方式是 `npm run dev`（开发模式，带热更新）。
- `npm run build` 只产出 `out/` 目录，**不会生成独立的 `.exe`**（未配置 electron-builder 打包），所以运行用 `npm run dev` 而不是双击某个文件。
- 模型配置不随代码走：接口地址和 API Key 存在各自机器的 `config.json`（或环境变量）里，不在仓库内。别人克隆后若什么都不配，claude 会走它默认的 Anthropic 后端，需要自己的账号。

## 使用说明

1. 点击 **+ New Chat** 创建会话
2. 点击侧边栏底部 **Choose Project Folder** 选择 Claude Code 的工作目录（可选，默认用用户目录）
3. 在底部输入框输入消息，**Enter** 发送，**Shift + Enter** 换行
4. 直接输入问题即可联网查询，例如「帮我查一下北京今天的天气」「搜索 XX 是什么」
5. 回复过程中可点击 **Stop** 停止生成
6. 顶部下拉框切换模型（DeepSeek V4 Flash / DeepSeek Chat）
7. 侧边栏底部 **设置** 按钮配置模型（接口地址、API Key、添加/删除自定义模型）
8. 侧边栏底部 **English / 中文** 按钮切换界面语言
9. 左侧列表切换 / 删除会话，应用重启后历史聊天自动恢复

> 默认查找 PATH 中的 `claude` 命令。若不在 PATH 中，可设置环境变量 `CLAUDE_BIN` 指定可执行文件路径。

## 模型配置

有两种方式配置模型，**在应用里填的优先级更高**：

1. **设置界面（推荐）**：点击侧边栏底部 **设置**，在弹窗里直接填每个模型的
   显示名、模型名、接口地址（Base URL）和 API Key；也可以点「添加模型」加新的
   （比如 minimax 等其它 Anthropic 兼容端点）。保存后立即生效，存在
   `%APPDATA%\claude-code-gui\config.json`。
2. **环境变量（兜底）**：某个模型在设置里没填接口地址 / Key 时，程序会继承
   进程环境里的 `ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN`。

内置模型（DeepSeek V4 Flash / DeepSeek Chat）在设置里可以改配置但不能删除；
自定义模型可以随时删除。

注意：API Key 会以明文存在 `config.json` 里（本地 userData 目录，只有当前用户能访问）。
如果要发给别人用，记得先清掉里面填的 Key。

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
