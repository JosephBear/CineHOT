# CinemaHOT

**当前版本：v0.1.0 · 本地试运行**

电影摄影信息聚合平台，关注官方厂商、机构、专业媒体和创作者。当前配置 17 个信源，包含影视工业网；公开页面默认展示摘要与原文链接。精选门槛尚未校准，校园部署尚未完成。

2026 年 10 月 15 日，本机已按授权开启每 480 分钟采集及 DeepSeek 模型试运行，滚动 24 小时最多 120 次请求。这些是本机私密配置和数据库设置；新部署的采集、模型和外部推送默认关闭，克隆仓库不会复制本机运行状态或新闻数据。

## 从这里开始

| 要做的事 | 文件夹与入口 |
|---|---|
| 查看全部说明与项目结构 | [文档导航](docs/README.md) |
| 本机启动、换电脑、校园访问 | [部署](docs/deployment/README.md) |
| 增加、修改、暂停或检查信源 | [信源管理](docs/sources/README.md) |
| 配置模型、查看费用、排查无内容 | [运行维护](docs/operations/README.md) |
| 人工标注与精选校准 | [质量校准](docs/quality/calibration.md) |
| 更换 Logo 与品牌资源 | [品牌](docs/branding/README.md) |
| 查看本版内容与升级事项 | [v0.1.0 版本记录](docs/releases/v0.1.0.md) |

## 项目文件夹

```text
CinemaHOT/
├── VERSION                 当前版本号
├── docs/                   使用、管理、部署和版本文档
├── deploy/                 部署配置，含校园 Nginx 模板
├── industry/               信源名单、分类、主题与提示词
├── site/                   站名、Logo、页面文案和站内更新日志
├── apps/                   网页、API 和后台 worker
├── packages/               共享类型及后端采集、模型、发布逻辑
├── scripts/                初始化、迁移、检查、备份与评测工具
├── tests/                  自动化回归测试
└── database/               数据库迁移
```

首次部署按[部署指南](docs/deployment/README.md)执行。本机已有环境按[本地试运行](docs/deployment/local-trial.md)启动；本机工具路径不能直接用于另一台电脑。密钥写入私密 `.env`，数据库与 `.data/` 单独备份，不进入 Git。

## 开发与验证

需要 Node.js 24 和 PostgreSQL 17（含 LZ4、pg_trgm）。将对应工具加入 PATH 后运行：

```sh
npm ci
npm run typecheck
DATABASE_URL=postgres://postgres@127.0.0.1:55434/cinemahot_fixture_test npm test
npm run test:standalone
npm run build -w @aihot/web
TEST_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_BROWSERS_PATH=/private/tmp/cinemahot-playwright node --test apps/web/tests/*.test.ts
node scripts/smoke.ts --base http://localhost:3000
```

数据库地址和浏览器路径是本机示例，换环境时填写实际路径。测试库名称必须以 `_test` 或 `_ci` 结尾，不能使用运行库。测试中的付费服务仅连接本地替身。

## 开源来源

基于 [AIHOT](https://github.com/KKKKhazix/AIHOT) 改造，保留 [MIT License](LICENSE) 与原作者版权。内部 `@aihot/*` 包名沿用框架命名。另见 [English](README.en.md)。
