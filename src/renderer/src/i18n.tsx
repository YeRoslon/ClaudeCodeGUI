import { createContext, useContext, useEffect, useState } from 'react'

export const LANGS = ['zh', 'en'] as const
export type Lang = (typeof LANGS)[number]

const zh = {
  newChat: '+ New Chat',
  noChats: '暂无聊天',
  chooseProjectFolder: '选择项目目录',
  composerPlaceholder: 'Message Claude Code…（Enter 发送，Shift + Enter 换行）',
  send: '发送',
  stop: '停止',
  emptyHint: '点击左上角 “+ New Chat” 开始对话',
  me: '我',
  claude: 'Claude',
  switchTo: 'English',
  settings: '设置',
  settingsTitle: '模型设置',
  settingsHint: '接口地址和 API Key 填了就用这里配的，不填则用电脑上的环境变量。',
  modelLabel: '显示名',
  modelName: '模型名',
  baseUrl: '接口地址',
  apiKey: 'API Key',
  addModel: '添加模型',
  save: '保存',
  cancel: '取消',
  deleteModel: '删除',
  builtinHint: '内置模型不可删除',
  modelRequired: '模型名和显示名不能为空'
}

const en: typeof zh = {
  newChat: '+ New Chat',
  noChats: 'No chats',
  chooseProjectFolder: 'Choose Project Folder',
  composerPlaceholder: 'Message Claude Code… (Enter to send, Shift+Enter for newline)',
  send: 'Send',
  stop: 'Stop',
  emptyHint: 'Click "+ New Chat" in the top-left to start',
  me: 'Me',
  claude: 'Claude',
  switchTo: '中文',
  settings: 'Settings',
  settingsTitle: 'Model Settings',
  settingsHint:
    'If you fill in the base URL and API key, they are used; otherwise the environment variables are used.',
  modelLabel: 'Label',
  modelName: 'Model',
  baseUrl: 'Base URL',
  apiKey: 'API Key',
  addModel: 'Add Model',
  save: 'Save',
  cancel: 'Cancel',
  deleteModel: 'Delete',
  builtinHint: 'Built-in models cannot be deleted',
  modelRequired: 'Model and label cannot be empty'
}

const dicts: Record<Lang, typeof zh> = { zh, en }

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: keyof typeof zh) => string
}

const I18nContext = createContext<I18nValue | null>(null)
const STORAGE_KEY = 'gui-lang'

export function LanguageProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'en' || saved === 'zh' ? saved : 'zh'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const setLang = (l: Lang): void => setLangState(l)
  const t = (key: keyof typeof zh): string => dicts[lang][key]

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
