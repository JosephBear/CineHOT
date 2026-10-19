# VPS 部署模板（2 GB 内存服务器）

当前服务器的实际部署方式：发布包 + Docker Compose，目录 `/opt/cinemahot`，数据库名和用户名都是 `cinemahot`，宿主机 Caddy 提供 HTTPS。升级步骤见 [升级到 v0.2.2](../../docs/deployment/upgrade-v0.2.2.md)。

| 文件 | 放到服务器的位置 | 作用 |
|---|---|---|
| `Dockerfile` + `Dockerfile.dockerignore` | 随发布包，在发布目录里构建 | 网页事先在其他电脑构建好（`npm run build -w @aihot/web`），服务器只装生产依赖，减轻 2 GB 内存的压力 |
| `compose.yml` | `/opt/cinemahot/compose.yml` | db、api、web、worker 四个服务，带内存和 CPU 限额；网站只开在 `127.0.0.1:3000`；worker 每个队列最多同时处理 1 件（`WORKER_MAX_CONCURRENCY=1`），直连 DeepSeek |
| `Caddyfile.example` | `/etc/caddy/Caddyfile`（按实际改域名和绑定地址） | HTTPS 反向代理；后台和登录路径对公网返回 404，只能经 SSH 隧道访问 |

## `.env`（放在 `/opt/cinemahot/.env`，不进 Git）

`compose.yml` 读这些变量；缺少带 `?` 的变量时 Compose 会直接报错，不会用空值启动。

| 变量 | 说明 |
|---|---|
| `CINEMAHOT_IMAGE` | 本次构建的镜像名，例如 `cinemahot-app:v0.2.2` |
| `CINEMAHOT_RELEASE` | 网页显示的版本，例如 `0.2.2` |
| `POSTGRES_PASSWORD` | 数据库密码（沿用现有值） |
| `SITE_URL` | 读者访问的地址 |
| `SESSION_SECRET`、`IMG_PROXY_SIGN_SECRET`、`ADMIN_PASSWORD` | 沿用现有值 |
| `LLM_API_KEY` | DeepSeek 密钥 |
| `COLLECT_ENABLED`、`MODEL_CALLS_ENABLED` | 设为 `true` 才采集和调用模型 |
| `AIHOT_CREDENTIALS_DIR` | 可选；以前在 compose 里设置过的，沿用原值 |

费用由数据库里的 `llm` 预算（每分钟、每小时、滚动24小时上限）和付费回执控制，不再使用试运行期间的守护代理。
