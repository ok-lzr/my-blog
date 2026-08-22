# 前端性能优化实战：首屏加载提速的 12 个技巧

性能优化最怕"凭感觉"。先把目标锚定在可测量的指标上——LCP（最大内容绘制）、FCP（首次内容绘制）、TTI（可交互时间）、CLS（布局偏移）——然后按"收益从大到小"的顺序逐项优化。下面 12 个技巧，全部来自真实项目里的高频收益点。

## 一、资源加载

1. **减少关键请求数**：首屏的 CSS/JS 请求数控制在个位数，能合并的合并，能内联的内联（尤其是首屏 CSS）。
2. **给静态资源加长缓存**：文件名带内容哈希（如 `style.8f3d.css`），缓存一年，更新只影响变化的那一个文件。
3. **优先加载关键资源**：用 `<link rel="preload">` 提前加载首屏字体或图片，用 `preconnect` 预热第三方域名。

## 二、图片：最大的体积黑洞

```html
<!-- 尺寸匹配 + 延迟加载 + 宽高占位，避免 CLS -->
<img
  src="hero-800w.webp"
  width="800" height="450"
  loading="lazy"
  decoding="async"
  alt="封面图"
>
```

4. **用现代格式**：WebP / AVIF 通常比 JPEG 小 30%–70%。
5. **按需提供尺寸**：`srcset` + `sizes` 让浏览器按屏幕宽度选图，别让手机下载 4K 图。
6. **首屏图禁用 lazy**：`loading="lazy"` 只用于视口以下的图片，首屏大图加 `fetchpriority="high"`。

## 三、JavaScript：首屏的隐形杀手

```html
<!-- 阻塞渲染的脚本放底部或改异步 -->
<script defer src="app.js"></script>

<!-- 非关键的第三方脚本按需加载 -->
<script>
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadChatWidget();
    });
    io.observe(document.querySelector('#chat-trigger'));
  }
</script>
```

7. **脚本全部 `defer`**：解析期间不阻塞 DOM 构建。
8. **按需加载第三方**：聊天组件、埋点 SDK 等，等用户真正接近时才加载。
9. **代码分割**：路由级懒加载，首屏只下载当前页面需要的 chunk。

## 四、渲染与布局

10. **给媒体预留尺寸**：图片、视频、iframe 都写死宽高或用 `aspect-ratio`，彻底消除 CLS。
11. **减少强制同步布局**：避免在循环里"读样式再写样式"，读写分开，必要时用 `requestAnimationFrame` 批处理。
12. **用 `content-visibility`**：视口外的长列表区块加 `content-visibility: auto`，跳过首屏渲染成本。

## 优化后的检查清单

| 指标 | 目标 | 常用手段 |
| --- | --- | --- |
| LCP | < 2.5s | 压缩图片、内联关键 CSS、预加载主图 |
| FCP | < 1.8s | 减少阻塞脚本、加快服务器响应 |
| TTI | < 3.8s | 延迟非关键 JS、代码分割 |
| CLS | < 0.1 | 预留尺寸、避免动态注入布局 |

## 结语

优化的原则永远是：**先测量，再优化，再测量**。用 Lighthouse 或 Performance 面板跑一次基线，挑收益最大的两项动手，改完复测对比。性能没有终点，但每一毫秒的节省，都是对用户耐心的一次尊重。
