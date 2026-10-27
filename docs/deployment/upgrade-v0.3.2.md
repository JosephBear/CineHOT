# 升级到 v0.3.2：给部署 Agent 的逐步操作

适用于已经是 v0.3.0 或 v0.3.1 的 VPS（`/opt/cinemahot`）。本版没有数据库迁移。**按顺序执行，每步核对“检查”，不符合就停止并把输出发给项目负责人。** 不要打印 `.env`、飞书 App Secret 和 GHCR 令牌。

## 第 1 步：升级

```bash
cd /opt/cinemahot
v=v0.3.2; img=ghcr.io/josephbear/cinemahot-app:$v
sudo docker pull $img
sudo docker run --rm --entrypoint cat $img deploy/vps/upgrade.sh | sudo tee upgrade.sh > /dev/null
sudo docker run --rm --entrypoint cat $img deploy/vps/check.sh | sudo tee check.sh > /dev/null
sudo bash upgrade.sh $v
```

**检查：** 迁移输出 `database is up to date`；冒烟 `all checks passed`；最后输出“完成：v0.3.2”。

## 第 2 步：录入 DeepSeek 单价（估算费用用）

按 DeepSeek 价格页 deepseek-flash 的**高峰时段**价格（偏保守），单位：元 / 百万 token。线上调用记在 `llm` 名下，后台“模型”页按 `deepseek` 查价，两条都录：

```bash
sudo docker exec -i cinemahot-db-1 psql -U cinemahot -d cinemahot -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO service_prices (service, model, currency, input_per_mtok, cached_per_mtok, output_per_mtok, source_url, verified_on, note)
VALUES ('llm', '', 'CNY', 2, 0.04, 8, 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing', '2026-10-27', 'deepseek-flash 高峰价；空闲时段为 1 / 0.02 / 4'),
       ('deepseek', '', 'CNY', 2, 0.04, 8, 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing', '2026-10-27', 'deepseek-flash 高峰价；空闲时段为 1 / 0.02 / 4')
ON CONFLICT (service, model) DO UPDATE SET input_per_mtok = EXCLUDED.input_per_mtok, cached_per_mtok = EXCLUDED.cached_per_mtok,
  output_per_mtok = EXCLUDED.output_per_mtok, source_url = EXCLUDED.source_url, verified_on = EXCLUDED.verified_on, note = EXCLUDED.note, updated_at = now();
SELECT service, model, input_per_mtok, cached_per_mtok, output_per_mtok FROM service_prices;
SQL
```

**检查：** 两行都是 `2 | 0.04 | 8`。之后 `check.sh` 第 4 段的“近24小时估算费用”会显示金额（按高峰价，实际扣费以 DeepSeek 账单为准，空闲时段约为一半）。

## 第 3 步：接通飞书告警（项目负责人准备好飞书应用后再做）

项目负责人提供 App ID、App Secret 和群 ID（`oc_` 开头）。写进 `.env`，不要回显：

```bash
cd /opt/cinemahot
set_env() { sudo sed -i "/^$1=/d" .env && echo "$1=$2" | sudo tee -a .env > /dev/null; }
read -r  -p "App ID: " A; set_env FEISHU_APP_ID "$A"
read -rs -p "App Secret: " S; echo; set_env FEISHU_APP_SECRET "$S"; unset S
read -r  -p "群 ID (oc_...): " C; set_env FEISHU_ALERT_CHAT_ID "$C"; set_env FEISHU_INTERNAL_CHAT_ID "$C"
set_env FEISHU_INTERNAL_ENABLED true
sudo docker compose -f compose.yml up -d worker
sudo docker compose -f compose.yml run --rm --no-deps worker node -e "import('@aihot/backend/notify/feishu').then(async m => console.log(await m.sendAlert('CineHOT 告警测试', ['飞书告警已接通。'])))"
```

**检查：** 最后一条输出 `sent`，飞书群里收到“CineHOT 告警测试”。输出 `disabled` 说明开关或群 ID 没读到；报 HTTP 错误多半是应用权限没开或机器人没进群，把错误发给项目负责人。之后积压、缺期、信源连续失败、付费服务拒绝等告警，以及读者反馈，都会发到这个群。

## 第 4 步：核对

```bash
sudo bash /opt/cinemahot/check.sh
```

**检查：** 版本 0.3.2；预算 `20 | 500 | 2000`；“近24小时估算费用”有数字。

## 回退

本版没有迁移。按第 1 步打印的备份目录，把 `compose.yml` 和 `env.backup`（改名为 `.env`）放回原处，再 `sudo docker compose -f compose.yml up -d api web worker`。
