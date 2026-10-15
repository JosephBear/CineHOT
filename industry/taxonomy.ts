// 这个行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（教程、观点）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "gear", label: "器材", feedLabel: "电影摄影器材", section: "器材发布", guide: "机身、镜头、灯光、稳定、录音、监看与存储设备的发布、规格与价格变化，以及有实测依据的器材结论。厂商的营销稿、经销商促销和没有实测的“上手体验”不算。" },
  { key: "tech", label: "技术", feedLabel: "影视技术", section: "技术与流程", guide: "拍摄工艺、布光方法、色彩与格式标准（Log、HDR、色彩空间）、虚拟制作、后期与调色流程。重点是能迁移到实际拍摄的做法或标准变化；单纯发布软件或插件归器材。" },
  { key: "industry", label: "行业", feedLabel: "行业动态", section: "行业动态", guide: "影展与奖项的评选结果、影响拍摄实务的政策与补贴、厂商经营与人事、影片项目开机与制片动态、劳资与工会事件。单纯的片场八卦和绯闻不归这一类。" },
  { key: "works", label: "作品", feedLabel: "作品与幕后", section: "作品与幕后", guide: "已上映或已公布影片的摄影解析、摄影师访谈、幕后技术拆解。重点是“这部片子是怎么拍出来的”；没有摄影技术信息的纯影评和剧情讨论不算。" },
  { key: "tip", label: "教程", section: "技巧与观点", guide: "读者可以照着做的拍摄、布光、运镜、调色方法与经验复盘。重点是可复用的做法；单纯介绍器材归器材，只有态度和预测而无做法归观点。", commentary: true },
  { key: "opinion", label: "观点", section: "技巧与观点", guide: "重点是作者的解释、判断、主张、预测、评论或访谈观点。讨论某个厂商不自动归行业，作者是知名摄影师不自动归观点。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（电影摄影行业是新器材）：日报报头的“N 款新器材”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "gear", tag: "器材发布", unit: "款新器材" };

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算在内。 */
export const PLAIN_TERMS: readonly string[] = [
  "log", "lut", "hdr", "raw", "iso", "fps", "4k", "8k", "aces", "rec709", "gimbal", "b-roll", "nd",
  "f-stop", "t-stop", "led", "anamorphic", "调色", "布光", "运镜", "景深", "色温",
];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = ["gear_release", "software_release", "workflow_or_tool", "tech_paper", "industry_event", "opinion_analysis", "tutorial_explainer"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "器材发布", "技术/标准", "软件/流程", "作品/幕后", "教程/实践", "评测/实测", "影展/奖项", "政策/监管", "人物/访谈", "行业动态", "观点/趋势",
  "其他",
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "镜头", "灯光", "稳定/运镜", "色彩/调色", "格式/编码", "虚拟制作", "后期/流程", "同期录音", "航拍", "特殊拍摄", "胶片", "特效/合成", "现场监看", "存储/备份",
] as const;

/** 可选的实体标签（公司、机构、平台）。 */
export const ENTITY_TAGS = ["ARRI", "RED", "Sony", "Blackmagic", "Panavision", "ZEISS", "Cooke", "Canon", "DJI", "Aputure", "Kodak", "ASC"] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "设备/器材": "器材发布", "器材/设备": "器材发布", "硬件发布": "器材发布", "产品发布": "器材发布", "新品": "器材发布",
  技术: "技术/标准", 标准: "技术/标准", 工艺: "技术/标准", 规范: "技术/标准",
  软件: "软件/流程", 流程: "软件/流程", 工具: "软件/流程", 插件: "软件/流程", 工作流: "软件/流程",
  幕后: "作品/幕后", 拍摄解析: "作品/幕后", 作品解析: "作品/幕后", 摄影解析: "作品/幕后",
  教程: "教程/实践", 指南: "教程/实践", 技巧: "教程/实践", 最佳实践: "教程/实践", 实践: "教程/实践", 方法: "教程/实践", 经验: "教程/实践", 教学: "教程/实践",
  评测: "评测/实测", 实测: "评测/实测", 测评: "评测/实测", 对比测试: "评测/实测",
  影展: "影展/奖项", 电影节: "影展/奖项", 获奖: "影展/奖项", 奖项: "影展/奖项", 入围: "影展/奖项",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 补贴: "政策/监管",
  访谈: "人物/访谈", 人物: "人物/访谈", 专访: "人物/访谈",
  观点: "观点/趋势", 趋势: "观点/趋势", 评论: "观点/趋势", 复盘: "观点/趋势",
  行业: "行业动态", 公司动态: "行业动态", 融资: "行业动态", 收购: "行业动态", 合作: "行业动态", 人事: "行业动态",
};

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/**
 * 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看；otherNames 是公司自己的其他称呼（官方账号名、子品牌），
 * 把事实的主体对到发布方时也认它们。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  arri: { name: "ARRI", displayTag: "ARRI", aliases: ["ARRI", "阿莱"], otherNames: ["ARRI Camera Systems", "ARRI Rental"] },
  red: { name: "RED Digital Cinema", displayTag: "RED", aliases: ["RED", "RED Digital Cinema"], otherNames: ["RED.com"] },
  sony: { name: "Sony", displayTag: "Sony", aliases: ["Sony", "索尼", "Sony Cine"], otherNames: ["Sony Cinema", "Sony Professional", "索尼中国"] },
  blackmagic: { name: "Blackmagic Design", displayTag: "Blackmagic", aliases: ["Blackmagic", "Blackmagic Design", "BMD"], otherNames: ["DaVinci Resolve", "达芬奇"] },
  panavision: { name: "Panavision", displayTag: null, aliases: ["Panavision", "潘那维申"] },
  zeiss: { name: "ZEISS", displayTag: null, aliases: ["ZEISS", "Carl Zeiss", "蔡司"] },
  cooke: { name: "Cooke Optics", displayTag: null, aliases: ["Cooke", "Cooke Optics", "库克"] },
  angenieux: { name: "Angénieux", displayTag: null, aliases: ["Angénieux", "Angenieux", "安琴"] },
  canon: { name: "Canon", displayTag: null, aliases: ["Canon", "佳能"] },
  nikon: { name: "Nikon", displayTag: null, aliases: ["Nikon", "尼康"] },
  fujifilm: { name: "FUJIFILM", displayTag: null, aliases: ["Fujifilm", "富士"] },
  dji: { name: "DJI", displayTag: null, aliases: ["DJI", "大疆"], otherNames: ["Ronin", "DJI Pro"] },
  aputure: { name: "Aputure", displayTag: null, aliases: ["Aputure", "爱图仕"] },
  nanlux: { name: "Nanlux", displayTag: null, aliases: ["Nanlux", "南光"] },
  atomos: { name: "Atomos", displayTag: null, aliases: ["Atomos"] },
  kodak: { name: "Kodak", displayTag: null, aliases: ["Kodak", "柯达"] },
  unreal: { name: "Unreal Engine", displayTag: null, aliases: ["Unreal Engine", "虚幻引擎"], otherNames: ["Epic Games"] },
  asc: { name: "ASC 美国电影摄影师协会", displayTag: null, aliases: ["ASC", "American Society of Cinematographers"], otherNames: ["American Cinematographer"] },
  bsc: { name: "BSC 英国电影摄影师协会", displayTag: null, aliases: ["BSC", "British Society of Cinematographers"] },
  imago: { name: "IMAGO", displayTag: null, aliases: ["IMAGO"], otherNames: ["International Federation of Cinematographers"] },
};

/**
 * 身份词典：摘要和标题里出现的公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 行业没有这个问题时可以留空数组。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "arri", name: "ARRI", patterns: [/\bARRI\b|阿莱/i] },
  // The bare acronym is case-sensitive: ordinary “red light” is not a camera maker.
  { id: "red", name: "RED Digital Cinema", patterns: [/\bRED\b/, /RED Digital Cinema|\bKOMODO\b|\bV-RAPTOR\b|\bMONSTRO\b|\bHELIUM\b/i] },
  // VENICE needs a model number or camera context; the city/film festival is not Sony.
  { id: "sony", name: "Sony", patterns: [/sony|索尼|\bBURANO\b|\bFX\d+\b/i, /\bVENICE(?:\s+2\b|\s+cameras?\b|\s*(?:摄影机|机身))/i] },
  { id: "blackmagic", name: "Blackmagic Design", patterns: [/blackmagic|\bBMD\b|达芬奇|DaVinci\s?Resolve|\bURSA\b|Pocket\s?Cinema/i] },
  { id: "canon", name: "Canon", patterns: [/\bCanon\b|佳能|\bEOS\b|\bC\d{3}\b/i] },
  { id: "nikon", name: "Nikon", patterns: [/\bNikon\b|尼康|\bZ\s?[89]\b/i] },
  { id: "fujifilm", name: "FUJIFILM", patterns: [/fujifilm|富士|\bGFX\b/i] },
  { id: "dji", name: "DJI", patterns: [/\bDJI\b|大疆|\bRonin\b|\bMavic\b|\bInspire\b/i] },
  { id: "panavision", name: "Panavision", patterns: [/panavision|潘那维申/i] },
  { id: "zeiss", name: "ZEISS", patterns: [/\bZEISS\b|蔡司|\bSupreme\s?Prime\b/i] },
  { id: "cooke", name: "Cooke Optics", patterns: [/cooke|库克/i] },
  { id: "angenieux", name: "Angénieux", patterns: [/ang[eé]nieux|安琴/i] },
  { id: "aputure", name: "Aputure", patterns: [/aputure|爱图仕/i] },
  { id: "atomos", name: "Atomos", patterns: [/\bAtomos\b/i] },
  { id: "kodak", name: "Kodak", patterns: [/\bKodak\b|柯达|\bVISION3\b/i] },
  { id: "unreal", name: "Unreal Engine", patterns: [/unreal\s?engine|虚幻引擎|\bUE5\b/i] },
  { id: "asc", name: "ASC", patterns: [/\bASC\b|American Society of Cinematographers/i] },
  { id: "bsc", name: "BSC", patterns: [/\bBSC\b|British Society of Cinematographers/i] },
  { id: "imago", name: "IMAGO", patterns: [/\bIMAGO\b/i] },
];

/** 这些域名上的文章，发布方就是对应的公司（媒体和聚合站不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "arri", domains: ["arri.com"] },
  { entityId: "red", domains: ["red.com"] },
  { entityId: "sony", domains: ["sonycine.com", "pro.sony"] },
  { entityId: "blackmagic", domains: ["blackmagicdesign.com"] },
  { entityId: "canon", domains: ["canon.com", "usa.canon.com"] },
  { entityId: "nikon", domains: ["nikon.com"] },
  { entityId: "fujifilm", domains: ["fujifilm.com"] },
  { entityId: "dji", domains: ["dji.com"] },
  { entityId: "panavision", domains: ["panavision.com"] },
  { entityId: "zeiss", domains: ["zeiss.com"] },
  { entityId: "cooke", domains: ["cookeoptics.com"] },
  { entityId: "aputure", domains: ["aputure.com"] },
  { entityId: "atomos", domains: ["atomos.com"] },
  { entityId: "kodak", domains: ["kodak.com"] },
  { entityId: "unreal", domains: ["unrealengine.com"] },
];

/** 原文里的这些写法也算提到了对应公司。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "sony", pattern: /@SonyCine\b/i },
  { entityId: "dji", pattern: /@DJIGlobal\b/i },
  { entityId: "blackmagic", pattern: /@Blackmagic_News\b/i },
];
