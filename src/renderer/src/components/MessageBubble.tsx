import type { Message } from '@shared/types'
import { useI18n } from '../i18n'
import MarkdownContent from './MarkdownContent'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props): React.JSX.Element {
  const { t } = useI18n()
  const isUser = message.role === 'user'
  return (
    <div className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="msg-avatar">{isUser ? t('me') : t('claude')}</div>
      <div className="msg-bubble">
        <MarkdownContent text={message.content} />
      </div>
    </div>
  )
}
