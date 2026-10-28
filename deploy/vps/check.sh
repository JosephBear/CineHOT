#!/usr/bin/env bash
# Read-only health report of the VPS site, the same sections every time, so it can be pasted back as is.
# Prints no secrets (only whether LLM_API_KEY is set). Fetch it like upgrade.sh, then: sudo bash check.sh
set -uo pipefail
dir=/opt/cinemahot
cd "$dir"
dc() { docker compose -f "$dir/compose.yml" "$@"; }
q() { docker exec cinemahot-db-1 psql -U cinemahot -d cinemahot -P pager=off -c "$1"; }

echo "== 1 版本"
cat current-release.json 2>/dev/null; echo
grep -E '^(CINEMAHOT_IMAGE|CINEMAHOT_RELEASE|COLLECT_ENABLED|MODEL_CALLS_ENABLED|SITE_URL)=' .env
echo "LLM_API_KEY 已设置: $(grep -cE '^LLM_API_KEY=.+' .env)"
echo "== 2 容器与内存"
dc ps -a --format 'table {{.Service}}\t{{.Image}}\t{{.Status}}'
docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' | grep cinemahot
echo "== 3 冒烟检查与公网首页"
docker exec cinemahot-web-1 node scripts/smoke.ts --base http://127.0.0.1:3000 2>&1 | tail -3
site=$(grep -E '^SITE_URL=' .env | cut -d= -f2-)
curl -sS -m 20 -o /dev/null -w "首页 %{http_code}\n" "$site/"
echo "== 4 模型预算与用量"
q "SELECT b.service, b.per_minute, b.per_hour, b.per_day,
          (SELECT count(*) FROM receipt_attempts a WHERE a.service = b.service AND a.origin = 'live' AND a.started_at > now() - interval '1 hour') AS 近1小时,
          (SELECT count(*) FROM receipt_attempts a WHERE a.service = b.service AND a.origin = 'live' AND a.started_at > now() - interval '24 hours') AS 近24小时,
          (SELECT round(sum((coalesce((a.usage->>'prompt_tokens')::numeric, 0) - coalesce((a.usage->>'prompt_cache_hit_tokens')::numeric, (a.usage->'prompt_tokens_details'->>'cached_tokens')::numeric, 0)) * p.input_per_mtok
                             + coalesce((a.usage->>'prompt_cache_hit_tokens')::numeric, (a.usage->'prompt_tokens_details'->>'cached_tokens')::numeric, 0) * coalesce(p.cached_per_mtok, p.input_per_mtok)
                             + coalesce((a.usage->>'completion_tokens')::numeric, 0) * p.output_per_mtok) / 1e6, 2)
           FROM receipt_attempts a JOIN service_prices p ON p.service = a.service AND p.model = ''
           WHERE a.service = b.service AND a.started_at > now() - interval '24 hours') AS 近24小时估算费用
   FROM budgets b WHERE b.service = 'llm'"
echo "== 5 采集与处理"
q "SELECT (SELECT count(*) FROM fetch_runs WHERE started_at > now() - interval '1 hour') AS 近1小时采集,
          (SELECT count(*) FROM fetch_runs WHERE started_at > now() - interval '1 hour' AND status = 'failed') AS 其中失败,
          (SELECT max(started_at) FROM fetch_runs) AS 最近采集,
          (SELECT count(*) FROM analyses WHERE created_at > now() - interval '24 hours') AS 近24小时判定,
          (SELECT max(created_at) FROM analyses) AS 最近判定"
q "SELECT processing_state AS 状态, count(*) AS 文章数, min(discovered_at) AS 最早发现 FROM articles
   WHERE processing_state IN ('new', 'failed') GROUP BY 1"
echo "== 6 任务队列（卡住与失败）"
q "SELECT name, state, count(*), min(coalesce(started_on, created_on)) AS 最早 FROM pgboss.job
   WHERE (state = 'active' AND started_on < now() - interval '30 minutes') OR state = 'retry'
      OR (state = 'failed' AND completed_on > now() - interval '24 hours')
   GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 15"
echo "== 7 最近 6 次全部失败的信源"
q "SELECT source_id, max(error) AS 最近错误 FROM (
     SELECT source_id, status, error, row_number() OVER (PARTITION BY source_id ORDER BY started_at DESC) AS n FROM fetch_runs) r
   WHERE n <= 6 GROUP BY source_id HAVING bool_and(status = 'failed') AND count(*) = 6 ORDER BY 1"
echo "== 8 worker 近 1 小时错误（去重）"
dc logs --since 1h worker 2>&1 | grep -i '"level":"error"' | grep -oE '"message":"[^"]{0,140}' | sort | uniq -c | sort -rn | head -12
echo "== 9 备份与镜像"
ls -1d "$dir"/backups/* 2>/dev/null | tail -3
docker image ls --format '{{.Repository}}:{{.Tag}} {{.CreatedSince}}' | grep -E 'cine(ma)?hot-app'
