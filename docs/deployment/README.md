# CinemaHOT 部署

当前版本 v0.2.0 已在本机试运行。部署到另一台机器需要独立准备密钥、数据库和模型预算；复制代码不会迁移新闻数据，也不会自动打开付费调用。

## 选择部署方式

- 交给服务器负责人逐步执行：[服务器部署手册（含每步目的与检查）](server-runbook.md)。
- 当前服务器（`/opt/cinemahot`，发布包 + Docker Compose）升级：[升级到 v0.2.2（逐步操作）](upgrade-v0.2.2.md)；服务器模板见 [`deploy/vps/`](../../deploy/vps/README.md)。
- 当前电脑启动：[本地试运行](local-trial.md)。
- 让校园内的同学访问：[校园部署](campus.md)。
- Docker、HTTPS、非 Docker、更新和备份细节：[完整部署参考](../deploy.md)。

## 在新服务器上部署

以下命令从私有仓库取得指定版本，需要使用有该仓库读取权限的 GitHub 账号认证：

```sh
git clone https://github.com/JosephBear/cinemahot.git
cd cinemahot
git checkout v0.2.0
node scripts/init-env.ts
```

`init-env.ts` 需要 Node.js 24，生成权限为 600 的 `.env` 并显示一次管理员密码。不要把 API Key 放在命令参数或聊天里，直接编辑服务器上的 `.env`：

```dotenv
LLM_BASE_URL=https://api.deepseek.com/
LLM_MODEL=deepseek-flash
LLM_API_KEY=
LLM_EXTRA_JSON={"thinking":{"type":"disabled"}}
SITE_URL=http://localhost:3000
PORT=127.0.0.1:3000
COLLECT_ENABLED=false
MODEL_CALLS_ENABLED=false
```

其余随机密钥保留初始化生成值。若服务器没有 Node，可按[完整参考](../deploy.md)从 `.env.example` 手工初始化；不要沿用示例密码。然后启动：

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 api worker web
```

以上配置仅从服务器本机访问。远程维护可通过 SSH 转发本机端口；校园读者访问需要再按[校园部署](campus.md)配置反向代理。后台位于 `/admin/login`。

## 开启采集与模型

先在后台配置并预览信源，在“设置”中确认模型服务的请求预算；当前站点使用默认模型，对应服务为 `llm`。日常采用 20 次/分钟、150 次/小时、1000 次/滚动 24 小时（2026-10-19 起：94 个信源每小时采集，每篇相关资料至少 5 次调用，200 次会持续积压）。这是次数上限，不是人民币金额上限。

确认后将 `.env` 中 `COLLECT_ENABLED`、`MODEL_CALLS_ENABLED` 显式设为 `true`，重建 API 和 worker 容器使环境生效：

```sh
docker compose up -d --force-recreate api worker
```

新信源首轮最多导入 8 条，已有素材随后进入处理队列；达到预算会等待，不保证固定几分钟后出现内容。站点固定采集间隔为 60 分钟。推送开关保持关闭，直到明确配置并授权推送。

## 更新已有部署

按[完整部署参考中的更新和备份](../deploy.md#更新)执行；当前服务器升级按[升级到 v0.2.2](upgrade-v0.2.2.md)。v0.2.0 新增预算起算点迁移 0084；已有 Blackmagic 信源仍需保留正文规则，旧间隔需改为 360，见[本版升级说明](../releases/v0.2.0.md)。`scripts/seed.ts` 只添加新 ID，不会覆盖现有信源。
