import { contextBridge, ipcRenderer } from 'electron'
import type { AppState, Chat, ClaudeEvent } from '../shared/types'

const api = {
  getState: (): Promise<AppState> => ipcRenderer.invoke('chats:get-state'),
  createChat: (projectPath?: string): Promise<Chat> =>
    ipcRenderer.invoke('chats:create', projectPath),
  setActiveChat: (chatId: string): Promise<void> =>
    ipcRenderer.invoke('chats:set-active', chatId),
  deleteChat: (chatId: string): Promise<void> =>
    ipcRenderer.invoke('chats:delete', chatId),
  updateModel: (chatId: string, model: string): Promise<void> =>
    ipcRenderer.invoke('chats:update-model', { chatId, model }),
  setProjectPath: (chatId: string, projectPath: string): Promise<void> =>
    ipcRenderer.invoke('chats:set-project-path', { chatId, projectPath }),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:pick-folder'),
  send: (chatId: string, message: string): Promise<void> =>
    ipcRenderer.invoke('chat:send', { chatId, message }),
  stop: (chatId: string): Promise<void> => ipcRenderer.invoke('chat:stop', chatId),
  onClaudeEvent: (callback: (ev: ClaudeEvent) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, ev: ClaudeEvent): void => callback(ev)
    ipcRenderer.on('claude:event', listener)
    return () => {
      ipcRenderer.removeListener('claude:event', listener)
    }
  },
  onChatsUpdated: (callback: (state: AppState) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, state: AppState): void => callback(state)
    ipcRenderer.on('chats:updated', listener)
    return () => {
      ipcRenderer.removeListener('chats:updated', listener)
    }
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
