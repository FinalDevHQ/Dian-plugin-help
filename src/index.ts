import "reflect-metadata";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Plugin,
  pluginManager,
  type PluginSetupContext,
} from "@dian/plugin-runtime";

// ── 配置 ──────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "config.json");

interface Config {
  /** 触发 help 的指令，默认 "help" */
  command: string;
}

const DEFAULTS: Config = { command: "help" };

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_PATH)) {
      return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Config };
    }
  } catch { /* 读取失败时使用默认值 */ }
  return { ...DEFAULTS };
}

function saveConfig(cfg: Config): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// ── 插件主体 ──────────────────────────────────────────────────────────────────

@Plugin({
  name: "dian-help",
  description: "发送可配置的 help 指令，列出所有已注册的指令",
  version: "1.0.0",
  author: "FinalDevHQ",
  icon: "📖",
})
export default class HelpPlugin {
  private config = loadConfig();

  onSetup(ctx: PluginSetupContext): void {
    // ── 注册 help 指令（函数 pattern，改配置立即生效）────────────────────
    ctx.command({
      name: this.config.command,
      pattern: () => this.config.command,
      description: "列出所有已注册的指令",
      handler: async (c) => {
        const lines: string[] = ["📖 指令列表："];

        for (const plugin of pluginManager.listPluginsMeta()) {
          if (!plugin.enabled) continue;
          if (plugin.commands.length === 0) continue;

          lines.push(`\n[${plugin.icon ?? "🔌"} ${plugin.name}]`);
          for (const cmd of plugin.commands) {
            const desc = cmd.description ? `  ${cmd.description}` : "";
            lines.push(`  ${cmd.pattern}${desc}`);
          }
        }

        if (lines.length === 1) {
          await c.reply("暂无已注册的指令。");
          return;
        }

        await c.reply(lines.join("\n"));
      },
    });

    // ── GET /plugins/dian-help/api/config ────────────────────────────────
    ctx.route("GET", "/config", (_req, reply) => {
      reply.send({ config: this.config });
    });

    // ── GET /plugins/dian-help/api/commands ──────────────────────────────
    // 服务端直接查询 pluginManager，返回所有已启用插件的指令列表
    // 避免 UI 在 iframe 上下文中跨端口 fetch /plugins 可能失败的问题
    ctx.route("GET", "/commands", (_req, reply) => {
      const plugins = pluginManager.listPluginsMeta()
        .filter((p) => p.enabled && p.commands.length > 0)
        .map((p) => ({
          name: p.name,
          description: p.description,
          icon: p.icon,
          commands: p.commands,
        }));
      reply.send({ plugins });
    });

    // ── POST /plugins/dian-help/api/config ───────────────────────────────
    ctx.route("POST", "/config", (req, reply) => {
      const body = req.body as Partial<Config>;
      if (typeof body.command === "string" && body.command.trim()) {
        this.config.command = body.command.trim();
        saveConfig(this.config);
      }
      reply.send({ ok: true, config: this.config });
    });

    // ── Web UI ───────────────────────────────────────────────────────────
    ctx.ui({ staticDir: "./public", entry: "index.html" });
  }
}
