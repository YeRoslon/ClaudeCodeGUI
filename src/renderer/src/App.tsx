import { useEffect, useState } from 'react'
import type { AppState } from '@shared/types'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'

export default function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({
    chats: [],
    activeChatId: null,
    lastProjectPath: null
  })
  const [streaming, setStreaming] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activeChat = state.chats.find((c) => c.id === state.activeChatId) ?? null

  useEffect(() => {
    void window.api.getState().then(setState)
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

  const handlePickFolder = async (): Promise<void> => {
    if (!activeChat) return
    const dir = await window.api.pickFolder()
    if (dir) await window.api.setProjectPath(activeChat.id, dir)
  }

  const handlePickGlobalFolder = async (): Promise<void> => {
    const dir = await window.api.pickFolder()
    if (dir) return
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
      />
      <main className="main">
        {activeChat ? (
          <ChatView
            chat={activeChat}
            streamingText={streamingText}
            errorText={errorText}
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={handleStop}
            onModelChange={handleModelChange}
            onPickFolder={handlePickFolder}
          />
        ) : (
          <div className="empty">
            <h2>Claude Code GUI</h2>
            <p>点击左上角 “+ New Chat” 开始对话</p>
          </div>
        )}
      </main>
    </div>
  )
}
