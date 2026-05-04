// articles.js - 动态加载文章脚本

async function loadArticles() {
    try {
        // 获取文章列表
        const response = await fetch('articles.json');
        const articles = await response.json();
        
        // 获取文章容器
        const articlesGrid = document.getElementById('articlesGrid');
        
        // 清空容器
        articlesGrid.innerHTML = '';
        
        // 为每篇文章创建卡片
        articles.forEach(article => {
            const articleCard = createArticleCard(article);
            articlesGrid.appendChild(articleCard);
        });
    } catch (error) {
        console.error('加载文章失败:', error);
        document.getElementById('articlesGrid').innerHTML = '<p style="color: #999; text-align: center; grid-column: 1/-1;">加载文章失败，请稍后重试</p>';
    }
}

function createArticleCard(article) {
    // 创建卡片容器
    const card = document.createElement('a');
    card.href = `articles/${article.id}.html`;
    card.className = 'article-card';
    
    // 创建日期元素
    const dateDiv = document.createElement('div');
    dateDiv.className = 'article-date';
    dateDiv.textContent = article.date;
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = article.title;
    
    // 创建摘要
    const excerpt = document.createElement('p');
    excerpt.className = 'article-excerpt';
    excerpt.textContent = article.excerpt;
    
    // 创建标签容器
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'article-tags';
    
    // 添加标签
    article.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
    });
    
    // 将所有元素添加到卡片
    card.appendChild(dateDiv);
    card.appendChild(title);
    card.appendChild(excerpt);
    card.appendChild(tagsDiv);
    
    return card;
}

// 页面加载完成后加载文章
document.addEventListener('DOMContentLoaded', function() {
    loadArticles();
});
