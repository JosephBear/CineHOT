# CinemaHOT 本地试运行

当前用途是个人本地试运行，尚未公开上线。模型调用、自动采集和外部推送默认关闭；首次打开空站是正常状态，不会自动产生精选。精选门槛尚未用电影摄影人工样本校准。

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

打开 `http://localhost:3000`。该启动器强制外部动作开关关闭，API 与网页仅监听本机。按 Ctrl-C 停止三个进程，日志在 `work/local-api.log`、`local-web.log`、`local-worker.log`。数据库独立运行，停止时执行 `pg_ctl -D work/postgres17-data stop -m fast`。

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

## 采集与模型的后续启用

当前网络曾把海外域名解析为 `198.18.x.x`，正常采集会被 SSRF 防护拒绝。需要先为项目配置实际可用的 `EGRESS_PROXY_URL`，再运行 `node scripts/check-cinemahot-sources.ts`；不能通过允许私网抓取或修改系统 DNS 来跳过检查。此前真实页面解析与适配测试通过，不代表当前网络下所有海外源均可实时采集。

正式启用模型前，配置服务商和预算，完成人工标注与评测。然后自行启动 worker 并显式打开对应安全阀；本地启动器始终保持它们关闭。不要把 API key 或 `.data/` 提交到 Git。公开上线前还需确定运营主体、联系方式，并由使用者确认条款和隐私说明。
