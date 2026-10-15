# CinemaHOT 本地试运行

当前用途是个人本地试运行，尚未公开上线。仓库默认关闭模型、自动采集和外部推送；2026-10-15 本机已按授权开启采集与 DeepSeek 模型试运行，外部推送仍关闭。新建空数据库不会因打开网页而自动产生内容。精选门槛尚未用电影摄影人工样本校准。

## 这台电脑

- 项目：`/Volumes/AI/Cinema-hot/cinema-hot`
- 工作资料：`/Users/josephus/Documents/ChatGPT/Cinema-hot/work`
- Node 24.21.0：`/Users/josephus/.workbuddy-ai/binaries/node/versions/v24.21.0-darwin-arm64/bin/node`
- PostgreSQL 17.11：工作资料中的 `postgres17/bin`，包含 LZ4、pg_trgm、pg_dump、pg_restore；由官方源码构建，没有安装系统服务。
- 数据目录：`work/postgres17-data`；仅监听 `127.0.0.1:55434`；数据库 `cinemahot_local`。测试用独立的 `cinemahot_fixture_test`，不能拿试运行库跑测试。
- 当前本机 trust 认证仅适用于此隔离试运行库；同机进程可访问它。公开部署前必须另建有密码认证的部署环境。

私密 `.env` 已生成，权限为 600，不进入 Git。管理员密码在该文件的 `ADMIN_PASSWORD`，登录 `/admin/login`。项目使用新建库，没有迁移或覆盖此前数据库。

启动数据库（已在运行时无需重复）：

```sh
cd /Users/josephus/Documents/ChatGPT/Cinema-hot
./work/postgres17/bin/pg_ctl -D work/postgres17-data -l work/postgres17.log -o '-h 127.0.0.1 -p 55434 -k /Users/josephus/Documents/ChatGPT/Cinema-hot/work' start
```

启动三个进程：

```sh
python3 /Users/josephus/Documents/ChatGPT/Cinema-hot/work/run-local.py
```

打开 `http://localhost:3000`。该启动器读取私密 `.env` 中的采集和模型开关，强制推送关闭，API 与网页仅监听本机。按 Ctrl-C 停止三个进程，日志在 `work/local-api.log`、`local-web.log`、`local-worker.log`。数据库独立运行，停止时执行 `pg_ctl -D work/postgres17-data stop -m fast`。

## 后续修改后的检查

将 Node 和工作目录中的 `postgres17/bin` 加入当前终端的 PATH，再从项目目录运行：

```sh
npm run typecheck
DATABASE_URL=postgres://postgres@127.0.0.1:55434/cinemahot_fixture_test npm test
npm run test:standalone
npm run build -w @aihot/web
TEST_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_BROWSERS_PATH=/private/tmp/cinemahot-playwright node --test apps/web/tests/*.test.ts
node scripts/smoke.ts --base http://localhost:3000
```

浏览器测试默认使用 Playwright Chromium；这台电脑可指定 `TEST_CHROMIUM_CHANNEL=chrome` 使用已有 Google Chrome。WebKit 安装在上述临时目录，清理后需用项目自带 Playwright 重新安装 `webkit`。不改变任何测试断言。

## 当前采集与模型配置

本机 `.env` 已按授权打开 `COLLECT_ENABLED` 和 `MODEL_CALLS_ENABLED`，使用 DeepSeek 默认模型；数据库中的 `llm` 请求预算为 20/分钟、60/小时、120/滚动24小时。17 个信源间隔为 480 分钟。停止付费处理时可将该服务预算设为 0，或关闭模型开关后正常重启服务。

本机配置 `EGRESS_PROXY_URL=http://127.0.0.1:55435`，由启动器启动仅监听回环地址的项目代理，继续使用既有 DNS 与 SSRF 检查。此地址仅适用于本机；新服务器需要验证自己的出口条件，不应照抄回环代理地址。不得通过允许私网抓取或关闭 TLS 检查绕过失败。

费用、队列与空页面排查见[运行维护](../operations/README.md)。人工标注尚未完成，模型试运行不等于质量评测通过；公开上线前需完成质量校准、运营资料及使用规则和隐私说明确认。
