# AI Note Generator (ai-note-generator)

Generate note pages from unresolved `[[wikilinks]]` using AI, right inside Obsidian.

> 中文说明见文末 / Chinese docs at the bottom.

## Features

- **Click to generate**: Click an unresolved `[[link]]` in your note, and the plugin calls an AI model to write that entry and create the note page.
- **Batch generation**: Generate notes for all unresolved links in the current note at once.
- **Auto classification**: Learns your vault structure (PARA or folder-based) and routes new notes to the right folder automatically.
- **Tag inheritance**: Inherits tags from the source note, with optional default tags.
- **OpenAI-compatible**: Works with DeepSeek, Qwen (Tongyi), OpenAI and any API that follows the `/chat/completions` format.

## Install

1. Download `main.js`, `manifest.json`, `styles.css` from the latest [release](https://github.com/CaptainsimonE/ai-note-generator/releases).
2. Put them into your vault: `.obsidian/plugins/ai-note-generator/`
3. Enable the plugin in Obsidian: Settings → Community plugins → AI Note Generator.

## Settings

| Option | Description |
|--------|-------------|
| `apiBase` | OpenAI-compatible endpoint, e.g. `https://api.deepseek.com` |
| `apiKey` | Your API key (stored locally in `data.json` only, never uploaded) |
| `model` | Model name, e.g. `deepseek-chat` |
| `outputDir` | Default output folder (leave empty to use auto classification) |
| `contextChars` | How much context around the link to send to the AI |
| `inheritTags` | Inherit tags from the source note |
| `generateOnClick` | Generate immediately when clicking an unresolved link |
| `autoClassify` | Route new notes by the learned vault profile |

See `data.example.json` — copy it to `data.json` and fill in your real API key.

## Usage tips

- Only link to APIs you trust — the key is sent to `apiBase` you configure.
- The plugin targets Chinese knowledge vaults (wiki-style Chinese notes by default).

## License

MIT

---

# AI 笔记生成器（中文说明）

Obsidian 插件：点击未创建的 `[[双链]]` 时，调用 AI 自动生成该词条的笔记页面，并写入指定目录。

## 功能

- **点击生成**：点击未创建的双链 → AI 自动撰写该词条并创建笔记
- **批量生成**：一键为当前笔记的所有未创建链接批量生成
- **自动分类**：学习你的库结构（PARA/主题文件夹），新笔记自动归入对应目录
- **标签继承**：继承源笔记标签，可附加默认标签
- **OpenAI 兼容**：支持 DeepSeek / 通义千问 / OpenAI 等

## 安装

1. 从 [Release](https://github.com/CaptainsimonE/ai-note-generator/releases) 下载 `main.js`、`manifest.json`、`styles.css`
2. 放入库目录：`.obsidian/plugins/ai-note-generator/`
3. 设置 → 第三方插件 → 启用「AI 笔记生成器」

## 配置

| 配置 | 说明 |
|------|------|
| `apiBase` | OpenAI 兼容接口地址，如 `https://api.deepseek.com` |
| `apiKey` | API 密钥（仅存本地 data.json，不会上传） |
| `model` | 模型名，如 `deepseek-chat` |
| `outputDir` | 输出目录（留空 = 自动分类归位） |
| `contextChars` | 发送给 AI 的上下文长度（字符） |
| `inheritTags` | 是否继承源笔记标签 |
| `generateOnClick` | 点击未创建链接时直接生成 |
| `autoClassify` | 按学习到的库画像自动分类 |

参考 `data.example.json`（复制为 `data.json` 后填入真实密钥）。

## 许可

MIT
