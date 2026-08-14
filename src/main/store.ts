import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import {
  DEFAULT_MODEL_ID,
  MODEL_OPTIONS,
  type AppState,
  type Chat,
  type ModelConfig
} from '../shared/types'

const LEGACY_MODEL_ALIASES = ['sonnet', 'opus', 'haiku']

/**
 * JSON 持久化存储。数据保存在 app.getPath('userData') 目录下，
 * 应用重启后历史聊天仍然存在。模型配置单独存 config.json。
 */
export class Store {
  private readonly file: string
  private readonly configFile: string
  private state: AppState = { chats: [], activeChatId: null, lastProjectPath: null }
  private models: ModelConfig[] = []

  constructor() {
    const dir = app.getPath('userData')
    this.file = path.join(dir, 'chats.json')
    this.configFile = path.join(dir, 'config.json')
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.file, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppState>
      this.state = {
        chats: Array.isArray(parsed.chats) ? parsed.chats : [],
        activeChatId: parsed.activeChatId ?? null,
        lastProjectPath: parsed.lastProjectPath ?? null
      }
    } catch {
      // 文件不存在或损坏时使用空状态
    }
    // 迁移旧的 sonnet/opus/haiku 别名（本机 claude 接入的是 DeepSeek 端点，别名无意义）
    let migrated = false
    for (const chat of this.state.chats) {
      if (LEGACY_MODEL_ALIASES.includes(chat.model)) {
        chat.model = DEFAULT_MODEL_ID
        migrated = true
      }
    }
    if (migrated) await this.save()
  }

  async loadConfig(): Promise<void> {
    try {
      const raw = await fs.readFile(this.configFile, 'utf-8')
      const parsed = JSON.parse(raw) as { models?: ModelConfig[] }
      if (Array.isArray(parsed.models)) {
        this.models = parsed.models
      }
    } catch {
      // 文件不存在或损坏时用内置列表
    }
    // 确保内置模型始终存在（代码里新增的内置模型也会自动补进来）
    for (const builtin of MODEL_OPTIONS) {
      if (!this.models.some((m) => m.id === builtin.id)) {
        this.models.push({ ...builtin, builtin: true })
      }
    }
    await this.saveConfig()
  }

  getModels(): ModelConfig[] {
    return this.models
  }

  async saveModels(models: ModelConfig[]): Promise<ModelConfig[]> {
    this.models = models.map((m) => ({ ...m, builtin: m.builtin === true }))
    await this.saveConfig()
    return this.getModels()
  }

  private async saveConfig(): Promise<void> {
    await fs.mkdir(path.dirname(this.configFile), { recursive: true })
    await fs.writeFile(this.configFile, JSON.stringify({ models: this.models }, null, 2), 'utf-8')
  }

  getState(): AppState {
    return this.state
  }

  async addChat(chat: Chat): Promise<void> {
    this.state.chats.unshift(chat)
    this.state.activeChatId = chat.id
    await this.save()
  }

  async updateChat(id: string, patch: Partial<Chat>): Promise<void> {
    const chat = this.state.chats.find((c) => c.id === id)
    if (!chat) return
    Object.assign(chat, patch, { updatedAt: Date.now() })
    await this.save()
  }

  async setActiveChat(id: string): Promise<void> {
    if (!this.state.chats.some((c) => c.id === id)) return
    this.state.activeChatId = id
    await this.save()
  }

  async deleteChat(id: string): Promise<void> {
    this.state.chats = this.state.chats.filter((c) => c.id !== id)
    if (this.state.activeChatId === id) {
      this.state.activeChatId = this.state.chats[0]?.id ?? null
    }
    await this.save()
  }

  async setLastProjectPath(p: string): Promise<void> {
    this.state.lastProjectPath = p
    await this.save()
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true })
    await fs.writeFile(this.file, JSON.stringify(this.state, null, 2), 'utf-8')
  }
}
