# 如何下载 DeepSeek Harness

DeepSeek Harness（命令行工具名为 `dsh`）是 DeepSeek AI 开发并开源的一款 agent harness（智能体框架）。它采用"一切皆插件"的架构，由 Cordis 驱动，可以让你搭建、运行和管理自己的 AI 智能体。项目目前处于**开发者预览**阶段，迭代很快。这篇文章介绍两种最常用的获取方式。

## 方式一：npx 一行命令启动（推荐）

最简单的方式是通过 npm 生态的 `npx` 直接运行，不需要克隆仓库：

```bash
npx @deepseek-ai/dsh web
```

该命令默认会在 `http://127.0.0.1:3080` 启动 Web UI。本机运行时，它还会自动用默认浏览器打开页面；如果你是通过 SSH 远程连接启动，它只会打印宿主机 URL，由 SSH 客户端或编辑器负责端口转发。

如果不想让它自动打开浏览器，可以加上 `--no-open` 参数，仅启动服务器：

```bash
npx @deepseek-ai/dsh web --no-open
```

首次运行 `npx` 会自动下载对应的包，请保持网络畅通；之后再次运行会直接使用本地缓存，速度很快。

## 方式二：从源码克隆并构建

如果你想查看源码、参与贡献或者跟踪最新的开发进度，可以从 GitHub 克隆仓库：

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

这里需要用到 [pnpm](https://pnpm.io) 作为包管理器（如果还没有安装，可以用 `npm install -g pnpm` 安装）。`pnpm run build` 负责准备仓库产物，`pnpm dsh web` 会直接使用这些已构建的产物，不会重复构建。

## 常见问题排查

- **端口被占用**：3080 端口被其他程序占用时，先关闭占用进程，或查看官方 Web UI 指南中的端口配置项。
- **npx 下载失败**：多半是网络问题，可以重试，或配置 npm 镜像源后再次执行。
- **Node.js 版本过低**：源码构建需要较新的 Node.js 与 pnpm，建议使用 Node.js 的 LTS 版本。
- **访问不了页面**：确认命令确实在运行，且访问的地址是 `127.0.0.1:3080`（远程场景请检查端口转发）。

## 社区与支持

项目采用 MIT 许可证，完全开源。遇到问题或想反馈建议，可以前往 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交；如果你开发了自己的插件，也可以为插件仓库添加 `dsh-plugin` 话题，方便其他人发现。官方 README 中还提供了企微交流群与微信公众号的入口，欢迎加入。

## 结语

下载 DeepSeek Harness 的路径很清晰：**想快速体验就用 `npx @deepseek-ai/dsh web`，想深入折腾就从源码构建**。由于它仍处于开发者预览阶段，升级时可能会遇到破坏性变更，建议留意官方更新日志。去试试吧，几分钟后你就拥有自己的智能体工作台了。
