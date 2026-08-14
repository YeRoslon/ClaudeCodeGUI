import type { Message } from '@shared/types'
import MarkdownContent from './MarkdownContent'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props): React.JSX.Element {
  const isUser = message.role === 'user'
  return (
    <div className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="msg-avatar">{isUser ? '我' : 'Claude'}</div>
      <div className="msg-bubble">
        <MarkdownContent text={message.content} />
      </div>
    </div>
  )
}
