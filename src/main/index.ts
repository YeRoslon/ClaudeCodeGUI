import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { randomUUID } from 'crypto'
import { ClaudeRunner } from './claudeRunner'
import { Store } from './store'
import {
  DEFAULT_MODEL,
  DEFAULT_TITLE,
  type AppState,
  type Chat,
  type ClaudeEvent
} from '../shared/types'

let mainWindow: BrowserWindow | null = null
const store = new Store()
const runner = new ClaudeRunner()

function broadcastState(): void {
  mainWindow?.webContents.send('chats:updated', store.getState())
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 820,
    minHeight: 600,
    title: 'Claude Code GUI',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpcHandlers(): void {
  ipcMain.handle('chats:get-state', (): AppState => store.getState())

  ipcMain.handle('chats:create', async (_e, projectPath?: string): Promise<Chat> => {
    const state = store.getState()
    const path =
      projectPath && projectPath.trim().length > 0
        ? projectPath
        : (state.lastProjectPath ?? homedir())
    const chat: Chat = {
      id: randomUUID(),
      title: DEFAULT_TITLE,
      model: DEFAULT_MODEL,
      projectPath: path,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    }
    await store.addChat(chat)
    broadcastState()
    return chat
  })

  ipcMain.handle('chats:set-active', async (_e, chatId: string): Promise<void> => {
    await store.setActiveChat(chatId)
    broadcastState()
  })

  ipcMain.handle('chats:delete', async (_e, chatId: string): Promise<void> => {
    runner.stop(chatId)
    await store.deleteChat(chatId)
    broadcastState()
  })

  ipcMain.handle(
    'chats:update-model',
    async (_e, payload: { chatId: string; model: string }): Promise<void> => {
      await store.updateChat(payload.chatId, { model: payload.model })
      broadcastState()
    }
  )

  ipcMain.handle(
    'chats:set-project-path',
    async (_e, payload: { chatId: string; projectPath: string }): Promise<void> => {
      await store.setLastProjectPath(payload.projectPath)
      await store.updateChat(payload.chatId, { projectPath: payload.projectPath })
      broadcastState()
    }
  )

  ipcMain.handle('dialog:pick-folder', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '选择项目目录',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const dir = result.filePaths[0]
    await store.setLastProjectPath(dir)
    return dir
  })

  ipcMain.handle(
    'chat:send',
    async (_e, payload: { chatId: string; message: string }): Promise<void> => {
      const chat = store.getState().chats.find((c) => c.id === payload.chatId)
      if (!chat) throw new Error('聊天不存在')
      if (runner.isRunning(chat.id)) return

      const trimmed = payload.message.trim()
      if (!trimmed) return

      chat.messages.push({
        id: randomUUID(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now()
      })
      if (chat.title === DEFAULT_TITLE) {
        chat.title = trimmed.slice(0, 30)
      }
      await store.updateChat(chat.id, { messages: chat.messages, title: chat.title })
      broadcastState()

      runner.sendMessage({
        chatId: chat.id,
        message: trimmed,
        model: chat.model,
        projectPath: chat.projectPath,
        resumeSessionId: chat.claudeSessionId
      })
    }
  )

  ipcMain.handle('chat:stop', async (_e, chatId: string): Promise<void> => {
    runner.stop(chatId)
  })
}

function wireRunnerEvents(): void {
  runner.on('event', (ev: ClaudeEvent) => {
    mainWindow?.webContents.send('claude:event', ev)

    if (ev.type === 'session') {
      void store.updateChat(ev.chatId, { claudeSessionId: ev.sessionId }).then(() => {
        broadcastState()
      })
    } else if (ev.type === 'done') {
      const chat = store.getState().chats.find((c) => c.id === ev.chatId)
      if (!chat) return
      chat.messages.push({
        id: randomUUID(),
        role: 'assistant',
        content: ev.finalText ?? '',
        createdAt: Date.now()
      })
      void store.updateChat(ev.chatId, { messages: chat.messages }).then(() => {
        broadcastState()
      })
    }
  })
}

app.whenReady().then(async () => {
  await store.load()
  registerIpcHandlers()
  wireRunnerEvents()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  runner.stopAll()
})
