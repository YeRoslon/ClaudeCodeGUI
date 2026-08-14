export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export interface Chat {
  id: string
  claudeSessionId?: string
  title: string
  model: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

export interface AppState {
  chats: Chat[]
  activeChatId: string | null
  lastProjectPath: string | null
}

export interface ModelConfig {
  id: string
  /** 传给 claude --model 的模型名 */
  model: string
  /** 下拉框显示名 */
  label: string
  /** 可选：覆盖 ANTHROPIC_BASE_URL（比如接入 minimax 等其它兼容端点） */
  baseUrl?: string
  /** 可选：直接填 API Key（在设置界面配置，优先于环境变量） */
  authToken?: string
  /** 可选：从哪个环境变量读取该模型的 API Key（兜底，程序内置配置里没填时用） */
  authTokenEnv?: string
  /** 内置模型（来自代码内置列表），设置界面里不可删除 */
  builtin?: boolean
}

export const MODEL_OPTIONS: ModelConfig[] = [
  { id: 'deepseek-v4-flash', model: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', builtin: true },
  { id: 'deepseek-chat', model: 'deepseek-chat', label: 'DeepSeek Chat', builtin: true }
]

export const DEFAULT_MODEL_ID = MODEL_OPTIONS[0].id

export const DEFAULT_TITLE = 'New Chat'

export type ClaudeEvent =
  | { type: 'text-delta'; chatId: string; text: string }
  | { type: 'session'; chatId: string; sessionId: string }
  | { type: 'done'; chatId: string; finalText?: string }
  | { type: 'error'; chatId: string; message: string }
