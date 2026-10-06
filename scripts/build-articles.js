/**
 * 站点发布脚本：把 articles/<ID>.md 渲染成 articles/<ID>.html
 *
 * 用法：node scripts/build-articles.js
 *
 * 设计说明：
 *   1. articles.json 是唯一的信息源（标题、日期、摘要、标签、文件名）。
 *   2. templates/article.html 是唯一的页面骨架，脚本在里面做定点替换，
 *      所以改模板 = 改全站文章页结构（它是构建用的，不对外发布）。
 *   3. Markdown 渲染用 marked（GFM + breaks: true），与线上 md2html 工具同款配置。
 *      渲染器已随仓库放在 scripts/vendor/marked.umd.js（带 SHA-256 校验），
 *      构建全程不联网，同一份 md 永远产出同一份 HTML。
 *
 * 新增一篇文章：写 articles/<ID>.md → 在 articles.json 追加一条 → 跑本脚本。
 * （sitemap.xml、articles.html 的 <noscript> 列表、index.html 的动态仍需手动同步，
 *   见 articles/TEMPLATE.md 里的《发布教程》。）
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const TEMPLATE_FILE = path.join(ROOT, 'templates', 'article.html');
const LIST_FILE = path.join(ROOT, 'articles.json');
const SITE_URL = 'https://ok-lzr.us.ci';
const MARKED_FILE = path.join(__dirname, 'vendor', 'marked.umd.js');
/* 与 scripts/vendor/README.md 记录的版本一致；有意升级 marked 时两者必须同步更新 */
const MARKED_SHA256 = 'f424dcb508fdf93e0137a970cfce8f3207ea2e3f37eca5f7556a52875683632a';

/* ------------------------------------------------------------------ */
/* Markdown → HTML                                                     */
/* ------------------------------------------------------------------ */
let marked = null;

function loadMarked() {
    if (marked) return marked;
    let code;
    try {
        code = fs.readFileSync(MARKED_FILE, 'utf8');
    } catch (error) {
        throw new Error(`找不到本地 Markdown 渲染器 ${path.relative(ROOT, MARKED_FILE)}：${error.message}`);
    }
    const actual = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
    if (actual !== MARKED_SHA256) {
        throw new Error(
            `Markdown 渲染器校验失败：${path.relative(ROOT, MARKED_FILE)}\n` +
                `  期望 sha256 ${MARKED_SHA256}\n` +
                `  实际 sha256 ${actual}\n` +
                '  如果是有意升级 marked，请同时更新本脚本的 MARKED_SHA256 与 scripts/vendor/README.md。'
        );
    }
    const mod = { exports: {} };
    new Function('module', 'exports', code)(mod, mod.exports);
    const lib = mod.exports;
    marked = lib.marked || lib;
    if (typeof marked.setOptions === 'function') marked.setOptions({ gfm: true, breaks: true });
    return marked;
}

function parseMarkdown(md) {
    return typeof marked.parse === 'function'
        ? marked.parse(md, { gfm: true, breaks: true })
        : marked(md, { gfm: true, breaks: true });
}

const DEPTH_TAGS = new Set(['ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'pre', 'div']);
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function prettyPrint(html, base) {
    const pad = (n) => ' '.repeat(base + n * 4);
    const out = [];
    let depth = 0;
    let inPre = false;

    const countOpens = (s) =>
        [...s.matchAll(/<([A-Za-z0-9]+)(?:\s[^>]*)?>/g)].filter(
            (m) => DEPTH_TAGS.has(m[1].toLowerCase()) && !m[0].endsWith('/>') && !VOID_TAGS.has(m[1].toLowerCase())
        ).length;
    const countCloses = (s) => [...s.matchAll(/<\/([A-Za-z0-9]+)>/g)].filter((m) => DEPTH_TAGS.has(m[1].toLowerCase())).length;
    const countLeadingClosers = (s) => {
        let n = 0;
        let rest = s;
        for (;;) {
            const m = rest.match(/^<\/([A-Za-z0-9]+)>/);
            if (m && DEPTH_TAGS.has(m[1].toLowerCase())) {
                n++;
                rest = rest.slice(m[0].length);
            } else {
                return n;
            }
        }
    };

    for (const raw of html.replace(/\r\n/g, '\n').split('\n')) {
        const line = raw.trim();

        if (inPre) {
            out.push(pad(depth) + raw.replace(/\s+$/, ''));
            if (line.includes('</pre>')) {
                inPre = false;
                depth = Math.max(0, depth - 1);
            }
            continue;
        }
        if (line === '') continue;

        const leading = countLeadingClosers(line);
        const opens = countOpens(line);
        const closes = countCloses(line);
        const target = Math.max(0, depth - leading);

        if (target === 0 && out.length && out[out.length - 1] !== '') out.push('');
        out.push(pad(target) + line);
        depth = Math.max(0, target + opens - (closes - leading));

        if (/<pre[ >]/.test(line) && !/<\/pre>/.test(line)) inPre = true;
    }
    return out.join('\n');
}

/** marked 的表格会省略 </tr>、把 <tbody><tr> 挤在一行，这里重排成规范结构 */
function formatTable(raw) {
    const tokens = raw.match(/<[^>]+>|[^<]+/g) || [];
    const sections = [];
    let currentRow = null;
    let cellBuf = null;

    const flushRow = () => {
        if (currentRow) {
            sections.push(`<tr>${currentRow.join('')}</tr>`);
            currentRow = null;
        }
    };

    for (const tok of tokens) {
        if (cellBuf !== null) {
            if (/^<\/(td|th)>$/i.test(tok)) {
                currentRow.push(cellBuf + tok);
                cellBuf = null;
            } else {
                cellBuf += tok;
            }
            continue;
        }
        const open = tok.match(/^<([a-zA-Z0-9]+)/);
        const close = tok.match(/^<\/([a-zA-Z0-9]+)>$/);
        if (open) {
            const tag = open[1].toLowerCase();
            if (tag === 'td' || tag === 'th') {
                cellBuf = tok;
                continue;
            }
            if (tag === 'tr') {
                flushRow();
                currentRow = [];
                continue;
            }
            if (['table', 'thead', 'tbody', 'tfoot'].includes(tag)) {
                flushRow();
                sections.push(tok);
                continue;
            }
        } else if (close) {
            const tag = close[1].toLowerCase();
            if (tag === 'tr') {
                flushRow();
                continue;
            }
            if (['table', 'thead', 'tbody', 'tfoot'].includes(tag)) {
                flushRow();
                sections.push(tok);
                continue;
            }
        }
    }
    flushRow();
    return sections.join('\n');
}

function normalizeTables(html) {
    const lines = html.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('<table')) {
            const chunk = [];
            while (i < lines.length) {
                chunk.push(lines[i]);
                const done = lines[i].includes('</table>');
                i++;
                if (done) break;
            }
            i--;
            out.push(formatTable(chunk.join('')));
        } else {
            out.push(lines[i]);
        }
    }
    return out.join('\n');
}

function renderBody(markdown) {
    const bodyMd = markdown.replace(/^#\s+.*(?:\r?\n)+/, ''); // H1 已由页面骨架渲染
    let html = parseMarkdown(bodyMd);
    html = html.replace(/<table>/g, '<div class="table-wrapper">\n<table>').replace(/<\/table>/g, '</table>\n</div>');
    html = normalizeTables(html);
    html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, (m, url) =>
        /ok-lzr\.us\.ci/.test(url) ? m : `<a href="${url}" target="_blank" rel="noopener"`
    );
    html = html.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return prettyPrint(html, 20);
}

/** 阅读时间：正文（去掉 H1、代码块、Markdown 标记、空白）字符数，350 字符/分钟，最低 3 分钟 */
function readingMinutes(markdown) {
    const body = markdown.replace(/^#\s.*$/m, '');
    const plain = body
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[#>*`|\-]/g, '')
        .replace(/\s+/g, '');
    return Math.max(3, Math.round(plain.length / 350));
}

/* ------------------------------------------------------------------ */
/* 套页面骨架                                                          */
/* ------------------------------------------------------------------ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (s) => JSON.stringify(String(s));

function parseDate(display) {
    const m = String(display).match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (!m) throw new Error(`日期格式应为「YYYY年M月D日」，收到：${display}`);
    const [, y, mo, d] = m;
    return { display: `${y}年${Number(mo)}月${Number(d)}日`, iso: `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}` };
}

function buildPage(entry, bodyHtml, minutes, template) {
    const url = `${SITE_URL}/articles/${entry.id}.html`;
    const date = parseDate(entry.date);
    const tags = entry.tags || [];
    const twitter = entry.twitter || entry.excerpt;
    let out = template;

    out = out.replace('<title>文章标题 · ok-lzr的个人空间</title>', `<title>${esc(entry.title)} · ok-lzr的个人空间</title>`);
    out = out.replace('文章摘要：用一两句话概括本文内容，便于搜索引擎展示。', esc(entry.excerpt));
    out = out.replace('content="noindex, nofollow"', 'content="index, follow"');
    out = out.split(`${SITE_URL}/articles/文章标题.html`).join(url);
    out = out.replace('<meta property="og:title" content="文章标题 · ok-lzr的个人空间">', `<meta property="og:title" content="${esc(entry.title)} · ok-lzr的个人空间">`);
    out = out.replace('<meta property="og:description" content="文章摘要">', `<meta property="og:description" content="${esc(entry.excerpt)}">`);
    out = out.replace('<meta name="twitter:title" content="文章标题">', `<meta name="twitter:title" content="${esc(entry.title)}">`);
    out = out.replace('<meta name="twitter:description" content="文章摘要">', `<meta name="twitter:description" content="${esc(twitter)}">`);
    out = out.replace('"headline": "文章标题"', `"headline": ${json(entry.title)}`);
    out = out.replace('"description": "文章摘要"', `"description": ${json(entry.excerpt)}`);
    out = out.replace('"datePublished": "2026-05-04"', `"datePublished": "${date.iso}"`);
    out = out.replace('"dateModified": "2026-05-04"', `"dateModified": "${date.iso}"`);
    out = out.replace('"keywords": ["标签1", "标签2"]', `"keywords": ${JSON.stringify(tags)}`);
    out = out.replace('"articleSection": "标签1"', `"articleSection": ${json(tags[0] || '')}`);
    out = out.replace('"timeRequired": "PT8M"', `"timeRequired": "PT${minutes}M"`);
    out = out.replace('"name": "文章标题", "item":', `"name": ${json(entry.title)}, "item":`);
    out = out.replace('<h1>文章模板</h1>', `<h1>${esc(entry.title)}</h1>`);
    out = out.replace('<span>xxxx年xx月xx日</span>', `<span>${date.display}</span>`);
    out = out.replace('<span>阅读时间：8分钟</span>', `<span>阅读时间：${minutes} 分钟</span>`);
    out = out.replace(
        /<span class="tag">标签1<\/span>\s*<span class="tag">标签2<\/span>/,
        tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('\n                        ')
    );

    const bodyMarker = '<div class="article-body" id="articleContent">';
    const footerMarker = '<div class="article-footer">';
    const bodyStart = out.indexOf(bodyMarker) + bodyMarker.length;
    const footerIdx = out.indexOf(footerMarker);
    const bodyEnd = out.lastIndexOf('</div>', footerIdx);
    if (bodyStart < bodyMarker.length || footerIdx < 0 || bodyEnd < 0) {
        throw new Error('页面骨架里找不到 articleBody / article-footer 标记，请检查 templates/article.html');
    }
    out = out.slice(0, bodyStart) + '\n' + bodyHtml + '\n                ' + out.slice(bodyEnd);

    const leftovers = ['文章标题', '文章摘要', '标签1', '标签2', 'xxxx年xx月xx日'].filter((s) => out.includes(s));
    if (leftovers.length) throw new Error(`页面骨架里还有未替换的占位符：${leftovers.join('、')}`);
    return out;
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */
async function main() {
    await loadMarked();
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    const list = JSON.parse(fs.readFileSync(LIST_FILE, 'utf8'));

    const report = [];
    const problems = [];

    for (const entry of list) {
        if (!entry || entry.id === 'TEMPLATE' || !entry.file) continue;
        const mdFile = path.join(ARTICLES_DIR, `${entry.id}.md`);
        if (!fs.existsSync(mdFile)) {
            problems.push(`缺少源文件：articles/${entry.id}.md（articles.json 里登记了，但没有 md）`);
            continue;
        }
        const markdown = fs.readFileSync(mdFile, 'utf8').replace(/\r\n/g, '\n');
        const h1 = (markdown.match(/^#\s+(.*)$/m) || [, ''])[1].trim();
        if (h1 !== entry.title) {
            problems.push(`标题不一致：${entry.id}（md 里是「${h1}」，articles.json 里是「${entry.title}」）`);
        }

        const minutes = readingMinutes(markdown);
        const html = buildPage(entry, renderBody(markdown), minutes, template);
        fs.writeFileSync(path.join(ARTICLES_DIR, entry.file), html, 'utf8');
        report.push({ id: entry.id, date: entry.date, minutes, bytes: Buffer.byteLength(html, 'utf8') });
    }

    console.log(report.map((r) => `${r.id}\t${r.date}\t${r.minutes} 分钟\t${r.bytes} B`).join('\n'));
    console.log(`\n共生成 ${report.length} 个文章页面。`);
    if (problems.length) {
        console.log('\n需要注意：');
        console.log(problems.join('\n'));
    }
}

main().catch((error) => {
    console.error(`\n构建失败：${error.message}`);
    process.exit(1);
});
