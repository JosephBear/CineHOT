# CineHOT 信源配置与验收

CineHOT 第一阶段沿用电影摄影分类和文本资讯引擎。项目名称为 CineHOT，页面站名为“电影动态”；公开 MCP 前缀保持 `cinemahot`，抓取 User-Agent 为 `CineHOTBot/1.0`。

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

## 2026-10-18 外部来源转为自动采集

原19个`external`来源中，11个找到了可长期读取的公开订阅、网页列表或页面内嵌数据，改用新ID自动采集；旧ID仍是外部导入，新部署不再登记。当前54个登记信源：33个RSS、10个网页列表、3个JSON列表自动采集，8个`external`待接入。

管理后台只允许在RSS、网页列表和JSON列表之间调整采集方式，不能把`external`改为自动采集，所以使用新ID。已有部署运行 `node --env-file=.env scripts/seed.ts` 添加新ID，再在 `/admin/sources` 暂停对应的旧external来源。文章按原文网址去重，新来源读到已导入的文章时并入原记录，不会重复出现。

| 来源 | 旧ID | 新ID | 读取方式 | 入口 |
|---|---|---|---|---|
| Curious Refuge | `web-curious-refuge` | `rss-curious-refuge` | Squarespace RSS | https://curiousrefuge.com/blog?format=rss |
| SMPTE（官方新闻） | `web-smpte` | `rss-smpte` | 官方博客RSS；期刊目录无可读日期，改收SMPTE官方新闻 | https://www.smpte.org/blog/rss.xml |
| Anthropic | `web-anthropic` | `web-anthropic-news` | 网页列表，列表日期 | https://www.anthropic.com/news |
| Black Forest Labs／FLUX | `web-black-forest-labs` | `web-bfl-blog` | 网页列表，`time[datetime]` | https://bfl.ai/blog |
| Topaz Labs | `web-topaz` | `web-topaz-news` | 网页列表；列表无日期，详情页JSON-LD补日期 | https://www.topazlabs.com/news |
| Theoretically Media | `web-theoretically-media` | `web-theoretically-media-archive` | beehiiv归档页网页列表 | https://theoreticallymedia.beehiiv.com/archive |
| 国家电影局 | `web-chinafilm-gov` | `web-chinafilm-hyzx` | “行业资讯”栏目网页列表；标题由页面脚本写出，从详情页脚本读取标题 | https://www.chinafilm.gov.cn/xwzx/hyzx/ |
| Vidu／生数科技 | `web-vidu` | `web-shengshu-news` | 生数科技英文新闻页网页列表；原平台新闻页停在2025-12，中文页更新较慢 | https://www.shengshu.com/en/news/ |
| Runway | `web-runway` | `json-runway-news` | JSON列表，Next.js页面内嵌 `posts` | https://runway.com/news |
| MiniMax／海螺 | `web-minimax-hailuo` | `json-minimax-news` | JSON列表，官方新闻接口 | https://www.minimax.io/api/news?page=1&locale=en |
| 字节跳动 Seed | `web-bytedance-seed` | `json-seed-updates` | JSON列表，首页 `window._ROUTER_DATA` 的最新动态；过滤招聘 | https://seed.bytedance.com/zh/ |

验证：MiniMax、Seed、国家电影局在本机直接联网通过 `scripts/check-cinemahot-sources.ts`；其余8个在本机解析到私网地址（代理的fake-IP），被SSRF检查拦下，改为用当天下载的真实页面在本地回放，经同一套采集代码解析出标题、链接和日期。正式运行需要可用的出网条件（见[部署](../deploy.md)中的 `EGRESS_PROXY_URL`），以后台运行记录为准。

仍为`external`的8个：

| 来源 | ID | 原因 |
|---|---|---|
| Panavision Highlights | `web-panavision` | 列表与文章页都没有发布日期 |
| 可灵／快手官方公告 | `web-kling` | 返回HTTP 403 |
| xAI／Grok | `web-xai` | 新闻页与变更记录返回HTTP 403 |
| Cullen Kelly | `web-cullen-kelly` | Newsletter只有订阅表单，没有公开归档 |
| Paul Trillo | `web-paul-trillo` | 作品集网站，没有文章列表 |
| 中国电影报 | `web-chinafilm-news` | 电子报按期分版，需要先找最新一期再读版面，现有读取方式不支持两级列表 |
| Luma | `web-luma` | 新闻页以泛工具排行榜为主 |
| PixVerse | `web-pixverse` | 博客以泛工具排行榜为主，条目在Astro序列化数据中，现有读取方式不支持 |

2026-10-18起默认采集周期改为60分钟（`site/site.ts` 的 `SOURCE_DEFAULTS.fixedIntervalMinutes` 与种子配置）。已有部署的信源间隔需在后台调整。

## 2026-10-18 院校、影展与泛影像信源

站点面向学习电影与泛影像的师生，新增院校、影展、评论、摄影、动画、视效、纪录片、剪辑和视频频道来源，共36个：28个自动采集，8个暂登记为`external`。预筛提示词同步把泛影像与电影教育列为相关内容；评分标准与精选门槛未改，仍待人工样本校准。当前共90个：50个RSS、20个网页列表、4个JSON列表、16个`external`。

| 来源 | ID | 读取方式 | 入口 |
|---|---|---|---|
| AFI 美国电影学院 | `rss-afi-news` | RSS | https://www.afi.com/news/feed/ |
| BFI 英国电影协会（含 Sight and Sound） | `rss-bfi` | RSS | https://www.bfi.org.uk/rss-feed |
| MUBI Notebook | `rss-mubi-notebook` | RSS | https://mubi.com/notebook/posts.rss |
| Frame.io Insider | `rss-frameio-insider` | RSS | https://blog.frame.io/feed/ |
| PetaPixel | `rss-petapixel` | RSS | https://petapixel.com/feed/ |
| Fstoppers | `rss-fstoppers` | RSS | https://fstoppers.com/feed |
| Cartoon Brew | `rss-cartoonbrew` | RSS | https://www.cartoonbrew.com/feed/ |
| Animation World Network | `rss-awn` | RSS | https://www.awn.com/news/rss.xml |
| VFX Voice | `rss-vfxvoice` | RSS | https://vfxvoice.com/feed/ |
| 80.lv | `rss-80lv` | RSS | https://80.lv/feed |
| IDA《Documentary》 | `rss-ida-documentary` | RSS | https://www.documentary.org/rss.xml |
| CineMontage | `rss-cinemontage` | RSS | https://cinemontage.org/feed/ |
| YouTube：American Cinematographer（ASC） | `rss-yt-asc` | YouTube频道RSS | channel_id=UCFjhAJXEcQBAcQIRhGUyCAA |
| YouTube：In Depth Cine | `rss-yt-indepthcine` | YouTube频道RSS | channel_id=UCUodELQsFwF8dq0X-bK9FQQ |
| YouTube：wolfcrow | `rss-yt-wolfcrow` | YouTube频道RSS | channel_id=UC7gBcKzHKc0oOR5-XiWdlFQ |
| YouTube：StudioBinder | `rss-yt-studiobinder` | YouTube频道RSS | channel_id=UCUFoQUaVRt3MVFxqwPUMLCQ |
| YouTube：Higgsfield AI | `rss-yt-higgsfield` | YouTube频道RSS | channel_id=UCh13OyDSm-Kb8ij3yZArtFg |
| EnergaCAMERIMAGE | `web-camerimage-news` | 网页列表 | https://camerimage.pl/en/news |
| USC 电影艺术学院 | `web-usc-sca-news` | 网页列表 | https://cinema.usc.edu/news/index.cfm |
| NYU Tisch | `web-nyu-tisch-news` | 网页列表；新闻页加载列表所用的HTML片段 | https://tisch.nyu.edu/tisch-research-news-events/news |
| NFTS | `web-nfts-news` | 网页列表；列表无日期，详情页 `time` 补日期（精确到天） | https://nfts.co.uk/news |
| World Press Photo | `web-wpp-news` | 网页列表，按日期排序 | https://www.worldpressphoto.org/news |
| 上海国际电影节 | `web-siff-news` | 首页轮播网页列表；详情页 `.time` 补日期 | https://www.siff.com/ |
| 北京国际电影节 | `web-bjiff-news` | “要闻资讯”网页列表 | https://www.bjiff.com/ywzx/ |
| 国家广播电视总局 | `web-nrta-news` | 首页“总局要闻”网页列表；日期取自文章网址 | https://www.nrta.gov.cn/ |
| 蜂鸟网 | `web-fengniao-news` | 资讯网页列表（GBK编码） | https://news.fengniao.com/ |
| 色影无忌 | `web-xitek-news` | 新闻网页列表 | https://info.xitek.com/news/ |
| 平遥国际电影展 | `json-pyiff-news` | 官方公开新闻接口 | https://www.pyiffestival.com/News |

验证：广电总局、上海国际电影节、蜂鸟网、色影无忌在本机联网通过 `scripts/check-cinemahot-sources.ts`；其余在本机被fake-IP解析拦截，用当天下载的真实页面在本地回放，经同一套采集代码解析出标题、链接和日期。

暂登记为`external`的8个：

| 来源 | ID | 原因 |
|---|---|---|
| CILECT 国际电影电视学校联合会 | `web-cilect` | 网站拒绝脚本访问（HTTP 403） |
| 北京电影学院 | `web-bfa` | 网站有访问验证（HTTP 412） |
| Criterion「The Current」 | `web-criterion-current` | 网站拒绝脚本访问（HTTP 403） |
| British Journal of Photography | `web-bjp` | 网站拒绝脚本访问（HTTP 403） |
| 中国电影资料馆 | `web-cfa` | 动态列表由“加载更多”脚本请求，页面本身没有条目 |
| 北京大学生电影节 | `web-bcsff` | 页面未找到带日期的新闻列表 |
| FIRST 青年电影展 | `web-first-festival` | 网站订阅只含影片库与人物条目，新闻列表由脚本加载 |
| 《电影艺术》 | `web-dyys` | 期刊按期出版，网站没有带日期的文章列表 |

《当代电影》《北京电影学院学报》没有找到可公开访问的官方网站入口，未登记；可考虑通过知网等数据库人工导入。

### 2026-10-18 移出无法采集的来源

上文两张“仍为`external`”“暂登记为`external`”表中的16个来源找不到可长期采集的入口，已从 `industry/sources.json` 移出，当前共74个，全部自动采集。移出原因保留在上表，以后找到入口可按新ID重新登记。已有部署的数据库记录不会因种子文件变化而删除，需在后台暂停这些来源。

### 2026-10-18 品牌官方来源补充

| 来源 | ID | 读取方式 | 入口 |
|---|---|---|---|
| Panavision | `rss-yt-panavision` | 官方YouTube频道RSS（官网列表无日期） | channel_id=UCjjsTTWiWbeZGbbxqI0ExVw |
| 可灵 Kling AI | `rss-yt-kling` | 官方YouTube频道RSS（快手投资者页面返回403） | channel_id=UC1i21joJVJVVRUGUOGFEdVQ |
| 爱图仕 Aputure | `rss-yt-aputure` | 官方YouTube频道RSS（官网新闻页404） | channel_id=UCc0D1yh3TGE8dJSLm9VmEdg |
| DJI 大疆 | `web-dji-news` | 官方中文新闻网页列表 | https://www.dji.com/cn/media-center/announcements |

PixVerse仍未接入：官方YouTube频道订阅为空，博客以泛工具排行榜为主且在Astro序列化数据中，接口文档更新日志是一张同一网址下的表格，每行没有独立链接。其官方X账号可用`x_search`接入，但需要SocialData按请求付费。当前共78个信源。

### 2026-10-18 联网实测与补充频道

经本机转发代理联网实测，下列6个来源当前读不到可用条目，因内容有价值仍保留，按后台运行记录观察：

| 来源 | ID | 当前情况 | 补充入口 |
|---|---|---|---|
| The ASC | `rss-asc` | 采集程序被网站防护拦截（HTTP 403） | 已有官方频道 `rss-yt-asc` |
| AFI | `rss-afi-news` | 网站拒绝采集程序的User-Agent（HTTP 403） | 新增官方频道 `rss-yt-afi`（channel_id=UCmO_WjaWDwimv8Kl7GHFxAA） |
| CineMontage | `rss-cinemontage` | 采集程序被网站防护拦截（HTTP 403） | 没有官方YouTube频道 |
| Cooke Optics | `rss-cooke` | 订阅当前为空 | 新增官方频道 `rss-yt-cooke`（channel_id=UC-Ya9gBlwOhRwtloTn1hvbA，更新较少） |
| The Hollywood Reporter（技术） | `rss-thr-tech` | 订阅当前为空 | 官方YouTube以娱乐资讯为主，未接入 |
| StudioBinder | `rss-studiobinder` | 最新条目都被其排行榜过滤规则排除 | 已有官方频道 `rss-yt-studiobinder` |

X（推特）账号可通过 `x_search` 接入，但需SocialData按请求付费，暂未开通。当前共80个信源。

### 2026-10-19 学术期刊、器材厂商与 ASC 补充

面向“学术性”和“首次发布”的内容补充15个来源，并移出 `rss-afi-news`（网站拒绝采集程序，且约四分之三是每日“AFI Movie Club”片单；保留官方频道 `rss-yt-afi`）。当前共94个信源。

| 来源 | ID | 读取方式 |
|---|---|---|
| ASC 官方动态 | `rss-asc-gnews` | Google News 按站点检索的公开RSS（近30天），过滤 Master Class、新会员等活动标题；只有标题与简短摘要，链接经 Google 跳转 |
| Film Quarterly / Screen / Animation: An Interdisciplinary Journal / SMPTE Motion Imaging Journal / Journal of Film and Video | `json-crossref-*` | Crossref 公开接口按期刊 ISSN 取最新注册的论文；日期用 DOI 注册时间（部分期刊只给年份）；过滤书评、更正、目录、作者简介等 |
| Film Comment | `rss-filmcomment` | 官方RSS |
| FUJIFILM 富士 | `web-fujifilm-news` | 官方新闻网页列表 |
| Kinefinity 卓曜 | `web-kinefinity-news` | 官方中文新闻网页列表 |
| ZEISS、SIGMA、Leitz、DZOFILM、Atlas、RED | `rss-yt-zeiss` 等 | 官方YouTube频道RSS |

未接入：Angénieux（官网证书链不完整，采集程序无法验证；Google News 结果混有站点被注入的赌博页面）、Vantage/Hawk（新闻无发布日期）、Sony、Canon、Atomos、Senses of Cinema、Bright Lights（拒绝采集程序；索尼佳能新品可经 ASC、CineD、Newsshooter 获得）。

验证：本机当日无法连接 Cloudflare DNS（本机代理设置），未能联网实测；用当日下载的真实订阅与页面在本地回放，15个来源均经同一套采集代码解析出标题、链接和日期。
