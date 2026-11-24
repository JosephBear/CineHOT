# CineHOT 部署

主站在 Oracle ARM64 主机上，用 Docker Compose 运行 GHCR 发布的镜像；校园服务器只做只读镜像。部署到另一台机器需要独立准备密钥、数据库和模型预算；复制代码不会迁移新闻数据，也不会自动打开付费调用。

## 选择部署方式

- **现有主站（Oracle）升级**：按 [Oracle 部署模板](../../deploy/oracle/README.md) 的“已有 Oracle 项目升级”执行，每个版本要做的额外操作写在[版本记录](../releases/README.md)里。
- **新建一台主站**：按 [Oracle 部署模板](../../deploy/oracle/README.md)；它复用 [`deploy/vps/compose.yml`](../../deploy/vps/compose.yml)。
- **让校园内的同学访问**：[校园镜像](campus.md)（校园服务器只转发并缓存主站）。
- **当前电脑本机运行**：[本地试运行](local-trial.md)。
- **Docker、HTTPS、非 Docker、更新和备份细节**：[完整部署参考](../deploy.md)。

`upgrade-v0.2.3.md`、`upgrade-v0.3.0.md`、`upgrade-v0.3.2.md` 和 `deploy/vps/upgrade.sh` 是主站在 AWS VPS 时期（2026-10-24 至 11 月中旬）的升级方式，留作参考；现在的主站按 Oracle 模板升级。

## 在新服务器上部署

仓库是公开的，直接克隆，切到要部署的版本标签：

```sh
git clone https://github.com/JosephBear/CineHOT.git
cd CineHOT
git checkout v0.3.5
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

先在后台配置并预览信源，在“设置”中确认模型服务的请求预算；当前站点使用默认模型，对应服务为 `llm`。日常采用 20 次/分钟、500 次/小时、2000 次/滚动 24 小时（2026-10-24 起；每篇相关资料至少 5 次调用，200 次会持续积压）。这是次数上限，不是人民币金额上限。

确认后将 `.env` 中 `COLLECT_ENABLED`、`MODEL_CALLS_ENABLED` 显式设为 `true`，重建 API 和 worker 容器使环境生效：

```sh
docker compose up -d --force-recreate api worker
```

新信源首轮最多导入 8 条，已有素材随后进入处理队列；达到预算会等待，不保证固定几分钟后出现内容。站点固定采集间隔为 60 分钟（`site/site.ts` 的 `SOURCE_DEFAULTS.fixedIntervalMinutes`）。推送开关保持关闭，直到明确配置并授权推送。

**升级脚本不会替你打开采集。** 每次升级后都要核对 worker 正在运行、两个开关为 `true`，并确认有新文章入库；2026-11-18 起的断更就是升级后采集没有恢复。站外探测见 [运行维护](../operations/README.md#站外探测)。

## 更新已有部署

按[完整部署参考中的更新和备份](../deploy.md#更新)执行。`scripts/seed.ts` 只添加新 ID，不会覆盖现有信源；改了已有信源配置的版本，会在版本记录里写明要在后台手动改哪些。
