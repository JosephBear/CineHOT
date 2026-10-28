# VPS 部署模板（2 GB 内存服务器）

当前服务器的实际部署方式：Docker Compose，目录 `/opt/cinemahot`，数据库名和用户名都是 `cinemahot`，宿主机 Caddy 提供 HTTPS。从 v0.3.0 起，推送版本标签后由 GitHub Actions（`.github/workflows/release-image.yml`）构建镜像（已发布至 v0.3.2 的版本为 `ghcr.io/josephbear/cinemahot-app:<版本>`，改名后的新构建为 `ghcr.io/josephbear/cinehot-app:<标签>`），服务器只拉取，不再打包和构建。升级步骤见 [升级到 v0.3.2](../../docs/deployment/upgrade-v0.3.2.md)（还在 v0.2.3 的先看 [v0.3.0](../../docs/deployment/upgrade-v0.3.0.md)）。

| 文件 | 放到服务器的位置 | 作用 |
|---|---|---|
| `Dockerfile` + `Dockerfile.dockerignore` | 不放到服务器；GitHub Actions 用它们构建镜像 | 网页先构建好（`npm run build -w @aihot/web`），镜像里只装生产依赖 |
| `upgrade.sh` | 从镜像里取出后运行，见升级文档 | 升级到指定版本：先拉镜像，再停写、备份、换 compose 与镜像、迁移、冒烟检查、启动 worker |
| `check.sh` | 同上 | 只读核对：版本、容器与内存、冒烟、预算与用量、采集与积压、卡住的任务、连续失败的信源、worker 错误；输出可原样贴回 |
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

改名兼容规则见 [CineHOT 命名](../../docs/branding/naming.md)，请从目标镜像提取配套升级脚本。
