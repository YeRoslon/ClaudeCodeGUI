import { MODEL_OPTIONS } from '@shared/types'

interface Props {
  model: string
  onChange: (model: string) => void
}

const LABELS: Record<string, string> = {
  sonnet: 'Sonnet',
  opus: 'Opus',
  haiku: 'Haiku'
}

export default function ModelSelector({ model, onChange }: Props): React.JSX.Element {
  return (
    <select
      className="model-select"
      value={model}
      onChange={(e) => onChange(e.target.value)}
      title="选择模型"
    >
      {MODEL_OPTIONS.map((m) => (
        <option key={m} value={m}>
          {LABELS[m] ?? m}
        </option>
      ))}
    </select>
  )
}
