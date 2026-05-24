/**
 * 全站通用脚本：导航、汉堡菜单、页脚年份、首页动效等
 */
(function () {
    'use strict';

    const MOBILE_BREAKPOINT = 900;
    const QQ_NUMBER = '3866477796';

    const GREETINGS = [
        'Hello, world!',
        '欢迎访问！',
        '探索无限可能',
        '创意与技术的交汇',
        '构建美好数字世界',
    ];

    function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function getCurrentPage() {
        const page = window.location.pathname.split('/').pop();
        return page || 'index.html';
    }

    function isNavLinkActive(href, currentPage) {
        if (!href) return false;
        const target = href.split('/').pop() || 'index.html';
        const current = currentPage || 'index.html';
        return target === current;
    }

    function initNavHighlight() {
        const currentPage = getCurrentPage();
        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.classList.toggle('active', isNavLinkActive(link.getAttribute('href'), currentPage));
        });
    }

    function initMobileNav() {
        const navbar = document.querySelector('.navbar');
        const navToggle = document.querySelector('.nav-toggle');
        const navOverlay = document.querySelector('.nav-overlay');
        const navLinks = document.querySelectorAll('.nav-links a');

        if (!navbar || !navToggle) return;

        function setNavOpen(open) {
            navbar.classList.toggle('nav-open', open);
            document.body.classList.toggle('nav-menu-open', open);
            navToggle.setAttribute('aria-expanded', String(open));
            navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
            if (navOverlay) {
                navOverlay.setAttribute('aria-hidden', String(!open));
            }
        }

        function closeNavMenu() {
            setNavOpen(false);
        }

        navToggle.addEventListener('click', () => {
            setNavOpen(!navbar.classList.contains('nav-open'));
        });

        navLinks.forEach((link) => link.addEventListener('click', closeNavMenu));

        if (navOverlay) {
            navOverlay.addEventListener('click', closeNavMenu);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeNavMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > MOBILE_BREAKPOINT) closeNavMenu();
        });
    }

    function initFooterYear() {
        const yearEl = document.getElementById('year');
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    }

    function initCopyTargets() {
        document.querySelectorAll('[data-copy]').forEach((el) => {
            el.addEventListener('click', async (event) => {
                event.preventDefault();
                const text = el.dataset.copy || QQ_NUMBER;
                try {
                    await navigator.clipboard.writeText(text);
                    alert('QQ号已复制到剪贴板');
                } catch {
                    alert(`QQ号: ${text}`);
                }
            });
        });
    }

    function initHomeGreeting() {
        const greetingEl = document.getElementById('greetingText');
        if (!greetingEl) return;

        greetingEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        let index = 0;
        setInterval(() => {
            greetingEl.style.opacity = '0';
            greetingEl.style.transform = 'translateY(10px)';

            window.setTimeout(() => {
                index = (index + 1) % GREETINGS.length;
                greetingEl.textContent = GREETINGS[index];
                greetingEl.style.opacity = '1';
                greetingEl.style.transform = 'translateY(0)';
            }, 300);
        }, 5000);
    }

    function initHeroParallax() {
        if (!document.getElementById('greetingText')) return;

        const hero = document.querySelector('#mainContent .hero, main .hero');
        if (!hero) return;

        let ticking = false;

        window.addEventListener(
            'scroll',
            () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    hero.style.transform = `translateY(${-(window.scrollY * 0.3)}px)`;
                    ticking = false;
                });
            },
            { passive: true }
        );
    }

    function initCardTilt() {
        document.querySelectorAll('.contact-card').forEach((card) => {
            card.addEventListener('mousemove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateY = ((x - centerX) / centerX) * 2;
                const rotateX = ((centerY - y) / centerY) * 2;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    function initPageEnter() {
        const { body } = document;
        body.style.opacity = '0';
        body.style.transform = 'translateY(20px)';

        requestAnimationFrame(() => {
            body.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            body.style.opacity = '1';
            body.style.transform = 'translateY(0)';
        });
    }

    onReady(() => {
        initNavHighlight();
        initMobileNav();
        initFooterYear();
        initCopyTargets();
        initHomeGreeting();
        initHeroParallax();
        initCardTilt();
        initPageEnter();
    });
})();
