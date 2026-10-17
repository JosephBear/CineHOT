# 创作者账号接入清单

更新：2026-10-16。当前登记54个来源：31个RSS、4个网页列表、19个外部导入／待长期适配；月度抓取仍须以实际结果核对，登记不代表全部访问成功。用户指定的账号以 `industry/source-watchlist.json` 为清单；该文件不由 `scripts/seed.ts` 导入，不代表已启用自动采集。早前17个来源加Google官方AI RSS与ComfyUI官方版本Atom形成19个来源，本轮已扩展为54个登记来源。

| 平台 | 账号 | 稳定标识 | 入口 | 当前状态 |
|---|---|---|---|---|
| B站 | 影视飓风 | UID `946974` | https://space.bilibili.com/946974/dynamic | 页面及公开动态列表HTTP412，待接入 |
| B站 | 调色师手册 | UID `14118553` | https://space.bilibili.com/14118553/dynamic | 公开动态列表HTTP412，待接入 |
| 微信公众号 | 数字生命卡兹克 | 原始ID尚未核实 | https://mp.weixin.qq.com/s/VuJsVTvyNIK8GRTL95n-Qw | 样例文章返回环境异常验证页，尚未读到正文，待接入 |

## 收录范围

影视飓风：设备测试，或与影像、电影、AI影视创作有关的内容。判断材料为该条更新的标题、简介和可获得的字幕/文字稿，不使用账号名、作者简介充当命中证据。设备测试包括器材评测、画质测试等同义表述；AI需有实际影像创作语境，不因 `air` 等单词中含字母ai而放行。无关生活动态和没有影像信息的推广排除。

调色师手册：调色教程、色彩管理、影视后期工作流及相关工具讲解。账号名不能代替内容判断，没有字幕或文字稿时只展示可核实的简介，不根据封面虚构教程步骤。

数字生命卡兹克：AI影视创作、视频生成、影像工具、创作教程和案例。泛AI商业、编程等无影视创作信息的内容排除。当前名称来自用户提供，尚未以样例文章核实作者和原始ID。

这些是待实现、待验证的接入规则。现有 `ingestNoiseFilter.keepIfMatches` 只是噪声豁免，并非关键词白名单，不能用它宣称完成“只收录”要求。

## 接入与验收

1. 先获得能稳定返回真实条目的列表入口（可用的公开RSS、列表接口或有维护的外部导入），核对作者、视频/文章链接及日期。
2. B站当前没有专用采集器；不把动态主页当作RSS，也不把返回412的接口设为正常启用。不使用用户的登录Cookie或绕过访问验证。
3. 微信现有 `mp_account` 采集需要核实的 `ghid` 和第三方 `DAJIALA_KEY`，第三方请求另计费。目前未开通，也未调用。免费试运行可先使用已确认内容的手动导入，但单篇文章链接并不代表已订阅整个公众号。
4. 用真实内容中符合条件和无关的样本分别验证规则；先预览，不导入、不调用模型。完成后再将经验证配置写入 `industry/sources.json` 并通过后台启用。
5. 保持480分钟采集间隔、首批最多8条、默认摘要与原文链接。模型继续共用现有滚动24小时120次上限，不增加上限。
6. 展示作者、平台、发布日期、原文链接；视频下载、全文转载和自动音视频转录均不在当前接入范围内。

## AI官方及开源来源

AI分类已扩展到影视创作。Google官方AI RSS与ComfyUI官方版本Atom已完成预览和真实抓取验证，配置保存在 `industry/sources.json`；其他入口仍需逐个验证：

- 可灵：https://kling.ai/app/
- 即梦：https://jimeng.jianying.com/
- Runway：https://runway.com/news
- Google Flow/Veo：https://blog.google/innovation-and-ai/products/google-flow-veo-ai-filmmaking-tool/
- ComfyUI：https://github.com/Comfy-Org/ComfyUI

以上部分入口为早前候选记录；当前读取方式以最新接入状态及项目种子配置为准，不能将普通网址视作RSS。X创作者名单也需逐个核实；现有X采集依赖SocialData，未开通付费服务。

## 本轮确认纳入接入范围的信源

确认日期：2026-10-15。以下35个来源均经用户选择，并在本轮月度刷新中登记；其中可用订阅及网页列表已经配置，其他来源为本轮外部导入／待长期适配。原有19个配置来源及原先3个待接入创作者账号另行保留，不与本表混算。候选网址为公开内容入口，不代表RSS地址。

| 分类 | 已选定来源 | 选择说明 |
|---|---|---|
| A：电影摄影与器材 | Cinematography World、British Cinematographer、Panavision Highlights、RedShark News、Lensrentals Blog | A1—A5全部保留，共5个 |
| B：后期与视效 | fxguide、befores & afters、Mixing Light、FilmLight | 保留B1—B4，共4个；Frame.io Insider不纳入本轮 |
| C：虚拟制作与标准 | Unreal Engine Film & Television、SMPTE Motion Imaging Journal、ACESCentral | C1—C3全部保留，共3个 |
| D：AI官方 | Runway、字节Seed、可灵、OpenAI、Anthropic、xAI／Grok | 原D1—D3及用户另指定的3个，共6个；“spaceXaI”暂按xAI／Grok理解 |
| E：教程与创作者 | Curious Refuge、Cullen Kelly、Theoretically Media、Paul Trillo、StudioBinder | E1—E4全部保留，另加StudioBinder，共5个 |
| F：GitHub候选 | 不纳入本轮 | 不新增LTX-2、Wan2.2等本轮GitHub候选；现有ComfyUI配置保留 |
| G：中文行业 | 国家电影局、中国电影报 | G1—G2全部保留，共2个 |
| H：AI影像技术与创作 | 下表H1—H10 | 用户明确全部纳入，共10个 |

### H类全部选定

| 编号 | 来源 | 内容入口 | 计划收录方向 |
|---|---|---|---|
| H1 | Higgsfield | https://higgsfield.ai/blog | AI镜头、运镜、分镜、角色一致性和短片制作流程 |
| H2 | Luma | https://lumalabs.ai/news | 视频生成、画面修改、制作案例与官方产品更新 |
| H3 | MiniMax／海螺 | https://www.minimax.io/news | 视频生成、人物动作、参考图、声音与影视创作案例 |
| H4 | Vidu／生数科技 | https://platform.vidu.com/news | 视频模型、参考控制、创作方案和实际作品 |
| H5 | PixVerse | https://pixverse.ai/en/news | 视频生成、交互影像及创作者应用 |
| H6 | Autodesk Flow Studio | https://blogs.autodesk.com/media-and-entertainment/ | AI动捕、三维角色与场景、视效及传统制作结合 |
| H7 | Black Forest Labs／FLUX | https://bfl.ai/blog | 图像与视频模型、视觉资产、图像编辑及影像技术 |
| H8 | Topaz Labs | https://www.topazlabs.com/learn | 视频降噪、增强、去模糊、升格及画面修复 |
| H9 | ElevenLabs | https://elevenlabs.io/blog | 配音、译制、音效、音乐与声音制作 |
| H10 | Midjourney | https://updates.midjourney.com/ | 视觉风格、概念美术及分镜关键帧相关更新 |

### 另指定来源的入口与规则

- StudioBinder：https://www.studiobinder.com/blog/ 。重点保留摄影、布光、镜头语言、分镜、剪辑及制作流程；过滤泛影片排行榜和无关推广；区分首次发布与旧文更新。
- OpenAI：https://developers.openai.com/api/docs/changelog 。重点保留影响影视创作的图像生成与编辑、声音、工作流程及能力变更；不将普通编程更新全部导入。
- Anthropic：https://www.anthropic.com/news 。定位为影视创作辅助，只有与剧本、视觉理解、创作资料或影视流程有明确联系的内容才纳入；泛商业与编程新闻排除。
- xAI／Grok：https://x.ai/news 。重点保留Imagine图像、视频、语音与创作控制相关内容；无关航天和一般公司新闻排除。

### 后续接入约束

1. 用户已确认以上来源范围，常规接入验证无需重复询问信源选择。逐个核验可用列表、正文、作者、发布日期和原文链接，验证结果另行记录；不能用网页可打开代替采集验收。
2. 频率判断以真实条目日期为依据，不将网站页眉日期、抓取日期或旧文更新时间当作新文章发布时间。官方来源多按版本和项目发布，不承诺日更。
3. 筛选影视相关内容，排除无关融资、招聘、消费资讯、普通编程、泛工具排行榜和营销通稿；同一发布跨站去重。
4. 付费文章、视频、动态网页和公众号等入口需分别验证；不默认新增付费采集、字幕转录或用户登录凭据。
5. 用户随后明确授权刷新最近一个月资讯，并允许本轮不受120次请求限制。本轮已进入抓取与模型筛选；日常480分钟采集间隔不变，批次结束恢复原模型请求上限。新增来源并非全部已经具备定时采集适配。


## 2026-10-16 接入状态快照

本轮35个选定来源已与原19个来源一起登记，共54个；31个RSS、4个网页列表、19个外部导入。当前完整配置保存在项目 `industry/sources.json`，读取方式和限制见 `docs/sources/catalog.md` 的月度刷新节。此前章节中的“候选／待接入”描述属于选定阶段记录，当前状态以本节及本轮实际刷新报告为准。三个B站／公众号账号仍未开通自动采集。
