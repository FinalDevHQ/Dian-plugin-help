import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: false,
  // ⚠️ 注意：@dian/plugin-runtime 必须保持 external！
  // help 插件需要读取宿主进程的 pluginManager 单例（列出所有已注册指令）。
  // 如果把 runtime 打进 bundle，插件运行时会拿到自己 bundle 里的另一份空单例，
  // 永远列不出任何插件（这正是 "发送 help 没有任何指令" 的根因）。
  external: ["@dian/plugin-runtime"],
  // reflect-metadata 是幂等的全局 polyfill，打包进来无副作用，便于单文件分发。
  noExternal: ["reflect-metadata"],
  // UI 由 Vite 单独构建到 dist/public/，此处无需 cpSync
});
