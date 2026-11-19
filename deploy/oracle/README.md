# Oracle ARM64 部署模板

此模板适用于新建实例，复用 [VPS Compose](../vps/compose.yml)。使用 Docker Compose 2.24.4 或以上版本。复制基础文件与本目录的覆盖文件到同一部署目录，分别命名为 `compose.yml` 和 `compose.override.yml`。按 [VPS 说明](../vps/README.md) 准备私有的 `.env`，设置正式站点的 `SITE_URL`、数据库凭据和模型凭据。

- `CINEMAHOT_IMAGE` 填已发布的多架构镜像标签或清单摘要。Docker 在 ARM64 主机自动选择对应镜像。
- `LLM_BASE_URL` 和 `LLM_MODEL` 填运营方选用的接口与模型。只在指定的主采集实例启用采集和评分。
- `REPORT_HISTORICAL_DAILY_GAPS` 默认留空。仅对人工核实的历史缺档填入日期，多项以逗号分隔。
- HTTPS 反向代理转发至 `127.0.0.1:13000`。可用 `CINEHOT_WEB_PORT` 调整端口。

先运行 `docker compose config --quiet` 校验配置，再按基础部署说明迁移、启动并访问 `/api/health`。现有实例升级时需沿用原 Docker 引擎、Compose 项目名、数据库及文件卷挂载，核实备份后再操作；直接使用新项目的默认卷会打开空库。

[反向代理示例](nginx.conf.example)适用于由 Nginx 独占 TCP 443 的主机。已有 TLS 分流的主机请沿用现有入口，仅将 CineHOT 的上游指向对应回环端口。

## 已有 Oracle 项目升级

在部署主机使用该项目实际使用的 Docker CLI 和引擎（如通过 `DOCKER_HOST` 指定专用 Unix socket），安装 Python 3 和 PyYAML。先按发布清单摘要拉取目标镜像。以能读写部署目录并能访问该 Docker 引擎的用户运行：

```bash
docker pull "$RELEASE_IMAGE"  # 完整的 仓库@sha256:… 引用
python3 deploy/oracle/upgrade.py --api "$RUNNING_API_CONTAINER" --image "$RELEASE_IMAGE"
```

脚本从运行容器的 Compose 标签读取项目、目录和配置文件顺序。Web 必须仅绑定回环，API 与 worker 必须共享实际的 /data，数据库的数据目录必须有持久挂载。只有配置哈希与现有容器一致、模型配置一致、候选 Compose 只变更三个应用镜像时才进入维护窗口。选择与原部署一致的 Compose 版本。升级期间应停掉项目外的数据库写入方或外部监督程序。

脚本停止三个应用服务，保留 DB。私有备份目录记录 Compose、项目 .env（如果存在）、实际挂载清单、数据库逻辑备份及 /data 归档。单独保存项目以外的环境文件、密钥和宿主服务配置。脚本对照源挂载检查归档，在临时容器解包并校验文件，在独立 PostgreSQL 中完整恢复数据库并核对业务表行数，通过后写入 RESTORE_VERIFIED。请预留归档与临时恢复实例的磁盘空间，并将验证过的备份另存。

备份或演练失败会尝试重新启动旧容器。迁移开始后出错则保留备份，人工核对数据库迁移状态再回退；不得只换回旧镜像就开放写入。成功时网页和健康接口就绪后才启动 worker。备份中的 inventory.json 记录原配置顺序与挂载，compose-0.yml 为升级前的基础文件。恢复演练可参考同目录 test-upgrade.sh，它只供一次性测试主机使用。
