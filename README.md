# AI Note Generator (ai-note-generator)

Generate note pages from unresolved `[[wikilinks]]` using AI — right inside Obsidian.

> 中文版说明在下方 / Full Chinese docs below.

---

## Why this plugin

In Obsidian, every `[[unresolved link]]` represents a note that **doesn't exist yet** — a gap in your knowledge base. Normally you have to stop what you're doing, manually create the page, and write it from scratch.

**AI Note Generator closes that gap instantly**: click an unresolved link (or select it and run a command), and an AI model writes the entry for you — formatted, classified, and placed in the right folder. You stay in flow; the knowledge base grows itself.

It is designed for **personal knowledge bases (PKM) that use wiki-style entries**: dictionaries, encyclopedic terms, historical figures, game/geography/reading notes, and any vault where each concept deserves its own page.

---

## Features

### 1. Click-to-generate
Click any unresolved `[[link]]` in a note → the plugin extracts context around the link, asks the AI, and creates the note page automatically.

- Handles the "dead click" case: Obsidian normally creates an empty file when you click an unresolved link — the plugin detects the empty file and offers to fill it with AI content.
- Context-aware: the AI receives the surrounding text of the link, so the generated note is consistent with your writing.

### 2. Batch generation
Generate notes for **all unresolved links** in the current note in one go — great for MOC (Map of Content) pages with many missing entries.

### 3. Auto classification (vault-aware)
The plugin can **learn your vault structure** (PARA folders, topic folders, tag conventions) and route each new note to the correct folder:

- Parses your folder tree and example file names
- Asks the AI to build a classification profile (keywords → path → tags)
- New notes are matched against the profile and written to the right place
- Falls back to the source note's folder or a configured default folder

### 4. Tag inheritance & frontmatter
Generated notes get proper YAML frontmatter:

- `tags`: inherited from the source note + profile rules + your default tags
- `type`: `概念` (concept) by default
- `created`: today's date
- Existing frontmatter in AI output is merged, duplicate tags are removed

### 5. OpenAI-compatible API
Works with **DeepSeek, Qwen (Tongyi), OpenAI**, or any endpoint implementing the `POST /chat/completions` protocol. Fully configurable: base URL, model, temperature.

### 6. Context-menu enhancement (optional)
Right-click a link and enhance an existing note with a related-sentence that connects it to the source note — keeps your graph coherent.

---

## Install

1. Download `main.js`, `manifest.json`, `styles.css` from the latest [release](https://github.com/CaptainsimonE/ai-note-generator/releases).
2. Create the folder and put the files in your vault:
   ```
   .obsidian/plugins/ai-note-generator/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```
3. Enable the plugin: Obsidian → Settings → Community plugins → **AI Note Generator** (may need to enable community plugins first).
4. Open plugin settings and fill in your `apiBase` and `apiKey`.

---

## Settings

| Option | Description | Default |
|--------|-------------|---------|
| `apiBase` | OpenAI-compatible endpoint, e.g. `https://api.deepseek.com` | OpenAI v1 |
| `apiKey` | Your API key — stored locally in `data.json`, never uploaded | — |
| `model` | Model name, e.g. `deepseek-chat`, `gpt-4o-mini` | `gpt-4o-mini` |
| `temperature` | Creativity (0 = strict, 1 = creative) | `0.3` |
| `outputDir` | Default folder for new notes (empty = auto classification) | — |
| `contextChars` | How much context around the link is sent to the AI (characters) | `400` |
| `inheritTags` | Inherit tags from the source note | On |
| `defaultTags` | Extra tags added to every generated note | `知识库` |
| `generateOnClick` | Auto-generate when clicking an unresolved link | On |
| `autoClassify` | Route new notes using the learned vault profile | On |

### Example data.json

Copy `data.example.json` from the repo into `.obsidian/plugins/ai-note-generator/data.json` and edit:

```json
{
  "apiBase": "https://api.deepseek.com",
  "apiKey": "sk-your-key-here",
  "model": "deepseek-chat",
  "temperature": 0.3,
  "outputDir": "",
  "contextChars": 400,
  "inheritTags": true,
  "defaultTags": "知识库",
  "generateOnClick": true,
  "autoClassify": true
}
```

---

## Usage examples

**Scenario 1 — Reading note with missing terms**
You write `《刺客信条》发生在[[9世纪的巴格达]]` and the link is unresolved. Click it → the plugin creates a full wiki entry for "9世纪的巴格达" and saves it to the geography/history folder per your vault profile.

**Scenario 2 — MOC with many missing entries**
A "基督教 MOC" page links to 50 unwritten concepts. Run the **batch generate** command → 50 notes are generated in sequence into their classified folders.

**Scenario 3 — Empty-file rescue**
You clicked an unresolved link earlier and Obsidian created an empty `巴格达.md`. Open any note, trigger the plugin — it detects the 0-byte file and offers to generate content into it.

---

## Commands

| Command | Action |
|---------|--------|
| 为选中的链接生成笔记 (Generate note for selected link) | Generates a note for the selected `[[link]]` in the editor |
| 批量生成未创建的链接 (Generate all unresolved links) | Batch-generates notes for every unresolved link in the current note |

---

## Privacy & safety

- The API key is stored **only** in your local `data.json` — it is never sent anywhere except the `apiBase` you configure.
- Only configure `apiBase` endpoints you trust (the key is sent as a Bearer token to that host).
- Generated content is written to your vault; existing non-empty notes are **never overwritten** (only 0-byte files may be replaced).

---

## FAQ

**Q: Which AI providers work?**
Any OpenAI-compatible chat-completions API: DeepSeek, Qwen/DashScope, OpenAI, Moonshot, Zhipu, or a self-hosted gateway like one-api.

**Q: Does it work on mobile?**
Yes — the plugin uses only web APIs and Obsidian APIs, no Node.js/Electron features. `isDesktopOnly: false`.

**Q: The AI wrote the note to the wrong folder.**
Edit the auto-classification profile (Settings → Learn vault structure → regenerate), or set a fixed `outputDir` and disable `autoClassify`.

**Q: Can it overwrite my existing notes?**
No. Existing notes with content are skipped and reported.

---

## License

MIT — free to use, modify, and distribute.

---

# AI 笔记生成器（中文说明）

Obsidian 插件：点击未创建的 `[[双链]]` 时，调用 AI 自动生成该词条的笔记页面，并自动分类写入对应目录。

## 它解决什么问题

Obsidian 里每个未创建的 `[[双链]]` 都是知识库的一块"空白"——以前你得停下来手动建页、从头写。这个插件让 AI 帮你瞬间补齐：点一下未创建的链接，AI 就按你的库规范生成词条、分好类、放对文件夹。

**适合**：个人知识库（PKM）中的百科式词条——历史人物、地理地名、游戏/读书笔记、概念条目等任何"一个概念一页"的场景。

## 核心功能

1. **点击生成**：点击未创建的双链 → 提取上下文 → AI 撰写词条 → 自动建页
2. **批量生成**：为当前笔记的所有未创建链接一键批量生成（MOC 索引页神器）
3. **自动分类**：学习你的库结构（PARA/主题文件夹/标签习惯），新笔记自动归位；可回退到源笔记所在文件夹或指定目录
4. **标签与 frontmatter**：自动生成 YAML（继承源笔记标签 + 规则标签 + 默认标签、type=概念、created=今天、去重合并）
5. **OpenAI 兼容**：支持 DeepSeek / 通义千问 / OpenAI 等任意兼容接口
6. **右键增强**（可选）：为已有笔记补一句与来源笔记的关联描述，保持图谱连贯

## 安装

1. 从 [Release](https://github.com/CaptainsimonE/ai-note-generator/releases) 下载 `main.js`、`manifest.json`、`styles.css`
2. 放入库目录：`.obsidian/plugins/ai-note-generator/`
3. 设置 → 第三方插件 → 启用「AI 笔记生成器」
4. 在插件设置里填 `apiBase` 和 `apiKey`

## 配置

| 配置 | 说明 | 默认 |
|------|------|------|
| `apiBase` | OpenAI 兼容接口地址 | OpenAI v1 |
| `apiKey` | API 密钥（仅存本地 data.json） | — |
| `model` | 模型名（deepseek-chat / gpt-4o-mini 等） | `gpt-4o-mini` |
| `temperature` | 创造性（0 严谨 / 1 发散） | `0.3` |
| `outputDir` | 固定输出目录（留空 = 自动分类） | — |
| `contextChars` | 发送给 AI 的上下文长度（字符） | `400` |
| `inheritTags` | 是否继承源笔记标签 | 开 |
| `defaultTags` | 每篇生成笔记附加的默认标签 | `知识库` |
| `generateOnClick` | 点击未创建链接时自动生成 | 开 |
| `autoClassify` | 按学习到的库画像自动分类 | 开 |

## 使用示例

- **读书笔记遇生词**：写下 `《刺客信条》发生在[[9世纪的巴格达]]`，点击链接 → 自动生成"9世纪的巴格达"百科词条并按画像归入地理/历史目录
- **MOC 批量补全**：基督教 MOC 挂了 50 个未创建词条 → 运行批量生成命令 → 逐个生成并分类归位
- **空文件救援**：以前点过的未创建链接留下了 0 字节空文件 → 插件检测到并询问是否用 AI 填充

## 命令

| 命令 | 作用 |
|------|------|
| 为选中的链接生成笔记 | 为编辑器中选中的 `[[链接]]` 生成笔记 |
| 批量生成未创建的链接 | 为当前笔记所有未创建链接批量生成 |

## 隐私与安全

- API Key 只存在本地 `data.json`，只发送给你配置的 `apiBase`
- 只填可信接口（Key 以 Bearer 形式发送到该地址）
- **绝不覆盖已有内容的笔记**（仅 0 字节空文件可被替换）

## 常见问题

**支持哪些模型？** 任何 OpenAI 兼容接口：DeepSeek、通义、OpenAI、月之暗面、智谱、one-api 网关等。

**手机能用吗？** 能。插件只用 Web API 和 Obsidian API，无 Node 依赖，`isDesktopOnly: false`。

**生成到错误目录了？** 重新学习库结构（设置里"学习库结构"），或关闭自动分类并固定 `outputDir`。

**会覆盖我的笔记吗？** 不会，已有内容的笔记会跳过并提示。

## 许可

MIT — 自由使用、修改、分发。
