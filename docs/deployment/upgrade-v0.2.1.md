# 升级到 v0.2.1：给部署 Agent 的逐步操作

> **已被取代**：本文件按部署手册的示例（`$HOME/cinemahot`、Git、`aihot` 数据库）编写，与服务器实际部署方式不符。当前服务器请使用 [升级到 v0.2.2](upgrade-v0.2.2.md)。

本文件给负责服务器的 Agent 使用。**严格按顺序执行，一步一步做，每步做完先核对“检查”，全部符合才进入下一步。** 任何一步的检查不符合，就停止，把当步的命令输出原样发给项目负责人，不要自己想办法绕过。

适用情况：服务器已按 [服务器部署手册](server-runbook.md) 用 Docker Compose 部署在 `$HOME/cinemahot`，当前运行的是 v0.2.0 之后的代码（例如提交 `276340d`）。

## 绝对不要做的事

- 不要运行 `docker compose down -v`，也不要删除任何 Docker 卷：会删掉全部新闻数据。
- 不要用 `git reset --hard`、`git checkout -- .`、`git clean` 丢弃服务器上的改动：先按第 2 步保存。
- 不要修改、打印或发送 `.env` 里的密钥；不要把 `.env` 提交到 Git。
- 不要关闭 SSRF/TLS 检查来让某个信源“通过”。
- 不要自行修改代码来解决报错：停止并汇报。
- 不要执行本文件以外的数据库写操作。

## 第 1 步：记录当前状态

```bash
cd "$HOME/cinemahot"
cat VERSION
git rev-parse --short HEAD
git status --short
sudo docker compose ps
grep -E '^(COLLECT_ENABLED|MODEL_CALLS_ENABLED)=' .env
```

**检查：** 命令都能执行；记下这几项输出，最后汇报要用：`VERSION`、提交号、`git status --short` 是否为空、哪些服务在运行、两个开关的值。

## 第 2 步：保存服务器上的本地改动（没有改动就跳过）

如果第 1 步 `git status --short` **没有任何输出**，跳到第 3 步。

如果有输出，说明服务器上改过仓库里的文件。先保存，再暂存，不要丢弃：

```bash
cd "$HOME/cinemahot"
save_dir="$HOME/cinemahot-local-changes/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$save_dir"
git status --short > "$save_dir/status.txt"
git diff > "$save_dir/changes.diff"
git ls-files --others --exclude-standard > "$save_dir/untracked.txt"
tar -czf "$save_dir/untracked.tar.gz" -T "$save_dir/untracked.txt" 2>/dev/null || true
git stash push --include-untracked -m "server-local-before-v0.2.1"
git status --short
echo "$save_dir"
```

**检查：** 最后的 `git status --short` 没有输出；`$save_dir` 里有 `changes.diff`。把 `status.txt` 和 `changes.diff` 的内容放进最后的汇报：项目负责人会判断哪些改动要合并进下一版。不要自己把暂存的改动恢复回来。

## 第 3 步：停写并备份

```bash
cd "$HOME/cinemahot"
sudo docker compose stop -t 210 api worker web

backup_dir="$HOME/cinemahot-backups/$(date +%Y%m%d-%H%M%S)-before-v0.2.1"
mkdir -p "$backup_dir"
chmod 700 "$HOME/cinemahot-backups" "$backup_dir"
sudo docker compose exec -T db pg_dump -U aihot -Fc aihot > "$backup_dir/database.dump"
sudo docker compose run --rm --no-deps --user root --entrypoint tar \
  api -C /data -czf - . > "$backup_dir/files.tar.gz"
chmod 600 "$backup_dir"/*
sudo docker compose exec -T db pg_restore --list < "$backup_dir/database.dump" > "$backup_dir/archive-list.txt"
tar -tzf "$backup_dir/files.tar.gz" > "$backup_dir/files-list.txt"
ls -l "$backup_dir"
```

**检查：** `database.dump` 和 `files.tar.gz` 都存在且大小不为 0；`archive-list.txt` 里能看到 `TABLE DATA public articles` 一类的行。任何一项不符合就停止，不要继续升级。

## 第 4 步：取得 v0.2.1 代码

```bash
cd "$HOME/cinemahot"
git fetch --tags origin
git checkout v0.2.1
cat VERSION
git describe --tags --exact-match
```

**检查：** `VERSION` 输出 `0.2.1`；`git describe` 输出 `v0.2.1`。如果提示本地改动会被覆盖而无法切换，回到第 2 步。

## 第 5 步：构建、迁移数据库、添加新信源

```bash
cd "$HOME/cinemahot"
sudo docker compose build
sudo docker compose run --rm setup
```

**检查：** `setup` 正常结束，输出里有 `N migration(s) applied` 或 `database is up to date`，以及 `sources: N added, M already there`。从 `276340d` 升级时 `N` 应为 15（本版新增的学术期刊、ASC、Film Comment、富士、卓曜和 6 个器材品牌频道）；从更早的版本升级时 `N` 会更大。出现 `Error` 就停止并汇报。

## 第 6 步：调整数据库里的运行设置

这些设置存在数据库里，升级代码不会自动修改，需要执行一次：

```bash
cd "$HOME/cinemahot"
sudo docker compose exec -T db psql -U aihot -d aihot -v ON_ERROR_STOP=1 <<'SQL'
-- 模型日常上限：每分钟20、每小时150、滚动24小时1000（94个信源每小时采集，200次会持续积压）
UPDATE budgets SET per_minute = 20, per_hour = 150, per_day = 1000,
  note = 'v0.2.1 升级：每分钟20、每小时150、每天1000', updated_at = now()
WHERE service = 'llm';
-- 所有信源统一每60分钟采集
UPDATE sources SET interval_minutes = 60 WHERE interval_minutes <> 60;
-- 本版移出的 AFI 新闻订阅，以及所有无法自动采集的 external 来源：只暂停，不删除
UPDATE sources SET enabled = false WHERE id = 'rss-afi-news' OR kind = 'external';
SELECT service, per_minute, per_hour, per_day FROM budgets WHERE service = 'llm';
SELECT count(*) FILTER (WHERE enabled) AS enabled_sources,
       count(*) FILTER (WHERE enabled AND interval_minutes <> 60) AS not_hourly
FROM sources;
SQL
```

**检查：** 第一个结果是 `llm | 20 | 150 | 1000`；第二个结果 `not_hourly` 为 `0`，`enabled_sources` 一般为 94（如果数据库里有负责人另外在后台加的信源，会更多，照实汇报）。

## 第 7 步：启动网页和 API 并检查

```bash
cd "$HOME/cinemahot"
sudo docker compose up -d api web
sleep 20
sudo docker compose ps
sudo docker compose exec -T web node scripts/smoke.ts --base http://127.0.0.1:3000
```

**检查：** `api`、`web` 状态为 running（或 healthy）；smoke 检查全部通过。失败就停止并汇报，不要启动 worker。

## 第 8 步：按原来的模式启动 worker

只有第 1 步记录的 `COLLECT_ENABLED=true` 时才执行；原来是 `false` 就跳过本步，保持只读站点：

```bash
cd "$HOME/cinemahot"
sudo docker compose up -d worker
sleep 30
sudo docker compose logs --tail=50 worker
```

**检查：** worker 状态为 running，日志里没有反复出现的 `Error`。

## 第 9 步：抽查新信源能否从服务器访问

```bash
cd "$HOME/cinemahot"
sudo docker compose exec -T api node scripts/check-cinemahot-sources.ts \
  --ids rss-asc-gnews,json-crossref-screen,rss-filmcomment,web-fujifilm-news,web-kinefinity-news,rss-yt-zeiss
```

**检查：** 只读检查，不写数据。每行 `"status":"ok"` 为通过。有个别 `failed` 不要处理，原样记进汇报。

## 第 10 步：导出近14天信源质量

```bash
cd "$HOME/cinemahot"
sudo docker compose exec -T db psql -U aihot -d aihot \
  < scripts/source-discovery/source-quality.sql > "$HOME/source-quality-$(date +%Y%m%d).txt"
head -40 "$HOME/source-quality-$(date +%Y%m%d).txt"
```

**检查：** 文件里有表头 `资料数 | 相关数 | 相关平均分 | 精选数` 和每个信源一行。这是只读查询。不要根据结果删除任何信源：把整个文件交给项目负责人决定。

## 第 11 步：汇报

把下面这些原样发给项目负责人：

1. 第 1 步记录的升级前状态（VERSION、提交号、开关值、`git status` 是否为空）；
2. 第 2 步保存的 `status.txt`、`changes.diff`（没有改动就写“无本地改动”）；
3. 第 3 步备份目录路径；
4. 第 5 步 `setup` 输出的最后几行；
5. 第 6 步两个查询结果；
6. 第 7 步 smoke 检查结果、第 8 步 worker 日志末尾；
7. 第 9 步每个信源的结果；
8. 第 10 步生成的 `source-quality-日期.txt` 全文。

## 出问题时

- **第 3 步之前出问题**：什么都没改，停止并汇报即可。
- **第 4–6 步出问题**：执行 `sudo docker compose stop api worker web`，保持停止，汇报错误输出。是否用第 3 步的备份恢复，由项目负责人决定，不要自行恢复。
- **第 7 步之后网站异常**：停止 worker（`sudo docker compose stop worker`），保留网页运行或一起停止，汇报。
- 回退到旧版本必须连同数据库备份一起处理，见 [服务器部署手册](server-runbook.md) 的“已运行后的版本回退”；不能只切回旧的 Git 标签。
