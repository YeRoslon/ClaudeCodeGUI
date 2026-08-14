import type { Chat } from '@shared/types'
import { useI18n } from '../i18n'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  lastProjectPath: string | null
  onNewChat: () => void
  onSelect: (chatId: string) => void
  onDelete: (chatId: string) => void
  onPickGlobalFolder: () => void
  onOpenSettings: () => void
}

export default function Sidebar({
  chats,
  activeChatId,
  lastProjectPath,
  onNewChat,
  onSelect,
  onDelete,
  onPickGlobalFolder,
  onOpenSettings
}: Props): React.JSX.Element {
  const { t, lang, setLang } = useI18n()
  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        {t('newChat')}
      </button>
      <div className="chat-list">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
            onClick={() => onSelect(chat.id)}
          >
            <span className="chat-title">{chat.title}</span>
            <button
              className="chat-delete"
              title="删除聊天"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(chat.id)
              }}
            >
              ×
            </button>
          </div>
        ))}
        {chats.length === 0 && <div className="chat-empty">{t('noChats')}</div>}
      </div>
      <div className="sidebar-footer">
        <button className="folder-btn" onClick={onPickGlobalFolder} title={lastProjectPath ?? undefined}>
          <span className="folder-path">{lastProjectPath ?? t('chooseProjectFolder')}</span>
        </button>
        <button
          className="lang-btn"
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          title="切换语言 / Switch language"
        >
          {t('switchTo')}
        </button>
        <button className="lang-btn" onClick={onOpenSettings} title={t('settingsTitle')}>
          {t('settings')}
        </button>
      </div>
    </aside>
  )
}
