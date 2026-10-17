# CinemaHOT 信源配置与验收

CinemaHOT 第一阶段沿用电影摄影分类和文本资讯引擎。项目名称为 CinemaHOT，页面站名为“电影动态”；公开 MCP 前缀保持 `cinemahot`，抓取 User-Agent 为 `CinemaHOTBot/1.0`。

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


## v0.1.0 运行更新

17 个种子信源间隔统一为 480 分钟，首次回灌仍限制为 8 条；Blackmagic 增加官方同源正文片段规则。本机已完成一轮实际采集：16 个来源完成，ASC 返回 HTTP 403。历史 DNS 限制记录保留供追溯，当前项目代理及费用设置见[运行维护](../operations/README.md)。新增与维护操作见[信源管理](README.md)。

## 2026-10-15 AI来源接入

- `rss-google-ai-film`：`https://blog.google/technology/ai/rss/`，官方RSS预览20条；Google主体，T1。首批8条，涵盖影片/Flow创作案例，也包含须由相关性预筛排除的泛AI资料。
- `rss-comfyui-releases`：`https://github.com/Comfy-Org/ComfyUI/releases.atom`，官方仓库Atom预览10条；ComfyUI主体，T1。首批3条，使用发布说明作为内部理解材料。

两者首次与后续采集只接受2026-04-15之后的可信发布日期；间隔480分钟，不展示或订阅全文。种子共19个。LTX-Video旧仓库Atom只含2024年发布，未添加；Runway新闻页本次下载超时，尚未作为自动信源启用。创作者账号清单仍保持待接入。


## 2026-10-16 月度刷新与选定信源

用户确认原有19个来源之外的35个候选，现已登记到本机数据库与种子配置，共54个来源。当前31个RSS与4个网页列表保持480分钟间隔；19个`external`来源仅接受本轮导入，尚未完成长期采集适配。可用订阅的预览有真实条目，不代表每次联网都能成功，也不代表一个月归档已全部可读。

本轮窗口为2026-09-15 00:00（UTC+8）至2026-10-15 23:30:37（UTC+8）。先读取公开订阅、列表、可用分页及文章元数据，再通过既有相关性、评分与摘要流程发布。可靠日期缺失、访问验证及正文材料不足的条目单独记录；不猜测日期，不把旧文更新时间当作首发日期。部分RSS分页因连接错误只能取得部分月份内容。

| 分类 | 来源 | ID | 当前读取方式 | 内容入口 |
|---|---|---|---|---|
| A | Cinematography World | `rss-cinematography-world` | RSS／Atom；已读到真实条目 | https://www.cinematography.world/ |
| A | British Cinematographer | `rss-british-cinematographer` | RSS／Atom；已读到真实条目 | https://britishcinematographer.co.uk/ |
| A | Panavision Highlights | `web-panavision` | 本轮外部导入／待长期采集适配 | https://www.panavision.com/highlights |
| A | RedShark News | `rss-redshark` | RSS／Atom；已读到真实条目 | https://www.redsharknews.com/ |
| A | Lensrentals Blog | `rss-lensrentals` | RSS／Atom；已读到真实条目 | https://www.lensrentals.com/blog/ |
| B | fxguide | `rss-fxguide` | RSS／Atom；已读到真实条目 | https://www.fxguide.com/ |
| B | befores & afters | `rss-befores-and-afters` | RSS／Atom；已读到真实条目 | https://beforesandafters.com/ |
| B | Mixing Light | `rss-mixing-light` | RSS／Atom；已读到真实条目 | https://mixinglight.com/ |
| B | FilmLight | `rss-filmlight` | RSS／Atom；已读到真实条目 | https://www.filmlight.ltd.uk/store/ |
| C | Unreal Engine Film & Television | `rss-unreal-film` | RSS／Atom；已读到真实条目 | https://www.unrealengine.com/uses/film-television?lang=en-US |
| C | SMPTE Motion Imaging Journal | `web-smpte` | 本轮外部导入／待长期采集适配 | https://www.smpte.org/motion-imaging-journal |
| C | ACESCentral | `rss-aces` | RSS／Atom；已读到真实条目 | https://acescentral.com/ |
| D | Runway | `web-runway` | 本轮外部导入／待长期采集适配 | https://runway.com/news |
| D | 字节跳动 Seed | `web-bytedance-seed` | 本轮外部导入／待长期采集适配 | https://seed.bytedance.com/zh/blog |
| D | 可灵／快手官方公告 | `web-kling` | 本轮外部导入／待长期采集适配 | https://ir.kuaishou.com/news-events/company-news |
| D | OpenAI | `rss-openai` | RSS／Atom；已读到真实条目 | https://openai.com/news/ |
| D | Anthropic | `web-anthropic` | 本轮外部导入／待长期采集适配 | https://www.anthropic.com/news |
| D | xAI／Grok | `web-xai` | 本轮外部导入／待长期采集适配 | https://x.ai/news |
| E | Curious Refuge | `web-curious-refuge` | 本轮外部导入／待长期采集适配 | https://curiousrefuge.com/blog |
| E | Cullen Kelly | `web-cullen-kelly` | 本轮外部导入／待长期采集适配 | https://cullenkellycolor.com/newsletter |
| E | Theoretically Media | `web-theoretically-media` | 本轮外部导入／待长期采集适配 | https://theoreticallymedia.beehiiv.com/ |
| E | Paul Trillo | `web-paul-trillo` | 本轮外部导入／待长期采集适配 | https://paultrillo.com/ |
| E | StudioBinder | `rss-studiobinder` | RSS／Atom；已读到真实条目 | https://www.studiobinder.com/blog/ |
| G | 国家电影局 | `web-chinafilm-gov` | 本轮外部导入／待长期采集适配 | https://www.chinafilm.gov.cn/ |
| G | 中国电影报 | `web-chinafilm-news` | 本轮外部导入／待长期采集适配 | https://chinafilmnews.cn/Html/Review/Review_1.html |
| H | Higgsfield | `rss-higgsfield` | RSS／Atom；已读到真实条目 | https://higgsfield.ai/blog |
| H | Luma | `web-luma` | 本轮外部导入／待长期采集适配 | https://lumalabs.ai/news |
| H | MiniMax／海螺 | `web-minimax-hailuo` | 本轮外部导入／待长期采集适配 | https://www.minimax.io/news |
| H | Vidu／生数科技 | `web-vidu` | 本轮外部导入／待长期采集适配 | https://platform.vidu.com/news |
| H | PixVerse | `web-pixverse` | 本轮外部导入／待长期采集适配 | https://pixverse.ai/en/news |
| H | Autodesk Flow Studio | `rss-autodesk-flow` | 网页列表；真实HTML已验证日期规则 | https://blogs.autodesk.com/media-and-entertainment/ |
| H | Black Forest Labs／FLUX | `web-black-forest-labs` | 本轮外部导入／待长期采集适配 | https://bfl.ai/blog |
| H | Topaz Labs | `web-topaz` | 本轮外部导入／待长期采集适配 | https://www.topazlabs.com/learn |
| H | ElevenLabs | `rss-elevenlabs` | RSS／Atom；已读到真实条目 | https://elevenlabs.io/blog |
| H | Midjourney | `rss-midjourney` | RSS／Atom；已读到真实条目 | https://updates.midjourney.com/ |

StudioBinder过滤泛影片及导演排行榜；Higgsfield与Luma的泛工具、套餐排行榜及纯注册推广不作为本轮推荐内容，保留具体技术教程、制作案例和重要能力变更。人工撤下使用统一发布层和审计，不提高模型分数或改变精选门槛。

Autodesk初次探测得到的是母站通用RSS，已改为电影与娱乐专栏的网页列表；以文章路径中完整的年/月/日作为日期，不采集母站其他行业的内容。Topaz两条月内官方更新另通过联网阅读核实后以人工摘记导入，正文保持未确认、只展示摘要；不能据此宣称其自动采集已跑通。

未新增本轮F类GitHub候选；既有ComfyUI来源保留。B站与公众号的三个指定账号仍需接入验证，没有开通额外付费采集或音视频转录。暂时放开的模型请求预算只存于本机数据库，由批次结束流程恢复，不随种子配置导出。

xAI补充核对了官方公开控制台变更记录 `https://x.ai/api/changelog` 的2026-09-29 Imagine条目，以人工摘记导入并经模型筛选；新闻主页访问受限不代表该来源没有月内更新。当前仍为外部导入，不能宣称已完成定时采集适配。

## v0.2.0 当前周期

2026-10-17起默认周期为360分钟。上文480分钟描述为历史运行记录；当前54个登记信源中35个支持自动采集，19个external仍待接入。
