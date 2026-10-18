# CinemaHOT 信源管理

信源名单保存在 `industry/sources.json`，当前共登记80个：55个RSS、21个网页列表、4个JSON列表；找不到可采集入口的外部导入来源已移出。外部导入不代表已开通定时采集；2026-10-18由外部导入改为自动采集的11个来源使用了新ID，已有部署的升级步骤见[信源目录](catalog.md#2026-10-18-外部来源转为自动采集)。访问失败及月份覆盖范围以本轮刷新报告为准。运行中的配置由后台管理，首次或新 ID 初始化时从文件导入。完整名单与适配依据见[信源目录](catalog.md)，全部参数见[采集配置参考](../sources.md)，为新信源找采集入口见[信源侦测](../../scripts/source-discovery/README.md)。

## 在后台新增信源

1. 登录网站 `/admin/login`，进入 `/admin/sources`，选择“新增信源”。本机入口为 `http://localhost:3000/admin/sources/new`。
2. 填写稳定 ID、名称和采集方式。ID 使用小写字母、数字和连字符，例如 `rss-new-publisher`；创建后不要把同一来源重复建成多个信源。
3. 官方厂商或机构使用 T1，知名媒体和创作者按实际来源使用 T2；日常资讯选 `editorial`。采集间隔默认 60 分钟，站内全文与订阅全文保持关闭。
4. 有 RSS 时优先使用 RSS，配置填写真实订阅 URL：

```json
{"feedUrl":"https://example.org/feed.xml"}
```

以上地址只是格式示例。普通网站首页不能代替 RSS。没有 RSS 的网页使用 `web_list`，需配置列表、文章链接、标题和日期选择器；JSON 列表需配置字段路径。动态网站可能需要专门适配，不能保证只填网址就能采集。

5. 点击“预览抓取”，检查标题、原文链接和发布日期，再创建。预览不导入文章、不调用模型；详情读取仍会请求来源网站。
6. 等待采集与模型队列处理。首次最多回灌 8 条，全文默认只用于内部理解，公开出口保留摘要和原文链接。

## 修改、暂停与排查

在 `/admin/sources` 编辑配置或暂停信源。修改后先预览，再检查最近抓取时间、错误和文章数量；HTTP 403 表示来源拒绝访问，不能据此假装抓取成功。不要关闭 SSRF 或 TLS 检查来绕过失败。

站点固定间隔由 `site/site.ts` 的 `SOURCE_DEFAULTS.fixedIntervalMinutes` 控制，目前为 60（2026-10-18 起，此前为 360）。每日调整会保留该值；设为 `null` 才恢复按产量自适应。预算耗尽的重试与采集间隔是两件事。

## 把信源保存到仓库

后台操作立即修改当前数据库，不会自动改写 GitHub 文件。验证信源可用后，将相同 ID 与完整配置写入 `industry/sources.json`，再提交 Git；这样新部署能初始化它。

`node --env-file=.env scripts/seed.ts` 只添加不存在的 ID，不覆盖人工配置；从 JSON 删除一个 ID 也不会删除数据库记录。已有部署要通过后台分别更新或暂停。只同步代码不会迁移文章和数据库。

## Blackmagic 正文规则

官方文章页为动态页面，信源使用同源公开片段读取正文，公开原文链接保留不变。配置为：

```json
{
  "bodyUrlPrefixRewrite": {
    "from": "https://www.blackmagicdesign.com/media/release/",
    "to": "https://www.blackmagicdesign.com/media/partial/release/"
  }
}
```

编辑时应在现有完整 `config` 中加入此项，不能用这段替换整个配置。前缀必须同源、以 `/` 结尾；正文下载仍执行原有网络安全检查。

## 指定创作者账号

影视飓风、调色师手册、数字生命卡兹克的链接、收录范围及接入障碍见[创作者账号清单](creator-accounts.md)，结构化清单在 `industry/source-watchlist.json`。目前均为待接入，不计入已启用的19个信源。

## AI影视创作来源

2026-10-15新增Google官方AI订阅和ComfyUI官方版本Atom，源配置已保存到 `industry/sources.json`。采集到的资料仍经过影视创作相关性筛选，不能把Google的泛AI新闻都视为已公开AI影视内容。Google首批最多8条、ComfyUI最多3条，均保持360分钟；其余来源首批仍最多8条。公开内容只展示摘要与链接。真实抓取可能短暂失败，应按后台运行记录确认成功。
