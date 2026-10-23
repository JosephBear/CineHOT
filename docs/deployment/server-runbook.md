# CineHOT 服务器部署手册

适用版本：**v0.2.0**。编写日期：**2026 年 10 月 17 日**。

面向服务器负责人，目标是让位于学校不同网络的少量教师、学生通过浏览器访问 CineHOT。推荐方案为 **Linux 服务器 + Docker Compose + 宿主机 Nginx + 学校 HTTPS 证书**。本文主线以 Ubuntu 24.04 LTS 为例；其他系统应由负责人替换系统软件安装命令，应用部署步骤相同。

本文提供操作步骤，尚未在学校服务器实际执行。所有 IP、域名和证书路径示例都需要替换；`202.205.122.xx` 不是可执行地址，也不能据此推断学校的子网掩码。

## 先看执行顺序

1. 确认服务器、跨网段路由、域名和 HTTPS 证书。
2. 安装 Docker，取得 v0.2.0 代码，生成服务器专用配置。
3. 选择“迁移现有文章”或“空库启动”，两条路径只能选一条。
4. 先启动网页和 API，验证历史内容及管理员登录。
5. 配置 Nginx、校园访问范围和可选的试用人员访问密码。
6. 从实际校园网络验收，再决定是否开启服务器自动采集及模型。
7. 安排备份、监控和后续更新。

本机的 24 小时费用观察仍在进行。可以先完成服务器环境和网络准备，等费用汇总后再安排正式迁移；如果提前迁移，记录旧机停止、新机接管时间，不能把中断时间当作完整观察时间。

## 第 1 步：填写部署信息

**操作：** 由信息中心与项目负责人共同确认下表。

| 项目 | 实际值或要求 |
|---|---|
| 操作系统 | Ubuntu 24.04 LTS，或记录实际发行版与版本 |
| 服务器资源 | 小规模测试起点可按 2 核、4 GB 内存准备；磁盘按数据增长预留 |
| SSH 账号、端口 | 由管理员分配，确认有安装服务所需权限 |
| 固定校园 IP | 填真实完整 IP，由信息中心配置 |
| 域名 | 示例 `cinemahot.example.edu`，替换为学校实际域名 |
| 允许访问的校园 CIDR | 分别确认办公网、学生 Wi-Fi 等网段，不猜测 `/24` |
| HTTPS 证书、私钥和证书链 | 由学校提供，并记录续期负责人 |
| 外网出口 | 能访问 GitHub、镜像与软件源、模型服务及新闻来源 |
| 数据迁移 | 本文建议迁移当前文章与配置，避免上线后成为空站 |
| 试用人员限制 | 校园 IP 范围；如需限制到受邀人员，再加独立访问密码 |

**目的：** 确保不是“服务器自己能访问，但其他教学楼无法打开”。域名解析和跨网段路由都必须真实可达。

**检查：** 从至少一个教师办公网络和一个学生网络确认服务器入口可达。路由不通时先由信息中心处理，修改网页代码不能解决路由隔离。

## 第 2 步：安装并检查 Docker

**执行位置：学校服务器。** 已有可用 Docker Engine 与 Compose 插件时，跳过安装，只运行检查。

```bash
cat /etc/os-release
uname -m
df -h
docker --version
docker compose version
```

若是尚未安装 Docker 的 Ubuntu 24.04 专用服务器，可按以下方式配置官方软件源。已有其他容器平台或冲突软件时，由服务器负责人先按官方文档评估，不直接卸载现有服务。

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

本文后续统一使用 `sudo docker`，不要求给普通账号额外授予 Docker 用户组权限。

**目的：** 用同一套容器定义运行数据库、API 和网页，避免手工安装 Node、PostgreSQL 及各项依赖。

**检查：** `hello-world` 正常退出，Compose 显示版本号。官方安装依据见文末资料。

## 第 3 步：取得指定版本的代码

**执行位置：学校服务器，以部署账号操作。** 仓库为私有，先由仓库所有者配置读取权限。可以使用只读部署密钥；私钥保存在服务器，不放入项目目录或聊天，也不在 Git URL 中嵌入令牌。

下面使用已经配置好 SSH 认证的示例：

```bash
git clone --branch v0.2.0 --depth 1 git@github.com:JosephBear/cinemahot.git "$HOME/cinemahot"
cd "$HOME/cinemahot"
cat VERSION
git rev-parse HEAD
```

如果负责人已有安全配置的 HTTPS 认证，也可将仓库地址换为 `https://github.com/JosephBear/cinemahot.git`。

**目的：** 固定到经过验证的版本，不在部署过程中意外使用变化中的代码。

**检查：** `VERSION` 为 `0.2.0`；运行 `git describe --tags --exact-match` 应返回 `v0.2.0`，并将 `git rev-parse HEAD` 与 GitHub 发布标签对应提交核对。

内部包、镜像和 Compose 项目仍沿用框架的 `aihot` 名称；网站品牌是 CineHOT。不要临时改数据库名或卷名，以免连接到另一套空数据。

## 第 4 步：生成服务器专用配置

**执行位置：学校服务器，项目根目录。** 不需要在宿主机另装 Node，使用 Node 24 容器运行项目初始化脚本：

```bash
cd "$HOME/cinemahot"
sudo docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$PWD:/app" -w /app \
  node:24-trixie-slim node scripts/init-env.ts
chmod 600 .env
nano .env
```

初始化只在 `.env` 不存在时运行；已有配置不要覆盖。脚本会在负责人的终端显示一次随机管理员密码，由负责人私密保管。

在生成文件中编辑以下字段，**不要用下面片段覆盖整个 `.env`**：

```dotenv
SITE_URL=https://cinemahot.example.edu
PORT=127.0.0.1:3000
TRUST_PROXY=true
AIHOT_RELEASE=v0.2.0

LLM_BASE_URL=https://api.deepseek.com/
LLM_MODEL=deepseek-flash
LLM_API_KEY=
LLM_EXTRA_JSON={"thinking":{"type":"disabled"}}

COLLECT_ENABLED=false
MODEL_CALLS_ENABLED=false
FEISHU_CONTENT_PUSH_ENABLED=false
FEISHU_INTERNAL_ENABLED=false
INDEXNOW_SUBMIT_ENABLED=false
```

- 替换 `SITE_URL` 为学校实际 HTTPS 地址；RSS、分享链接和 MCP 会使用它。
- 保留脚本生成的 `ADMIN_PASSWORD`、`SESSION_SECRET`、`IMG_PROXY_SIGN_SECRET`、`POSTGRES_PASSWORD`，不要留空或改成示例密码。
- API Key 示例特意留空。只读展示阶段可以保持为空；启用模型前，由负责人直接填入服务器私密 `.env`。
- Docker 里的数据库连接由 Compose 配置提供，不要照抄旧电脑的 `127.0.0.1:55434` 数据库地址。
- 不要配置 `DEV_AUTH_*`、`ALLOW_PRIVATE_NETWORK_FETCH=true`。Compose 会以生产环境运行并检查关键配置。
- 不要照抄旧电脑的 `EGRESS_PROXY_URL=http://127.0.0.1:55435`。容器中的回环地址指容器自己；确实需要代理时，填写学校提供、容器可达的实际代理地址。

**目的：** 先以不发起模型调用的状态启动，密钥与运行配置只留在服务器；网站应用端口仅在服务器本机开放。

**检查：** 只做不展开密钥的配置校验：

```bash
sudo docker compose config --quiet
git check-ignore .env
```

不要把不带 `--quiet` 的完整配置输出发到群里，它可能展开私密环境变量。

## 第 5 步：构建镜像并启动数据库

**执行位置：学校服务器。**

```bash
sudo docker compose build
sudo docker compose up -d db
sudo docker compose ps
sudo docker compose exec -T db pg_isready -U aihot -d aihot
```

此时先只启动 `db`，不要提前运行整套 `up -d`。下一步若要恢复旧数据，必须在目标库还是空库时进行。

**目的：** 提前完成耗时构建，并为数据迁移准备 PostgreSQL 17，减少旧电脑停机时间。

**检查：** `db` 为 healthy，`pg_isready` 显示 accepting connections。镜像或依赖下载失败时先修复服务器出口或配置经过学校确认的软件源，不关闭 TLS 验证。

## 第 6 步：选择数据初始化方式

### 方式 A：迁移当前文章和配置（建议）

**目的：** 保留已采集的文章、信源设置、模型回执和预算。GitHub 代码本身不含这些数据。

#### A1. 旧电脑正常停止应用，等待模型收尾

**执行位置：当前运行 CineHOT 的 Mac。** 由项目负责人在启动器所在终端按 Ctrl-C，等待出现 `worker stopped`，最长预留 210 秒。启动器会停止 API、网页和 worker，PostgreSQL 保持运行。

如果启动器由其他工具后台启动，由维护者确认 `work/run-local.py` 的准确进程身份后发送正常终止信号，并检查 worker 已停止；不要用模糊匹配批量结束进程，也不要强制杀掉进行中的模型请求。

从这一步到新服务器接管，旧电脑不要重新开启采集。这样不会在两台机器上重复处理同一批新闻。若必须回退，按第 13 步处理。

#### A2. 导出数据库和数据目录

**执行位置：旧 Mac 的终端。** 以下路径对应当前项目，换路径后应调整：

```bash
export PATH="/Users/josephus/Documents/ChatGPT/Cinema-hot/work/postgres17/bin:$PATH"
migration_dir="$HOME/cinemahot-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$migration_dir"

psql 'postgres://postgres@127.0.0.1:55434/cinemahot_local' \
  -v ON_ERROR_STOP=1 \
  -c "SELECT status, count(*) FROM receipts WHERE status IN ('pending','unknown') GROUP BY status;"
```

如果仍有 `pending` 或 `unknown`，先核对进行中的调用和服务商记录，处理回执后再继续切换；不能通过删除回执或重复调用来“清空错误”。

```bash
pg_dump -Fc \
  -d 'postgres://postgres@127.0.0.1:55434/cinemahot_local' \
  -f "$migration_dir/database.dump"

psql 'postgres://postgres@127.0.0.1:55434/cinemahot_local' \
  -v ON_ERROR_STOP=1 -At \
  -c "SELECT (SELECT count(*) FROM articles), (SELECT count(*) FROM publications), (SELECT count(*) FROM sources);" \
  > "$migration_dir/counts.txt"

tar -C '/Volumes/AI/Cinema-hot/cinema-hot/.data' \
  -czf "$migration_dir/files.tar.gz" .

chmod 600 "$migration_dir"/*
shasum -a 256 "$migration_dir/database.dump" "$migration_dir/files.tar.gz"
```

这里备份 `.data/`，不打包 `.env` 或源码中的本机凭据。当前 `.data` 路径若被实际 `AIHOT_DATA_DIR` 覆盖，应改为真实数据目录。备份包含运行数据，只通过负责人控制的安全通道传输，不上传 GitHub。

**检查：** 所有命令成功退出，备份文件非空，记录两个 SHA-256。Mac 与服务器之间使用 SSH/SCP 或学校批准的安全传输方式。

#### A3. 传到服务器

**执行位置：旧 Mac。** 将以下示例账号和地址换成真实值；非默认 SSH 端口使用 `scp -P 实际端口`。

```bash
scp -r "$migration_dir" deployer@server.example.edu:~/
```

**执行位置：学校服务器。** 将下面目录名换成刚收到的目录；重新开终端后也要重新设置此变量：

```bash
migration_dir="$HOME/cinemahot-migration-实际时间戳"
chmod 700 "$migration_dir"
chmod 600 "$migration_dir"/*
sha256sum "$migration_dir/database.dump" "$migration_dir/files.tar.gz"
cd "$HOME/cinemahot"
```

**检查：** 两个 SHA-256 与旧 Mac 的记录逐一相同。

#### A4. 只恢复到全新的空目标库

**执行位置：学校服务器。**

```bash
sudo docker compose exec -T db psql -U aihot -d aihot \
  -v ON_ERROR_STOP=1 \
  -c "SELECT schemaname, count(*) FROM pg_tables WHERE schemaname IN ('public','pgboss') GROUP BY schemaname;"
```

预期没有业务表。若目标库已有文章或队列表，停止恢复，由负责人选择另建部署实例或另行制定数据替换方案；不要把以下恢复命令强行重复执行。

```bash
sudo docker compose exec -T db pg_restore \
  -U aihot -d aihot \
  --no-owner --no-privileges --exit-on-error --single-transaction \
  < "$migration_dir/database.dump"

sudo docker compose run --rm --no-deps --user root \
  --entrypoint sh \
  -v "$migration_dir:/restore:ro" \
  api -c 'tar --no-same-owner -xzf /restore/files.tar.gz -C /data && chown -R node:node /data'

sudo docker compose exec -T db psql -U aihot -d aihot \
  -v ON_ERROR_STOP=1 -At \
  -c "SELECT (SELECT count(*) FROM articles), (SELECT count(*) FROM publications), (SELECT count(*) FROM sources);"
cat "$migration_dir/counts.txt"
```

**目的：** 忽略旧电脑的数据库拥有者身份，将数据恢复为服务器容器中的用户可用；数据库与附件目录一并迁移。

**检查：** 恢复无报错，文章、发布记录和信源数量与导出记录一致。失败则不要启动采集，应先排查或恢复目标服务器快照。

### 方式 B：从空库开始

不保留现有新闻时跳过方式 A，直接进入第 7 步。`setup` 会创建表并初始化 94 个登记信源（全部支持自动采集）；不开启采集与模型时，空页面是正常状态。

**目的：** 适用于明确不需要历史数据的新环境，而不是修复迁移失败的捷径。

## 第 7 步：先启动网页和 API

**执行位置：学校服务器。**

```bash
cd "$HOME/cinemahot"
sudo docker compose up -d api web
sudo docker compose ps -a
sudo docker compose logs --tail=100 setup api web
curl --fail --show-error http://127.0.0.1:3000/api/health
curl --fail --show-error -o /dev/null http://127.0.0.1:3000/all
```

这里不启动 worker。`setup` 正常完成后显示 Exited (0) 是正常结果；若它失败，先解决迁移或初始化错误，不能忽略错误继续开采集。

**目的：** 将“内容能否展示”和“模型能否付费处理”分开验收。

**检查：** API、web 持续运行，健康接口和 `/all` 返回 HTTP 200，健康信息显示配置的版本。迁移方案应能显示原有文章；空库方案则暂时没有文章。没有 worker 时，后台运行页可能显示尚未启动后台任务，符合本阶段预期。

## 第 8 步：配置校园域名、HTTPS 和访问范围

**执行位置：学校服务器和学校 DNS／网络管理平台。**

1. 信息中心将实际域名解析到该服务器的校园可达地址；确认试用者使用的 DNS 能解析。
2. 安装或复用 Nginx。Ubuntu 专用服务器安装命令如下，已有 Nginx 时不替换现有站点：

```bash
sudo apt-get install -y nginx
```

3. 由证书负责人将证书链和私钥安装到指定位置，并设置私钥访问权限。不要将证书私钥加入项目仓库。
4. 将以下独立站点配置保存为 `/etc/nginx/sites-available/cinemahot.conf`，替换域名、证书路径及所有校园 CIDR。

```nginx
server {
    listen 443 ssl;
    server_name cinemahot.example.edu;

    ssl_certificate     /etc/nginx/tls/cinemahot.crt;
    ssl_certificate_key /etc/nginx/tls/cinemahot.key;

    allow 192.0.2.0/24;
    deny all;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
```

`192.0.2.0/24` 是文档示例，必须换成学校确认的网段。多个网段写多行 `allow`，放在 `deny all` 之前。Nginx 逐条匹配规则。

如果 Nginx 前还有学校负载均衡／网关，需要信息中心先配置可信代理和真实客户端 IP 的识别；不能把任意请求提供的 IP 头当作真实校园地址。

```bash
sudo ln -s /etc/nginx/sites-available/cinemahot.conf /etc/nginx/sites-enabled/cinemahot.conf
sudo nginx -t
sudo systemctl reload nginx
```

若链接已存在，检查现有指向，不强行覆盖。只有 `nginx -t` 成功才执行 reload。

5. 信息中心在服务器防火墙／学校网关上允许实际试用网段访问 TCP 443，同时保留管理员现有 SSH 通道。不直接开放数据库、API、代理或网页 3000 端口；本方案不启动 Compose 的 Caddy HTTPS profile，避免与 Nginx 抢占端口。

**目的：** 为不同校园网络提供统一 HTTPS 入口，并限制可访问范围。Docker 的端口发布不应仅依赖 UFW 规则；本方案直接把 3000 绑定到回环地址。

**检查：** 从实际试用设备访问学校 HTTPS 域名，无证书警告，打开 `/all` 正常；仅在服务器运行 `curl` 成功不能证明跨网段访问成功。

## 第 9 步：需要时给试用者增加独立访问密码

若“部分人试用”只指先邀请少数人、并不严格禁止其他校内人员访问，可跳过本步。若要严格限制到受邀人员，在 Nginx 增加一层访问认证；这个密码不等于网站后台管理员密码。

**执行位置：学校服务器。首次创建密码文件时执行：**

```bash
sudo apt-get install -y apache2-utils
sudo htpasswd -c /etc/nginx/cinemahot.htpasswd trial-reader
sudo chown root:www-data /etc/nginx/cinemahot.htpasswd
sudo chmod 640 /etc/nginx/cinemahot.htpasswd
```

命令交互输入密码，不把密码写在命令行参数中。`-c` 只用于首次创建；已有文件时去掉 `-c`，否则会覆盖原有用户。

在 CineHOT 的 `server` 块中、`location` 之前加入：

```nginx
satisfy all;
auth_basic "CineHOT campus trial";
auth_basic_user_file /etc/nginx/cinemahot.htpasswd;
```

再次执行 `sudo nginx -t`，通过后 reload。试用人员需要同时满足校园 IP 范围和访问密码要求。此方案在浏览器原生认证框输入账号密码，不需要给每个人创建网站管理员。

**检查：** 未输入访问密码时返回 401，输入有效访问密码后可阅读；进入 `/admin` 仍需独立的管理员登录。RSS、API、MCP 也受这层访问限制，外部客户端需支持相应认证。

## 第 10 步：验证内容和管理员权限

**执行位置：实际试用者设备、服务器终端。**

| 检查 | 操作 | 通过条件与目的 |
|---|---|---|
| 跨网段访问 | 办公网和学生 Wi-Fi 各打开一次 HTTPS 网站 | 均可打开，验证真实路由和访问名单 |
| 内容 | 打开 `/all`、一篇文章、原文链接 | 文章正常，原文链接仍指向来源 |
| 精选 | 打开首页并与全部列表比较 | 只展示符合规则的精选；门槛来自首轮186条标注，样本仍有限 |
| 手机 | 手机查看列表、筛选、搜索 | Logo、导航和内容不重叠 |
| 订阅地址 | 打开 `/feed/all.xml` | 返回 RSS；绝对地址使用学校域名 |
| 管理员保护 | 无管理员会话请求 `/api/admin/settings` | 返回 401；不能直接读取预算设置 |
| 管理员登录 | 在 `/admin/login` 输入服务器新生成的管理员密码 | 登录成功，可查看后台 |

旧数据库会话与旧电脑密钥绑定；服务器使用新密码和新会话密钥后，旧登录失效属于预期行为。

可在服务器运行项目自带的全站检查，不调用模型：

```bash
sudo docker compose exec -T web node scripts/smoke.ts --base http://127.0.0.1:3000
```

**检查：** 全站检查通过。内部检查绕过校园代理层，因此仍需上表中的实际设备测试。

## 第 11 步：确认预算，再选择是否开启采集

如果目前只需大家查看现有内容，可以维持 `COLLECT_ENABLED=false`、`MODEL_CALLS_ENABLED=false`，并不启动 worker；网页照常展示已有文章。

需要服务器持续更新时，按以下顺序操作：

1. 再次确认旧电脑的 worker 已停止，不会再次自动启动。
2. 在服务器私密 `.env` 填入模型 Key，保留 `LLM_MODEL=deepseek-flash` 等经确认的服务配置。所有 Key 示例仍应留空，不回传给聊天或 GitHub。
3. 在后台 `/admin/settings` 将默认模型服务 `llm` 预算设置为 **20 次/分钟、300 次/小时、1000 次/滚动 24 小时**（2026-10-19 起：94 个信源每小时采集，每篇相关资料至少 5 次调用，200 次会持续积压），填写修改原因。其他未使用的付费服务保持停用。
4. 在 `/admin/sources` 核对登记信源、60 分钟间隔及 Blackmagic 正文规则。空库使用版本种子配置：94 个，全部自动采集。迁移来的旧库保留原有设置，运行 seed 后多出 11 个新 ID，按[信源目录](../sources/catalog.md#2026-10-18-外部来源转为自动采集)暂停对应的旧 external 来源。
5. 确认 `/admin/models` 的模型与单价。迁移会保留 `service_prices`；新库可能没有该模型价格，显示“未定价”不等于免费，由维护者按服务商当期价格配置后再解释费用估算。
6. 修改 `.env` 中这两项，其余推送开关继续关闭：

```dotenv
COLLECT_ENABLED=true
MODEL_CALLS_ENABLED=true
```

在启动新 worker 前，记录费用观察基线，并保留输出与准确接管时间：

```bash
sudo docker compose exec -T db psql -U aihot -d aihot \
  -v ON_ERROR_STOP=1 \
  -c "SELECT now() AS observed_at, (SELECT coalesce(max(id),0) FROM receipt_attempts) AS last_attempt_id, (SELECT count(*) FROM articles) AS articles;"

sudo docker compose up -d --force-recreate api worker
sudo docker compose ps
sudo docker compose logs --tail=100 worker
```

**目的：** 服务器成为唯一持续采集端，并沿用已约定的请求次数限制。1000 次不是人民币金额的硬上限，实际费用以服务商账单为准。迁移过来的最近调用回执仍计入滚动时间窗，不会因换服务器立即获得新额度。

**检查：** 后台任务出现新的采集记录；模型有回执且无不明重复请求；成功抓取后下次时间约为 60 分钟以后。部分来源可能拒绝访问，例如 ASC 曾返回 403，不能将拒绝访问记为成功。

可以只读检查几个来源的服务器出口：

```bash
sudo docker compose exec -T api node scripts/check-cinemahot-sources.ts --ids web-arri-news,web-blackmagic-news
```

该检查请求真实来源，不导入数据、不调用模型。失败应排查服务器 DNS、出口、HTTP 状态或学校提供的代理，不关闭原有 SSRF/TLS 防护。

## 第 12 步：记录费用基线并安排备份

**执行位置：学校服务器。** 使用第 11 步在启动 worker 前记录的 `observed_at`、`last_attempt_id` 与切换时间，之后按新增回执和实际 token 汇总费用。原本在 Mac 上安排的 Codex 观察任务不会随数据库或 GitHub 自动迁移；服务器负责人需要另行落实观察与告警。

### 手工备份一次并验证备份可读取

在约定的维护窗口停止应用写入，数据库继续运行：

```bash
sudo docker compose stop -t 210 api worker web
```

然后执行备份：

```bash
backup_dir="$HOME/cinemahot-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"
chmod 700 "$HOME/cinemahot-backups" "$backup_dir"

sudo docker compose exec -T db pg_dump -U aihot -Fc aihot > "$backup_dir/database.dump"

sudo docker compose run --rm --no-deps --user root --entrypoint tar \
  api -C /data -czf - . > "$backup_dir/files.tar.gz"

chmod 600 "$backup_dir"/*
sudo docker compose exec -T db pg_restore --list < "$backup_dir/database.dump" > "$backup_dir/archive-list.txt"
tar -tzf "$backup_dir/files.tar.gz" > "$backup_dir/files-list.txt"
```

备份成功后恢复原来的运行模式：只读站点执行 `sudo docker compose up -d api web`；此前已开启采集的站点执行 `sudo docker compose up -d api web worker`。不要把只读站点误切为采集模式。

数据库导出是一个一致的数据库快照，但与文件包不自动构成同一时刻的快照；上述正常停写保证交接时两者一致。日常备份由运维安排固定维护窗口或一致性快照，并保存到服务器以外受控存储；仅列出归档不代表已完成恢复演练。

项目也支持 `DB_BACKUP_STORE_*` 对象存储备份，运行中的 worker 会按项目排程执行。未配置对象存储或未启动 worker 时，不能假定每天已经自动备份。保留周期、异地副本、磁盘与证书到期监控由服务器负责人落实。

**目的：** 服务器、卷或人为操作出问题时，有可恢复的数据副本。不能把 GitHub 代码备份当成新闻数据备份。

## 第 13 步：更新与回退

### 更新代码

先在维护窗口正常停写并完成成对数据备份，再查看目标版本发布说明。以下 `vX.Y.Z` 必须替换为已存在、已确认的版本标签：

```bash
cd "$HOME/cinemahot"
git status --short
git fetch --tags origin
git checkout vX.Y.Z
sudo docker compose build
sudo docker compose stop -t 210 api worker web
sudo docker compose run --rm setup
sudo docker compose up -d api web
```

检查成功后再启动 worker：

```bash
sudo docker compose up -d worker
```

本地有未提交的修改时先由负责人处理，不强制覆盖。代码更新或修改 `.env` 后按需 `--force-recreate` 相关服务，确保进程实际载入新配置；单纯修改文件不会改变已运行进程。

### 本次首次迁移失败时

1. 新服务器保持采集和模型关闭，并停止新 worker。
2. 确认新服务器未发生需要保留的新写入或付费处理，再由项目负责人重新启动旧电脑作为唯一采集端。
3. 新服务器问题修复后重新安排一次最新数据迁移，不把过期快照与旧电脑新写入的数据混用。

### 已运行后的版本回退

先停止新服务并备份现场，再核对迁移兼容性；存在数据库结构变化时，需要恢复升级前的数据库与文件备份，不能只切回旧 Git 标签。不要使用 `docker compose down -v`，该命令会删除本项目数据卷。

## 常见现象与处理

| 现象 | 优先检查 |
|---|---|
| 本机能打开，其他楼宇超时 | 校园路由、域名解析、防火墙和跨网段访问名单 |
| Nginx 返回 403 | 真实校园 CIDR 是否匹配；前置代理是否导致客户端 IP 识别错误 |
| Nginx 返回 401 | 是否开启了试用访问密码；账号密码是否正确 |
| Nginx 返回 502 | `api/web` 是否运行，`curl http://127.0.0.1:3000/api/health` 是否成功 |
| 首次启动空页面 | 选了空库方案，或素材尚未完成筛选发布；先看 `/all` |
| 首页没有新精选 | 并非每条文章都会入选，检查全部列表与筛选结果，不盲目改门槛 |
| 模型停在队列 | Key、分钟/小时/滚动日预算、失败或未知回执 |
| RSS 链接指向 localhost | `.env` 的 `SITE_URL` 是否正确，相关容器是否已重建 |
| 海外来源失败 | 实际出口、DNS、来源 403 或代理配置；不要使用旧 Mac 的回环代理地址 |
| 生产容器拒绝启动 | 是否保留随机密钥、管理员密码，是否带了开发免登录变量 |

## 交接完成清单

- [ ] 记录服务器系统、负责人、IP、域名和证书续期方式。
- [ ] v0.2.0 代码与实际运行版本已核对。
- [ ] `.env` 权限为 600，Key 与密码不在 GitHub、文档或群聊中。
- [ ] 迁移数量核对一致，或明确接受空库启动。
- [ ] API、数据库和代理不直接向读者开放。
- [ ] 办公网及学生网络分别验收 HTTPS 页面。
- [ ] 需要限制受邀人员时，独立访问认证已验证。
- [ ] 后台未登录无法读取管理员 API。
- [ ] 当前采集端只有一处，保留 60 分钟和请求预算设置。
- [ ] 记录费用观察基线，明确实际扣费以服务商账单为准。
- [ ] 备份、恢复演练、日志检查与证书续期已有负责人。

## 官方资料与项目入口

- [CineHOT v0.2.0 发布记录](https://github.com/JosephBear/cinemahot/releases/tag/v0.2.0)
- [CineHOT 文档导航](https://github.com/JosephBear/cinemahot/tree/main/docs)
- [Docker 在 Ubuntu 上安装](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose 单机生产部署](https://docs.docker.com/compose/how-tos/production/)
- [GitHub 部署密钥](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)
- [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html)
- [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)
- [Nginx 按地址控制访问](https://nginx.org/en/docs/http/ngx_http_access_module.html)
- [Nginx 访问密码认证](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html)
