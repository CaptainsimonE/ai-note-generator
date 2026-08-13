var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  BatchProgressModal: () => BatchProgressModal,
  EmptyFileModal: () => EmptyFileModal,
  EnhanceModal: () => EnhanceModal,
  GenerateProgressModal: () => GenerateProgressModal,
  default: () => AINoteGeneratorPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  apiBase: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.3,
  outputDir: "",
  contextChars: 400,
  inheritTags: true,
  defaultTags: "\u77E5\u8BC6\u5E93",
  generateOnClick: true,
  enhanceOnContextMenu: true,
  autoClassify: true,
  profile: null
};
var SYS_PROMPT = `\u4F60\u662F Obsidian \u77E5\u8BC6\u5E93\u7684\u8BCD\u6761\u64B0\u5199\u52A9\u624B\uFF0C\u4E3A\u8BCD\u6761\u64B0\u5199\u4E00\u7BC7\u53EF\u76F4\u63A5\u5199\u5165 .md \u6587\u4EF6\u7684\u7B14\u8BB0\uFF0C\u5199\u4F5C\u98CE\u683C\u53C2\u7167\u7EF4\u57FA\u767E\u79D1/\u767E\u5EA6\u767E\u79D1\u7684\u767E\u79D1\u8BCD\u6761\u3002

\u5199\u4F5C\u8981\u6C42\uFF1A
1. \u4EE5\u8BCD\u6761\u672C\u8EAB\u4E3A\u4E2D\u5FC3\uFF0C\u4E2D\u7ACB\u3001\u5BA2\u89C2\u3001\u4FE1\u606F\u51C6\u786E\uFF1B\u91C7\u7528\u767E\u79D1\u7ED3\u6784\uFF1A\u9996\u6BB5\u7ED9\u51FA\u5B9A\u4E49\u4E0E\u6838\u5FC3\u4FE1\u606F\uFF0C\u968F\u540E\u5206\u5C0F\u8282\u5C55\u5F00\u80CC\u666F\u3001\u5386\u53F2\u6CBF\u9769\u3001\u6838\u5FC3\u5185\u5BB9\u3001\u5F71\u54CD\u4E0E\u4E89\u8BAE\u7B49\u3002
2. **\u7BC7\u5E45\u4E0D\u53D7\u9650\u5236**\u2014\u2014\u4FE1\u606F\u91CF\u8D8A\u4E30\u5BCC\u8D8A\u597D\uFF0C\u53EA\u8981\u5185\u5BB9\u76F8\u5173\u4E14\u51C6\u786E\uFF0C\u9F13\u52B1\u5199\u957F\uFF08500\u5B57\u4EE5\u4E0A\u540C\u6837\u6B22\u8FCE\uFF09\uFF0C\u4F46\u4E0D\u8981\u6CE8\u6C34\u3001\u4E0D\u8981\u91CD\u590D\u3001\u4E0D\u8981\u51D1\u5B57\u3002
3. \u5168\u6587\u72EC\u7ACB\u6210\u7BC7\uFF0C\u8131\u79BB\u4EFB\u4F55\u6765\u6E90\u4E5F\u80FD\u5355\u72EC\u9605\u8BFB\uFF1B\u4E0D\u8981\u51FA\u73B0"\u672C\u6587\u8BCD\u6761""\u8BE5\u8BCD\u6761\u51FA\u81EA"\u4E4B\u7C7B\u7684\u5143\u8868\u8FF0\uFF0C\u4E0D\u8981\u8BBE\u7F6E"\u4E0E\u6765\u6E90\u7B14\u8BB0\u7684\u5173\u7CFB"\u4E4B\u7C7B\u7684\u72EC\u7ACB\u5C0F\u8282\u3002
4. \u82E5\u8BCD\u6761\u4E0E\u7528\u6237\u70B9\u51FB\u7684\u6765\u6E90\u7B14\u8BB0\u6709\u5173\uFF08\u5982\u5B83\u662F\u67D0\u4F5C\u54C1/\u6587\u6863\u4E2D\u7684\u4E13\u540D\u6216\u5386\u53F2\u80CC\u666F\uFF09\uFF0C\u5728**\u6B63\u6587\u672B\u5C3E**\u7528 1~2 \u53E5\u6D41\u7545\u7684\u8FC7\u6E21\u81EA\u7136\u5E26\u51FA\uFF08\u4F8B\uFF1A"\u2026\u20269\u4E16\u7EAA\u7684\u57CE\u5E02\u98CE\u8C8C\u5728\u6E38\u620F\u300AXX\u300B\u4E2D\u4EA6\u6709\u5448\u73B0"\uFF09\uFF0C\u4E0D\u8BBE\u6807\u9898\u3001\u4E0D\u5206\u8282\u3002
5. \u76F8\u5173\u6982\u5FF5\u3001\u4EBA\u7269\u3001\u4E8B\u4EF6\u5728\u6B63\u6587\u4E2D\u7528 [[\u53CC\u94FE]] \u81EA\u7136\u5D4C\u5165\uFF08\u94FE\u63A5\u76EE\u6807\u4E3A\u8BCD\u6761\u540D\uFF0C\u82E5\u8BE5\u4E13\u540D\u662F\u53E6\u4E00\u4E2A\u8BCD\u6761\u7684\u522B\u540D\u5219\u7528 [[\u76EE\u6807\u7B14\u8BB0\u540D|\u663E\u793A\u6587\u5B57]]\uFF09\uFF1B
6. \u4E0D\u8981\u7F16\u9020\u53F2\u5B9E\u4E0E\u4EBA\u7269\uFF1B\u4E0D\u786E\u5B9A\u5904\u7528"\u636E\u8BB0\u8F7D/\u7EA6"\u7B49\u63AA\u8F9E\u3002`;
var ENHANCE_PROMPT = `\u4F60\u662F Obsidian \u77E5\u8BC6\u5E93\u7684"\u4EA4\u53C9\u5F15\u7528\u8865\u5199\u52A9\u624B"\u3002\u4EFB\u52A1\u662F\u5224\u65AD\u76EE\u6807\u8BCD\u6761\u7B14\u8BB0\u662F\u5426\u5DF2\u5305\u542B\u4E0E\u67D0\u6765\u6E90\u7B14\u8BB0\u76F8\u5173\u7684\u8868\u8FF0\uFF1B\u82E5\u6CA1\u6709\uFF0C\u751F\u6210\u4E00\u53E5\u7B80\u77ED\u7684\u5173\u8054\u63CF\u8FF0\u3002

\u89C4\u5219\uFF1A
1. \u9605\u8BFB\u76EE\u6807\u8BCD\u6761\u300CX\u300D\u7684\u73B0\u6709\u5185\u5BB9\uFF0C\u4EE5\u53CA\u6765\u6E90\u7B14\u8BB0\u300AY\u300B\u4E2D\u63D0\u53CA\u8BE5\u8BCD\u6761\u7684\u4E0A\u4E0B\u6587\uFF1B
2. \u5224\u65AD\uFF1A\u76EE\u6807\u8BCD\u6761\u6B63\u6587\u662F\u5426\u5DF2\u63D0\u5230\u300AY\u300B\uFF08\u6216\u4E0E\u300AY\u300B\u540C\u4E3B\u9898\u7684\u4F5C\u54C1/\u4E8B\u4EF6\uFF0C\u5982\u6E38\u620F\u540D\u3001\u4E66\u540D\u3001\u4F5C\u54C1\u540D\u7B49\uFF09\uFF1F\u5DF2\u63D0\u5230\u5219\u53EA\u8F93\u51FA SKIP\uFF1B
3. \u82E5\u672A\u63D0\u5230\uFF0C\u8F93\u51FA**\u4E00\u53E5\u8BDD**\uFF0825~60 \u5B57\uFF0Cwiki \u767E\u79D1\u98CE\u683C\u3001\u81EA\u7136\u6D41\u7545\uFF09\uFF0C\u8865\u5145\u8BE5\u8BCD\u6761\u4E0E\u300AY\u300B\u7684\u5173\u8054\uFF0C\u4F8B\u5982\uFF1A"9\u4E16\u7EAA\u5DF4\u683C\u8FBE\u7684\u7E41\u534E\uFF0C\u5728\u6E38\u620F\u300A\u523A\u5BA2\u4FE1\u6761\uFF1A\u5E7B\u666F\u300B\u4E2D\u6709\u7EC6\u81F4\u7684\u827A\u672F\u518D\u73B0\u3002" \u6216 "\u82F1\u683C\u5170\u662F\u300A\u523A\u5BA2\u4FE1\u6761\uFF1A\u82F1\u7075\u6BBF\u300B\u7684\u4E3B\u8981\u821E\u53F0\uFF0C\u6E38\u620F\u5BF99\u4E16\u7EAA\u82F1\u683C\u5170\u7684\u8FD8\u539F\u9887\u4E3A\u8003\u7A76\u3002"\uFF1B
4. \u53EA\u8F93\u51FA SKIP \u6216\u8FD9\u4E00\u53E5\u8BDD\uFF0C\u7981\u6B62\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\uFF08\u4E0D\u8981\u5F15\u53F7\u3001\u4E0D\u8981 markdown \u56F4\u680F\u3001\u4E0D\u8981\u89E3\u91CA\uFF09\u3002`;
var PROFILE_PROMPT = `\u4F60\u662F Obsidian \u77E5\u8BC6\u5E93\u7684"\u5206\u7C7B\u5E08"\u3002\u7528\u6237\u4F1A\u7ED9\u4F60\u5E93\u7684\u5B8C\u6574\u76EE\u5F55\u6811\uFF08\u6BCF\u884C\uFF1A\u76EE\u5F55\u8DEF\u5F84 + md \u6587\u4EF6\u6570\u91CF + \u793A\u4F8B\u6587\u4EF6\u540D\uFF09\u3002
\u8BF7\u7406\u89E3\u8FD9\u4E2A\u5E93\u7684\u7EC4\u7EC7\u903B\u8F91\uFF08\u5982 PARA \u4F53\u7CFB\u3001\u6309\u4E3B\u9898\u5206\u6587\u4EF6\u5939\u3001\u6807\u7B7E\u5C42\u7EA7\u4E60\u60EF\uFF09\uFF0C\u7136\u540E\u8F93\u51FA**\u552F\u4E00\u7684 JSON \u5BF9\u8C61**\uFF08\u4E0D\u8981 markdown \u56F4\u680F\u3001\u4E0D\u8981\u89E3\u91CA\uFF09\uFF0C\u683C\u5F0F\uFF1A
{
  "summary": "\u7528\u4E00\u53E5\u8BDD\u6982\u62EC\u8FD9\u4E2A\u5E93\u7684\u7ED3\u6784\u903B\u8F91",
  "rules": [
    {
      "keywords": ["\u57FA\u7763\u6559", "\u795E\u5B66", "\u4E09\u4F4D\u4E00\u4F53", "\u6559\u4F1A"],
      "path": "\u5FC5\u987B\u6765\u81EA\u4E0A\u9762\u76EE\u5F55\u6811\u4E2D\u771F\u5B9E\u5B58\u5728\u7684\u8DEF\u5F84",
      "tags": ["\u57FA\u7763\u6559/\u6982\u5FF5"],
      "reason": "\u4E3A\u4EC0\u4E48\u8FD9\u7C7B\u8BCD\u6761\u653E\u8FD9\u91CC"
    }
  ],
  "defaultPath": "\u515C\u5E95\u8DEF\u5F84\uFF08\u4E5F\u5FC5\u987B\u662F\u76EE\u5F55\u6811\u4E2D\u771F\u5B9E\u5B58\u5728\u7684\u8DEF\u5F84\uFF09",
  "defaultTags": ["\u77E5\u8BC6\u5E93"]
}
\u89C4\u5219\u8981\u6C42\uFF1A
1. keywords \u8981\u8986\u76D6\uFF1A\u76EE\u5F55\u540D\u3001\u793A\u4F8B\u6587\u4EF6\u540D\u3001\u4EE5\u53CA\u8BE5\u4E3B\u9898\u5FC5\u7136\u76F8\u5173\u7684\u8BCD\uFF08\u5982"\u795E\u5B66/\u6559\u4F1A/\u5723\u7ECF/\u5F02\u7AEF"\uFF09\uFF1B
2. \u6BCF\u4E2A\u4E3B\u8981\u4E3B\u9898\u6587\u4EF6\u5939\u81F3\u5C11\u4E00\u6761\u89C4\u5219\uFF1B\u6761\u6570\u4E0D\u9650\uFF0C\u5C3D\u91CF\u5168\u9762\uFF1B
3. path \u5FC5\u987B\u9010\u5B57\u53D6\u81EA\u76EE\u5F55\u6811\uFF08\u4E0D\u8981\u62FC\u63A5\u3001\u4E0D\u8981\u6539\u540D\uFF09\uFF1B
4. tags \u9075\u5FAA\u8BE5\u5E93\u5DF2\u6709\u7684\u5C42\u7EA7\u6807\u7B7E\u98CE\u683C\uFF08\u5982"\u4E3B\u9898/\u7C7B\u522B"\uFF09\uFF1B
5. **\u7B2C\u4E00\u8EAB\u4EFD\u5F52\u6863\u539F\u5219**\uFF1A\u7269\u7406\u76EE\u5F55\u6309\u8BCD\u6761\u7684"\u7B2C\u4E00\u8EAB\u4EFD"\u51B3\u5B9A\u2014\u2014\u6559\u4F1A\u5185\u90E8\u4EBA\u7269\uFF08\u4F7F\u5F92/\u6559\u7236/\u5723\u5F92/\u6559\u7687/\u795E\u5B66\u5BB6/\u4F20\u6559\u58EB\uFF09\u5F52\u5B97\u6559\u7C7B\u76EE\u5F55\uFF1B\u4E16\u4FD7\u4EBA\u7269\uFF08\u541B\u4E3B/\u653F\u6CBB\u5BB6/\u601D\u60F3\u5BB6/\u79D1\u5B66\u5BB6\u7B49\uFF09\u5F52\u5386\u53F2\u7C7B\u76EE\u5F55\uFF0C\u5373\u4F7F\u4ED6\u4EEC\u5728\u5B97\u6559\u53F2\u4E2D\u5F88\u91CD\u8981\uFF1B\u5F53\u8BCD\u6761\u540C\u65F6\u4E0E\u5176\u4ED6\u4E3B\u9898\u76F8\u5173\u65F6\uFF0C\u5728 tags \u4E2D\u8FFD\u52A0"<\u4E3B\u9898>/\u5173\u8054"\u6807\u7B7E\uFF08\u5982 \u57FA\u7763\u6559/\u5173\u8054\uFF09\uFF0C\u8868\u793A"\u8DE8\u4E3B\u9898\u76F8\u5173\u3001\u4F46\u7269\u7406\u4F4D\u7F6E\u5728\u522B\u5904"\u3002`;
var AINoteGeneratorPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    /** 拦截防抖：避免捕获阶段与 workspace 事件重复弹窗 */
    this.lastIntercept = 0;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new AINoteGenSettingTab(this.app, this));
    if (this.settings.generateOnClick) {
      this.registerDomEvent(document, "click", (evt) => {
        this.interceptAtCapture(evt);
      }, true);
      this.registerDomEvent(document, "click", (evt) => {
        this.handleLinkClick(evt);
      });
      this.registerEvent(
        this.app.vault.on("create", (file) => {
          if (file instanceof import_obsidian.TFile && file.extension === "md" && file.stat.size === 0) {
            window.setTimeout(() => new EmptyFileModal(this, file).open(), 300);
          }
        })
      );
    }
    if (this.settings.enhanceOnContextMenu) {
      this.registerDomEvent(document, "contextmenu", (evt) => {
        this.handleContextMenu(evt);
      }, true);
    }
    this.addCommand({
      id: "generate-selected-note",
      name: "\u4E3A\u9009\u4E2D\u7684\u94FE\u63A5\u751F\u6210\u7B14\u8BB0",
      editorCallback: (editor) => {
        var _a;
        const sel = editor.getSelection();
        const m = sel.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
        if (!m) {
          new import_obsidian.Notice("\u8BF7\u5148\u9009\u4E2D\u4E00\u4E2A\u5F62\u5982 [[\u8BCD\u6761\u540D]] \u7684\u672A\u521B\u5EFA\u94FE\u63A5");
          return;
        }
        new GenerateProgressModal(this, m[1].trim(), (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path).open();
      }
    });
    this.addCommand({
      id: "generate-all-unresolved",
      name: "\u6279\u91CF\u751F\u6210\u5F53\u524D\u7B14\u8BB0\u7684\u6240\u6709\u672A\u521B\u5EFA\u94FE\u63A5",
      callback: () => void this.batchGenerate()
    });
    this.addCommand({
      id: "analyze-vault",
      name: "\u5206\u6790\u5E76\u5B66\u4E60\u5E93\u7ED3\u6784\uFF08\u81EA\u52A8\u5206\u7C7B\uFF09",
      callback: () => void this.analyzeVault()
    });
  }
  onunload() {
  }
  // ================= 点击拦截 =================
  /** 捕获阶段拦截：在 Obsidian 处理之前截住未创建链接的点击 */
  interceptAtCapture(evt) {
    var _a, _b;
    if (!this.settings.generateOnClick)
      return;
    const t = evt.target;
    const linkEl = t.closest("a.internal-link");
    if (!linkEl)
      return;
    const rawHref = linkEl.getAttribute("data-href") || "";
    const name = rawHref.split("#")[0].trim();
    if (!name)
      return;
    const sourcePath = (_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : "";
    if (this.app.metadataCache.getFirstLinkpathDest(name, sourcePath))
      return;
    evt.preventDefault();
    evt.stopPropagation();
    const now = Date.now();
    if (now - this.lastIntercept < 500)
      return;
    this.lastIntercept = now;
    new GenerateProgressModal(this, name, sourcePath).open();
  }
  /**
   * 第二道拦截（workspace click 阶段）。
   * 判断依据不是 CSS 类，而是 metadataCache 查目标文件是否存在——
   * 兼容所有 Obsidian 版本与阅读/编辑视图，只要目标笔记不存在就拦截。
   */
  handleLinkClick(evt) {
    var _a, _b;
    const target = evt.target;
    const linkEl = target.closest("a.internal-link");
    if (!linkEl)
      return;
    const rawHref = linkEl.getAttribute("data-href") || "";
    const name = rawHref.split("#")[0].trim();
    if (!name)
      return;
    const sourcePath = (_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : "";
    const dest = this.app.metadataCache.getFirstLinkpathDest(name, sourcePath);
    if (dest)
      return;
    const now = Date.now();
    if (now - this.lastIntercept < 500)
      return;
    this.lastIntercept = now;
    evt.preventDefault();
    evt.stopPropagation();
    new GenerateProgressModal(this, name, sourcePath).open();
  }
  // ================= 右键链接菜单 =================
  /** 右键 internal-link：已创建 → 补充关联；未创建 → 生成词条 */
  handleContextMenu(evt) {
    var _a, _b;
    const t = evt.target;
    const linkEl = t.closest("a.internal-link");
    if (!linkEl)
      return;
    const rawHref = linkEl.getAttribute("data-href") || "";
    const name = rawHref.split("#")[0].trim();
    if (!name)
      return;
    const sourcePath = (_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : "";
    const dest = this.app.metadataCache.getFirstLinkpathDest(name, sourcePath);
    evt.preventDefault();
    evt.stopPropagation();
    const menu = new import_obsidian.Menu();
    if (dest) {
      menu.addItem(
        (item) => item.setTitle("\u7528 AI \u8865\u5145\u4E0E\u5F53\u524D\u7B14\u8BB0\u7684\u5173\u8054").setIcon("wand-2").onClick(() => {
          void this.enhanceLinkNote(name, dest.path);
        })
      );
      menu.addItem(
        (item) => item.setTitle("\u6253\u5F00\u7B14\u8BB0").setIcon("open-elsewhere").onClick(() => {
          void this.app.workspace.openLinkText(dest.path, "", false);
        })
      );
    } else {
      menu.addItem(
        (item) => item.setTitle("\u7528 AI \u751F\u6210\u8BCD\u6761\u7B14\u8BB0").setIcon("wand-2").onClick(() => {
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
  async enhanceLinkNote(name, targetPath) {
    const targetFile = this.app.vault.getAbstractFileByPath(targetPath);
    if (!(targetFile instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice("\u76EE\u6807\u7B14\u8BB0\u4E0D\u5B58\u5728");
      return;
    }
    const sourceFile = this.app.workspace.getActiveFile();
    if (!sourceFile) {
      new import_obsidian.Notice("\u672A\u68C0\u6D4B\u5230\u5F53\u524D\u7B14\u8BB0");
      return;
    }
    const modal = new EnhanceModal(this.app, name, sourceFile.basename);
    modal.open();
    try {
      modal.setStatus("\u6B63\u5728\u8BFB\u53D6\u7B14\u8BB0\u5185\u5BB9\u2026");
      const targetText = await this.app.vault.read(targetFile);
      const context = await this.extractContext(sourceFile.path, name);
      if (targetText.includes(sourceFile.basename)) {
        modal.setStatus(`\u300C${name}\u300D\u5DF2\u5305\u542B\u4E0E\u300A${sourceFile.basename}\u300B\u76F8\u5173\u7684\u8868\u8FF0\uFF0C\u65E0\u9700\u8865\u5145`);
        return;
      }
      modal.setStatus("\u6B63\u5728\u8BF7\u6C42 AI \u5224\u65AD\u2026");
      const userMsg = `\u76EE\u6807\u8BCD\u6761\u300C${name}\u300D\u73B0\u6709\u5185\u5BB9\uFF1A
${targetText.slice(0, 1200)}

\u6765\u6E90\u7B14\u8BB0\u300A${sourceFile.basename}\u300B\u4E2D\u63D0\u53CA\u8BE5\u8BCD\u6761\u7684\u4E0A\u4E0B\u6587\uFF1A
${context || "\uFF08\u65E0\u4E0A\u4E0B\u6587\u6458\u5F55\uFF09"}

\u8BF7\u5224\u65AD\u5E76\u8F93\u51FA\u3002`;
      const result = await this.requestChat(ENHANCE_PROMPT, userMsg);
      const sentence = (result != null ? result : "").trim();
      if (!sentence || sentence.toUpperCase().startsWith("SKIP")) {
        modal.setStatus("AI \u5224\u65AD\uFF1A\u5DF2\u5305\u542B\u76F8\u5173\u8868\u8FF0\uFF0C\u65E0\u9700\u8865\u5145");
        return;
      }
      const clean = sentence.replace(/```/g, "").replace(/^["'\u201c\u2018\u300c]|["'\u201d\u2019\u300d]$/g, "").trim();
      if (!clean) {
        modal.setStatus("AI \u8F93\u51FA\u4E3A\u7A7A\uFF0C\u672A\u505A\u4FEE\u6539");
        return;
      }
      modal.setStatus("\u6B63\u5728\u5199\u5165\u8865\u5145\u63CF\u8FF0\u2026");
      await this.app.vault.process(targetFile, (data) => data.trimEnd() + "\n\n" + clean + "\n");
      modal.setStatus(`\u5DF2\u5411\u300C${name}\u300D\u672B\u5C3E\u8865\u5145\u5173\u8054\u63CF\u8FF0`);
      modal.setResultPath(targetPath);
    } catch (e) {
      modal.setStatus("\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    }
  }
  // ================= 生成核心（带进度回调） =================
  /**
   * 带进度回调的生成流程，返回写入的文件路径（失败返回 null）。
   * onStatus 用于在弹窗/通知中展示当前步骤。
   */
  async generateWithProgress(name, sourcePath, onStatus) {
    var _a, _b;
    const safeName = name.replace(/[\\/:*?"<>|]/g, "").trim();
    if (!safeName) {
      onStatus("\u8BCD\u6761\u540D\u65E0\u6548");
      return null;
    }
    if (!this.settings.apiKey) {
      onStatus("\u672A\u914D\u7F6E API Key\uFF0C\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u586B\u5199");
      return null;
    }
    onStatus("\u2460 \u63D0\u53D6\u94FE\u63A5\u4E0A\u4E0B\u6587\u2026");
    const context = await this.extractContext(sourcePath != null ? sourcePath : "", name);
    onStatus(`\u2461 \u8BF7\u6C42 AI\uFF08${this.settings.model}\uFF09\u751F\u6210\u5185\u5BB9\u2026`);
    const content = await this.callAI(name, context);
    if (!content) {
      onStatus("\u274C AI \u8BF7\u6C42\u5931\u8D25\uFF1A\u8BF7\u68C0\u67E5 API Key / \u63A5\u53E3\u5730\u5740 / \u7F51\u7EDC");
      return null;
    }
    onStatus("\u2462 \u6574\u7406 frontmatter \u4E0E\u6807\u7B7E\u2026");
    const final = await this.ensureFrontmatter(content, sourcePath, name, context);
    onStatus("\u2463 \u786E\u5B9A\u8F93\u51FA\u76EE\u5F55\u2026");
    const dir = await this.resolveDir(sourcePath, name, context);
    const filePath = (0, import_obsidian.normalizePath)(`${dir}/${safeName}.md`);
    const exists = await this.app.vault.adapter.exists(filePath);
    if (exists) {
      let size = -1;
      try {
        size = (_b = (_a = await this.app.vault.adapter.stat(filePath)) == null ? void 0 : _a.size) != null ? _b : -1;
      } catch (e) {
      }
      if (size !== 0) {
        onStatus("\u26A0\uFE0F \u7B14\u8BB0\u5DF2\u5B58\u5728\uFF0C\u8DF3\u8FC7\uFF08\u4E0D\u4F1A\u8986\u76D6\uFF09");
        return null;
      }
      onStatus("\u68C0\u6D4B\u5230 0 \u5B57\u8282\u7A7A\u6587\u4EF6\uFF0C\u5C06\u7528 AI \u5185\u5BB9\u8986\u76D6\u2026");
    }
    onStatus("\u2464 \u5199\u5165\u6587\u4EF6\u2026");
    await this.ensureDir(dir);
    await this.app.vault.adapter.write(filePath, final);
    onStatus(`\u2705 \u5DF2\u751F\u6210\uFF1A${filePath}`);
    return filePath;
  }
  /** 无弹窗调用（批量模式用）：silent=true 时把状态输出到控制台而非通知 */
  async startGenerate(rawName, sourcePath, silent = false) {
    const name = rawName.trim();
    return this.generateWithProgress(name, sourcePath, silent ? () => {
    } : (s) => new import_obsidian.Notice(s));
  }
  async batchGenerate() {
    const file = this.app.workspace.getActiveFile();
    if (!file)
      return;
    const text = await this.app.vault.read(file);
    const linkRe = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    const names = /* @__PURE__ */ new Set();
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      names.add(m[1].trim());
    }
    if (names.size === 0) {
      new import_obsidian.Notice("\u5F53\u524D\u7B14\u8BB0\u4E2D\u6CA1\u6709\u94FE\u63A5");
      return;
    }
    new BatchProgressModal(this, [...names], file.path).open();
  }
  // ================= 自动分类 =================
  async scanVaultTree(maxFolders = 300) {
    const out = [];
    const walk = async (path) => {
      if (out.length >= maxFolders)
        return;
      let items;
      try {
        items = await this.app.vault.adapter.list(path);
      } catch (e) {
        return;
      }
      const mdFiles = items.files.filter((f) => f.endsWith(".md"));
      const samples = mdFiles.slice(0, 3).map((f) => {
        var _a;
        return (_a = f.split("/").pop()) != null ? _a : "";
      });
      if (mdFiles.length > 0) {
        out.push(`${path === "" ? "/\uFF08\u5E93\u6839\uFF09" : path}\uFF1A${mdFiles.length}\u7BC7md${samples.length ? " | \u793A\u4F8B: " + samples.join("\u3001") : ""}`);
      }
      for (const folder of items.folders) {
        if (folder.startsWith("."))
          continue;
        await walk(folder);
      }
    };
    await walk("");
    return out;
  }
  async analyzeVault() {
    if (!this.settings.apiKey) {
      new import_obsidian.Notice("\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u586B\u5199 API Key");
      return false;
    }
    new import_obsidian.Notice("\u23F3 \u6B63\u5728\u626B\u63CF\u5E76\u5206\u6790\u5E93\u7ED3\u6784\u2026");
    const tree = await this.scanVaultTree();
    const raw = await this.requestChat(
      PROFILE_PROMPT,
      `\u6211\u7684\u5E93\u76EE\u5F55\u7ED3\u6784\u5982\u4E0B\uFF1A
${tree.join("\n")}

\u8BF7\u8F93\u51FA\u5206\u7C7B\u89C4\u5219 JSON\u3002`
    );
    const parsed = parseJSONLoose(raw != null ? raw : "");
    if (!parsed || !Array.isArray(parsed.rules)) {
      new import_obsidian.Notice("\u5206\u6790\u5931\u8D25\uFF1AAI \u8FD4\u56DE\u7684\u5185\u5BB9\u65E0\u6CD5\u89E3\u6790");
      return false;
    }
    const rawRules = parsed.rules;
    const rules = rawRules.filter(
      (r) => typeof r === "object" && r !== null && typeof r.path === "string" && Array.isArray(r.keywords)
    );
    this.settings.profile = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      rules,
      defaultPath: typeof parsed.defaultPath === "string" ? parsed.defaultPath : "",
      defaultTags: Array.isArray(parsed.defaultTags) ? parsed.defaultTags.map(String) : [],
      generatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    };
    await this.saveSettings();
    new import_obsidian.Notice(`\u2705 \u5E93\u7ED3\u6784\u5DF2\u5B66\u4E60\uFF1A${this.settings.profile.rules.length} \u6761\u5206\u7C7B\u89C4\u5219`);
    return true;
  }
  matchProfile(name, context) {
    const p = this.settings.profile;
    if (!p || !p.rules || p.rules.length === 0)
      return null;
    const text = `${name} ${context}`;
    for (const rule of p.rules) {
      if (rule.keywords.some((k) => text.includes(k))) {
        return { path: rule.path, tags: rule.tags.slice() };
      }
    }
    if (p.defaultPath)
      return { path: p.defaultPath, tags: p.defaultTags.slice() };
    return null;
  }
  // ================= 工具方法 =================
  async resolveDir(sourcePath, name = "", context = "") {
    if (this.settings.autoClassify) {
      const hit = this.matchProfile(name, context);
      if (hit && await this.pathExists(hit.path))
        return (0, import_obsidian.normalizePath)(hit.path);
      if (sourcePath) {
        const parts = sourcePath.split("/");
        parts.pop();
        return (0, import_obsidian.normalizePath)(parts.join("/")) || "/";
      }
      return "";
    }
    if (this.settings.outputDir && this.settings.outputDir.trim()) {
      return (0, import_obsidian.normalizePath)(this.settings.outputDir.trim());
    }
    if (sourcePath) {
      const parts = sourcePath.split("/");
      parts.pop();
      return (0, import_obsidian.normalizePath)(parts.join("/")) || "/";
    }
    return "";
  }
  async pathExists(path) {
    if (!path)
      return false;
    try {
      await this.app.vault.adapter.list(path);
      return true;
    } catch (e) {
      return false;
    }
  }
  async ensureDir(dir) {
    if (!dir || dir === "/")
      return;
    await this.app.vault.adapter.mkdir(dir);
  }
  async extractContext(sourcePath, name) {
    if (!sourcePath)
      return "";
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof import_obsidian.TFile))
      return "";
    const text = await this.app.vault.read(file);
    const re = new RegExp(`\\[\\[[^\\]]*?\\|?${escapeRegExp(name)}\\s*\\]\\]`);
    const idx = text.search(re);
    if (idx < 0)
      return "";
    const half = Math.floor(this.settings.contextChars / 2);
    return text.slice(Math.max(0, idx - half), Math.min(text.length, idx + half));
  }
  async callAI(name, context) {
    var _a, _b;
    const userMsg = `\u8BCD\u6761\u540D\uFF1A${name}
\u6765\u6E90\u7B14\u8BB0\uFF1A${(_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.name) != null ? _b : "\u672A\u77E5"}
` + (context ? `\u4E0A\u4E0B\u6587\u6458\u5F55\uFF08\u4EC5\u7528\u4E8E\u5728\u6B63\u6587\u672B\u5C3E\u81EA\u7136\u5E26\u51FA\u4E0E\u8BE5\u6765\u6E90\u7B14\u8BB0\u7684\u5173\u7CFB\uFF0C\u6B63\u6587\u4E3B\u4F53\u8BF7\u4EE5\u8BCD\u6761\u672C\u8EAB\u4E3A\u51C6\uFF09\uFF1A
${context}
` : "") + `
\u8BF7\u4E3A\u300C${name}\u300D\u64B0\u5199\u4E00\u7BC7\u767E\u79D1\u98CE\u683C\u7684\u72EC\u7ACB\u8BCD\u6761\u7B14\u8BB0\u3002`;
    return this.requestChat(SYS_PROMPT, userMsg);
  }
  async requestChat(system, user) {
    var _a, _b, _c, _d;
    const base = this.settings.apiBase.replace(/\/+$/, "");
    try {
      const resp = await (0, import_obsidian.requestUrl)({
        url: `${base}/chat/completions`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.apiKey}`
        },
        body: JSON.stringify({
          model: this.settings.model,
          temperature: this.settings.temperature,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ]
        })
      });
      if (resp.status < 200 || resp.status >= 300) {
        const errText = ((_a = resp.text) != null ? _a : "").slice(0, 300);
        console.error("AI API error:", resp.status, errText);
        return null;
      }
      const data = JSON.parse(resp.text);
      const content = (_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content;
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
  async ensureFrontmatter(content, sourcePath, name = "", context = "") {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const tags = await this.collectTags(sourcePath, name, context);
    let clean = content.replace(/```markdown|```md|```/g, "").replace(/<[^>]*>/g, "");
    const fmMatch = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      parseTagsFromFm(fmMatch[1]).forEach((t) => {
        if (t && !tags.includes(t))
          tags.push(t);
      });
      clean = clean.slice(fmMatch[0].length);
    }
    clean = clean.replace(/^#\s+.+?\n+/, "").trim();
    const fm = `---
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
type: \u6982\u5FF5
created: ${today}
---
`;
    return fm + clean + "\n";
  }
  async collectTags(sourcePath, name = "", context = "") {
    const tags = [];
    if (this.settings.autoClassify) {
      const hit = this.matchProfile(name, context);
      if (hit)
        hit.tags.forEach((t) => {
          if (!tags.includes(t))
            tags.push(t);
        });
    }
    if (this.settings.inheritTags && sourcePath) {
      const file = this.app.vault.getAbstractFileByPath(sourcePath);
      if (file instanceof import_obsidian.TFile) {
        const text = await this.app.vault.read(file);
        const m = text.match(/^---\r?\n(.*?)\r?\n---/s);
        if (m) {
          const tm = m[1].match(/^tags:\s*([\s\S]*?)(?=^\w+:|$)/m);
          if (tm) {
            tm[1].split("\n").forEach((line) => {
              const t = line.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, "").trim();
              if (t && !tags.includes(t))
                tags.push(t);
            });
          }
        }
      }
    }
    (this.settings.defaultTags || "").split(/[\s,，]+/).filter(Boolean).forEach((t) => {
      if (!tags.includes(t))
        tags.push(t);
    });
    return tags.length ? tags : ["\u77E5\u8BC6\u5E93"];
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data != null ? data : {});
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function parseJSONLoose(s) {
  let t = s.replace(/```json/gi, "").replace(/```/g, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end < 0)
    return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}
function parseTagsFromFm(fmText) {
  const out = [];
  const push = (t) => {
    const v = t.trim().replace(/^["']|["']$/g, "");
    if (v && !out.includes(v))
      out.push(v);
  };
  const block = fmText.match(/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m);
  if (block) {
    block[1].split("\n").forEach((line) => {
      const m = line.match(/^\s*-\s*(.+)$/);
      if (m)
        push(m[1]);
    });
    return out;
  }
  const inline = fmText.match(/^tags:\s*(.+)$/m);
  if (inline) {
    inline[1].replace(/[[\]"']/g, "").split(/[,，]/).forEach((t) => push(t));
  }
  return out;
}
var EnhanceModal = class extends import_obsidian.Modal {
  constructor(app, name, sourceName) {
    super(app);
    this.resultPath = null;
    this.name = name;
    this.sourceName = sourceName;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `\u4E3A\u300C${this.name}\u300D\u8865\u5145\u4E0E\u300A${this.sourceName}\u300B\u7684\u5173\u8054` });
    this.statusEl = contentEl.createEl("p", { text: "\u51C6\u5907\u4E2D\u2026", cls: "ai-note-gen-status" });
  }
  setStatus(s) {
    this.statusEl.setText(s);
  }
  setResultPath(p) {
    this.resultPath = p;
    const btn = this.contentEl.createEl("button", { text: "\u6253\u5F00\u7B14\u8BB0" });
    btn.addEventListener("click", () => {
      if (this.resultPath)
        void this.app.workspace.openLinkText(this.resultPath, "", false);
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var EmptyFileModal = class extends import_obsidian.Modal {
  constructor(plugin, file) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `\u68C0\u6D4B\u5230\u7A7A\u7B14\u8BB0\u300C${this.file.basename}\u300D` });
    contentEl.createEl("p", {
      text: "\u8FD9\u901A\u5E38\u662F\u56E0\u4E3A\u70B9\u51FB\u4E86\u5C1A\u672A\u521B\u5EFA\u7684 [[\u53CC\u94FE]]\uFF0CObsidian \u9ED8\u8BA4\u521B\u5EFA\u4E86\u7A7A\u6587\u4EF6\u3002\u662F\u5426\u7528 AI \u81EA\u52A8\u751F\u6210\u5185\u5BB9\uFF1F\u751F\u6210\u540E\u5C06\u5220\u9664\u7A7A\u6587\u4EF6\u3001\u6309\u81EA\u52A8\u5206\u7C7B\u5199\u5165\u5BF9\u5E94\u76EE\u5F55\u3002"
    });
    const btnRow = contentEl.createDiv({ cls: "ai-note-gen-btns" });
    const btnGen = btnRow.createEl("button", { text: "\u7528 AI \u751F\u6210\u5185\u5BB9" });
    const btnKeep = btnRow.createEl("button", { text: "\u4FDD\u7559\u7A7A\u6587\u4EF6" });
    btnGen.addEventListener("click", () => {
      this.close();
      void this.generate();
    });
    btnKeep.addEventListener("click", () => this.close());
  }
  async generate() {
    var _a;
    const activePath = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path;
    const source = activePath && activePath !== this.file.path ? activePath : this.file.path;
    await this.app.fileManager.trashFile(this.file).catch(() => {
    });
    new GenerateProgressModal(this.plugin, this.file.basename, source).open();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var GenerateProgressModal = class extends import_obsidian.Modal {
  constructor(plugin, name, sourcePath) {
    super(plugin.app);
    this.resultPath = null;
    this.running = true;
    this.plugin = plugin;
    this.name = name;
    this.sourcePath = sourcePath;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `\u4E3A\u300C${this.name}\u300D\u751F\u6210\u7B14\u8BB0` });
    this.statusEl = contentEl.createDiv({ cls: "ai-note-gen-status" });
    const btnRow = contentEl.createDiv({ cls: "ai-note-gen-btns" });
    this.openBtn = btnRow.createEl("button", { text: "\u6253\u5F00\u7B14\u8BB0", attr: { disabled: "true" } });
    const cancelBtn = btnRow.createEl("button", { text: "\u5173\u95ED" });
    this.openBtn.addEventListener("click", () => {
      if (this.resultPath)
        void this.openResult();
    });
    cancelBtn.addEventListener("click", () => {
      this.running = false;
      this.close();
    });
    void this.run();
  }
  async openResult() {
    if (!this.resultPath)
      return;
    const file = this.app.vault.getAbstractFileByPath(this.resultPath);
    if (file instanceof import_obsidian.TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    }
  }
  async run() {
    const path = await this.plugin.generateWithProgress(this.name, this.sourcePath, (s) => {
      this.statusEl.setText(s);
    });
    if (!this.running)
      return;
    if (path) {
      this.resultPath = path;
      this.openBtn.removeAttribute("disabled");
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var BatchProgressModal = class extends import_obsidian.Modal {
  constructor(plugin, names, sourcePath) {
    super(plugin.app);
    this.cancelled = false;
    this.plugin = plugin;
    this.names = names;
    this.sourcePath = sourcePath;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "\u6279\u91CF\u751F\u6210\u672A\u521B\u5EFA\u94FE\u63A5\u7B14\u8BB0" });
    contentEl.createEl("p", { text: `\u5171 ${this.names.length} \u4E2A\u94FE\u63A5\u3002\u5DF2\u5B58\u5728\u7684\u4F1A\u81EA\u52A8\u8DF3\u8FC7\u3002` });
    this.statusEl = contentEl.createDiv({ cls: "ai-note-gen-status" });
    const cancelBtn = contentEl.createEl("button", { text: "\u505C\u6B62" });
    cancelBtn.addEventListener("click", () => this.cancelled = true);
    void this.run();
  }
  async run() {
    let ok = 0;
    for (let i = 0; i < this.names.length; i++) {
      if (this.cancelled)
        break;
      const name = this.names[i];
      this.statusEl.setText(`[${i + 1}/${this.names.length}] ${name} \u2026`);
      const path = await this.plugin.startGenerate(name, this.sourcePath, true);
      if (path)
        ok++;
      await sleep(300);
    }
    this.statusEl.setText(
      this.cancelled ? `\u5DF2\u505C\u6B62\u3002\u5B8C\u6210 ${ok} \u4E2A\u3002` : `\u5B8C\u6210\uFF1A\u65B0\u589E ${ok} \u4E2A\u3002`
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AINoteGenSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("AI \u7B14\u8BB0\u751F\u6210\u5668").setHeading();
    containerEl.createEl("p", {
      text: "\u70B9\u51FB\u672A\u521B\u5EFA\u7684 [[\u53CC\u94FE]] \u65F6\u81EA\u52A8\u8C03\u7528 AI \u751F\u6210\u7B14\u8BB0\u3002\u652F\u6301 OpenAI \u517C\u5BB9\u63A5\u53E3\uFF08DeepSeek / \u901A\u4E49 / Moonshot / OpenAI\uFF09\u3002"
    });
    new import_obsidian.Setting(containerEl).setName("API \u63A5\u53E3\u5730\u5740").setDesc("\u793A\u4F8B\uFF1Ahttps://api.deepseek.com/v1\u3001https://api.openai.com/v1\u3001https://dashscope.aliyuncs.com/compatible-mode/v1").addText(
      (t) => t.setPlaceholder("https://api.openai.com/v1").setValue(this.plugin.settings.apiBase).onChange(async (v) => {
        this.plugin.settings.apiBase = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("API Key").setDesc("\u4EC5\u4FDD\u5B58\u5728\u672C\u673A data.json\uFF0C\u4E0D\u4F1A\u5916\u4F20\u3002").addText(
      (t) => t.setPlaceholder("sk-\u2026").setValue(this.plugin.settings.apiKey).onChange(async (v) => {
        this.plugin.settings.apiKey = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6A21\u578B").setDesc("\u5982 deepseek-chat\u3001gpt-4o-mini\u3001qwen-plus").addText(
      (t) => t.setPlaceholder("gpt-4o-mini").setValue(this.plugin.settings.model).onChange(async (v) => {
        this.plugin.settings.model = v.trim() || "gpt-4o-mini";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6E29\u5EA6").setDesc("\u8D8A\u4F4E\u8D8A\u4E25\u8C28\uFF08\u5EFA\u8BAE 0.2~0.5\uFF09").addSlider(
      (s) => s.setLimits(0, 1, 0.05).setValue(this.plugin.settings.temperature).onChange(async (v) => {
        this.plugin.settings.temperature = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u5206\u7C7B\uFF08\u63A8\u8350\uFF09").setHeading();
    containerEl.createEl("p", {
      text: '\u8BA9 AI \u8BFB\u53D6\u5E76\u7406\u89E3\u672C\u5730\u5E93\u7ED3\u6784\uFF08\u76EE\u5F55\u6811 + \u6587\u4EF6\u793A\u4F8B\uFF09\uFF0C\u5B66\u4E60\u51FA"\u8BCD\u6761\u5173\u952E\u8BCD \u2192 \u76EE\u5F55 + \u6807\u7B7E"\u7684\u89C4\u5219\uFF1B\u751F\u6210\u7B14\u8BB0\u65F6\u81EA\u52A8\u5F52\u6863\u5E76\u6253\u6807\u7B7E\uFF0C\u65E0\u9700\u624B\u586B\u3002'
    });
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528\u81EA\u52A8\u5206\u7C7B").setDesc("\u5173\u95ED\u540E\u56DE\u9000\u4E3A\u624B\u52A8\u8BBE\u7F6E\uFF1A\u8F93\u51FA\u76EE\u5F55 + \u7EE7\u627F\u6807\u7B7E").addToggle(
      (t) => t.setValue(this.plugin.settings.autoClassify).onChange(async (v) => {
        this.plugin.settings.autoClassify = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u5206\u6790\u5E76\u5B66\u4E60\u5E93\u7ED3\u6784").setDesc("\u626B\u63CF\u5168\u5E93\u76EE\u5F55\uFF08\u8DF3\u8FC7\u9690\u85CF\u76EE\u5F55\uFF09\uFF0C\u4EA4\u7ED9 AI \u751F\u6210\u5206\u7C7B\u89C4\u5219\u3002\u5E93\u7ED3\u6784\u53D8\u5316\u540E\u53EF\u968F\u65F6\u91CD\u65B0\u5B66\u4E60\u3002").addButton(
      (b) => b.setButtonText(this.plugin.settings.profile ? "\u91CD\u65B0\u5B66\u4E60" : "\u5F00\u59CB\u5206\u6790").onClick(async () => {
        b.setDisabled(true);
        b.setButtonText("\u5206\u6790\u4E2D\u2026");
        await this.plugin.analyzeVault();
        this.display();
      })
    );
    const p = this.plugin.settings.profile;
    if (p) {
      const info = containerEl.createDiv({ cls: "ai-note-gen-profile" });
      info.createEl("p", { text: `\u5DF2\u5B66\u4E60\uFF08${p.generatedAt}\uFF09\uFF1A${p.summary || "\uFF08\u65E0\u6458\u8981\uFF09"}` });
      info.createEl("p", { text: `\u5171 ${p.rules.length} \u6761\u89C4\u5219\uFF0C\u515C\u5E95\u76EE\u5F55\uFF1A${p.defaultPath || "\uFF08\u65E0\uFF09"}` });
      const list = info.createEl("ul");
      p.rules.slice(0, 12).forEach((r) => {
        const li = list.createEl("li");
        li.setText(`${r.path} \u2190 ${r.keywords.slice(0, 6).join("\u3001")}${r.keywords.length > 6 ? "\u2026" : ""}`);
      });
      if (p.rules.length > 12)
        info.createEl("p", { text: `\u2026\u5176\u4F59 ${p.rules.length - 12} \u6761\u7565` });
    }
    new import_obsidian.Setting(containerEl).setName("\u624B\u52A8\u8BBE\u7F6E").setHeading();
    containerEl.createEl("p", {
      text: this.plugin.settings.autoClassify ? "\u2705 \u5168\u81EA\u52A8\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF1A\u76EE\u5F55\u4E0E\u6807\u7B7E\u7531 AI \u81EA\u52A8\u51B3\u5B9A\uFF0C\u65E0\u9700\u624B\u52A8\u8BBE\u7F6E\uFF08\u4EE5\u4E0B\u8BBE\u7F6E\u4E0D\u751F\u6548\uFF09\u3002\u82E5\u65B0\u589E\u4E86\u4E3B\u9898\u6587\u4EF6\u5939\uFF0C\u8BF7\u70B9\u4E0A\u65B9\u300C\u91CD\u65B0\u5B66\u4E60\u300D\u66F4\u65B0\u89C4\u5219\u3002" : "\u81EA\u52A8\u5206\u7C7B\u5DF2\u5173\u95ED\uFF0C\u4EE5\u4E0B\u624B\u52A8\u8BBE\u7F6E\u751F\u6548\u3002"
    });
    new import_obsidian.Setting(containerEl).setName("\u8F93\u51FA\u76EE\u5F55").setDesc("\u76F8\u5BF9\u5E93\u6839\u7684\u76EE\u5F55\uFF0C\u7559\u7A7A = \u5199\u5165\u5F53\u524D\u7B14\u8BB0\u6240\u5728\u76EE\u5F55\u3002\u793A\u4F8B\uFF1A30-Resources--\u5174\u8DA3\u3001\u77E5\u8BC6\u5E93\uFF0C\u6241\u5E73\u5316 + MOC/\u271D\uFE0F\u57FA\u7763\u6559/06-\u6982\u5FF5\u4E0E\u672F\u8BED").addText(
      (t) => t.setPlaceholder("\u7559\u7A7A\u5219\u7528\u5F53\u524D\u7B14\u8BB0\u76EE\u5F55").setValue(this.plugin.settings.outputDir).onChange(async (v) => {
        this.plugin.settings.outputDir = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u4E0A\u4E0B\u6587\u957F\u5EA6").setDesc("\u4ECE\u6765\u6E90\u7B14\u8BB0\u94FE\u63A5\u524D\u540E\u63D0\u53D6\u7684\u5B57\u7B26\u6570\uFF0C\u4F9B AI \u53C2\u8003\uFF080 = \u4E0D\u63D0\u53D6\uFF09").addSlider(
      (s) => s.setLimits(0, 2e3, 50).setValue(this.plugin.settings.contextChars).onChange(async (v) => {
        this.plugin.settings.contextChars = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u7EE7\u627F\u6765\u6E90\u7B14\u8BB0\u6807\u7B7E").setDesc("\u751F\u6210\u65F6\u81EA\u52A8\u7EE7\u627F\u6765\u6E90\u7B14\u8BB0 frontmatter \u4E2D\u7684 tags").addToggle(
      (t) => t.setValue(this.plugin.settings.inheritTags).onChange(async (v) => {
        this.plugin.settings.inheritTags = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6807\u7B7E").setDesc("\u672A\u7EE7\u627F\u65F6\u7684\u515C\u5E95\u6807\u7B7E\uFF08\u7A7A\u683C\u5206\u9694\uFF09").addText(
      (t) => t.setPlaceholder("\u77E5\u8BC6\u5E93").setValue(this.plugin.settings.defaultTags).onChange(async (v) => {
        this.plugin.settings.defaultTags = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u70B9\u51FB\u672A\u521B\u5EFA\u94FE\u63A5\u65F6\u751F\u6210").setDesc("\u5173\u95ED\u540E\u4EC5\u901A\u8FC7\u547D\u4EE4\u89E6\u53D1\uFF08\u547D\u4EE4\u9762\u677F\uFF1A\u4E3A\u9009\u4E2D\u7684\u94FE\u63A5\u751F\u6210\u7B14\u8BB0 / \u6279\u91CF\u751F\u6210\u6240\u6709\u672A\u521B\u5EFA\u94FE\u63A5 / \u5206\u6790\u5E76\u5B66\u4E60\u5E93\u7ED3\u6784\uFF09").addToggle(
      (t) => t.setValue(this.plugin.settings.generateOnClick).onChange(async (v) => {
        this.plugin.settings.generateOnClick = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u53F3\u952E\u94FE\u63A5\u83DC\u5355\uFF08\u8865\u5145\u5173\u8054 / \u751F\u6210\u8BCD\u6761\uFF09").setDesc("\u53F3\u952E\u5DF2\u521B\u5EFA\u94FE\u63A5 \u2192\u300C\u7528 AI \u8865\u5145\u4E0E\u5F53\u524D\u7B14\u8BB0\u7684\u5173\u8054\u300D\uFF1AAI \u6BD4\u8F83\u8BCD\u6761\u7B14\u8BB0\u4E0E\u5F53\u524D\u7B14\u8BB0\uFF0C\u82E5\u8BCD\u6761\u5C1A\u672A\u63D0\u53CA\u5F53\u524D\u7B14\u8BB0\uFF0C\u5219\u5728\u5176\u672B\u5C3E\u8FFD\u52A0\u4E00\u53E5 wiki \u98CE\u683C\u7684\u5173\u8054\u63CF\u8FF0\uFF08\u4E0D\u4F1A\u91CD\u590D\u8FFD\u52A0\uFF09\uFF1B\u53F3\u952E\u672A\u521B\u5EFA\u94FE\u63A5 \u2192\u300C\u7528 AI \u751F\u6210\u8BCD\u6761\u7B14\u8BB0\u300D").addToggle(
      (t) => t.setValue(this.plugin.settings.enhanceOnContextMenu).onChange(async (v) => {
        this.plugin.settings.enhanceOnContextMenu = v;
        await this.plugin.saveSettings();
      })
    );
  }
};
function sleep(ms) {
  return new Promise((r) => window.setTimeout(r, ms));
}
