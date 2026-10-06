/**
 * 资源版本号（缓存串）：把 HTML 里对本地 CSS/JS 的 ?v=xxx 统一成文件内容的短哈希。
 *
 * 以前是手工维护的（style.css?v=9、script.js?v=8…），而且已经不一致了
 * （index/about/project 是 v9，articles.html/404 是 v10）。改一次样式要记得挨个页面改数字，
 * 漏一处浏览器就会继续用旧缓存。现在版本号由内容算出：改文件 → 值自动变。
 *
 * 被 build-articles.js（写入）与 check-articles.js（校验）共用，
 * 避免两边各维护一份资源清单而慢慢漂移。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

/** 需要带版本号的本地资源（相对仓库根） */
const ASSETS = [
    'styles/style.css',
    'styles/article.css',
    'scripts/site-config.js',
    'scripts/script.js',
    'scripts/articles-loader.js',
];

/** 站点里就地维护的页面；文章页由构建脚本按骨架生成，不在这里列 */
const ROOT_PAGES = ['index.html', 'articles.html', 'project.html', 'about.html', '404.html'];

/** 文章页的唯一骨架（构建用，不对外发布） */
const TEMPLATE_FILE = path.join(ROOT, 'templates', 'article.html');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* 匹配「href/src + 可选 ./ 或 ../ 前缀 + 资源路径 + 可选 ?v=... 」
   捕获组：1 属性名 / 2 前缀 / 3 资源路径 / 4 版本号（可能 undefined） */
const STAMP_RE = new RegExp(
    `(href|src)="((?:\\.\\./|\\./)?)(${ASSETS.map(escapeRe).join('|')})(?:\\?v=([^"]*))?"`,
    'g'
);

/** 资源路径 → 内容短哈希（8 位十六进制） */
function computeVersions() {
    const versions = {};
    for (const asset of ASSETS) {
        const bytes = fs.readFileSync(path.join(ROOT, asset));
        versions[asset] = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 8);
    }
    return versions;
}

/** 把 HTML 里这些资源的 ?v= 换成当前版本号；原本没带的也补上 */
function stampHtml(html, versions) {
    return html.replace(STAMP_RE, (match, attr, prefix, asset) => `${attr}="${prefix}${asset}?v=${versions[asset]}"`);
}

/** 读出 HTML 里引用的资源及其版本号，供校验使用 */
function readStamps(html) {
    return [...html.matchAll(STAMP_RE)].map((m) => ({ asset: m[3], version: m[4] }));
}

module.exports = { ROOT, ASSETS, ROOT_PAGES, TEMPLATE_FILE, computeVersions, stampHtml, readStamps };
