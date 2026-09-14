# 一级标题：文章主标题

这里是一个普通的段落。它包含了**粗体文本**和*斜体文本*，以及 `行内代码`。您还可以在这里[插入一个超链接](https://example.com)。

这是另一个段落。为了换行，您需要在上一行末尾添加两个空格，然后回车。  
或者，直接用一个空行来创建一个全新的段落。

## 二级标题：内容分区

> 这是一个引用块。通常用于摘录他人的话或强调重点。
> 可以跨越多行。

### 三级标题：子主题

1.  这是一个有序列表的第一项。
2.  这是第二项。
    - 您可以在有序列表中嵌套无序列表。
    - 这是嵌套的第二项。
3.  这是第三项。

- 这是一个无序列表项。
- 这是另一个无序列表项。
    - 这是嵌套的无序列表项（二级）。
        - 这是三级嵌套。

#### 四级标题：代码示例

下面是一个代码块（无特定语言）：

```
function sayHello() {
  console.log("Hello, world!");
}
```

下面是一个带有语法高亮的代码块（指定语言）：

```python
def say_hello():
    print("Hello, world!")
```

##### 五级标题：其他元素

**水平分割线**：用于主题分割。

---

**表格**：

| 表头列 1 | 表头列 2 | 表头列 3 |
| :--- | :---: | ---: |
| 左对齐 | 居中对齐 | 右对齐 |
| 单元格内容 | 更多内容 | 数据 |

**任务列表**（部分平台支持）：

- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 另一个待办事项

**删除线**：~~这是一条被删除的文本~~。

**脚注**：这里是一个带脚注的句子[^1]。

[^1]: 这是脚注的说明文字。

###### 六级标题：图片与视频

**插入图片**：
![图片替代文本](https://example.com/image.jpg "可选的图片标题")

**嵌入视频**（例如 YouTube，使用普通 Markdown 或 HTML）：
[![视频标题](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

或者直接使用原始 HTML：

<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

## 结语

最后，这里是一个收尾段落。感谢阅读！

---

## 发布教程：把一篇新文章发布到本站

本站文章是「Markdown 源文件 + 静态 HTML 页面」两份并存的：`.md` 是源文件（留档、方便以后改），`articles/<ID>.html` 才是真正上线的页面。发布一篇新文章，按下面六步走。

### 第一步：写 Markdown 源文件

在 `articles/` 下新建 `<ID>.md`。ID 用英文、数字、下划线（它会直接变成网址的一部分，例如 `DeepSeek_V41_Flash_vs_V4_Pro`）。

语法照抄本文件上面演示的那些。两条本站特有的约定：

- 第一行 `# 文章标题` 是标题，**正文里不要再重复写一遍**（页面顶部的 H1 由页面骨架渲染）。
- 每一段写成单独一行，段落之间空一行。渲染器开启了 `breaks`，段内手动换行会变成 `<br>`。

### 第二步：转成 HTML

把 Markdown 全文粘进 [md2html.ok-lzr.us.ci](https://md2html.ok-lzr.us.ci)，切到右侧「源码」标签，复制生成的 HTML 源码。

本地等价做法：用 `marked`，配置 `{ gfm: true, breaks: true }`（线上工具的配置），得到的结果一致。表格记得包一层 `<div class="table-wrapper">`。

### 第三步：套页面骨架

复制 `articles/TEMPLATE.html`（或任意一篇已有文章）另存为 `articles/<ID>.html`，逐项替换：

| 位置 | 要改的内容 |
| --- | --- |
| `<title>` | `文章标题 · ok-lzr的个人空间` |
| `meta description` / `og:description` | 一两句话的摘要 |
| `og:title` / `twitter:title` | 文章标题 |
| `canonical` / `og:url` | `https://ok-lzr.us.ci/articles/<ID>.html` |
| JSON-LD `BlogPosting` | `headline`、`description`、`url`、`mainEntityOfPage.@id`、`keywords`、`articleSection`（取第一个标签）、`datePublished`、`dateModified`、`timeRequired` |
| JSON-LD `BreadcrumbList` | 第三项的 `name` 与 `item` |
| `.article-header` | `<h1>` 标题、日期、阅读时间、`.article-tags` 标签 |
| `.article-body` | 第二步得到的 HTML |

外链一律加 `target="_blank" rel="noopener"`。

### 第四步：登记到 articles.json

在 `articles.json` 里追加一条（`TEMPLATE` 那条不要动，它不会出现在列表里）：

```json
{
  "id": "去掉 .md 的文件名",
  "title": "文章标题",
  "date": "2026年9月14日",
  "excerpt": "卡片上显示的摘要，一般与 meta description 一致",
  "tags": ["标签1", "标签2"],
  "file": "<ID>.html"
}
```

`date` 用「YYYY年M月D日」的显示格式，必须和页面 `<span>` 里的日期逐字一致。

### 第五步：同步站点级文件

- `sitemap.xml`：加一条 `<url>`，`lastmod` 写发布日（`YYYY-MM-DD`）；首页与文章列表页的 `lastmod` 也顺手更新。
- `articles.html`：`<noscript>` 里的静态文章列表加一行（纯抓取也能发现新文章）。
- `index.html`：在「最近动态」加一条，必要时更新「精选文章」。

### 第六步：发布前自查

- **日期**：不能是未来，也不要过于久远；用发布当天即可。三处必须一致——页面显示的日期、`articles.json` 的 `date`、JSON-LD 的 `datePublished`。
- **阅读时间**：按正文字符数估算（本站口径约 350 字符/分钟，最低 3 分钟），并与 JSON-LD 的 `timeRequired`（`PT<分钟>M`）保持一致。
- **一致性**：标题、摘要、标签在 HTML 与 `articles.json` 里保持一致；`<ID>.md` 与 `<ID>.html` 同名。
- **格式**：正文里不出现未渲染的 `**`、`](` 之类的 Markdown 残留；中文加粗后紧跟汉字时，把句号移到 `**` 外面（否则渲染器不会识别加粗）。
- **链接**：外链能打开，站内链接（`../articles.html`、`../index.html` 等）路径正确。

### 关于日期与文体

2026 年 9 月 14 日全站做过一次整理：所有文章的日期统一校正为 `2026年9月14日`，行文也统一改成个人博文口吻（第一人称、有由头、有个人判断，不用"本文介绍了"这种公文腔）。新写的文章请延续这个风格。

