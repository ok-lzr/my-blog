/**
 * 站点全局配置（SEO、结构化数据等引用）
 * 部署到自定义域名时，请同步修改 config/site.json 与各页 canonical 中的网址
 */
window.SITE = {
    name: 'ok-lzr的个人空间',
    url: 'https://ok-lzr.us.ci',
    description: 'ok-lzr 的个人网站，分享技术文章、开源项目、学习笔记与联系方式。',
    author: 'ok-lzr',
    locale: 'zh_CN',
    github: 'https://github.com/ok-lzr',
    ogImagePath: '/assets/avatar.png',
    get ogImage() {
        return `${this.url}${this.ogImagePath}`;
    },
    pageUrl(path) {
        const base = this.url.replace(/\/$/, '');
        const p = path.startsWith('/') ? path : `/${path}`;
        return `${base}${p}`;
    },
};
