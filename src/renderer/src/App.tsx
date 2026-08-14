import { useEffect, useState } from 'react'
import type { AppState, ModelConfig } from '@shared/types'
import { useI18n } from './i18n'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import SettingsModal from './components/SettingsModal'

export default function App(): React.JSX.Element {
  const { t } = useI18n()
  const [state, setState] = useState<AppState>({
    chats: [],
    activeChatId: null,
    lastProjectPath: null
  })
  const [models, setModels] = useState<ModelConfig[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [streaming, setStreaming] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activeChat = state.chats.find((c) => c.id === state.activeChatId) ?? null

  useEffect(() => {
    void window.api.getState().then(setState)
    void window.api.getModels().then(setModels)
    const offEvents = window.api.onClaudeEvent((ev) => {
      switch (ev.type) {
        case 'text-delta':
          setStreaming((prev) => ({
            ...prev,
            [ev.chatId]: (prev[ev.chatId] ?? '') + ev.text
          }))
          break
        case 'session':
          // session id 通过 chats:updated 广播回写
          break
        case 'done':
          setStreaming((prev) => {
            const next = { ...prev }
            delete next[ev.chatId]
            return next
          })
          setErrors((prev) => {
            const next = { ...prev }
            delete next[ev.chatId]
            return next
          })
          break
        case 'error':
          setStreaming((prev) => {
            const next = { ...prev }
            delete next[ev.chatId]
            return next
          })
          setErrors((prev) => ({ ...prev, [ev.chatId]: ev.message }))
          break
      }
    })
    const offUpdated = window.api.onChatsUpdated(setState)
    return () => {
      offEvents()
      offUpdated()
    }
  }, [])

  const handleNewChat = async (): Promise<void> => {
    await window.api.createChat()
  }

  const handleSelect = async (chatId: string): Promise<void> => {
    if (chatId !== state.activeChatId) await window.api.setActiveChat(chatId)
  }

  const handleDelete = async (chatId: string): Promise<void> => {
    await window.api.deleteChat(chatId)
    setStreaming((prev) => {
      const next = { ...prev }
      delete next[chatId]
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[chatId]
      return next
    })
  }

  const handleSend = async (text: string): Promise<void> => {
    if (!activeChat) return
    setStreaming((prev) => ({ ...prev, [activeChat.id]: '' }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[activeChat.id]
      return next
    })
    await window.api.send(activeChat.id, text)
  }

  const handleStop = async (): Promise<void> => {
    if (!activeChat) return
    await window.api.stop(activeChat.id)
  }

  const handleModelChange = async (model: string): Promise<void> => {
    if (!activeChat) return
    await window.api.updateModel(activeChat.id, model)
  }

  const handlePickGlobalFolder = async (): Promise<void> => {
    await window.api.pickFolder()
  }

  const handleSaveModels = async (list: ModelConfig[]): Promise<void> => {
    const saved = await window.api.saveModels(list)
    setModels(saved)
    // 当前聊天选中的模型被删了，回退到第一个模型
    if (activeChat && !saved.some((m) => m.id === activeChat.model)) {
      const fallback = saved[0]
      if (fallback) await window.api.updateModel(activeChat.id, fallback.id)
    }
  }

  const isStreaming = activeChat ? streaming[activeChat.id] !== undefined : false
  const streamingText = activeChat ? (streaming[activeChat.id] ?? '') : ''
  const errorText = activeChat ? (errors[activeChat.id] ?? '') : ''

  return (
    <div className="app">
      <Sidebar
        chats={state.chats}
        activeChatId={state.activeChatId}
        lastProjectPath={state.lastProjectPath}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onPickGlobalFolder={handlePickGlobalFolder}
        onOpenSettings={() => setShowSettings(true)}
      />
      <main className="main">
        {activeChat ? (
          <ChatView
            chat={activeChat}
            models={models}
            streamingText={streamingText}
            errorText={errorText}
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={handleStop}
            onModelChange={handleModelChange}
          />
        ) : (
          <div className="empty">
            <h2>Claude Code GUI</h2>
            <p>{t('emptyHint')}</p>
          </div>
        )}
      </main>
      {showSettings && (
        <SettingsModal
          models={models}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveModels}
        />
      )}
    </div>
  )
}
