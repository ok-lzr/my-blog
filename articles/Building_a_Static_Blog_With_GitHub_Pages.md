# 从零搭建静态博客：GitHub Pages 与自定义域名

你正在读的这个网站，就是一个纯静态博客。没有数据库、没有服务器进程、没有云厂商的账单——只有一堆 HTML、CSS 和 JavaScript 文件，托管在 GitHub Pages 上。这篇文章把整套流程拆开讲清楚，跟着做，你也可以在半小时内拥有一个自己的博客。

## 为什么选择静态博客

动态博客（如 WordPress、Typecho）功能强大，但需要维护服务器、数据库和运行环境，还要时刻提防安全漏洞。对内容创作来说，这些复杂度是多余的。静态博客的优势非常直接：

- **免费**：GitHub Pages 对公开仓库永久免费，自带 HTTPS。
- **极快**：纯静态文件，配合 CDN 全球加速，首屏几乎瞬时加载。
- **安全**：没有服务端代码，就没有可攻击的入口。
- **可维护**：一篇文章就是一个文件，内容即版本，随 Git 一起演进。

## 第一步：初始化项目结构

先为站点建一个仓库。推荐的目录结构如下，简单且语义清晰：

```
my-blog/
├── index.html        # 首页
├── articles/         # 文章存放目录
│   └── hello.html    # 单篇文章
├── assets/           # 图片、图标等静态资源
├── styles/           # 样式表
└── scripts/          # 脚本
```

站点根目录放一个 `index.html` 作为入口，文章集中放在 `articles/` 目录下。这样无论是人眼还是搜索引擎爬虫，都能一眼看懂站点的组织方式。

## 第二步：本地预览

写代码最重要的是即时反馈。在项目根目录启动一个本地静态服务器，比直接双击打开 HTML 更接近线上环境（路径、异步请求的行为都一致）：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node.js（需要先安装）
npx serve .
```

然后打开 `http://localhost:8080` 即可预览。改完文件刷新浏览器，所见即所得。

## 第三步：推送到 GitHub Pages

在 GitHub 上创建一个仓库（建议与用户名同名，例如 `ok-lzr.github.io`，这样默认域名最短），然后把本地代码推上去：

```bash
git init
git add .
git commit -m "init: my static blog"
git branch -M main
git remote add origin https://github.com/ok-lzr/ok-lzr.github.io.git
git push -u origin main
```

推送完成后，进入仓库的 **Settings → Pages**，把 **Build and deployment** 的 Source 选为 `Deploy from a branch`，分支选择 `main` 和根目录 `/`，保存。等几十秒，访问 `https://ok-lzr.github.io` 就能看到你的站点了。

## 第四步：绑定自定义域名

默认域名已经能用，但一个自己的域名会让站点更专业。绑定分两步：

1. 在仓库根目录新建 `CNAME` 文件，内容是你的域名，例如 `ok-lzr.us.ci`，推送到仓库。
2. 到域名服务商处配置 DNS 记录。如果域名是裸域（没有 www），使用 A 记录指向 GitHub Pages 的 IP；如果是子域名，用 CNAME 记录指向 `ok-lzr.github.io`。

DNS 记录参考：

| 类型 | 主机 | 值 |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | ok-lzr.github.io |

DNS 生效后，GitHub 会自动为自定义域名签发 HTTPS 证书，通常几分钟到几小时内完成。

## 常见问题排查

- **页面 404**：检查分支名是否为 `main`，或仓库是否设为公开。
- **样式丢失**：确认所有相对路径都从仓库根目录出发，比如文章页里用 `../styles/style.css`。
- **自定义域名不生效**：先等 DNS 传播，再用 `nslookup` 或在线工具确认解析结果。

## 结语

静态博客把"写内容"这件事的摩擦降到了最低：打开编辑器，写一个 HTML 或 Markdown 文件，提交，发布。没有后台要登录，没有插件要升级。如果你想要更自动化的体验，还可以引入 GitHub Actions 在推送时自动构建——那就是另一个话题了。希望这篇教程能帮你把第一个站点跑起来。
