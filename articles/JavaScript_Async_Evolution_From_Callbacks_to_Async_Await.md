# JavaScript 异步进化史：从回调地狱到 async/await

JavaScript 的异步编程，几乎是一部"为了让代码更好读"的奋斗史。从回调函数到 Promise，再到 async/await，每一代方案都解决了上一代的痛点，同时也留下了新的权衡。理解这条演进线，比单纯记住某个 API 有用得多。

## 回调时代：函数即答案，嵌套即噩梦

最初的异步方案是把"下一步做什么"作为参数传给异步函数。单层回调很自然，但业务一旦复杂，就会出现著名的"回调地狱"：

```javascript
getUser(id, function (user) {
    getPosts(user.id, function (posts) {
        getComments(posts[0].id, function (comments) {
            render(comments); // 缩进越来越深，逻辑越来越难追踪
        });
    });
});
```

回调的痛点不止是缩进：错误处理要靠每个回调里的 `err` 参数手动传递；控制流（并行、串行、限流）需要自己造轮子；一旦忘记调用回调，程序就静默卡死。

## Promise：把"将来"变成对象

Promise 把异步结果抽象成一种状态机：pending（进行中）、fulfilled（成功）、rejected（失败），并且状态一旦定型就不可再变。这让组合成为可能：

```javascript
getUser(id)
    .then((user) => getPosts(user.id))
    .then((posts) => getComments(posts[0].id))
    .then((comments) => render(comments))
    .catch((err) => handleError(err));
```

串行流程终于变成了扁平链。更关键的是，Promise 提供了标准化的并发工具：`Promise.all` 等待全部完成，`Promise.race` 取最先完成者，`Promise.allSettled` 无论成败都等待。错误也统一汇入 `catch`，不再依赖约定。

## async/await：用同步的姿势写异步

Promise 链已经很好，但读到链式代码时，大脑仍需"翻译"一遍。async/await 是语法层面的糖，让异步代码长得像同步代码：

```javascript
async function loadComments(id) {
    try {
        const user = await getUser(id);
        const posts = await getPosts(user.id);
        const comments = await getComments(posts[0].id);
        render(comments);
    } catch (err) {
        handleError(err);
    }
}
```

每一行都按直觉顺序执行，`try/catch` 也回归了熟悉的形态。需要注意：`await` 只能出现在 `async` 函数里；串行的多个 `await` 会逐个等待，如果任务之间没有依赖，应该用 `Promise.all` 并行执行。

## 并发控制的现代实践

实际项目里最常见的坑，是"看起来并行"的串行 await：

```javascript
// 慢：两个请求串行等待
const a = await fetchA();
const b = await fetchB();

// 快：两个请求并行发出
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

对于批量任务（比如一次上传几十张图片），还需要限制并发数。现代环境里可以借助 `AbortSignal.timeout` 做超时、用 `for await...of` 消费异步迭代器，配合 `Promise.allSettled` 让批量任务"尽力而为"。

## 各代方案的取舍

| 方案 | 核心优点 | 主要痛点 |
| --- | --- | --- |
| 回调 | 语法零成本 | 嵌套深、错误难管理 |
| Promise | 可组合、错误统一 | 链式代码仍需脑内翻译 |
| async/await | 接近同步的阅读体验 | 容易写出串行等待 |

## 结语

异步方案的每次进化，本质都是把"控制权"从开发者手里逐渐收归到语言机制里，让代码的意图更清晰、错误更不容易被忽略。写代码时记住一个判断标准：如果一段异步逻辑要"读两遍才能懂"，那就是该重构的信号了。
