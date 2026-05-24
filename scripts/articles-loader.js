/**
 * 文章列表页：从 articles.json 动态渲染卡片
 */
(function () {
    'use strict';

    const GRID_ID = 'articlesGrid';
    const STATUS_CLASS = 'articles-grid__status';

    function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function renderStatus(grid, message) {
        const status = document.createElement('p');
        status.className = STATUS_CLASS;
        status.textContent = message;
        grid.replaceChildren(status);
    }

    function injectArticleListSchema(articles) {
        const schemaEl = document.getElementById('articles-list-schema');
        if (!schemaEl || !window.SITE) return;

        const site = window.SITE;
        schemaEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: articles.map((article, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: article.title,
                url: site.pageUrl(`articles/${encodeURIComponent(article.id)}.html`),
            })),
        });
    }

    function createArticleCard(article) {
        const card = document.createElement('a');
        card.href = `articles/${encodeURIComponent(article.id)}.html`;
        card.className = 'article-card';
        card.setAttribute('aria-label', `阅读文章：${article.title}`);

        const date = document.createElement('div');
        date.className = 'article-date';
        date.textContent = article.date || '';

        const title = document.createElement('h3');
        title.textContent = article.title;

        const excerpt = document.createElement('p');
        excerpt.className = 'article-excerpt';
        excerpt.textContent = article.excerpt || '';

        const tags = document.createElement('div');
        tags.className = 'article-tags';

        (article.tags || []).forEach((tag) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tags.append(tagEl);
        });

        card.append(date, title, excerpt, tags);
        return card;
    }

    function getValidArticles(data) {
        if (!Array.isArray(data)) return [];
        return data.filter(
            (item) => item && item.id && item.title && String(item.id).toUpperCase() !== 'TEMPLATE'
        );
    }

    async function loadArticles() {
        const grid = document.getElementById(GRID_ID);
        if (!grid) return;

        try {
            const response = await fetch('articles.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const articles = getValidArticles(await response.json());

            if (!articles.length) {
                renderStatus(grid, '暂无文章');
                return;
            }

            injectArticleListSchema(articles);

            const fragment = document.createDocumentFragment();
            articles.forEach((article) => {
                fragment.appendChild(createArticleCard(article));
            });
            grid.replaceChildren(fragment);
        } catch (error) {
            console.error('加载文章失败:', error);
            renderStatus(grid, '加载文章失败，请稍后重试');
        }
    }

    onReady(loadArticles);
})();
