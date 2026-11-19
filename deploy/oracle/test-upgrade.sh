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
historical=false
if [[ "$(uname -m)" == "aarch64" ]]; then
    historical=true
    oldbuild="$testdir/old-image"
    mkdir "$oldbuild"
    docker build --target base -f "$repo/deploy/oracle/tests/old-image.Dockerfile" -t cinehot:oracle-032 "$oldbuild"
    docker run --rm --entrypoint cat cinehot:oracle-032 /app/packages/backend/src/reports/compose.ts > "$oldbuild/compose.ts"
    patch "$oldbuild/compose.ts" < "$repo/deploy/oracle/tests/report-gap.patch"
    (cd "$oldbuild" && echo "c9744a57a3f2bee2360f128adda0b30a65eb7132c9afb46a7b8b9ed6a5b1291b  compose.ts" | sha256sum -c -)
    docker build --target worker -f "$repo/deploy/oracle/tests/old-image.Dockerfile" -t cinehot:oracle-032-worker "$oldbuild"
    test "$(docker run --rm --entrypoint cat cinehot:oracle-032 /app/VERSION)" = "0.3.2"
    sed -i 's/^CINEMAHOT_IMAGE=cinehot:test$/CINEMAHOT_IMAGE=cinehot:oracle-032/' .env
    sed -i '/^  worker:$/a\    image: cinehot:oracle-032-worker' compose.yml
    echo 'REPORT_HISTORICAL_DAILY_GAPS=2026-10-17' >> .env
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
sql() { dc exec -T db psql -U cinemahot -d "$1" -XAt -v ON_ERROR_STOP=1 -c "$2"; }
if "$historical"; then
    sql cinemahot "INSERT INTO sources(id,name,kind,tier) VALUES ('test-archive','Archive','rss','T1');
      INSERT INTO articles(id,source_id,identity_key,url,title,discovered_at,timeline_at)
      VALUES ('legacy-article','test-archive','legacy-key','https://example.org/legacy','Legacy fixture',now(),now());
      INSERT INTO publications(article_id,title,source_id,channel,url,discovered_at,timeline_at,sort_at,eligible,selected,visible_after,visibility,score)
      VALUES ('legacy-article','Legacy fixture','test-archive','news','https://example.org/legacy',now(),now(),now(),true,true,now(),'public',90)"
    old_migrations=$(sql cinemahot 'select count(*) from schema_migrations')
    test "$old_migrations" -eq 65
fi
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

if "$historical"; then
    new_migrations=$(sql cinemahot 'select count(*) from schema_migrations')
    test "$new_migrations" -gt "$old_migrations"
    test "$(sql independent_restore 'select count(*) from schema_migrations')" = "$old_migrations"
    for db in cinemahot independent_restore; do
        test "$(sql "$db" "select p.title from publications p join articles a on a.id=p.article_id where a.identity_key='legacy-key' and p.visibility='public'")" = 'Legacy fixture'
    done
    test "$(dc exec -T api cat /app/VERSION)" = "$(cat "$repo/VERSION")"
    test "$(dc exec -T api cat '/data/nested/article asset')" = 'restore fixture'
    # Boot the old stack on separately restored storage and query through its own web service.
    recovered="$testdir/recovered"
    mkdir -p "$recovered/data"
    cp "$backup/compose-0.yml" "$recovered/compose.yml"
    cp "$backup/compose-1.yml" "$recovered/compose.override.yml"
    cp "$backup/env.backup" "$recovered/.env"
    sudo tar -xpf "$backup/data.tar" -C "$recovered/data"
    sed -i 's/18301/18302/g' "$recovered/.env"
    olddc() { docker compose --project-directory "$recovered" -p "${project}restored" -f "$recovered/compose.yml" -f "$recovered/compose.override.yml" "$@"; }
    trap 'olddc down -v; cleanup' EXIT
    olddc up -d --wait db
    olddc exec -T db pg_restore --single-transaction --exit-on-error -U cinemahot -d cinemahot < "$backup/database.dump"
    olddc up -d api web
    for i in {1..60}; do
        curl -fsS http://127.0.0.1:18302/api/health > old-health 2>/dev/null && break
        sleep 1
    done
    jq -e '.ok and .db == "ok"' old-health
    test "$(olddc exec -T api cat /app/VERSION)" = "0.3.2"
    test "$(olddc exec -T api cat '/data/nested/article asset')" = 'restore fixture'
    curl -fsS http://127.0.0.1:18302/all -o old-list.html
    grep -qi '<html' old-list.html
    echo "ORACLE_032_UPGRADE_AND_RESTORE_OK migrations=$old_migrations->$new_migrations"
fi
