import { useState, useEffect, useCallback, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react"

// ────────────────────────────────────────────────────────────────────────────
// 内联 shadcn 风格小组件
// ────────────────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-1 px-5 pt-4 pb-2 ${className}`}>{children}</div>
}

function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>
}

function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <label className={`text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </label>
  )
}

function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`flex h-9 w-full min-w-0 rounded-md border bg-input/30 px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  )
}

type ButtonVariant = "default" | "secondary" | "ghost"
function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    default:   "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-accent text-accent-foreground hover:bg-accent/80",
    ghost:     "hover:bg-accent hover:text-accent-foreground",
  }
  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  )
}

function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${className}`}>
      {children}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 类型
// ────────────────────────────────────────────────────────────────────────────

interface Config { command: string }

interface CommandMeta { name: string; pattern: string; description?: string }
interface PluginMeta {
  name: string
  description?: string
  icon?: string
  commands: CommandMeta[]
}

const PLUGIN_NAME = "dian-help"
const API = `/plugins/${PLUGIN_NAME}/api`

// ────────────────────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [config, setConfig]   = useState<Config | null>(null)
  const [plugins, setPlugins] = useState<PluginMeta[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [cmd, setCmd]         = useState("")
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const load = useCallback(async () => {
    try {
      const [cfgRes, pluginsRes] = await Promise.all([
        fetch(`${API}/config`).then((r) => r.json()) as Promise<{ config: Config }>,
        fetch(`${API}/commands`).then((r) => r.json()) as Promise<{ plugins: PluginMeta[] }>,
      ])
      setConfig(cfgRes.config)
      setPlugins(pluginsRes.plugins)
      setError(null)
      setCmd((prev) => prev || cfgRes.config.command)
    } catch {
      setError("无法连接到插件 API")
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [load])

  const save = async () => {
    if (!cmd.trim()) return
    setSaving(true)
    try {
      await fetch(`${API}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      })
      showToast("保存成功")
      load()
    } catch {
      showToast("保存失败", false)
    } finally {
      setSaving(false)
    }
  }

  // 所有命令总数
  const totalCommands = plugins.reduce((n, p) => n + p.commands.length, 0)

  return (
    <div className="min-h-screen p-5 flex flex-col gap-4">
      {/* ── 标题 ── */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border bg-card text-2xl shadow-sm">
          📖
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold leading-none">Dian Help</h1>
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              {config ? "运行中" : "加载中"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {error ?? (config
              ? <>触发指令 <span className="font-mono text-foreground">{config.command}</span>，当前共 {totalCommands} 条指令</>
              : "—")}
          </p>
        </div>
      </div>

      {/* ── 配置 ── */}
      <Card>
        <CardHeader>
          <Label>触发指令配置</Label>
          <p className="text-xs text-muted-foreground">用户发送该指令后将收到所有已注册指令列表，改后立即生效</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="help"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="max-w-xs"
            />
            <Button onClick={save} disabled={saving || !cmd.trim()}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 指令预览 ── */}
      <Card className="flex-1">
        <CardHeader>
          <Label>当前所有指令（发送 {config?.command ?? "help"} 后返回以下内容）</Label>
          <p className="text-xs text-muted-foreground">来自所有已启用插件，每 8 秒自动刷新</p>
        </CardHeader>
        <CardContent>
          {plugins.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无已注册的指令</p>
          ) : (
            <div className="flex flex-col gap-4">
              {plugins.map((p) => (
                <div key={p.name}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-base">{p.icon ?? "🔌"}</span>
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    {p.description && (
                      <span className="text-xs text-muted-foreground truncate">— {p.description}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 pl-1">
                    {p.commands.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <code className="shrink-0 font-mono text-xs text-sky-400">{c.pattern}</code>
                        {c.description && (
                          <span className="text-xs text-muted-foreground">{c.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 rounded-md border px-3 py-2 text-xs shadow-lg ${
            toast.ok
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-destructive/40 bg-destructive/15 text-destructive"
          }`}
        >
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  )
}
