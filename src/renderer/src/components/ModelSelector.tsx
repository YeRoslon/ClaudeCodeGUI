import type { ModelConfig } from '@shared/types'

interface Props {
  model: string
  models: ModelConfig[]
  onChange: (model: string) => void
}

export default function ModelSelector({ model, models, onChange }: Props): React.JSX.Element {
  const validModel = models.some((m) => m.id === model) ? model : (models[0]?.id ?? '')
  return (
    <select
      className="model-select"
      value={validModel}
      onChange={(e) => onChange(e.target.value)}
      title="选择模型"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  )
}
