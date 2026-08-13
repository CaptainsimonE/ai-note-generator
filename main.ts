import { App, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, normalizePath, requestUrl } from "obsidian";

/** OpenAI 兼容 chat/completions 响应结构 */
interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

interface AINoteGenSettings {
  apiBase: string;
  apiKey: string;
  model: string;
  temperature: number;
  outputDir: string;
  contextChars: number;
  inheritTags: boolean;
  defaultTags: string;
  generateOnClick: boolean;
  enhanceOnContextMenu: boolean;
  autoClassify: boolean;
  profile: VaultProfile | null;
}

interface ClassifyRule {
  keywords: string[];
  path: string;
  tags: string[];
  reason?: string;
}

interface VaultProfile {
  summary: string;
  rules: ClassifyRule[];
  defaultPath: string;
  defaultTags: string[];
  generatedAt: string;
}

const DEFAULT_SETTINGS: AINoteGenSettings = {
  apiBase: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.3,
  outputDir: "",
  contextChars: 400,
  inheritTags: true,
  defaultTags: "知识库",
  generateOnClick: true,
  enhanceOnContextMenu: true,
  autoClassify: true,
  profile: null,
};

const SYS_PROMPT = `你是 Obsidian 知识库的词条撰写助手，为词条撰写一篇可直接写入 .md 文件的笔记，写作风格参照维基百科/百度百科的百科词条。

写作要求：
1. 以词条本身为中心，中立、客观、信息准确；采用百科结构：首段给出定义与核心信息，随后分小节展开背景、历史沿革、核心内容、影响与争议等。
2. **篇幅不受限制**——信息量越丰富越好，只要内容相关且准确，鼓励写长（500字以上同样欢迎），但不要注水、不要重复、不要凑字。
3. 全文独立成篇，脱离任何来源也能单独阅读；不要出现"本文词条""该词条出自"之类的元表述，不要设置"与来源笔记的关系"之类的独立小节。
4. 若词条与用户点击的来源笔记有关（如它是某作品/文档中的专名或历史背景），在**正文末尾**用 1~2 句流畅的过渡自然带出（例："……9世纪的城市风貌在游戏《XX》中亦有呈现"），不设标题、不分节。
5. 相关概念、人物、事件在正文中用 [[双链]] 自然嵌入（链接目标为词条名，若该专名是另一个词条的别名则用 [[目标笔记名|显示文字]]）；
6. 不要编造史实与人物；不确定处用"据记载/约"等措辞。`;

const ENHANCE_PROMPT = `你是 Obsidian 知识库的"交叉引用补写助手"。任务是判断目标词条笔记是否已包含与某来源笔记相关的表述；若没有，生成一句简短的关联描述。

规则：
1. 阅读目标词条「X」的现有内容，以及来源笔记《Y》中提及该词条的上下文；
2. 判断：目标词条正文是否已提到《Y》（或与《Y》同主题的作品/事件，如游戏名、书名、作品名等）？已提到则只输出 SKIP；
3. 若未提到，输出**一句话**（25~60 字，wiki 百科风格、自然流畅），补充该词条与《Y》的关联，例如："9世纪巴格达的繁华，在游戏《刺客信条：幻景》中有细致的艺术再现。" 或 "英格兰是《刺客信条：英灵殿》的主要舞台，游戏对9世纪英格兰的还原颇为考究。"；
4. 只输出 SKIP 或这一句话，禁止任何其他内容（不要引号、不要 markdown 围栏、不要解释）。`;

const PROFILE_PROMPT = `你是 Obsidian 知识库的"分类师"。用户会给你库的完整目录树（每行：目录路径 + md 文件数量 + 示例文件名）。
请理解这个库的组织逻辑（如 PARA 体系、按主题分文件夹、标签层级习惯），然后输出**唯一的 JSON 对象**（不要 markdown 围栏、不要解释），格式：
{
  "summary": "用一句话概括这个库的结构逻辑",
  "rules": [
    {
      "keywords": ["基督教", "神学", "三位一体", "教会"],
      "path": "必须来自上面目录树中真实存在的路径",
      "tags": ["基督教/概念"],
      "reason": "为什么这类词条放这里"
    }
  ],
  "defaultPath": "兜底路径（也必须是目录树中真实存在的路径）",
  "defaultTags": ["知识库"]
}
规则要求：
1. keywords 要覆盖：目录名、示例文件名、以及该主题必然相关的词（如"神学/教会/圣经/异端"）；
2. 每个主要主题文件夹至少一条规则；条数不限，尽量全面；
3. path 必须逐字取自目录树（不要拼接、不要改名）；
4. tags 遵循该库已有的层级标签风格（如"主题/类别"）；
5. **第一身份归档原则**：物理目录按词条的"第一身份"决定——教会内部人物（使徒/教父/圣徒/教皇/神学家/传教士）归宗教类目录；世俗人物（君主/政治家/思想家/科学家等）归历史类目录，即使他们在宗教史中很重要；当词条同时与其他主题相关时，在 tags 中追加"<主题>/关联"标签（如 基督教/关联），表示"跨主题相关、但物理位置在别处"。`;

export default class AINoteGeneratorPlugin extends Plugin {
  settings: AINoteGenSettings;
  /** 拦截防抖：避免捕获阶段与 workspace 事件重复弹窗 */
  private lastIntercept = 0;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new AINoteGenSettingTab(this.app, this));

    if (this.settings.generateOnClick) {
      // 第一道：document 捕获阶段拦截（早于 Obsidian 的冒泡处理，阻止创建空文件）
      this.registerDomEvent(document, "click", (evt: MouseEvent) => {
        this.interceptAtCapture(evt);
      }, true);
      // 第二道：document 冒泡阶段拦截（官方推荐，兼容部分场景）
      this.registerDomEvent(document, "click", (evt: MouseEvent) => {
        this.handleLinkClick(evt);
      });
      // 第三道（兜底）：即使前两道都失效，Obsidian 创建了 0 字节空文件，
      // 也会通过 vault.create 发现并弹窗 —— 保证用户一定能看到弹窗。
      this.registerEvent(
        this.app.vault.on("create", (file) => {
          if (file instanceof TFile && file.extension === "md" && file.stat.size === 0) {
            window.setTimeout(() => new EmptyFileModal(this, file).open(), 300);
          }
        })
      );
    }

    // 右键链接菜单：已创建链接 → 补充关联描述；未创建链接 → 生成词条
    if (this.settings.enhanceOnContextMenu) {
      this.registerDomEvent(document, "contextmenu", (evt: MouseEvent) => {
        this.handleContextMenu(evt);
      }, true);
    }

    this.addCommand({
      id: "generate-selected-note",
      name: "为选中的链接生成笔记",
      editorCallback: (editor) => {
        const sel = editor.getSelection();
        const m = sel.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
        if (!m) {
          new Notice("请先选中一个形如 [[词条名]] 的未创建链接");
          return;
        }
        new GenerateProgressModal(this, m[1].trim(), this.app.workspace.getActiveFile()?.path).open();
      },
    });

    this.addCommand({
      id: "generate-all-unresolved",
      name: "批量生成当前笔记的所有未创建链接",
      callback: () => void this.batchGenerate(),
    });

    this.addCommand({
      id: "analyze-vault",
      name: "分析并学习库结构（自动分类）",
      callback: () => void this.analyzeVault(),
    });
  }

  onunload() {}

  // ================= 点击拦截 =================

  /** 捕获阶段拦截：在 Obsidian 处理之前截住未创建链接的点击 */
  private interceptAtCapture(evt: MouseEvent) {
    if (!this.settings.generateOnClick) return;
    const t = evt.target as HTMLElement;
    const linkEl = t.closest<HTMLAnchorElement>("a.internal-link");
    if (!linkEl) return;
    const rawHref = linkEl.getAttribute("data-href") || "";
    const name = rawHref.split("#")[0].trim();
    if (!name) return;
    const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";
    if (this.app.metadataCache.getFirstLinkpathDest(name, sourcePath)) return; // 已存在，放行
    // 未创建：阻止事件继续传播（Obsidian 的冒泡 handler 收不到 → 不会创建空文件）
    evt.preventDefault();
    evt.stopPropagation();
    const now = Date.now();
    if (now - this.lastIntercept < 500) return; // 防抖
    this.lastIntercept = now;
    new GenerateProgressModal(this, name, sourcePath).open();
  }

  /**
   * 第二道拦截（workspace click 阶段）。
   * 判断依据不是 CSS 类，而是 metadataCache 查目标文件是否存在——
   * 兼容所有 Obsidian 版本与阅读/编辑视图，只要目标笔记不存在就拦截。
   */
  private handleLinkClick(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    const linkEl = target.closest<HTMLAnchorElement>("a.internal-link");
    if (!linkEl) return;
    const rawHref = linkEl.getAttribute("data-href") || "";
    const name = rawHref.split("#")[0].trim(); // 去掉可能的 # 锚点
    if (!name) return;
    const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";
    // 已存在的链接（含别名解析）不拦截
    const dest = this.app.metadataCache.getFirstLinkpathDest(name, sourcePath);
    if (dest) return;
    const now = Date.now();
    if (now - this.lastIntercept < 500) return; // 防抖（捕获阶段已弹过）
    this.lastIntercept = now;
    // 未创建：拦截默认行为，弹出生成进度
    evt.preventDefault();
    evt.stopPropagation();
    new GenerateProgressModal(this, name, sourcePath).open();
  }

  // ================= 右键链接菜单 =================

  /** 右键 internal-link：已创建 → 补充关联；未创建 → 生成词条 */
  private handleContextMenu(evt: MouseEvent) {
    const t = evt.target as HTMLElement;
    const linkEl = t.closest<HTMLAnchorElement>("a.internal-link");
    if (!linkEl) return;
    const rawHref = linkEl.getAttribute("data-href") || "";
    const name = rawHref.split("#")[0].trim();
    if (!name) return;
    const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";
    const dest = this.app.metadataCache.getFirstLinkpathDest(name, sourcePath);
    // 无论目标是否存在都接管右键菜单（在链接上），提供我们的操作
    evt.preventDefault();
    evt.stopPropagation();
    const menu = new Menu();
    if (dest) {
      menu.addItem((item) =>
        item
          .setTitle("用 AI 补充与当前笔记的关联")
          .setIcon("wand-2")
          .onClick(() => {
            void this.enhanceLinkNote(name, dest.path);
          })
      );
      menu.addItem((item) =>
        item
          .setTitle("打开笔记")
          .setIcon("open-elsewhere")
          .onClick(() => {
            void this.app.workspace.openLinkText(dest.path, "", false);
          })
      );
    } else {
      menu.addItem((item) =>
        item
          .setTitle("用 AI 生成词条笔记")
          .setIcon("wand-2")
          .onClick(() => {
            new GenerateProgressModal(this, name, sourcePath).open();
          })
      );
    }
    menu.showAtMouseEvent(evt);
  }

  /**
   * 关联补写：读取目标词条笔记，与当前笔记比较；
   * 若目标词条尚未提及当前笔记，则在末尾追加一句 wiki 风格的关联描述。
   */
  private async enhanceLinkNote(name: string, targetPath: string) {
    const targetFile = this.app.vault.getAbstractFileByPath(targetPath);
    if (!(targetFile instanceof TFile)) {
      new Notice("目标笔记不存在");
      return;
    }
    const sourceFile = this.app.workspace.getActiveFile();
    if (!sourceFile) {
      new Notice("未检测到当前笔记");
      return;
    }
    const modal = new EnhanceModal(this.app, name, sourceFile.basename);
    modal.open();
    try {
      modal.setStatus("正在读取笔记内容…");
      const targetText = await this.app.vault.read(targetFile);
      const context = await this.extractContext(sourceFile.path, name);

      // 快速本地检查：目标笔记是否已提到来源笔记名（避免重复追加）
      if (targetText.includes(sourceFile.basename)) {
        modal.setStatus(`「${name}」已包含与《${sourceFile.basename}》相关的表述，无需补充`);
        return;
      }

      modal.setStatus("正在请求 AI 判断…");
      const userMsg =
        `目标词条「${name}」现有内容：\n${targetText.slice(0, 1200)}\n\n` +
        `来源笔记《${sourceFile.basename}》中提及该词条的上下文：\n${context || "（无上下文摘录）"}\n\n` +
        `请判断并输出。`;
      const result = await this.requestChat(ENHANCE_PROMPT, userMsg);
      const sentence = (result ?? "").trim();
      if (!sentence || sentence.toUpperCase().startsWith("SKIP")) {
        modal.setStatus("AI 判断：已包含相关表述，无需补充");
        return;
      }
      // 清洗：去掉两端引号与 markdown 围栏
      const clean = sentence
        .replace(/```/g, "")
        .replace(/^["'\u201c\u2018\u300c]|["'\u201d\u2019\u300d]$/g, "")
        .trim();
      if (!clean) {
        modal.setStatus("AI 输出为空，未做修改");
        return;
      }
      modal.setStatus("正在写入补充描述…");
      await this.app.vault.process(targetFile, (data) => data.trimEnd() + "\n\n" + clean + "\n");
      modal.setStatus(`已向「${name}」末尾补充关联描述`);
      modal.setResultPath(targetPath);
    } catch (e) {
      modal.setStatus("失败：" + (e instanceof Error ? e.message : String(e)));
    }
  }

  // ================= 生成核心（带进度回调） =================

  /**
   * 带进度回调的生成流程，返回写入的文件路径（失败返回 null）。
   * onStatus 用于在弹窗/通知中展示当前步骤。
   */
  async generateWithProgress(
    name: string,
    sourcePath: string | undefined,
    onStatus: (s: string) => void
  ): Promise<string | null> {
    const safeName = name.replace(/[\\/:*?"<>|]/g, "").trim();
    if (!safeName) {
      onStatus("词条名无效");
      return null;
    }
    if (!this.settings.apiKey) {
      onStatus("未配置 API Key，请先在插件设置中填写");
      return null;
    }
    onStatus("① 提取链接上下文…");
    const context = await this.extractContext(sourcePath ?? "", name);
    onStatus(`② 请求 AI（${this.settings.model}）生成内容…`);
    const content = await this.callAI(name, context);
    if (!content) {
      onStatus("❌ AI 请求失败：请检查 API Key / 接口地址 / 网络");
      return null;
    }
    onStatus("③ 整理 frontmatter 与标签…");
    const final = await this.ensureFrontmatter(content, sourcePath, name, context);
    onStatus("④ 确定输出目录…");
    const dir = await this.resolveDir(sourcePath, name, context);
    const filePath = normalizePath(`${dir}/${safeName}.md`);
    const exists = await this.app.vault.adapter.exists(filePath);
    if (exists) {
      // 已存在：若非 0 字节空文件则跳过（不覆盖）；若是空文件（点击误建）则允许覆盖生成
      let size = -1;
      try {
        size = (await this.app.vault.adapter.stat(filePath))?.size ?? -1;
      } catch {
        /* ignore */
      }
      if (size !== 0) {
        onStatus("⚠️ 笔记已存在，跳过（不会覆盖）");
        return null;
      }
      onStatus("检测到 0 字节空文件，将用 AI 内容覆盖…");
    }
    onStatus("⑤ 写入文件…");
    await this.ensureDir(dir);
    await this.app.vault.adapter.write(filePath, final);
    onStatus(`✅ 已生成：${filePath}`);
    return filePath;
  }

  /** 无弹窗调用（批量模式用）：silent=true 时把状态输出到控制台而非通知 */
  async startGenerate(rawName: string, sourcePath?: string, silent = false): Promise<string | null> {
    const name = rawName.trim();
    return this.generateWithProgress(name, sourcePath, silent ? () => {} : (s) => new Notice(s));
  }

  async batchGenerate() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const text = await this.app.vault.read(file);
    const linkRe = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    const names = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(text)) !== null) {
      names.add(m[1].trim());
    }
    if (names.size === 0) {
      new Notice("当前笔记中没有链接");
      return;
    }
    new BatchProgressModal(this, [...names], file.path).open();
  }

  // ================= 自动分类 =================

  async scanVaultTree(maxFolders = 300): Promise<string[]> {
    const out: string[] = [];
    const walk = async (path: string) => {
      if (out.length >= maxFolders) return;
      let items: { files: string[]; folders: string[] };
      try {
        items = await this.app.vault.adapter.list(path);
      } catch {
        return;
      }
      const mdFiles = items.files.filter((f) => f.endsWith(".md"));
      const samples = mdFiles.slice(0, 3).map((f) => f.split("/").pop() ?? "");
      if (mdFiles.length > 0) {
        out.push(`${path === "" ? "/（库根）" : path}：${mdFiles.length}篇md${samples.length ? " | 示例: " + samples.join("、") : ""}`);
      }
      for (const folder of items.folders) {
        if (folder.startsWith(".")) continue;
        await walk(folder);
      }
    };
    await walk("");
    return out;
  }

  async analyzeVault(): Promise<boolean> {
    if (!this.settings.apiKey) {
      new Notice("请先在插件设置中填写 API Key");
      return false;
    }
    new Notice("⏳ 正在扫描并分析库结构…");
    const tree = await this.scanVaultTree();
    const raw = await this.requestChat(
      PROFILE_PROMPT,
      `我的库目录结构如下：\n${tree.join("\n")}\n\n请输出分类规则 JSON。`
    );
    const parsed = parseJSONLoose(raw ?? "");
    if (!parsed || !Array.isArray(parsed.rules)) {
      new Notice("分析失败：AI 返回的内容无法解析");
      return false;
    }
    const rawRules: unknown[] = parsed.rules;
    const rules: ClassifyRule[] = rawRules.filter(
      (r): r is ClassifyRule =>
        typeof r === "object" && r !== null &&
        typeof (r as ClassifyRule).path === "string" &&
        Array.isArray((r as ClassifyRule).keywords)
    );
    this.settings.profile = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      rules,
      defaultPath: typeof parsed.defaultPath === "string" ? parsed.defaultPath : "",
      defaultTags: Array.isArray(parsed.defaultTags) ? parsed.defaultTags.map(String) : [],
      generatedAt: new Date().toISOString().slice(0, 10),
    };
    await this.saveSettings();
    new Notice(`✅ 库结构已学习：${this.settings.profile.rules.length} 条分类规则`);
    return true;
  }

  private matchProfile(name: string, context: string): { path: string; tags: string[] } | null {
    const p = this.settings.profile;
    if (!p || !p.rules || p.rules.length === 0) return null;
    const text = `${name} ${context}`;
    for (const rule of p.rules) {
      if (rule.keywords.some((k) => text.includes(k))) {
        return { path: rule.path, tags: rule.tags.slice() };
      }
    }
    if (p.defaultPath) return { path: p.defaultPath, tags: p.defaultTags.slice() };
    return null;
  }

  // ================= 工具方法 =================

  public async resolveDir(sourcePath?: string, name = "", context = ""): Promise<string> {
    // 全自动模式：只认自动分类结果；未命中回退当前笔记所在目录（避免堆到库根）
    if (this.settings.autoClassify) {
      const hit = this.matchProfile(name, context);
      if (hit && (await this.pathExists(hit.path))) return normalizePath(hit.path);
      if (sourcePath) {
        const parts = sourcePath.split("/");
        parts.pop();
        return normalizePath(parts.join("/")) || "/";
      }
      return "";
    }
    // 手动模式（关闭自动分类时）
    if (this.settings.outputDir && this.settings.outputDir.trim()) {
      return normalizePath(this.settings.outputDir.trim());
    }
    if (sourcePath) {
      const parts = sourcePath.split("/");
      parts.pop();
      return normalizePath(parts.join("/")) || "/";
    }
    return "";
  }

  private async pathExists(path: string): Promise<boolean> {
    if (!path) return false;
    try {
      await this.app.vault.adapter.list(path);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDir(dir: string) {
    if (!dir || dir === "/") return;
    await this.app.vault.adapter.mkdir(dir);
  }

  private async extractContext(sourcePath: string, name: string): Promise<string> {
    if (!sourcePath) return "";
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof TFile)) return "";
    const text = await this.app.vault.read(file);
    const re = new RegExp(`\\[\\[[^\\]]*?\\|?${escapeRegExp(name)}\\s*\\]\\]`);
    const idx = text.search(re);
    if (idx < 0) return "";
    const half = Math.floor(this.settings.contextChars / 2);
    return text.slice(Math.max(0, idx - half), Math.min(text.length, idx + half));
  }

  private async callAI(name: string, context: string): Promise<string | null> {
    const userMsg =
      `词条名：${name}\n` +
      `来源笔记：${this.app.workspace.getActiveFile()?.name ?? "未知"}\n` +
      (context
        ? `上下文摘录（仅用于在正文末尾自然带出与该来源笔记的关系，正文主体请以词条本身为准）：\n${context}\n`
        : "") +
      `\n请为「${name}」撰写一篇百科风格的独立词条笔记。`;
    return this.requestChat(SYS_PROMPT, userMsg);
  }

  private async requestChat(system: string, user: string): Promise<string | null> {
    const base = this.settings.apiBase.replace(/\/+$/, "");
    try {
      const resp = await requestUrl({
        url: `${base}/chat/completions`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.apiKey}`,
        },
        body: JSON.stringify({
          model: this.settings.model,
          temperature: this.settings.temperature,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (resp.status < 200 || resp.status >= 300) {
        const errText = (resp.text ?? "").slice(0, 300);
        console.error("AI API error:", resp.status, errText);
        return null;
      }
      const data = JSON.parse(resp.text) as ChatCompletionResponse;
      const content: string | undefined = data.choices?.[0]?.message?.content;
      return content ? content.trim() : null;
    } catch (e) {
      console.error("AI API fetch error:", e);
      return null;
    }
  }

  /**
   * 规范化为标准 frontmatter（保证 Obsidian 一定能识别）：
   * - 剥离 AI 输出中的 HTML 标签（防止字体/颜色等样式污染笔记渲染）；
   * - 解析 AI 自带的 frontmatter，只吸收其中的 tags，其余一律按插件标准重写；
   * - 最终格式恒为：--- / tags 列表 / type / created / ---
   */
  private async ensureFrontmatter(content: string, sourcePath?: string, name = "", context = ""): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const tags = await this.collectTags(sourcePath, name, context);
    // 1) 清洗：去 markdown 代码围栏、去 HTML 标签
    let clean = content
      .replace(/```markdown|```md|```/g, "")
      .replace(/<[^>]*>/g, "");
    // 2) 若 AI 给了 frontmatter，只取其中的 tags，其余丢弃
    const fmMatch = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      parseTagsFromFm(fmMatch[1]).forEach((t) => {
        if (t && !tags.includes(t)) tags.push(t);
      });
      clean = clean.slice(fmMatch[0].length);
    }
    // 3) 去掉可能的首行标题（文件名即标题）
    clean = clean.replace(/^#\s+.+?\n+/, "").trim();
    // 4) 标准 frontmatter
    const fm =
      `---\n` +
      `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}\n` +
      `type: 概念\n` +
      `created: ${today}\n` +
      `---\n`;
    return fm + clean + "\n";
  }

  private async collectTags(sourcePath?: string, name = "", context = ""): Promise<string[]> {
    const tags: string[] = [];
    if (this.settings.autoClassify) {
      const hit = this.matchProfile(name, context);
      if (hit) hit.tags.forEach((t) => { if (!tags.includes(t)) tags.push(t); });
    }
    if (this.settings.inheritTags && sourcePath) {
      const file = this.app.vault.getAbstractFileByPath(sourcePath);
      if (file instanceof TFile) {
        const text = await this.app.vault.read(file);
        const m = text.match(/^---\r?\n(.*?)\r?\n---/s);
        if (m) {
          const tm = m[1].match(/^tags:\s*([\s\S]*?)(?=^\w+:|$)/m);
          if (tm) {
            tm[1].split("\n").forEach((line) => {
              const t = line.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, "").trim();
              if (t && !tags.includes(t)) tags.push(t);
            });
          }
        }
      }
    }
    (this.settings.defaultTags || "")
      .split(/[\s,，]+/)
      .filter(Boolean)
      .forEach((t) => {
        if (!tags.includes(t)) tags.push(t);
      });
    return tags.length ? tags : ["知识库"];
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** AI 返回的库画像原始结构（宽松校验用） */
interface VaultProfileRaw {
  summary?: unknown;
  rules?: unknown;
  defaultPath?: unknown;
  defaultTags?: unknown;
}

/** 从 AI 输出中容错提取 JSON */
function parseJSONLoose(s: string): VaultProfileRaw | null {
  let t = s.replace(/```json/gi, "").replace(/```/g, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** 解析 frontmatter 文本中的 tags（支持块列表 / 行内数组 / 单值字符串） */
function parseTagsFromFm(fmText: string): string[] {
  const out: string[] = [];
  const push = (t: string) => {
    const v = t.trim().replace(/^["']|["']$/g, "");
    if (v && !out.includes(v)) out.push(v);
  };
  // 块列表：tags:\n  - a\n  - b
  const block = fmText.match(/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m);
  if (block) {
    block[1].split("\n").forEach((line) => {
      const m = line.match(/^\s*-\s*(.+)$/);
      if (m) push(m[1]);
    });
    return out;
  }
  // 行内：tags: a, b / tags: [a, b] / tags: a
  const inline = fmText.match(/^tags:\s*(.+)$/m);
  if (inline) {
    inline[1]
      .replace(/[[\]"']/g, "")
      .split(/[,，]/)
      .forEach((t) => push(t));
  }
  return out;
}

// ================= 关联补写进度弹窗 =================
export class EnhanceModal extends Modal {
  private name: string;
  private sourceName: string;
  private statusEl!: HTMLElement;
  private resultPath: string | null = null;

  constructor(app: App, name: string, sourceName: string) {
    super(app);
    this.name = name;
    this.sourceName = sourceName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `为「${this.name}」补充与《${this.sourceName}》的关联` });
    this.statusEl = contentEl.createEl("p", { text: "准备中…", cls: "ai-note-gen-status" });
  }

  setStatus(s: string) {
    this.statusEl.setText(s);
  }

  setResultPath(p: string) {
    this.resultPath = p;
    const btn = this.contentEl.createEl("button", { text: "打开笔记" });
    btn.addEventListener("click", () => {
      if (this.resultPath) void this.app.workspace.openLinkText(this.resultPath, "", false);
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ================= 空文件检测弹窗（兜底机制） =================
export class EmptyFileModal extends Modal {
  private plugin: AINoteGeneratorPlugin;
  private file: TFile;

  constructor(plugin: AINoteGeneratorPlugin, file: TFile) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `检测到空笔记「${this.file.basename}」` });
    contentEl.createEl("p", {
      text: "这通常是因为点击了尚未创建的 [[双链]]，Obsidian 默认创建了空文件。是否用 AI 自动生成内容？生成后将删除空文件、按自动分类写入对应目录。",
    });
    const btnRow = contentEl.createDiv({ cls: "ai-note-gen-btns" });
    const btnGen = btnRow.createEl("button", { text: "用 AI 生成内容" });
    const btnKeep = btnRow.createEl("button", { text: "保留空文件" });
    btnGen.addEventListener("click", () => {
      this.close();
      void this.generate();
    });
    btnKeep.addEventListener("click", () => this.close());
  }

  private async generate() {
    // 上下文来源：优先用当前激活的笔记（用户点击链接时所处位置），
    // 这样自动分类能依据链接上下文命中"人物/国家"等细分目录。
    const activePath = this.app.workspace.getActiveFile()?.path;
    const source = activePath && activePath !== this.file.path ? activePath : this.file.path;
    // 先删除空文件，避免残留，也让生成流程直接新建到分类目录
    await this.app.vault.trash(this.file, true).catch(() => {});
    new GenerateProgressModal(this.plugin, this.file.basename, source).open();
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ================= 生成进度弹窗 =================
export class GenerateProgressModal extends Modal {
  private plugin: AINoteGeneratorPlugin;
  private name: string;
  private sourcePath: string | undefined;
  private statusEl!: HTMLElement;
  private openBtn!: HTMLButtonElement;
  private resultPath: string | null = null;
  private running = true;

  constructor(plugin: AINoteGeneratorPlugin, name: string, sourcePath: string | undefined) {
    super(plugin.app);
    this.plugin = plugin;
    this.name = name;
    this.sourcePath = sourcePath;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `为「${this.name}」生成笔记` });
    this.statusEl = contentEl.createDiv({ cls: "ai-note-gen-status" });
    const btnRow = contentEl.createDiv({ cls: "ai-note-gen-btns" });
    this.openBtn = btnRow.createEl("button", { text: "打开笔记", attr: { disabled: "true" } });
    const cancelBtn = btnRow.createEl("button", { text: "关闭" });
    this.openBtn.addEventListener("click", () => {
      if (this.resultPath) void this.openResult();
    });
    cancelBtn.addEventListener("click", () => {
      this.running = false;
      this.close();
    });
    void this.run();
  }

  private async openResult() {
    if (!this.resultPath) return;
    const file = this.app.vault.getAbstractFileByPath(this.resultPath);
    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    }
  }

  private async run() {
    const path = await this.plugin.generateWithProgress(this.name, this.sourcePath, (s) => {
      this.statusEl.setText(s);
    });
    if (!this.running) return;
    if (path) {
      this.resultPath = path;
      this.openBtn.removeAttribute("disabled");
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ================= 批量生成进度弹窗 =================
export class BatchProgressModal extends Modal {
  private plugin: AINoteGeneratorPlugin;
  private names: string[];
  private sourcePath: string;
  private statusEl!: HTMLElement;
  private cancelled = false;

  constructor(plugin: AINoteGeneratorPlugin, names: string[], sourcePath: string) {
    super(plugin.app);
    this.plugin = plugin;
    this.names = names;
    this.sourcePath = sourcePath;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "批量生成未创建链接笔记" });
    contentEl.createEl("p", { text: `共 ${this.names.length} 个链接。已存在的会自动跳过。` });
    this.statusEl = contentEl.createDiv({ cls: "ai-note-gen-status" });
    const cancelBtn = contentEl.createEl("button", { text: "停止" });
    cancelBtn.addEventListener("click", () => (this.cancelled = true));
    void this.run();
  }

  private async run() {
    let ok = 0;
    for (let i = 0; i < this.names.length; i++) {
      if (this.cancelled) break;
      const name = this.names[i];
      this.statusEl.setText(`[${i + 1}/${this.names.length}] ${name} …`);
      const path = await this.plugin.startGenerate(name, this.sourcePath, true);
      if (path) ok++;
      await sleep(300);
    }
    this.statusEl.setText(
      this.cancelled ? `已停止。完成 ${ok} 个。` : `完成：新增 ${ok} 个。`
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ================= 设置页 =================
class AINoteGenSettingTab extends PluginSettingTab {
  plugin: AINoteGeneratorPlugin;

  constructor(app: App, plugin: AINoteGeneratorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("AI 笔记生成器").setHeading();
    containerEl.createEl("p", {
      text: "点击未创建的 [[双链]] 时自动调用 AI 生成笔记。支持 OpenAI 兼容接口（DeepSeek / 通义 / Moonshot / OpenAI）。",
    });

    new Setting(containerEl)
      .setName("API 接口地址")
      .setDesc("示例：https://api.deepseek.com/v1、https://api.openai.com/v1、https://dashscope.aliyuncs.com/compatible-mode/v1")
      .addText((t) =>
        t.setPlaceholder("https://api.openai.com/v1").setValue(this.plugin.settings.apiBase).onChange(async (v) => {
          this.plugin.settings.apiBase = v.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("仅保存在本机 data.json，不会外传。")
      .addText((t) =>
        t
          .setPlaceholder("sk-…")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("模型")
      .setDesc("如 deepseek-chat、gpt-4o-mini、qwen-plus")
      .addText((t) =>
        t.setPlaceholder("gpt-4o-mini").setValue(this.plugin.settings.model).onChange(async (v) => {
          this.plugin.settings.model = v.trim() || "gpt-4o-mini";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("温度")
      .setDesc("越低越严谨（建议 0.2~0.5）")
      .addSlider((s) =>
        s
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.temperature)
          .onChange(async (v) => {
            this.plugin.settings.temperature = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("自动分类（推荐）").setHeading();
    containerEl.createEl("p", {
      text: "让 AI 读取并理解本地库结构（目录树 + 文件示例），学习出\"词条关键词 → 目录 + 标签\"的规则；生成笔记时自动归档并打标签，无需手填。",
    });

    new Setting(containerEl)
      .setName("启用自动分类")
      .setDesc("关闭后回退为手动设置：输出目录 + 继承标签")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoClassify).onChange(async (v) => {
          this.plugin.settings.autoClassify = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("分析并学习库结构")
      .setDesc("扫描全库目录（跳过隐藏目录），交给 AI 生成分类规则。库结构变化后可随时重新学习。")
      .addButton((b) =>
        b.setButtonText(this.plugin.settings.profile ? "重新学习" : "开始分析").onClick(async () => {
          b.setDisabled(true);
          b.setButtonText("分析中…");
          await this.plugin.analyzeVault();
          this.display();
        })
      );

    const p = this.plugin.settings.profile;
    if (p) {
      const info = containerEl.createDiv({ cls: "ai-note-gen-profile" });
      info.createEl("p", { text: `已学习（${p.generatedAt}）：${p.summary || "（无摘要）"}` });
      info.createEl("p", { text: `共 ${p.rules.length} 条规则，兜底目录：${p.defaultPath || "（无）"}` });
      const list = info.createEl("ul");
      p.rules.slice(0, 12).forEach((r) => {
        const li = list.createEl("li");
        li.setText(`${r.path} ← ${r.keywords.slice(0, 6).join("、")}${r.keywords.length > 6 ? "…" : ""}`);
      });
      if (p.rules.length > 12) info.createEl("p", { text: `…其余 ${p.rules.length - 12} 条略` });
    }

    new Setting(containerEl).setName("手动设置").setHeading();
    containerEl.createEl("p", {
      text: this.plugin.settings.autoClassify
        ? "✅ 全自动模式已开启：目录与标签由 AI 自动决定，无需手动设置（以下设置不生效）。若新增了主题文件夹，请点上方「重新学习」更新规则。"
        : "自动分类已关闭，以下手动设置生效。",
    });

    new Setting(containerEl)
      .setName("输出目录")
      .setDesc("相对库根的目录，留空 = 写入当前笔记所在目录。示例：30-Resources--兴趣、知识库，扁平化 + MOC/✝️基督教/06-概念与术语")
      .addText((t) =>
        t.setPlaceholder("留空则用当前笔记目录").setValue(this.plugin.settings.outputDir).onChange(async (v) => {
          this.plugin.settings.outputDir = v.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("上下文长度")
      .setDesc("从来源笔记链接前后提取的字符数，供 AI 参考（0 = 不提取）")
      .addSlider((s) =>
        s
          .setLimits(0, 2000, 50)
          .setValue(this.plugin.settings.contextChars)
          .onChange(async (v) => {
            this.plugin.settings.contextChars = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("继承来源笔记标签")
      .setDesc("生成时自动继承来源笔记 frontmatter 中的 tags")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.inheritTags).onChange(async (v) => {
          this.plugin.settings.inheritTags = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("默认标签")
      .setDesc("未继承时的兜底标签（空格分隔）")
      .addText((t) =>
        t.setPlaceholder("知识库").setValue(this.plugin.settings.defaultTags).onChange(async (v) => {
          this.plugin.settings.defaultTags = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("点击未创建链接时生成")
      .setDesc("关闭后仅通过命令触发（命令面板：为选中的链接生成笔记 / 批量生成所有未创建链接 / 分析并学习库结构）")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.generateOnClick).onChange(async (v) => {
          this.plugin.settings.generateOnClick = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("右键链接菜单（补充关联 / 生成词条）")
      .setDesc("右键已创建链接 →「用 AI 补充与当前笔记的关联」：AI 比较词条笔记与当前笔记，若词条尚未提及当前笔记，则在其末尾追加一句 wiki 风格的关联描述（不会重复追加）；右键未创建链接 →「用 AI 生成词条笔记」")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enhanceOnContextMenu).onChange(async (v) => {
          this.plugin.settings.enhanceOnContextMenu = v;
          await this.plugin.saveSettings();
        })
      );
  }
}

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}
