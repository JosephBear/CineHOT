# 升级到 v0.2.2：给部署 Agent 的逐步操作（/opt/cinemahot）

> **已被取代**：请使用 [升级到 v0.2.3](upgrade-v0.2.3.md)（步骤相同，另外调整了模型调用上限）。

本文件按服务器的**实际部署方式**编写：发布包 + Docker Compose，目录 `/opt/cinemahot`，数据库名和用户名都是 `cinemahot`，宿主机 Caddy 代理到 `127.0.0.1:3000`。适用于当前运行 v0.2.1（`/opt/cinemahot/compose.yml` + `trial/override.json`）的服务器。

**严格按顺序执行，每步做完先核对“检查”，全部符合才进入下一步。** 任何一步检查不符合，就停止，把当步命令的输出原样发给项目负责人，不要自己想办法绕过。

## 这次升级做什么

项目负责人 2026-10-19 决定：网站从“按时段试运行”改为**长期持续运行**。

1. **停用试运行组件**：不再挂载 `trial/mounts/` 下的 5 个源码副本；停用 DeepSeek 守护代理（guard 容器）和两个试运行定时器。费用改由项目自带的 `llm` 预算和付费回执控制。
2. **保留低并发**：改为 v0.2.2 新增的设置 `WORKER_MAX_CONCURRENCY=1`（每个任务队列最多同时处理 1 件），写在新的 `compose.yml` 里。
3. **旧文章也补处理**：不再只处理试运行开始后的文章；数据库里还没处理的旧文章会逐步处理，受每日上限约束，可能需要几天。
4. **主 compose 换成仓库模板** `deploy/vps/compose.yml`（db、api、web、worker 四个服务；不含 guard；密钥都从 `.env` 读）。
5. 打开采集和模型调用（`COLLECT_ENABLED=true`、`MODEL_CALLS_ENABLED=true`）。

本版**没有数据库迁移**；`llm` 预算保持现有的 每分钟5、每小时120、滚动24小时1000 不变。

## 绝对不要做的事

- 不要运行 `docker compose down -v`，不要删除 Docker 卷 `cinemahot_db`、`cinemahot_data`：会删掉全部新闻数据。
- 不要删除 `/opt/cinemahot/trial/` 目录（里面有试运行费用台账）和 `/opt/cinemahot/backups/`。
- 不要打印、复制到聊天或提交 `.env`、`trial/deepseek-key`、`trial/proxy-token` 的内容。
- 不要关闭 SSRF/TLS 检查来让某个信源“通过”；不要自行修改代码；不要执行本文件以外的数据库写操作。

下文 `dc` 指：

```bash
dc() { sudo docker compose -f /opt/cinemahot/compose.yml "$@"; }
```

**注意**：第 6 步换成新的 `compose.yml` 之后才使用 `dc`；第 6 步之前操作旧组合时，命令里写明两个文件。

## 第 1 步：在本机准备发布包（你平时打包的那台电脑）

```bash
rm -rf /private/tmp/cinemahot-v0.2.2
gh repo clone JosephBear/CineHOT /private/tmp/cinemahot-v0.2.2 -- --branch v0.2.2 --depth 1
cd /private/tmp/cinemahot-v0.2.2
cat VERSION
git rev-parse HEAD
npm ci --ignore-scripts
npm run build -w @aihot/web
test -f apps/web/build/server/index.js && echo "web build ok"
COPYFILE_DISABLE=1 tar --no-xattrs --exclude=.git --exclude=node_modules --exclude=.env --exclude=.data \
  -czf /private/tmp/cinemahot-v0.2.2.tar.gz -C /private/tmp/cinemahot-v0.2.2 .
shasum -a 256 /private/tmp/cinemahot-v0.2.2.tar.gz
```

**检查：** `VERSION` 为 `0.2.2`；输出 `web build ok`；记下提交号和 SHA-256。**不要**修改仓库里的任何文件再打包（条款、更新日志等定制已经在仓库里）。

## 第 2 步：把发布包传到服务器

用你现有的私有 SSH 通道，把 `/private/tmp/cinemahot-v0.2.2.tar.gz` 传到服务器的 `/tmp/cinemahot-v0.2.2.tar.gz`，然后在服务器上：

```bash
sha256sum /tmp/cinemahot-v0.2.2.tar.gz
```

**检查：** 与第 1 步的 SHA-256 一致。

## 第 3 步：记录服务器当前状态

```bash
cd /opt/cinemahot
cat current-release.json
sudo docker compose -f compose.yml -f trial/override.json ps -a
sudo grep -E '^(COLLECT_ENABLED|MODEL_CALLS_ENABLED|SITE_URL)=' .env
sudo grep -cE '^LLM_API_KEY=.+' .env || true
grep -n 'AIHOT_CREDENTIALS_DIR' compose.yml || true
sudo docker exec cinemahot-db-1 psql -U cinemahot -d cinemahot -c "SELECT service, per_minute, per_hour, per_day FROM budgets WHERE service = 'llm';"
```

**检查：** 记下全部输出，最后汇报要用。预期：web、api、db 运行，worker 为 created，guard 为 exited；`llm | 5 | 120 | 1000`。

## 第 4 步：停写并备份

```bash
cd /opt/cinemahot
sudo docker compose -f compose.yml -f trial/override.json stop -t 210 api web worker guard

backup_dir="/opt/cinemahot/backups/v0.2.2-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$backup_dir"
sudo docker exec cinemahot-db-1 pg_dump -U cinemahot -d cinemahot -Fc | sudo tee "$backup_dir/database.dump" > /dev/null
old_image=$(sudo docker inspect cinemahot-api-1 --format '{{.Config.Image}}')
sudo docker run --rm --user root --entrypoint tar -v cinemahot_data:/data:ro "$old_image" -C /data -czf - . | sudo tee "$backup_dir/files.tar.gz" > /dev/null
sudo cp compose.yml "$backup_dir/compose.yml"
sudo cp trial/override.json "$backup_dir/override.json"
sudo cp .env "$backup_dir/env.backup"
sudo chmod 600 "$backup_dir"/*
sudo docker exec -i cinemahot-db-1 pg_restore --list < "$backup_dir/database.dump" | sudo tee "$backup_dir/archive-list.txt" > /dev/null
sudo tar -tzf "$backup_dir/files.tar.gz" | sudo tee "$backup_dir/files-list.txt" > /dev/null
echo "$backup_dir"; echo "$old_image"
sudo ls -l "$backup_dir"
```

**检查：** `database.dump`、`files.tar.gz`、`compose.yml`、`override.json`、`env.backup` 都存在且大小不为 0；`archive-list.txt` 里能看到 `TABLE DATA public articles`。记下备份目录和 `old_image`（回退要用）。任何一项不符合就停止。

## 第 5 步：解包并构建镜像

```bash
release=/opt/cinemahot/releases/v0.2.2
sudo mkdir -p "$release"
sudo tar -xzf /tmp/cinemahot-v0.2.2.tar.gz -C "$release"
cat "$release/VERSION"
sudo systemd-run --unit=cinemahot-build-v022 --collect --wait --working-directory="$release" \
  /bin/sh -c 'docker build --memory=256m --cpu-period=100000 --cpu-quota=40000 -f deploy/vps/Dockerfile -t cinemahot-app:v0.2.2 . > build.log 2>&1'
tail -5 "$release/build.log"
sudo docker image inspect cinemahot-app:v0.2.2 --format '{{.Id}}'
```

**检查：** `VERSION` 为 `0.2.2`；最后一条命令输出一个镜像 ID。构建失败就停止并汇报 `build.log` 末尾。

## 第 6 步：换成新的 compose 并调整 .env

```bash
cd /opt/cinemahot
release=/opt/cinemahot/releases/v0.2.2
sudo cp "$release/deploy/vps/compose.yml" /opt/cinemahot/compose.yml

set_env() { sudo sed -i "/^$1=/d" .env && echo "$1=$2" | sudo tee -a .env > /dev/null; }
set_env CINEMAHOT_IMAGE cinemahot-app:v0.2.2
set_env CINEMAHOT_RELEASE 0.2.2
set_env COLLECT_ENABLED true
set_env MODEL_CALLS_ENABLED true
# DeepSeek 密钥从试运行的密钥文件写进 .env，不在屏幕上显示
if ! sudo grep -qE '^LLM_API_KEY=.+' .env; then
  printf 'LLM_API_KEY=%s\n' "$(sudo cat trial/deepseek-key)" | sudo tee -a .env > /dev/null
fi
sudo grep -cE '^LLM_API_KEY=.+' .env
```

如果第 3 步 `grep -n 'AIHOT_CREDENTIALS_DIR' compose.yml` 在**旧** compose 里有输出，把那里的值原样写进 `.env`（不要发出来）：

```bash
# 把 <旧值> 换成旧 compose 里 AIHOT_CREDENTIALS_DIR 后面的值；第 3 步没有输出就跳过
set_env AIHOT_CREDENTIALS_DIR '<旧值>'
```

然后检查配置能正确组合：

```bash
dc config --quiet && echo "compose ok"
dc config --services
dc config | grep -E 'WORKER_MAX_CONCURRENCY|LLM_BASE_URL|image:' | sort -u
```

**检查：** 输出 `compose ok`；服务只有 `db api web worker`（没有 guard）；`WORKER_MAX_CONCURRENCY: "1"`、`LLM_BASE_URL: https://api.deepseek.com/v1`、`image: cinemahot-app:v0.2.2`；`LLM_API_KEY` 计数为 `1`。不符合就停止：用备份目录里的 `compose.yml` 放回 `/opt/cinemahot/compose.yml` 后汇报。

## 第 7 步：停用试运行定时器

```bash
sudo systemctl disable --now cinemahot-trial-stop.timer cinemahot-trial-checkpoint.timer
systemctl list-timers --all | grep cinemahot || echo "no cinemahot timers"
```

**检查：** 输出 `no cinemahot timers`，或列出的 cinemahot 定时器都不再有下次运行时间。不要删除 `trial/` 目录。

## 第 8 步：迁移与种子

```bash
dc run --rm --no-deps api node scripts/migrate.ts
dc run --rm --no-deps api node scripts/seed.ts
```

**检查：** 依次输出 `database is up to date` 和 `sources: 0 added, 94 already there`（本版没有新迁移和新信源；如果负责人在后台另加过信源，第二个数字会更大，照实汇报）。出现 `Error` 就停止。

## 第 9 步：更正预算备注

预算数值不改，只把与实际不符的旧备注改对：

```bash
sudo docker exec -i cinemahot-db-1 psql -U cinemahot -d cinemahot -v ON_ERROR_STOP=1 <<'SQL'
UPDATE budgets SET note = 'v0.2.2 长期运行：每分钟5、每小时120、滚动24小时1000', updated_at = now()
WHERE service = 'llm' AND per_minute = 5 AND per_hour = 120 AND per_day = 1000;
SELECT service, per_minute, per_hour, per_day, note FROM budgets WHERE service = 'llm';
SQL
```

**检查：** 结果是 `llm | 5 | 120 | 1000 | v0.2.2 长期运行……`。如果数值不是 5/120/1000，`UPDATE 0`，不要改数值，照实汇报。

## 第 10 步：启动网页和 API 并检查

```bash
dc up -d --remove-orphans api web
sleep 20
dc ps -a
sudo docker ps -a --filter name=cinemahot-guard --format '{{.Names}}' | grep . || echo "guard removed"
sudo docker exec cinemahot-web-1 node scripts/smoke.ts --base http://127.0.0.1:3000
curl -sS -o /dev/null -w '%{http_code}\n' "$(sudo grep -E '^SITE_URL=' .env | cut -d= -f2-)/"
```

**检查：** api、web 为 running；输出 `guard removed`；smoke 检查 `all checks passed`；公网首页 `200`。失败就停止并汇报，不要启动 worker。

## 第 11 步：启动 worker 并确认不再使用试运行组件

```bash
dc up -d worker
sleep 60
dc ps worker
sudo docker inspect cinemahot-worker-1 --format '{{range .Mounts}}{{.Destination}} {{end}}'
sudo docker exec cinemahot-worker-1 printenv WORKER_MAX_CONCURRENCY LLM_BASE_URL
dc logs --tail=60 worker
```

**检查：** worker 为 running；挂载只有 `/data`（不再有 `/app/packages/...` 等源码挂载）；输出 `1` 和 `https://api.deepseek.com/v1`；日志没有反复出现的 `Error`。

## 第 12 步：运行 30 分钟后核对

```bash
sleep 1800
sudo docker exec cinemahot-db-1 psql -U cinemahot -d cinemahot -c "
SELECT (SELECT count(*) FROM fetch_runs WHERE started_at > now() - interval '35 minutes') AS 采集次数,
       (SELECT count(*) FROM receipt_attempts WHERE service = 'llm' AND started_at > now() - interval '35 minutes') AS 模型调用,
       (SELECT count(*) FROM analyses WHERE created_at > now() - interval '35 minutes') AS 新判定;"
sudo docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' | grep cinemahot
echo "{\"version\":\"0.2.2\",\"image\":\"cinemahot-app:v0.2.2\",\"applied_at\":\"$(date -u +%FT%TZ)\"}" | sudo tee /opt/cinemahot/current-release.json
```

**检查：** 采集次数、模型调用、新判定都大于 0；模型调用不超过 120（每小时上限）；各容器内存都低于各自上限（db 450M、api 450M、web 350M、worker 300M）。新判定为 0 而模型调用大于 0 时，看 `dc logs --tail=100 worker` 并汇报。

## 第 13 步：汇报

把下面这些原样发给项目负责人：

1. 第 1 步的提交号和 SHA-256；
2. 第 3 步的全部输出；
3. 第 4 步的备份目录和 `old_image`；
4. 第 6 步 `dc config` 三条检查的输出（不要包含密钥）；
5. 第 8、9 步的输出；
6. 第 10 步 smoke 结果和首页状态码；
7. 第 11 步挂载、环境变量和日志末尾；
8. 第 12 步三项计数和内存。

## 出问题时如何回退

本版没有数据库迁移，回退不需要恢复数据库：

```bash
cd /opt/cinemahot
backup_dir=<第 4 步的备份目录>
sudo docker compose -f compose.yml stop -t 210 worker web api
sudo cp "$backup_dir/compose.yml" /opt/cinemahot/compose.yml
sudo cp "$backup_dir/env.backup" /opt/cinemahot/.env
sudo docker compose -f compose.yml -f trial/override.json up -d --no-deps api web
```

回退后 worker 和 guard 保持停止，等项目负责人决定。不要只切换镜像标签而不恢复 `compose.yml` 和 `.env`。
