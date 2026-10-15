# CinemaHOT

电影摄影信息聚合平台，关注官方厂商、机构、专业媒体和创作者。当前为**本地试运行版本**，尚未公开上线。自动采集、模型调用与外部推送默认关闭，精选门槛**尚未校准**。

当前 17 个信源保留原有名单，并补齐 ARRI、Blackmagic Design、Wandering DP、Team Deakins 与影视工业网。默认只展示摘要和原文链接。

- [本地启动与验证](docs/cinemahot-local.md)
- [信源名单与适配依据](docs/cinemahot-sources.md)
- [101 条真实文章待标注清单与校准流程](docs/cinemahot-calibration.md)
- [品牌资源与离线生成](docs/cinemahot-brand.md)
- [English](README.en.md)

## 本机运行

这台电脑已准备 Node 24.21.0、PostgreSQL 17.11（含 LZ4 与备份恢复工具）、本地数据库和私密 `.env`，详见本地说明。先启动数据库，再执行：

```sh
python3 /Users/josephus/Documents/ChatGPT/Cinema-hot/work/run-local.py
```

浏览 `http://localhost:3000`。该启动器会启动 API、网页、worker，只监听本机并保持外部动作关闭。初始数据库只有信源配置，没有自动生成的精选内容。管理员密码位于本机私密 `.env`，不要提交该文件。

换电脑时按 [部署说明](docs/deploy.md) 准备 Node 24、PostgreSQL 17（需要 LZ4 和 pg_trgm）、项目依赖和 `.env`，运行迁移、信源初始化及前端构建；本机工作目录中的工具路径不具备跨电脑通用性。

## 功能与结构

支持动态列表、精选、事件归组、主题、日报/周报/月报，以及 RSS、公开 API、Agent Markdown 和 MCP。模型只在后台任务中调用，读页面不产生模型请求。付费服务经过回执和预算控制；站内全文默认关闭。

站点文案和资源在 `site/`，行业分类、主题、提示词与信源在 `industry/`。网页通过 HTTP 访问 API；公开出口统一使用后端发布层。

- [精选与评测](docs/selection.md)
- [架构](docs/architecture.md)
- [采集信源](docs/sources.md)
- [定制说明](docs/customize.md)
- [部署与更新](docs/deploy.md)

## 验证

```sh
npm run typecheck
DATABASE_URL=postgres://postgres@127.0.0.1:55434/cinemahot_fixture_test npm test
npm run test:standalone
npm run build -w @aihot/web
TEST_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_BROWSERS_PATH=/private/tmp/cinemahot-playwright node --test apps/web/tests/*.test.ts
node scripts/smoke.ts --base http://localhost:3000
```

先按本地说明设置当前终端的 Node、PostgreSQL 工具 PATH。测试使用独立测试数据库；付费服务仅连本地替身。海外实时采集仍需验证当前网络与项目代理，不能关闭 SSRF 防护来绕过私网地址拦截。

## 当前边界

`.data/labeling/` 已生成 101 条真实文章元数据供人工标注，尚无人工金标与真实模型评测；初始门槛 60/65/76 保持不变。公开上线前需要完成质量校准、联网采集验收、运营资料，以及由使用者确认使用规则和隐私说明。

## 开源来源

基于 [AIHOT](https://github.com/KKKKhazix/AIHOT) 开源框架改造。保留 [MIT License](LICENSE) 及原作者版权说明；内部 `@aihot/*` 包名沿用框架命名。
