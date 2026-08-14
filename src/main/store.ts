import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import type { AppState, Chat } from '../shared/types'

/**
 * JSON 持久化存储。数据保存在 app.getPath('userData') 目录下，
 * 应用重启后历史聊天仍然存在。
 */
export class Store {
  private readonly file: string
  private state: AppState = { chats: [], activeChatId: null, lastProjectPath: null }

  constructor() {
    this.file = path.join(app.getPath('userData'), 'chats.json')
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
