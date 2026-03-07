// script.js

document.addEventListener('DOMContentLoaded', function() {

    // 主题切换
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('personalSiteTheme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        updateToggleText('light');
    } else {
        updateToggleText('dark');
    }

    themeToggle.addEventListener('click', function() {
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            localStorage.setItem('personalSiteTheme', 'dark');
            updateToggleText('dark');
        } else {
            body.classList.add('light-mode');
            localStorage.setItem('personalSiteTheme', 'light');
            updateToggleText('light');
        }
    });

    function updateToggleText(mode) {
        if (mode === 'light') {
            themeToggle.textContent = '🌓 深色';
        } else {
            themeToggle.textContent = '🌓 浅色';
        }
    }

    // 根据当前页面高亮导航链接
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 年份更新
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 双击问候语动画
    const greeting = document.getElementById('greetingText');
    if (greeting) {
        greeting.addEventListener('dblclick', function() {
            this.style.animation = 'none';
            this.offsetHeight;
            this.style.animation = 'fadeScale 0.6s ease-out';
        });
    }

});