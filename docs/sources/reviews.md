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
