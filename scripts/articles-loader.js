/**
 * 文章列表页：从 articles.json 动态渲染卡片
 */
(function () {
    'use strict';

    const GRID_ID = 'articlesGrid';
    const SEARCH_ID = 'articleSearch';
    const COUNT_ID = 'articleCount';
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

    /* ----- 搜索过滤 ----- */
    function getQuery(input) {
        return input ? input.value.trim() : '';
    }

    function filterArticles(articles, query) {
        const q = query.toLowerCase();
        if (!q) return articles;
        return articles.filter((article) => {
            const haystack = [
                article.title || '',
                article.excerpt || '',
                (article.tags || []).join(' '),
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }

    function updateCount(countEl, total, matched, query) {
        if (!countEl) return;
        countEl.textContent = query ? `找到 ${matched} / ${total} 篇` : `共 ${total} 篇`;
    }

    async function loadArticles() {
        const grid = document.getElementById(GRID_ID);
        if (!grid) return;

        const searchInput = document.getElementById(SEARCH_ID);
        const countEl = document.getElementById(COUNT_ID);

        try {
            const response = await fetch('articles.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const all = getValidArticles(await response.json());

            if (!all.length) {
                renderStatus(grid, '暂无文章');
                return;
            }

            injectArticleListSchema(all);

            function render() {
                const query = getQuery(searchInput);
                const articles = filterArticles(all, query);

                if (!articles.length) {
                    renderStatus(grid, query ? `未找到与“${query}”匹配的文章` : '暂无文章');
                } else {
                    const fragment = document.createDocumentFragment();
                    articles.forEach((article) => {
                        fragment.appendChild(createArticleCard(article));
                    });
                    grid.replaceChildren(fragment);
                }

                updateCount(countEl, all.length, articles.length, query);
            }

            render();

            if (searchInput) {
                searchInput.addEventListener('input', render);
            }
        } catch (error) {
            console.error('加载文章失败:', error);
            renderStatus(grid, '加载文章失败，请稍后重试');
        }
    }

    onReady(loadArticles);
})();
