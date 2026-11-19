# Oracle ARM64 部署模板

此模板适用于新建实例，复用 [VPS Compose](../vps/compose.yml)。使用 Docker Compose 2.24.4 或以上版本。复制基础文件与本目录的覆盖文件到同一部署目录，分别命名为 `compose.yml` 和 `compose.override.yml`。按 [VPS 说明](../vps/README.md) 准备私有的 `.env`，设置正式站点的 `SITE_URL`、数据库凭据和模型凭据。

- `CINEMAHOT_IMAGE` 填已发布的多架构镜像标签或清单摘要。Docker 在 ARM64 主机自动选择对应镜像。
- `LLM_BASE_URL` 和 `LLM_MODEL` 填运营方选用的接口与模型。只在指定的主采集实例启用采集和评分。
- `REPORT_HISTORICAL_DAILY_GAPS` 默认留空。仅对人工核实的历史缺档填入日期，多项以逗号分隔。
- HTTPS 反向代理转发至 `127.0.0.1:13000`。可用 `CINEHOT_WEB_PORT` 调整端口。

先运行 `docker compose config --quiet` 校验配置，再按基础部署说明迁移、启动并访问 `/api/health`。现有实例升级时需沿用原 Docker 引擎、Compose 项目名、数据库及文件卷挂载，核实备份后再操作；直接使用新项目的默认卷会打开空库。

[反向代理示例](nginx.conf.example)适用于由 Nginx 独占 TCP 443 的主机。已有 TLS 分流的主机请沿用现有入口，仅将 CineHOT 的上游指向对应回环端口。
