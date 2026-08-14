import type { Chat } from '@shared/types'
import ModelSelector from './ModelSelector'
import MessageList from './MessageList'
import Composer from './Composer'

interface Props {
  chat: Chat
  streamingText: string
  errorText: string
  isStreaming: boolean
  onSend: (text: string) => void
  onStop: () => void
  onModelChange: (model: string) => void
  onPickFolder: () => void
}

export default function ChatView({
  chat,
  streamingText,
  errorText,
  isStreaming,
  onSend,
  onStop,
  onModelChange,
  onPickFolder
}: Props): React.JSX.Element {
  return (
    <div className="chat-view">
      <header className="chat-header">
        <div className="chat-header-left">
          <ModelSelector model={chat.model} onChange={onModelChange} />
        </div>
        <div className="chat-header-right">
          <span className="project-path" title={chat.projectPath}>
            {chat.projectPath}
          </span>
          <button className="folder-btn small" onClick={onPickFolder}>
            Choose Folder
          </button>
        </div>
      </header>
      <MessageList
        messages={chat.messages}
        streamingText={streamingText}
        errorText={errorText}
        isStreaming={isStreaming}
      />
      <Composer
        isStreaming={isStreaming}
        disabled={false}
        onSend={onSend}
        onStop={onStop}
      />
    </div>
  )
}
