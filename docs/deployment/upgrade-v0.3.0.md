# 升级到 v0.3.0：给部署 Agent 的逐步操作

适用于 AWS VPS（`/opt/cinemahot`，当前 v0.2.3）。从本版起镜像由 GitHub 构建，服务器不再打包和构建。**严格按顺序执行，每步核对“检查”，不符合就停止，把当步输出原样发给项目负责人。**

分工（2026-10-24 起）：VPS 是主站，负责采集和模型处理；校园服务器只做镜像，不采集。两台服务器任何时候都不能同时采集。

## 绝对不要做的事

- 不要运行 `docker compose down -v`，不要删除 Docker 卷 `cinemahot_db`、`cinemahot_data`，不要删除 `backups/`、`trial/`。
- 不要打印、复制到聊天或提交 `.env` 和 GHCR 令牌。
- 不要动 VPN（UDP 443 的 hysteria 进程）和 Caddy 配置。
- 第 5 步的删除脚本先看预览，数字和文档预期相符才加 `--apply`。

## 第 0 步：前提检查（只读）

```bash
uname -m
sudo docker exec cinemahot-db-1 psql -U cinemahot -d cinemahot -c "SELECT service, per_minute, per_hour, per_day FROM budgets WHERE service='llm';"
sudo docker compose -f /opt/cinemahot/compose.yml ps -a --format 'table {{.Service}}\t{{.Image}}\t{{.Status}}'
```

**检查：** `uname -m` 输出 `x86_64`（是 `aarch64` 就停止并汇报：镜像只构建了 x86）；镜像为 `cinemahot-app:v0.2.3`；worker 目前停着属预期（10-22 起由校园服务器采集）。

## 第 1 步：停掉校园服务器的采集

在校园服务器（`ssh fanhua@202.205.122.75`）上：

```bash
cd ~/cinemahot && docker compose ps --format '{{.Service}} {{.Status}}'
docker compose stop -t 515 worker
docker compose ps --format '{{.Service}} {{.Status}}'
```

**检查：** worker 为 exited。校园服务器在 10-22 之后采集的数据不迁回 VPS：VPS 从自己的数据库继续，近两天的新文章会在下一轮采集时从各信源重新读到。

## 第 2 步：登录 GHCR（每台服务器只需一次）

项目负责人在 GitHub 生成一个只有 `read:packages` 权限的令牌，由部署 Agent 输入，不要回显：

```bash
read -rs GHCR_TOKEN && echo "$GHCR_TOKEN" | sudo docker login ghcr.io -u JosephBear --password-stdin; unset GHCR_TOKEN
```

**检查：** 输出 `Login Succeeded`。

## 第 3 步：取出升级脚本并升级

```bash
cd /opt/cinemahot
v=v0.3.0; img=ghcr.io/josephbear/cinemahot-app:$v
sudo docker pull $img
sudo docker run --rm --entrypoint cat $img deploy/vps/upgrade.sh | sudo tee upgrade.sh > /dev/null
sudo docker run --rm --entrypoint cat $img deploy/vps/check.sh | sudo tee check.sh > /dev/null
sudo bash upgrade.sh $v
```

脚本依次：拉镜像 → 停 worker/web/api（最多等 515 秒）→ 备份数据库、`/data`、`compose.yml` 和 `.env` → 换成新版 `compose.yml` 与镜像 → 迁移与信源初始化 → 启动 api、web 并冒烟检查 → 启动 worker。

**检查：** 迁移输出 `5 migration(s) applied`（0085–0089）或 `database is up to date`；信源初始化输出 `sources: 0 added, …`（本版只删不加）；冒烟检查 `all checks passed`；最后输出“完成：v0.3.0”。中途出错脚本会停下并打印备份目录和回退方法，把输出发给项目负责人。

## 第 4 步：调整模型调用上限

```bash
sudo docker exec -i cinemahot-db-1 psql -U cinemahot -d cinemahot -v ON_ERROR_STOP=1 <<'SQL'
UPDATE budgets SET per_minute = 20, per_hour = 500, per_day = 2000,
  note = 'v0.3.0：每分钟20、每小时500、滚动24小时2000', updated_at = now()
WHERE service = 'llm';
SELECT service, per_minute, per_hour, per_day FROM budgets WHERE service = 'llm';
SQL
```

**检查：** 输出 `UPDATE 1`，结果为 `llm | 20 | 500 | 2000`。立即生效，不用重启。

## 第 5 步：清除 7 个移出信源的数据

```bash
cd /opt/cinemahot
ids=web-fengniao-news,web-xitek-news,web-nyu-tisch-news,web-nfts-news,rss-unreal-film,rss-asc,rss-cinemontage
sudo docker compose -f compose.yml run --rm --no-deps api node scripts/purge-sources.ts --ids $ids
```

先只看预览：每个信源一行“文章 N 篇，其中对外可见 M 篇”。把预览发给项目负责人，得到确认后再执行：

```bash
sudo docker compose -f compose.yml run --rm --no-deps api node scripts/purge-sources.ts --ids $ids --apply
```

**检查：** 输出“撤下 X 篇”和“删除文章 Y 篇、孤立事实 Z 条、信源 7 个”，Y 等于预览里文章数之和。已发布的文章先撤下，网站、RSS、事件和热榜随之更新；审计日志里有每篇的撤下记录和一条 `source.purge`。

## 第 6 步：核对

```bash
sudo bash /opt/cinemahot/check.sh
```

立即运行一次，30 分钟后再运行一次，两次输出都发给项目负责人。

**检查：** 版本为 0.3.0；四个容器运行且内存低于上限（db 450M、api 450M、web 350M、worker 300M）；冒烟通过、首页 200；预算 `20 | 500 | 2000`；第二次核对时“近1小时采集”为几十次、“最近判定”在升级之后。VPS 停采期间（10-22 起）的日报缺期报错属预期，积压处理到那几天后自动补齐。

## 第 7 步：校园服务器改为镜像

升级核对通过后，在校园服务器上停掉 CineHOT 其余容器，按 [校园镜像](campus.md) 配置 Nginx 转发与缓存（需要 sudo，由项目负责人执行）。

## 出问题时如何回退

第 3 步打印了备份目录。本版的迁移只新增列和表、删除一个不再使用的列，回退不必恢复数据库：

```bash
cd /opt/cinemahot
backup=<第 3 步打印的备份目录>
sudo docker compose -f compose.yml stop -t 515 worker web api
sudo cp "$backup/compose.yml" compose.yml
sudo cp "$backup/env.backup" .env
sudo docker compose -f compose.yml up -d api web worker
```

第 5 步执行后删掉的文章只能从 `$backup/database.dump` 恢复，需由项目负责人决定。
