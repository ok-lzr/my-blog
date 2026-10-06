# scripts/vendor

构建脚本依赖的第三方文件，随仓库一起提交，所以**构建全程不需要联网**。

## marked.umd.js

| 项 | 值 |
| --- | --- |
| 包 / 版本 | `marked` 18.1.0 |
| 来源 | npm 包里的 `lib/marked.umd.js`（等价于 `https://cdn.jsdelivr.net/npm/marked@18.1.0/lib/marked.umd.js`） |
| 许可 | MIT |
| 大小 | 47225 字节 |
| sha256 | `f424dcb508fdf93e0137a970cfce8f3207ea2e3f37eca5f7556a52875683632a` |

`scripts/build-articles.js` 每次构建都会校验这个 sha256，对不上就直接报错退出——
保证「同一份 md 永远产出同一份 HTML」，也挡住被替换过的文件。

### 升级 marked

1. `npm pack marked@<新版本> --pack-destination .tmp`
2. `tar -xzf .tmp/marked-<新版本>.tgz -C .tmp package/lib/marked.umd.js`
3. 用 `.tmp/package/lib/marked.umd.js` 覆盖本目录的 `marked.umd.js`
4. 算新的 sha256（`Get-FileHash scripts/vendor/marked.umd.js -Algorithm SHA256`），
   同步更新 `scripts/build-articles.js` 顶部的 `MARKED_SHA256` 和本文件的表格
5. 跑 `node scripts/build-articles.js` 与 `node scripts/check-articles.js`，
   **逐篇看 `git diff`**：不同版本的 marked 输出可能有细微差别，确认无误再提交
