/**
 * 发布前自检：node scripts/check-articles.js
 *
 * 检查项：
 *   1. articles.json 与 articles/*.md、articles/*.html 是否对得上
 *   2. Markdown 的 H1 与 articles.json 的 title 是否一致
 *   3. 页面里的日期、阅读时间、标签、结构化数据是否与 articles.json 一致
 *   4. 正文是否残留未渲染的 Markdown（**、](）、是否有占位符没替换
 *   5. 是否有 emoji（站点规范不用 emoji）
 *   6. 日期是否落在未来、或过于久远
 *   7. sitemap.xml、articles.html 的 <noscript> 列表是否收录了全部文章
 *
 * 只要有问题就打印出来，并以退出码 1 结束，方便接到提交钩子里。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const SITE_URL = 'https://ok-lzr.us.ci';

const problems = [];
const notes = [];
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u;
const EMOJI_ALLOW = new Set(['✦', '→']);

function scanEmoji(text, where) {
    for (const ch of text) {
        if (EMOJI.test(ch) && !EMOJI_ALLOW.has(ch)) problems.push(`${where}：出现 emoji「${ch}」`);
    }
}

function main() {
    const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'articles.json'), 'utf8'));
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    const articlesPage = fs.readFileSync(path.join(ROOT, 'articles.html'), 'utf8');
    const todayIso = new Date().toISOString().slice(0, 10);

    const ids = [];
    for (const entry of list) {
        if (!entry || entry.id === 'TEMPLATE') continue;
        ids.push(entry.id);
        // 列表页用 encodeURIComponent(id) 拼链接，构建则直接用 id 当文件名：
        // 一旦 id 含需要转义的字符，两者就会指向不同地址，这里提前拦住
        if (encodeURIComponent(entry.id) !== entry.id) {
            problems.push(`${entry.id}：id 只能用英文、数字、下划线、连字符（它同时是文件名与网址）`);
        }

        const mdPath = path.join(ARTICLES_DIR, `${entry.id}.md`);
        const htmlPath = path.join(ARTICLES_DIR, `${entry.id}.html`);
        if (!fs.existsSync(mdPath)) {
            problems.push(`${entry.id}：缺少 Markdown 源文件`);
            continue;
        }
        if (!fs.existsSync(htmlPath)) {
            problems.push(`${entry.id}：缺少 HTML 页面`);
            continue;
        }

        const md = fs.readFileSync(mdPath, 'utf8');
        const html = fs.readFileSync(htmlPath, 'utf8');
        const h1 = (md.match(/^#\s+(.*)$/m) || [, ''])[1].trim();
        if (h1 !== entry.title) problems.push(`${entry.id}：H1「${h1}」与 articles.json 的 title「${entry.title}」不一致`);

        // 日期
        const m = String(entry.date).match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
        if (!m) {
            problems.push(`${entry.id}：日期格式应为「YYYY年M月D日」，当前是「${entry.date}」`);
        } else {
            const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
            if (iso > todayIso) problems.push(`${entry.id}：日期 ${iso} 在未来（今天是 ${todayIso}）`);
            if (m[1] < '2015') notes.push(`${entry.id}：日期 ${entry.date} 比较久远，确认一下是否有意为之`);
            if (!html.includes(`<span>${entry.date}</span>`)) problems.push(`${entry.id}：页面里的日期显示与 articles.json 不一致`);
            if (!html.includes(`"datePublished": "${iso}"`)) problems.push(`${entry.id}：JSON-LD 的 datePublished 不是 ${iso}`);
        }

        // 阅读时间
        const shown = html.match(/阅读时间：(\d+) 分钟/);
        const required = html.match(/"timeRequired": "PT(\d+)M"/);
        if (!shown || !required) problems.push(`${entry.id}：页面里缺少阅读时间或 timeRequired`);
        else if (shown[1] !== required[1]) problems.push(`${entry.id}：阅读时间 ${shown[1]} 分钟与 timeRequired PT${required[1]}M 不一致`);

        // 标签
        for (const tag of entry.tags || []) {
            if (!html.includes(`<span class="tag">${tag}</span>`)) problems.push(`${entry.id}：页面里缺少标签「${tag}」`);
        }

        // 占位符与未渲染的 Markdown
        for (const ph of ['文章标题', '文章摘要', '标签1', 'xxxx年xx月xx日']) {
            if (html.includes(ph)) problems.push(`${entry.id}：页面里还有未替换的占位符「${ph}」`);
        }
        const bodyStart = html.indexOf('<div class="article-body" id="articleContent">');
        const body = bodyStart >= 0 ? html.slice(bodyStart, html.indexOf('<div class="article-footer">')) : '';
        // 代码块里的 **、[]( 是正常代码，检查前先剔除
        const prose = body.replace(/<pre>[\s\S]*?<\/pre>/g, '');
        if (/\*\*/.test(prose)) problems.push(`${entry.id}：正文里有未渲染的 **`);
        if (/\]\(/.test(prose)) problems.push(`${entry.id}：正文里有未渲染的 Markdown 链接`);
        if ((html.match(/<h1>/g) || []).length !== 1) problems.push(`${entry.id}：<h1> 数量不是 1`);

        // 标签配对
        for (const [open, close] of [['<table', '</table>'], ['<ul', '</ul>'], ['<ol', '</ol>'], ['<pre', '</pre>'], ['<blockquote', '</blockquote>'], ['<div', '</div>']]) {
            const o = (html.match(new RegExp(open, 'g')) || []).length;
            const c = (html.match(new RegExp(close, 'g')) || []).length;
            if (o !== c) problems.push(`${entry.id}：${open} 与 ${close} 数量不匹配（${o}/${c}）`);
        }

        // emoji
        scanEmoji(md, `${entry.id}.md`);
        scanEmoji(body, `${entry.id}.html 正文`);

        // 站点级收录
        if (!sitemap.includes(`${SITE_URL}/articles/${entry.id}.html`)) problems.push(`${entry.id}：sitemap.xml 里没有收录`);
        if (!articlesPage.includes(`articles/${entry.id}.html`)) problems.push(`${entry.id}：articles.html 的静态列表里没有收录`);
    }

    // 反向检查：sitemap 里有没有指向不存在的文章
    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const loc = match[1];
        if (!loc.startsWith(`${SITE_URL}/articles/`)) continue;
        const file = loc.slice(`${SITE_URL}/articles/`.length);
        if (!fs.existsSync(path.join(ARTICLES_DIR, file))) problems.push(`sitemap.xml 指向了不存在的页面：${file}`);
    }

    console.log(`检查了 ${ids.length} 篇文章。`);
    if (notes.length) console.log(`\n提示：\n${notes.join('\n')}`);
    if (problems.length) {
        console.log(`\n发现 ${problems.length} 个问题：\n${problems.join('\n')}`);
        process.exit(1);
    }
    console.log('\n全部通过。');
}

main();
