# AI 笔记生成器（ai-note-generator）

Obsidian 插件：点击未创建的 `[[双链]]` 时，调用 AI 自动生成该词条的笔记页面，并写入指定目录。支持 OpenAI 兼容接口（DeepSeek / 通义千问 / OpenAI 等）。

## 功能

- **点击生成**：在笔记中点击一个尚未创建的 `[[链接]]`，自动调用 AI 生成该词条内容并创建笔记
- **批量生成**：一键为当前笔记的所有未创建链接批量生成笔记
- **自动分类**：内置知识库画像（profile）与分类规则，AI 按规则把新笔记归入对应目录
- **标签继承**：可继承源笔记标签，也可附加默认标签

## 安装

1. 下载本仓库 `main.js`、`manifest.json`、`styles.css`
2. 放入 Obsidian 库目录：`.obsidian/plugins/ai-note-generator/`
3. Obsidian 设置 → 第三方插件 → 启用「AI 笔记生成器」

## 配置

插件设置项（对应 `data.json`）：

| 配置 | 说明 |
|------|------|
| `apiBase` | OpenAI 兼容接口地址，如 `https://api.deepseek.com` |
| `apiKey` | 你的 API 密钥（**仅保存在本地 data.json，不会上传**） |
| `model` | 模型名，如 `deepseek-chat` |
| `outputDir` | 新笔记写入目录（留空 = 按分类规则自动归位） |
| `contextChars` | 生成时参考的上下文长度（字符数） |
| `inheritTags` | 是否继承源笔记标签 |
| `generateOnClick` | 点击未创建链接时是否直接生成 |
| `autoClassify` | 是否按 profile 规则自动分类 |

参考示例：`data.example.json`（复制为 `data.json` 后填入真实密钥）。

## 许可

MIT
