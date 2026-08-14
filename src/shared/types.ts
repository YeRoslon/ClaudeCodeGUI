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
  projectPath: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

export interface AppState {
  chats: Chat[]
  activeChatId: string | null
  lastProjectPath: string | null
}

export const MODEL_OPTIONS = ['sonnet', 'opus', 'haiku'] as const
export type ModelAlias = (typeof MODEL_OPTIONS)[number]
export const DEFAULT_MODEL: ModelAlias = 'sonnet'

export const DEFAULT_TITLE = 'New Chat'

export type ClaudeEvent =
  | { type: 'text-delta'; chatId: string; text: string }
  | { type: 'session'; chatId: string; sessionId: string }
  | { type: 'done'; chatId: string; finalText?: string }
  | { type: 'error'; chatId: string; message: string }
