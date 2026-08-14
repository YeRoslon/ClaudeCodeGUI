import { useState } from 'react'
import type { ModelConfig } from '@shared/types'
import { useI18n } from '../i18n'

interface Props {
  models: ModelConfig[]
  onClose: () => void
  onSave: (models: ModelConfig[]) => Promise<void>
}

export default function SettingsModal({ models, onClose, onSave }: Props): React.JSX.Element {
  const { t } = useI18n()
  const [draft, setDraft] = useState<ModelConfig[]>(models.map((m) => ({ ...m })))
  const [saving, setSaving] = useState(false)

  const update = (index: number, patch: Partial<ModelConfig>): void => {
    setDraft((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  const add = (): void => {
    setDraft((prev) => [...prev, { id: '', model: '', label: '', baseUrl: '', authToken: '' }])
  }

  const remove = (index: number): void => {
    setDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const canSave = draft.some((m) => m.id.trim() && m.model.trim())

  const handleSave = async (): Promise<void> => {
    const cleaned = draft.map((m) => ({
      ...m,
      id: m.id.trim() || m.model.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }))
    setSaving(true)
    try {
      await onSave(cleaned)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{t('settingsTitle')}</h3>
        <p className="settings-hint">{t('settingsHint')}</p>
        <div className="settings-list">
          {draft.map((m, i) => (
            <div className="model-row" key={i}>
              <div className="model-row-head">
                <span className="model-row-index">{i + 1}</span>
                {m.builtin ? (
                  <span className="model-builtin">{t('builtinHint')}</span>
                ) : (
                  <button className="model-delete" onClick={() => remove(i)}>
                    {t('deleteModel')}
                  </button>
                )}
              </div>
              <input
                className="modal-input"
                placeholder={t('modelLabel')}
                value={m.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
              <input
                className="modal-input"
                placeholder={t('modelName')}
                value={m.model}
                onChange={(e) => update(i, { model: e.target.value })}
              />
              <input
                className="modal-input"
                placeholder={t('baseUrl')}
                value={m.baseUrl ?? ''}
                onChange={(e) => update(i, { baseUrl: e.target.value })}
              />
              <input
                className="modal-input"
                type="password"
                placeholder={t('apiKey')}
                value={m.authToken ?? ''}
                onChange={(e) => update(i, { authToken: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button className="btn-plain btn-add" onClick={add}>
          + {t('addModel')}
        </button>
        <div className="modal-actions">
          <button className="btn-plain" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn-accent" onClick={() => void handleSave()} disabled={!canSave || saving}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
