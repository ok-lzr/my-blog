// script.js - 高级Chrome风格交互

document.addEventListener('DOMContentLoaded', function() {

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

    // 导航卡片交互效果
    const navCards = document.querySelectorAll('.nav-card');
    navCards.forEach(card => {
        // 鼠标悬停时添加涟漪效果
        card.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 创建涟漪元素
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.width = '0';
            ripple.style.height = '0';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'radial-gradient(circle, rgba(26, 115, 232, 0.2) 0%, transparent 70%)';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            ripple.style.zIndex = '0';
            ripple.style.pointerEvents = 'none';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            // 触发涟漪动画
            setTimeout(() => {
                ripple.style.width = '300px';
                ripple.style.height = '300px';
                ripple.style.opacity = '0';
            }, 10);
            
            // 移除涟漪元素
            setTimeout(() => {
                if (ripple.parentNode === this) {
                    this.removeChild(ripple);
                }
            }, 600);
        });
        
        // 点击时的微交互
        card.addEventListener('click', function(e) {
            // 创建点击效果
            const clickEffect = document.createElement('div');
            clickEffect.style.position = 'absolute';
            clickEffect.style.left = '50%';
            clickEffect.style.top = '50%';
            clickEffect.style.width = '0';
            clickEffect.style.height = '0';
            clickEffect.style.borderRadius = '50%';
            clickEffect.style.background = 'radial-gradient(circle, rgba(26, 115, 232, 0.3) 0%, transparent 70%)';
            clickEffect.style.transform = 'translate(-50%, -50%)';
            clickEffect.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            clickEffect.style.zIndex = '0';
            clickEffect.style.pointerEvents = 'none';
            
            this.appendChild(clickEffect);
            
            setTimeout(() => {
                clickEffect.style.width = '200px';
                clickEffect.style.height = '200px';
                clickEffect.style.opacity = '0';
            }, 10);
            
            setTimeout(() => {
                if (clickEffect.parentNode === this) {
                    this.removeChild(clickEffect);
                }
            }, 400);
        });
    });

    // 滚动时的视差效果
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrolled = window.pageYOffset;
                const parallaxElements = document.querySelectorAll('.hero, .nav-card');
                
                parallaxElements.forEach((el, index) => {
                    const speed = el.classList.contains('hero') ? 0.3 : 0.1;
                    const yPos = -(scrolled * speed);
                    el.style.transform = `translateY(${yPos}px)`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    });

    // 问候语动态效果
    const greetingText = document.getElementById('greetingText');
    if (greetingText) {
        const greetings = [
            'Hello, world!',
            '欢迎访问！',
            '探索无限可能',
            '创意与技术的交汇',
            '构建美好数字世界'
        ];
        
        let currentIndex = 0;
        
        // 每5秒切换一次问候语
        setInterval(() => {
            greetingText.style.opacity = '0';
            greetingText.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % greetings.length;
                greetingText.textContent = greetings[currentIndex];
                
                greetingText.style.opacity = '1';
                greetingText.style.transform = 'translateY(0)';
                greetingText.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            }, 300);
        }, 5000);
    }

    // 鼠标移动时的微交互
    document.addEventListener('mousemove', function(e) {
        const cards = document.querySelectorAll('.nav-card, .card, .contact-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算鼠标位置相对于卡片中心的比例
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateY = ((x - centerX) / centerX) * 2;
            const rotateX = ((centerY - y) / centerY) * 2;
            
            // 应用微妙的3D效果
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        });
    });

    // 鼠标离开时重置
    document.addEventListener('mouseleave', function() {
        const cards = document.querySelectorAll('.nav-card, .card, .contact-card');
        cards.forEach(card => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });

    // 页面加载时的入场动画
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
        document.body.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 100);

    // 初始状态
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';

});