import type { Chat } from '@shared/types'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  lastProjectPath: string | null
  onNewChat: () => void
  onSelect: (chatId: string) => void
  onDelete: (chatId: string) => void
  onPickGlobalFolder: () => void
}

export default function Sidebar({
  chats,
  activeChatId,
  lastProjectPath,
  onNewChat,
  onSelect,
  onDelete,
  onPickGlobalFolder
}: Props): React.JSX.Element {
  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
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
        {chats.length === 0 && <div className="chat-empty">暂无聊天</div>}
      </div>
      <div className="sidebar-footer">
        <button className="folder-btn" onClick={onPickGlobalFolder}>
          <span className="folder-icon">📁</span>
          {lastProjectPath ? (
            <span className="folder-path" title={lastProjectPath}>
              {lastProjectPath}
            </span>
          ) : (
            <span>Choose Project Folder</span>
          )}
        </button>
      </div>
    </aside>
  )
}
