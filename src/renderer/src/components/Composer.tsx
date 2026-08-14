import { useState } from 'react'

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
        placeholder="Message Claude Code…（Enter 发送，Shift + Enter 换行）"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={3}
      />
      {isStreaming ? (
        <button className="stop-btn" onClick={onStop} title="停止生成">
          Stop
        </button>
      ) : (
        <button className="send-btn" onClick={submit} disabled={!canSend}>
          Send
        </button>
      )}
    </div>
  )
}
