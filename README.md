# Dian Help 插件使用说明

## 作用

这个插件用于提供一个可配置的帮助指令。
用户发送帮助指令后，会收到当前所有已启用插件的指令列表。

## 安装

1. 在插件项目目录执行：

```bash
npm install
npm run pack
```

2. 生成安装包后，在 Dian 管理界面上传根目录下的 dian-help.zip。

3. 也可以手动解压到 Dian 的 plugins/dian-help 目录。

## 使用

默认触发词是 help。

用户发送：

```text
help
```

插件会返回当前可用指令列表。

## 配置

方式一：在插件 UI 页面修改触发词并保存。

方式二：调用接口修改。

接口前缀：/plugins/dian-help/api

- GET /config：读取当前配置
- POST /config：更新配置
- GET /commands：读取当前指令列表

更新触发词示例：

```bash
curl -X POST /plugins/dian-help/api/config \
  -H "Content-Type: application/json" \
  -d '{"command":"指令帮助"}'
```

## 常见问题

1. 发送 help 没有内容：确认其他插件已启用且已注册指令。
2. 修改后不生效：确认配置接口返回成功，或在 UI 里保存成功。
