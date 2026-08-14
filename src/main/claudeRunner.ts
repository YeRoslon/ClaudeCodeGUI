import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { EventEmitter } from 'events'
import type { ClaudeEvent } from '../shared/types'

export interface SendRequest {
  chatId: string
  message: string
  /** 实际传给 --model 的模型名（主进程已解析） */
  model: string
  projectPath: string
  resumeSessionId?: string
  /** 可选：覆盖 ANTHROPIC_BASE_URL（程序内配置） */
  baseUrl?: string
  /** 可选：覆盖 ANTHROPIC_AUTH_TOKEN（程序内配置） */
  authToken?: string
}

interface ActiveRun {
  chatId: string
  child: ChildProcessWithoutNullStreams
  buffer: string
  streamText: string
  finalText?: string
  manuallyStopped: boolean
  errorOccurred: boolean
}

interface StreamLine {
  type: string
  subtype?: string
  session_id?: string
  event?: { type?: string; delta?: { type?: string; text?: string } }
  result?: unknown
  is_error?: boolean
  error?: { message?: string }
}

/**
 * 封装本机 claude CLI。负责 spawn 子进程、解析 stream-json、
 * 提取文本增量、获取 session_id，并通过 'event' 事件向外界推送。
 */
export class ClaudeRunner extends EventEmitter {
  private readonly claudeBin: string
  private active = new Map<string, ActiveRun>()

  constructor() {
    super()
    this.claudeBin = this.resolveClaudeCommand()
  }

  sendMessage(req: SendRequest): void {
    // 同一聊天正在生成时，先取消旧的
    this.stop(req.chatId)

    const args: string[] = [
      '-p',
      '--model',
      req.model,
      '--output-format',
      'stream-json',
      '--verbose',
      '--include-partial-messages',
      // 只放开只读联网工具（查天气、搜资料），其余工具保持默认权限
      '--allowedTools',
      'WebSearch WebFetch'
    ]
    if (req.resumeSessionId) {
      args.push('--resume', req.resumeSessionId)
    }

    // 程序内配置的接口地址 / API Key 优先于环境变量；没配就继承进程环境
    const env: NodeJS.ProcessEnv = { ...process.env }
    if (req.baseUrl) env.ANTHROPIC_BASE_URL = req.baseUrl
    if (req.authToken) env.ANTHROPIC_AUTH_TOKEN = req.authToken

    const child = spawn(this.claudeBin, args, {
      cwd: req.projectPath,
      env,
      shell: false
    })

    // -p 模式下消息通过 stdin 传入（新版本 claude CLI 不接受命令行位置参数作为提示词）
    child.stdin.on('error', () => {})
    child.stdin.write(req.message)
    child.stdin.end()

    const run: ActiveRun = {
      chatId: req.chatId,
      child,
      buffer: '',
      streamText: '',
      manuallyStopped: false,
      errorOccurred: false
    }
    this.active.set(req.chatId, run)

    child.stdout.on('data', (chunk: Buffer) => {
      run.buffer += chunk.toString('utf-8')
      let idx: number
      while ((idx = run.buffer.indexOf('\n')) >= 0) {
        const line = run.buffer.slice(0, idx).trim()
        run.buffer = run.buffer.slice(idx + 1)
        if (line) this.handleLine(run, line)
      }
    })

    // --verbose 的日志输出到 stderr，丢弃即可（不处理会阻塞子进程）
    child.stderr.on('data', () => {})

    child.on('error', (err: NodeJS.ErrnoException) => {
      const notFound = err.code === 'ENOENT'
      this.emit('event', {
        type: 'error',
        chatId: req.chatId,
        message: notFound
          ? `找不到 claude CLI（${this.claudeBin}），请确认已安装并加入 PATH`
          : `无法启动 claude CLI: ${err.message}`
      } satisfies ClaudeEvent)
      this.active.delete(req.chatId)
    })

    child.on('close', () => {
      const cur = this.active.get(req.chatId)
      if (cur && !cur.manuallyStopped && !cur.errorOccurred) {
        this.emit('event', {
          type: 'done',
          chatId: req.chatId,
          finalText: cur.finalText ?? cur.streamText
        } satisfies ClaudeEvent)
      }
      this.active.delete(req.chatId)
    })
  }

  stop(chatId: string): void {
    const run = this.active.get(chatId)
    if (!run) return
    run.manuallyStopped = true
    try {
      run.child.kill()
    } catch {
      // 进程可能已退出
    }
    this.active.delete(chatId)
  }

  stopAll(): void {
    for (const chatId of Array.from(this.active.keys())) {
      this.stop(chatId)
    }
  }

  isRunning(chatId: string): boolean {
    return this.active.has(chatId)
  }

  private handleLine(run: ActiveRun, line: string): void {
    let data: StreamLine
    try {
      data = JSON.parse(line) as StreamLine
    } catch {
      return
    }

    switch (data.type) {
      case 'system':
        if (data.subtype === 'init' && data.session_id) {
          this.emit('event', {
            type: 'session',
            chatId: run.chatId,
            sessionId: data.session_id
          } satisfies ClaudeEvent)
        }
        break
      case 'stream_event':
        if (
          data.event?.type === 'content_block_delta' &&
          data.event.delta?.type === 'text_delta' &&
          data.event.delta.text
        ) {
          run.streamText += data.event.delta.text
          this.emit('event', {
            type: 'text-delta',
            chatId: run.chatId,
            text: data.event.delta.text
          } satisfies ClaudeEvent)
        }
        break
      case 'result':
        if (typeof data.result === 'string' && data.result.length > 0) {
          run.finalText = data.result
        }
        if (data.is_error) {
          run.errorOccurred = true
          this.emit('event', {
            type: 'error',
            chatId: run.chatId,
            message: data.error?.message ?? 'Claude 请求失败'
          } satisfies ClaudeEvent)
        }
        break
      case 'error':
        run.errorOccurred = true
        this.emit('event', {
          type: 'error',
          chatId: run.chatId,
          message: data.error?.message ?? 'Claude 返回错误'
        } satisfies ClaudeEvent)
        break
      default:
        break
    }
  }

  private resolveClaudeCommand(): string {
    const configured = process.env.CLAUDE_BIN
    if (configured && configured.trim()) return configured.trim()
    if (process.platform === 'win32') {
      // 优先使用 npm 全局安装的原生 claude.exe，避免 .cmd 经 cmd.exe 转发时的编码问题
      const npmCli = join(
        process.env.APPDATA ?? '',
        'npm',
        'node_modules',
        '@anthropic-ai',
        'claude-code',
        'bin',
        'claude.exe'
      )
      if (existsSync(npmCli)) return npmCli
      return 'claude.cmd'
    }
    return 'claude'
  }
}
