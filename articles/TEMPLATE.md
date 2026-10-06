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

本站文章是「Markdown 源文件 + 静态 HTML 页面」两份并存的：`.md` 是源文件（留档、方便以后改），`articles/<ID>.html` 才是真正上线的页面。发布一篇新文章，按下面五步走（第二、三步有脚本，一条命令搞定）。

### 第一步：写 Markdown 源文件

在 `articles/` 下新建 `<ID>.md`。ID 用英文、数字、下划线（它会直接变成网址的一部分，例如 `DeepSeek_V41_Flash_vs_V4_Pro`）。

语法照抄本文件上面演示的那些。两条本站特有的约定：

- 第一行 `# 文章标题` 是标题，**正文里不要再重复写一遍**（页面顶部的 H1 由页面骨架渲染）。
- 每一段写成单独一行，段落之间空一行。渲染器开启了 `breaks`，段内手动换行会变成 `<br>`。

### 第二步：登记到 articles.json

在 `articles.json` 里追加一条（数组里都是已发布的文章；本文件 `articles/TEMPLATE.md` 只是语法参考，不登记）：

```json
{
  "id": "去掉 .md 的文件名",
  "title": "文章标题",
  "date": "2026年9月16日",
  "excerpt": "卡片上显示的摘要，一般与 meta description 一致",
  "tags": ["标签1", "标签2"]
}
```

`id` 同时决定源文件名与页面文件名：`articles/<id>.md` → `articles/<id>.html`，不用另登记输出文件名；
它也直接进网址，所以只能用英文、数字、下划线（列表页按 `id` 拼链接）。

`date` 用「YYYY年M月D日」的显示格式，必须和 md 的 H1 标题、页面显示的日期逐字一致（标题不一致脚本会报警）。

### 第三步：一条命令生成页面

```bash
node scripts/build-articles.js
```

它做的正是以前手工做的那两步（转 HTML + 套页面骨架）：

1. 用 `marked`（`{ gfm: true, breaks: true }`，与线上 [md2html.ok-lzr.us.ci](https://md2html.ok-lzr.us.ci) 同款配置）把 `articles/<ID>.md` 渲染成 HTML，表格自动包 `<div class="table-wrapper">`，外链自动加 `target="_blank" rel="noopener"`；
2. 以 `templates/article.html` 为骨架，替换标题、摘要、canonical、og/twitter、两条 JSON-LD、日期、阅读时间、标签，再写入正文；
3. 按正文字符数算阅读时间（约 350 字符/分钟，最低 3 分钟）。

> 改页面结构（导航、页脚、meta）时，**直接改 `templates/article.html`**，再跑一次脚本，全站文章页一起更新。
> 渲染器 `marked` 已随仓库放在 `scripts/vendor/marked.umd.js`（18.1.0 + SHA-256 校验），构建全程不联网。

如果只想手工来一遍（比如没有 Node 环境）：把 Markdown 粘进 [md2html.ok-lzr.us.ci](https://md2html.ok-lzr.us.ci)，复制「源码」里的 HTML，再照 `templates/article.html` 逐项替换上表那些字段（`<title>`、`meta description`、`canonical`、`og:*`/`twitter:*`、JSON-LD 的 `headline`/`description`/`keywords`/`articleSection`/`datePublished`/`timeRequired`、`.article-header` 里的标题与日期与标签、`.article-body` 正文）。

### 第四步：同步站点级文件

- `sitemap.xml`：加一条 `<url>`，`lastmod` 写发布日（`YYYY-MM-DD`）；首页与文章列表页的 `lastmod` 也顺手更新。
- `articles.html`：`<noscript>` 里的静态文章列表加一行（纯抓取也能发现新文章）。
- `index.html`：在「最近动态」加一条，必要时更新「精选文章」。

### 第五步：发布前自检

```bash
node scripts/check-articles.js
```

它会把下面这些一次查完，有问题就列出来并以非零退出码结束：

- `articles.json`、`articles/<ID>.md`、`articles/<ID>.html` 三者是否对得上，H1 与 `title` 是否一致；
- 日期格式、是否落在未来、页面 `<span>` 与 JSON-LD `datePublished` 是否一致；
- 阅读时间与 `timeRequired` 是否一致，标签是否齐全；
- 正文里有没有未渲染的 `**`、`](`，有没有没替换掉的占位符；
- 有没有 emoji（本站规范不用 emoji）；
- `sitemap.xml` 与 `articles.html` 的静态列表是否收录了每一篇。

几个容易踩的坑：

- **中文加粗**：加粗内容以标点结尾时，标点必须放在 `**` 外面——写 `**很厉害**。` 会渲染，写 `**很厉害。**后面` 不会渲染。
- **段落**：一段一行，段间空行（渲染器开了 `breaks`，段内换行会变成 `<br>`）。
- **正文不重复标题**：H1 由页面骨架渲染，md 的第一行标题不会出现在正文里。

### 关于日期与文体

2026 年 9 月 14 日全站做过一次整理：所有文章的日期统一校正为 `2026年9月14日`，行文也统一改成个人博文口吻（第一人称、有由头、有个人判断，不用"本文介绍了"这种公文腔）。新写的文章请延续这个风格。

