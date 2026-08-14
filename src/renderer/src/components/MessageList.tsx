import { useEffect, useRef } from 'react'
import type { Message } from '@shared/types'
import { useI18n } from '../i18n'
import MessageBubble from './MessageBubble'
import MarkdownContent from './MarkdownContent'

interface Props {
  messages: Message[]
  streamingText: string
  errorText: string
  isStreaming: boolean
}

export default function MessageList({
  messages,
  streamingText,
  errorText,
  isStreaming
}: Props): React.JSX.Element {
  const { t } = useI18n()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, errorText])

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && (
        <div className="msg-row assistant">
          <div className="msg-avatar">{t('claude')}</div>
          <div className="msg-bubble streaming">
            {streamingText ? <MarkdownContent text={streamingText} /> : <span className="placeholder">…</span>}
            <span className="cursor" />
          </div>
        </div>
      )}
      {!isStreaming && errorText && (
        <div className="msg-row assistant">
          <div className="msg-avatar">{t('claude')}</div>
          <div className="msg-bubble error">{errorText}</div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
