# 信源评审记录

按人工标注评估信源：每轮从各信源抽最近的文章，判断“学电影和影像的师生，会不会愿意在今天的精选里看到这条”。标注工具与流程见 [标注与校准](../quality/calibration.md)。

## 评审轮次

| 轮次 | 日期 | 抽样 | 条数 |
|---|---|---|---|
| 第一轮 | 2026-10-18 | 每个信源最近 45 天至多 3 条 | 186 |
| 第二轮 | 2026-10-23 | 每个信源最近 14 天至多 2 条 | 88 |

## 2026-10-23 决定

- **移出（5 个）**：蜂鸟网、色影无忌（整体水平偏低）；NYU Tisch、NFTS、Unreal Engine Film & Television（两轮都有样本，一条未选，多数为“不该选”）。
- **移出（2 个，拒绝采集）**：The ASC 订阅、CineMontage。自 2026-10-18 起网站防护一直拦截采集程序（HTTP 403），改配置无法解决；ASC 仍由 Google News 与 YouTube 两个入口覆盖。
- **观察（4 个）**：ComfyUI 官方版本更新、Animation World Network、Film and Digital Times、DJI 大疆官方新闻。两轮一条未选，但多数是“两可”，不算明确的噪声。
- 每轮只抽到最近 14 天内有文章的信源；没抽到的信源更新少，要结合运行中的 `scripts/source-discovery/source-quality.sql` 看实际文章量。

## 2026-11-24 决定：收窄领域、加影像教育

依据：2026-10-21 至 11-18 共 33 期日报的 566 条去重条目（按标题和摘要关键词初筛后人工抽查）。约 80% 属于电影、电影制作、电影教育与AI影视创作；约 14% 是与影视无关的静态摄影（Fstoppers 50 条、PetaPixel 9 条为主），约 4% 是游戏美术（80.lv 21 条），约 2% 是电脑与消费电子评测。电影教育只占约 3%，而且多是零散访谈。

- **领域收窄**：预筛不再放行与影视无关的静态摄影、游戏美术和消费电子；评分把这三类的 `reson` 压到 2 以下。头部AI模型发布按站长 11-24 的决定继续放行。
- **移出（1 个）**：World Press Photo 荷赛，纯新闻摄影，近一个月没有条目进入日报。
- **加过滤、不移出（3 个）**：Fstoppers、PetaPixel、80.lv 仍有影视相关内容（器材实测、视效与虚拟制片），用 `ingestNoiseFilter` 在标题层面先滤掉修图、风光人像、游戏美术等明显无关的条目，标题含 cinema、film、video 等词的保留；其余交给预筛判断。
- **新增影像教育（6 个）**：见下节。

## 影像教育单元（2026-11-24）

目标：给学电影的学生和老师稳定的学习材料。更新慢可以接受，但不能只来自院校官网的新闻页（那里多是招生、任命和校庆，前几轮标注已证明价值很低）。

选源原则：内容本身就是教学，讲清方法、步骤或创作者的取舍；有稳定的订阅入口；近一个月仍在更新。以下 6 个都在 2026-11-24 用 `scripts/check-cinehot-sources.ts` 经本机代理实测，抓取、过滤和日期解析都通过。

| 信源 | 内容 | 近期频率 | 过滤 |
|---|---|---|---|
| YouTube：Film Riot | 拍摄、布光、实拍特效的完整教程，“经典电影特效是怎么做的”系列 | 每周 0.5–1 条 | 去掉自制短片预告、抽奖 |
| YouTube：Film Courage | 编剧、导演、演员讲创作方法的访谈片段 | 每周约 2 条 | 去掉 #shorts 竖屏短视频 |
| YouTube：BFI 英国电影协会 | 导演与创作者的 Screen Talk、大师班与映后问答 | 每周约 9 条，过滤后约 6 条 | 去掉预告和影评，保留 Screen Talk、Q&A |
| YouTube：Gnomon School of VFX | 视效、动画、3D 院校的学生作品制作复盘与行业讲座 | 每周约 2 条 | 去掉招生广告、游戏美术 |
| YouTube：Curious Refuge | AI影视创作教程与工具横评（AI电影学校） | 每周约 3 条 | 去掉课程推销与猎奇标题 |
| Go Into The Story（Black List） | 编剧访谈连载、“编剧 101”剧作分析 | 每周约 9 条，过滤后约 6 条 | 去掉剧本交易新闻 |

合计每周约 15–20 条进入预筛，精选后估计每周 3–8 条。网站上有独立的“教育”类别（`/all?category=edu`）、分类 RSS（`/feed/category/edu.xml`）和“影像教育”主题页（`/topics/film-education`）。

暂未接入、以后可补：
- **中文来源**：影视飓风、B 站电影教学 UP 主没有可直接订阅的公开入口（RSSHub 公共实例返回 403），需要自建 RSSHub 或公众号接入（`mp_account`，按次计费）后再加。
- **院校**：`docs/education/roster-research.md` 里实测可用的 11 个院系 RSS 主要是科技、设计类院系新闻，不是电影教学内容，这次不接。
- **调研过、不接**：Filmmaker IQ、Every Frame a Painting、Lessons from the Screenplay（近一年基本停更）；No Film School YouTube（2024 年后停更，网站 RSS 已接入）；Raindance、PremiumBeat（多为活动和音乐宣传）；Directors Notes、Sundance、Filmmaker Magazine（以短片推荐和影评为主，教学内容少）。

上线一个月后用 `label-selection.ts collect-db` 抽 edu 类条目标注，按上面的观察规则决定去留。

## 观察名单的处理规则

每轮标注后更新下表，并按累计结果处理：

- **移出**：累计至少 8 条样本，选中不到 1 成。
- **解除观察**：累计选中至少 2 条，且选中率不低于全站平均。
- 介于两者之间的继续观察。这两条门槛是 2026-10-23 的约定，可以随标注量调整，调整时在这里写明。

## 各信源累计结果

“选中”指标成“该选”；“第一轮”“第二轮”列为“选中数/样本数”。按选中率从低到高排列。

| 信源 | 第一轮 | 第二轮 | 样本 | 选中 | 不该选 | 两可 | 状态 |
|---|---|---|---|---|---|---|---|
| Animation World Network | 0/3 | 0/2 | 5 | 0 | 0 | 5 | 观察 |
| ComfyUI 官方版本更新 | 0/3 | 0/2 | 5 | 0 | 2 | 3 | 观察 |
| NYU Tisch 纽约大学帝势艺术学院 | 0/3 | 0/2 | 5 | 0 | 4 | 1 | 已移出 |
| 蜂鸟网 | 0/3 | 0/2 | 5 | 0 | 3 | 2 | 已移出 |
| DJI 大疆官方新闻 | 0/3 | 0/1 | 4 | 0 | 1 | 3 | 观察 |
| Film and Digital Times | 0/3 | 0/1 | 4 | 0 | 1 | 3 | 观察 |
| NFTS 英国国家电影电视学院 | 0/3 | 0/1 | 4 | 0 | 2 | 2 | 已移出 |
| Unreal Engine Film & Television | 0/3 | 0/1 | 4 | 0 | 3 | 1 | 已移出 |
| FilmLight | 0/3 | — | 3 | 0 | 2 | 1 |  |
| IDA《Documentary》杂志 | 0/3 | — | 3 | 0 | 1 | 2 |  |
| Midjourney | 0/3 | — | 3 | 0 | 2 | 1 |  |
| Mixing Light | 0/3 | — | 3 | 0 | 1 | 2 |  |
| SMPTE（官方新闻） | 0/3 | — | 3 | 0 | 1 | 2 |  |
| USC 南加州大学电影艺术学院 | 0/3 | — | 3 | 0 | 2 | 1 |  |
| YouTube：wolfcrow | 0/3 | — | 3 | 0 | 1 | 2 |  |
| 平遥国际电影展 | 0/3 | — | 3 | 0 | 2 | 1 |  |
| World Press Photo 荷赛 | — | 0/2 | 2 | 0 | 1 | 1 |  |
| YouTube：American Film Institute（AFI） | — | 0/2 | 2 | 0 | 2 | 0 |  |
| 北京国际电影节 | 0/2 | — | 2 | 0 | 1 | 1 |  |
| Lensrentals Blog | 0/1 | — | 1 | 0 | 1 | 0 |  |
| Theoretically Media | 0/1 | — | 1 | 0 | 1 | 0 |  |
| 上海国际电影节 | 0/1 | — | 1 | 0 | 0 | 1 |  |
| BFI 英国电影协会（含 Sight and Sound） | 1/3 | 0/2 | 5 | 1 | 2 | 2 |  |
| Blackmagic Design News | 1/3 | 0/2 | 5 | 1 | 3 | 1 |  |
| Cartoon Brew | 0/3 | 1/2 | 5 | 1 | 2 | 2 |  |
| ElevenLabs | 0/3 | 1/2 | 5 | 1 | 3 | 1 |  |
| OpenAI | 0/3 | 1/2 | 5 | 1 | 3 | 1 |  |
| PetaPixel | 0/3 | 1/2 | 5 | 1 | 2 | 2 |  |
| RedShark News | 1/3 | 0/2 | 5 | 1 | 2 | 2 |  |
| YouTube：Kling AI（可灵） | 0/3 | 1/2 | 5 | 1 | 2 | 2 |  |
| 色影无忌 | 0/3 | 1/2 | 5 | 1 | 2 | 2 | 已移出 |
| Autodesk Flow Studio | 0/3 | 1/1 | 4 | 1 | 1 | 2 |  |
| Runway | 1/3 | 0/1 | 4 | 1 | 1 | 2 |  |
| 80.lv | 1/3 | — | 3 | 1 | 1 | 1 |  |
| Anthropic | 1/3 | — | 3 | 1 | 2 | 0 |  |
| 影视工业网 | 1/3 | — | 3 | 1 | 1 | 1 |  |
| EnergaCAMERIMAGE 国际电影摄影艺术节 | 0/3 | 2/2 | 5 | 2 | 3 | 0 |  |
| Fstoppers | 1/3 | 1/2 | 5 | 2 | 1 | 2 |  |
| Higgsfield | 1/3 | 1/2 | 5 | 2 | 0 | 3 |  |
| Newsshooter | 1/3 | 1/2 | 5 | 2 | 1 | 2 |  |
| ProVideo Coalition | 0/3 | 2/2 | 5 | 2 | 0 | 3 |  |
| Y.M.Cinema Magazine | 1/3 | 1/2 | 5 | 2 | 1 | 2 |  |
| YouTube：Aputure（爱图仕） | 0/3 | 2/2 | 5 | 2 | 3 | 0 |  |
| YouTube：Higgsfield AI | 1/3 | 1/2 | 5 | 2 | 3 | 0 |  |
| 国家广播电视总局 | 0/3 | 2/2 | 5 | 2 | 1 | 2 |  |
| Google 官方 AI 动态（影视创作筛选） | 2/3 | 0/1 | 4 | 2 | 1 | 1 |  |
| 国家电影局 | 1/3 | 1/1 | 4 | 2 | 0 | 2 |  |
| ASC 官方动态（经 Google News） | — | 1/2 | 2 | 1 | 1 | 0 |  |
| Black Forest Labs／FLUX | 1/2 | — | 2 | 1 | 0 | 1 |  |
| Film Comment | — | 1/2 | 2 | 1 | 1 | 0 |  |
| Topaz Labs | 1/2 | — | 2 | 1 | 0 | 1 |  |
| British Cinematographer | 2/3 | 1/2 | 5 | 3 | 0 | 2 |  |
| CineD | 3/3 | 0/2 | 5 | 3 | 0 | 2 |  |
| Cinematography World | 2/3 | 1/2 | 5 | 3 | 1 | 1 |  |
| IndieWire（幕后工艺） | 2/3 | 1/2 | 5 | 3 | 0 | 2 |  |
| MUBI Notebook | 1/3 | 2/2 | 5 | 3 | 1 | 1 |  |
| StudioDaily | 2/3 | 1/2 | 5 | 3 | 2 | 0 |  |
| Variety（电影） | 2/3 | 1/2 | 5 | 3 | 2 | 0 |  |
| befores & afters | 2/3 | 1/2 | 5 | 3 | 1 | 1 |  |
| YouTube：In Depth Cine | 2/3 | — | 3 | 2 | 0 | 1 |  |
| fxguide | 2/3 | — | 3 | 2 | 1 | 0 |  |
| VFX Voice（视效协会杂志） | 2/3 | 1/1 | 4 | 3 | 1 | 0 |  |
| YouTube：StudioBinder | 2/3 | 1/1 | 4 | 3 | 1 | 0 |  |
| No Film School | 3/3 | 1/2 | 5 | 4 | 0 | 1 |  |
| YouTube：Panavision | 2/3 | 2/2 | 5 | 4 | 1 | 0 |  |
| Team Deakins | 3/3 | 1/1 | 4 | 4 | 0 | 0 |  |
| ARRI Newsroom | 3/3 | — | 3 | 3 | 0 | 0 |  |
| Curious Refuge | 3/3 | — | 3 | 3 | 0 | 0 |  |
| YouTube：Atlas Lens Co. | — | 2/2 | 2 | 2 | 0 | 0 |  |
| YouTube：SIGMA（适马） | — | 2/2 | 2 | 2 | 0 | 0 |  |
| Frame.io Insider | 1/1 | — | 1 | 1 | 0 | 0 |  |
| MiniMax／海螺 | 1/1 | — | 1 | 1 | 0 | 0 |  |
| StudioBinder | — | 1/1 | 1 | 1 | 0 | 0 |  |
| Vidu／生数科技 | 1/1 | — | 1 | 1 | 0 | 0 |  |

全站累计 274 条，选中 100 条（36%）。
