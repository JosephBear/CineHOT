# CinemaHOT 信源配置与验收

CinemaHOT 第一阶段沿用电影摄影分类和文本资讯引擎。站名统一为 CinemaHOT；公开 MCP 前缀保持 `cinemahot`，抓取 User-Agent 为 `CinemaHOTBot/1.0`。

2026-10-14 保留当前 12 个 RSS，新增 ARRI Newsroom、Blackmagic Design、Wandering DP、Team Deakins 和影视工业网，共 17 个配置来源。ARRI 和 Blackmagic 是 T1 官方来源；新增创作者与媒体暂按 T2 评价。首次回灌上限均为 8 条；站内与订阅全文权限均关闭。播客条目只使用公开介绍，不代表已经转写或听过音频。

| 新增来源 | 采集入口 | 读取方式 |
|---|---|---|
| ARRI | `https://www.arri.com/en/company/arri-news` | 读取新闻卡片，排除其他语言及导航链接 |
| Blackmagic | `https://www.blackmagicdesign.com/media/partial/archive` | 官网脚本使用的新闻列表；同一天的每篇公告共享卡片日期 |
| Wandering DP | `https://wanderingdp.com/feed/` | RSS |
| Team Deakins | `https://rss.libsyn.com/shows/265448/destinations/2018942.xml` | 官方播客订阅；由原 `teamdeakins.libsyn.com/rss` 重定向确认 |
| 影视工业网 | `https://cinehello.com/` | 首页文章列表；读取公开文章的编码元数据以取得完整日期 |

ARRI 与 Blackmagic 的列表只提供日期，按 UTC 日值记录，没有推断具体发布时刻。影视工业网 `/stream/` 页面只显示月日，其 `stream_id` 对应 `/morning/articles/` 页中的公开 `window._data`。`cinehello_home` 适配器只解码这段 JSON，核对文章 ID、公开状态和带时区的完整时间戳，不执行页面脚本，不读取或使用页面中的登录凭据。缺少可信元数据时会报告采集失败，不猜测年份。

`web_list` 的 `multipleLinks: true` 用于一个日期卡片下有多篇文章的列表；每篇标题取自自己的链接，共用卡片日期。默认仍只读取一个链接，保持已有信源行为。该选项与 `titleSelector` 同用时，标题选择器相对于每个链接。

执行只读核验，不会导入数据库、调用模型或调用付费服务：

```sh
node scripts/check-cinemahot-sources.ts
node scripts/check-cinemahot-sources.ts --ids web-arri-news,web-blackmagic-news,web-cinehello,rss-wandering-dp,rss-team-deakins
```

`industry/sources.json` 仅在首次启动导入。已有部署可以运行 `node --env-file=.env scripts/seed.ts` 添加新 ID；它不会覆盖后台修改过的配置。修改网页源码后应重新构建前端。

评分校准、品牌图形、运行环境及上线条款分别在后续问题中验收，本项不将配置完成记作公开上线。

## 2026-10-14 验证记录

新增适配的 6 项回归测试、既有采集测试和下载页面重放均通过。真实页面分别解析出 ARRI 11 条、Blackmagic 历史存档 2213 条、Wandering DP 10 条、Team Deakins 378 条；这些是列表解析数量，首次入库仍受 8 条回灌上限约束。影视工业网使用实际网络采集取得 20 条完整日期的公开文章。

本机海外域名 DNS 返回了 SSRF 防护拒绝的保留地址，直接运行核验脚本时会显示 `Blocked private address`。上述海外数据使用实际下载页面进行离线重放，不能据此声称本机后台采集已全部跑通。此项运行环境限制留到问题 5 处理，保留现有网络防护。
