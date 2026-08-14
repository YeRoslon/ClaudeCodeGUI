import type { Chat, ModelConfig } from '@shared/types'
import ModelSelector from './ModelSelector'
import MessageList from './MessageList'
import Composer from './Composer'

interface Props {
  chat: Chat
  models: ModelConfig[]
  streamingText: string
  errorText: string
  isStreaming: boolean
  onSend: (text: string) => void
  onStop: () => void
  onModelChange: (model: string) => void
}

export default function ChatView({
  chat,
  models,
  streamingText,
  errorText,
  isStreaming,
  onSend,
  onStop,
  onModelChange
}: Props): React.JSX.Element {
  return (
    <div className="chat-view">
      <header className="chat-header">
        <ModelSelector model={chat.model} models={models} onChange={onModelChange} />
      </header>
      <MessageList
        messages={chat.messages}
        streamingText={streamingText}
        errorText={errorText}
        isStreaming={isStreaming}
      />
      <Composer isStreaming={isStreaming} disabled={false} onSend={onSend} onStop={onStop} />
    </div>
  )
}
