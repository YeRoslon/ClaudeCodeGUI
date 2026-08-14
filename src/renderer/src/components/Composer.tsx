import { useState } from 'react'
import { useI18n } from '../i18n'

interface Props {
  isStreaming: boolean
  disabled: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export default function Composer({
  isStreaming,
  disabled,
  onSend,
  onStop
}: Props): React.JSX.Element {
  const { t } = useI18n()
  const [text, setText] = useState('')

  const canSend = !disabled && !isStreaming && text.trim().length > 0

  const submit = (): void => {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="composer">
      <textarea
        className="composer-input"
        placeholder={t('composerPlaceholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={3}
      />
      {isStreaming ? (
        <button className="stop-btn" onClick={onStop} title={t('stop')}>
          {t('stop')}
        </button>
      ) : (
        <button className="send-btn" onClick={submit} disabled={!canSend}>
          {t('send')}
        </button>
      )}
    </div>
  )
}
