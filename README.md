# Robyn — 本地运行说明

项目已调整为本地开发模式：所有 JS 依赖现在通过 `npm` 安装并由 Vite 打包，样式使用本地 Tailwind 配置。

## 前提条件

- Node.js (建议 v18+)

## 快速运行

1. 安装依赖：

```powershell
npm install
```

2. （可选）在根目录创建 `.env` 或 `.env.local`，设置 `GEMINI_API_KEY` 用于 Gemini 调用：

```text
GEMINI_API_KEY=your_api_key_here
```

3. 启动开发服务器：

```powershell
npm run dev
```

4. 在浏览器打开 `http://localhost:5173`（Vite 默认端口）。

## 关于字体 & 资源

- 我已移除对 Google Fonts 与 CDN importmap 的直接引用，项目使用本地 `index.css`（包含 Tailwind 指令与回退字体）。
- 如果你想使用 Inter 字体的本地文件，请将字体文件放到 `public/assets/fonts` 并在 `index.css` 中引入。

如果需要，我可以帮你：
- 自动下载并加入 Inter 字体文件（需网络权限）
- 或者把所有远程图片/资产下载到 `public/assets` 并更新引用

---
如果你希望我现在替你执行 `npm install` 并启动开发服务器，请确认，我会在终端里运行这些命令。 
