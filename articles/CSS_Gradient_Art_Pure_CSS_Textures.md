# CSS 渐变之美：用纯 CSS 绘制质感背景

渐变是 CSS 里最被低估的能力之一。很多人只把它当作"从一种颜色到另一种颜色"的过渡，但掌握角度、位置、颜色节点与多层叠加之后，渐变可以模拟出布料、金属、纸张、光晕等各种质感——而且不依赖任何图片资源。

## 线性渐变：掌握角度与色标

线性渐变的核心是角度和色标（color stop）。角度决定渐变方向，色标决定颜色在路径上的分布：

```css
/* 默认方向：从上到下 */
background: linear-gradient(#2c3e50, #8d6e63);

/* 指定角度：135 度对角线 */
background: linear-gradient(135deg, #2c3e50 0%, #4a3f35 40%, #d7c4a8 100%);

/* 硬过渡：在 50% 处产生清晰的边界 */
background: linear-gradient(90deg, #1a1a1a 0 50%, #f0f0f0 50% 100%);
```

硬过渡是个宝藏技巧——它让渐变不只是"柔和的过渡"，还能绘制条纹、棋盘格等图案。

## 径向渐变：模拟光与体积

径向渐变从中心点向外扩散，特别适合模拟聚光灯、光晕和球体体积感：

```css
/* 中心光晕：透明中心 + 深色边缘，模拟暗角 */
background: radial-gradient(ellipse at 70% 20%, transparent 30%, rgba(0,0,0,.55) 100%);

/* 球体体积感 */
background: radial-gradient(circle at 35% 30%, #fff 0%, #8d6e63 60%, #3e2723 100%);
```

注意 `at 70% 20%` 这类位置参数——把光源放在偏离中心的位置，质感会立刻"活"起来，而不是呆板的居中光斑。

## 锥形渐变：色环与扇形

锥形渐变（conic-gradient）绕中心旋转一圈，是绘制色环、仪表盘和扇区的利器：

```css
/* 色环 */
background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);

/* 饼图：四个扇区 */
background: conic-gradient(#4a6fa5 0 25%, #d7c4a8 25% 50%, #8d6e63 50% 75%, #2c3e50 75% 100%);
```

## 多层叠加：质感的来源

真正的高级感来自多层渐变的叠加。CSS 允许多个背景图层，第一层在最上面：

```css
.hero {
    /* 上：径向暗角；下：主渐变 */
    background:
        radial-gradient(ellipse at 70% 20%, transparent 30%, rgba(0,0,0,.55) 100%),
        linear-gradient(135deg, #2c3e50 0%, #4a3f35 40%, #8d6e63 70%, #d7c4a8 100%);
}

/* 斜纹布料质感：半透明条纹叠在渐变上 */
.striped {
    background:
        repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0 12px, transparent 12px 24px),
        linear-gradient(180deg, #4a3f35, #2c3e50);
}
```

这个技巧在摄影风格网站上尤其好用——用渐变替代图片，既保证了加载速度，又能让背景和整体色调严格统一。

## 性能与兼容性建议

- 渐变是 GPU 友好的绘制指令，性能远优于同等效果的图片，但避免在同一元素上堆叠过多图层。
- 对需要频繁变化的渐变（如 hover 动画），优先用 `transition` 过渡 `opacity` 或叠加层，而不是直接动画 `background`。
- 为 `conic-gradient` 提供降级背景，部分旧浏览器不支持。
- 颜色尽量使用 `rgba()` 配合半透明色标，叠加时更容易产生通透感。

## 结语

渐变看似简单，却是"用代码表达质感"最直接的入口。下次设计页面时，先别急着找背景图——打开开发者工具，试试用两三层渐变组合出你要的情绪。你会发现，最好的素材库其实就藏在 CSS 里。
