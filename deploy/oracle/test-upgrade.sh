#!/usr/bin/env bash
# Disposable GitHub runner. Test the exact release image which will be published.
set -euo pipefail
repo=$(pwd)
testdir=$(mktemp -d)
project="oraclecheck$RANDOM"
registry="$project-registry"
cd "$testdir"
cp "$repo/deploy/vps/compose.yml" compose.yml
cp "$repo/deploy/oracle/compose.override.yml" compose.override.yml
cp "$repo/.env.example" .
node "$repo/scripts/init-env.ts" >/dev/null
cat >> .env <<EOF
CINEMAHOT_IMAGE=cinehot:test
SITE_URL=http://127.0.0.1:18301
CINEHOT_WEB_PORT=18301
LLM_BASE_URL=https://model.example.invalid/v1
LLM_MODEL=test-model
COLLECT_ENABLED=false
MODEL_CALLS_ENABLED=false
EOF
if [[ "$(uname -m)" == "aarch64" ]]; then
    mkdir data
    sudo chown 1000:1000 data
    cat >> compose.override.yml <<'YAML'
    volumes: ["./data:/data"]
  api:
    volumes: ["./data:/data"]
YAML
fi
dc() { docker compose -p "$project" -f compose.yml -f compose.override.yml "$@"; }
cleanup() {
    dc down -v --remove-orphans
    docker rm -fv "$registry" >/dev/null || true
}
trap cleanup EXIT
docker run -d --name "$registry" -p 127.0.0.1:15399:5000 registry:2 >/dev/null
remote=localhost:15399/test/cinehot
docker tag cinehot:test "$remote:fixture"
docker push "$remote:fixture" >/dev/null
image=$(docker image inspect "$remote:fixture" --format '{{range .RepoDigests}}{{println .}}{{end}}' | grep "^$remote@")
dc up -d --wait db
dc run --rm --no-deps api node scripts/migrate.ts
dc run --rm --no-deps api node scripts/seed.ts
dc up -d api web worker
for i in {1..60}; do
    curl -fsS http://127.0.0.1:18301/api/health >/dev/null 2>&1 && break
    sleep 1
done
api=$(dc ps -q api)
dc exec -T api sh -ec 'mkdir -p /data/nested; echo "restore fixture" > "/data/nested/article asset"'
dc exec -T db psql -U cinemahot -c "create table recovery_fixture(value text); insert into recovery_fixture values ('database fixture')"
python3 "$repo/deploy/oracle/upgrade.py" --api "$api" --image "$image"
backup=$(dirname "$(find backups -name RESTORE_VERIFIED -print -quit)")
(cd "$backup" && sha256sum -c SHA256SUMS)
test "$(tar -xOf "$backup/data.tar" './nested/article asset')" = 'restore fixture'
# A fresh database, independently queried after restoring the exact saved archive.
dc exec -T db createdb -U cinemahot independent_restore
dc exec -T db pg_restore --single-transaction --exit-on-error -U cinemahot -d independent_restore < "$backup/database.dump"
test "$(dc exec -T db psql -U cinemahot -d independent_restore -XAtc 'select value from recovery_fixture')" = 'database fixture'
curl -fsS http://127.0.0.1:18301/api/health | jq -e '.ok and .db == "ok"'
curl -fsS http://127.0.0.1:18301/all -o list.html
grep -qi '<html' list.html
