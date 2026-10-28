#!/usr/bin/env bash
# Upgrades the VPS in /opt/cinemahot to a released image from GHCR (.github/workflows/release-image.yml):
# pull first, then stop, back up, switch .env and compose.yml to the version, migrate, start api and web,
# smoke-check, start the worker. A version's own extra steps live in docs/deployment/upgrade-<版本>.md.
# Fetch this script from the image itself, so it always matches the version:
#   v=<已在新镜像仓库发布的版本标签>; img=ghcr.io/josephbear/cinehot-app:$v
#   sudo docker pull $img && sudo docker run --rm --entrypoint cat $img deploy/vps/upgrade.sh > upgrade.sh
#   sudo bash upgrade.sh $v
set -euo pipefail
v="${1:?usage: upgrade.sh v0.3.0}"
[[ "$v" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "版本号格式应为 v0.3.0" >&2; exit 1; }
dir=/opt/cinemahot
image="ghcr.io/josephbear/cinehot-app:$v"
cd "$dir"
dc() { docker compose -f "$dir/compose.yml" "$@"; }
set_env() { sed -i "/^$1=/d" .env && echo "$1=$2" >> .env; }

echo "== 1 拉取镜像（网站照常运行）"
docker pull "$image"
old_image=$(docker inspect cinemahot-api-1 --format '{{.Config.Image}}')
echo "当前镜像 $old_image → $image"

echo "== 2 停写并备份"
dc stop -t 515 worker web api
backup="$dir/backups/$v-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup"
trap 'echo "!! 第 $LINENO 行出错，已停止。备份在 $backup；回退：cp $backup/compose.yml $backup/env.backup 回原处（env.backup 改名为 .env），再 docker compose -f compose.yml up -d api web worker" >&2' ERR
docker exec cinemahot-db-1 pg_dump -U cinemahot -d cinemahot -Fc > "$backup/database.dump"
docker run --rm --user root --entrypoint tar -v cinemahot_data:/data:ro "$old_image" -C /data -czf - . > "$backup/files.tar.gz"
cp compose.yml "$backup/compose.yml"
cp .env "$backup/env.backup"
chmod 600 "$backup"/*
for f in database.dump files.tar.gz compose.yml env.backup; do test -s "$backup/$f" || { echo "备份 $f 为空，停止" >&2; exit 1; }; done
ls -l "$backup"

echo "== 3 换成新版本的 compose 与镜像"
docker run --rm --entrypoint cat "$image" deploy/vps/compose.yml > compose.yml
set_env CINEMAHOT_IMAGE "$image"
set_env CINEMAHOT_RELEASE "${v#v}"
dc config --quiet

echo "== 4 迁移与信源初始化"
dc run --rm --no-deps api node scripts/migrate.ts
dc run --rm --no-deps api node scripts/seed.ts

echo "== 5 启动网页和 API 并冒烟检查"
dc up -d --remove-orphans api web
sleep 20
docker exec cinemahot-web-1 node scripts/smoke.ts --base http://127.0.0.1:3000

echo "== 6 启动 worker"
dc up -d worker
sleep 30
dc ps -a
printf '{"version":"%s","image":"%s","backup":"%s","applied_at":"%s"}\n' "${v#v}" "$image" "$backup" "$(date -u +%FT%TZ)" > current-release.json
echo "完成：$v。接着按 docs/deployment/upgrade-$v.md 做本版的其余步骤，再运行 check.sh。"
