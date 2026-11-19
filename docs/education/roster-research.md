# 院校教育单元：第 0 步调研（名单、信源、对比表样例）

调研时间：2026-11-18。网页可访问性和 RSS 用脚本实测（`.data/edu/checked.tsv`，不进 Git），其余结论都附出处。标"待核实"的是只见于二手摘要、没有打开原文确认的内容。

## 一、结论先说

1. **院校名单定为三组，下表去重后共 73 所。**
   - QS 2026 综合前 50：42 所有对口的艺术、媒体或设计单位，纳入；8 所没有，列入观察。
   - QS 2026 艺术与设计前 20：并列后共 21 所，其中 MIT、代尔夫特理工、牛津、新加坡国立 4 所已在综合组，另计 17 所。
   - 电影学院：13 所 CILECT 成员，另加 CalArts、ZHdK 两所非成员；UCLA 和 La Fémis（属 PSL）已在综合组。
2. **"每个院系订一个 RSS"这条路走不通。**
   - 实测 101 个院系和实验室页面：能直接读到正经 RSS 的只有 11 个。
   - 24 个页面拒绝自动访问（403/429，多为名校的防爬虫保护）。
   - 其余能打开，但没有 RSS。
3. **"按学校名做搜索订阅（Google News RSS）"能用，但噪声很大。**
   - 抽测 8 所学校，近 90 天结果里真正讲"艺术×科技/AI 教学"的只有约 12～15%。综合性大学几乎全是工程、医学新闻，专门院校好一些：USC 电影学院约 4/10，RCA 约 3/8。
   - 把检索词收窄到艺术学院本身（如 "Yale School of Art"、"Ruskin School of Art"），结果都和艺术有关，但几乎没有一条讲 AI。
   - 也就是说，全球范围内"艺术院校 AI 教学"的真新闻本来就少，每周大概只有个位数。
4. **由此修正方案：对比表是主体，新闻流只是补充。**
   - 新闻流的作用是发现变化，比如某校新开了项目，然后提示对比表里对应的那一格需要重新核实。
   - 不需要每周抓取，也不需要接社交媒体。
   - 搜索订阅源和院系 RSS 都进同一个"院校教育"分类，设一个高门槛的信源类别，并在预筛阶段过滤掉事务性新闻。

## 二、三组名单的来源

| 名单 | 出处 | 核对情况 |
|---|---|---|
| QS 2026 综合前 50 | [xuanxiao.org 转载的 QS 2026 榜单](https://xuanxiao.org/en/university-rankings/world-university-rankings/2026) | 与 [QS 官方结果页](https://www.qs.com/insights/qs-world-university-rankings-2026)及媒体报道的前 10、第 25～50 名一致 |
| QS 2026 艺术与设计 | [xuanxiao.org 转载的 QS 2026 学科榜](https://xuanxiao.org/en/rankings/qs/subject/art-design)（2026-03-25 发布） | QS 官网拒绝自动访问（403）；与 [Aalto 官方新闻"第 9 名"](https://aalto.fi/en/news/aalto-universitys-art-design-ranked-9th-in-the-world)一致 |
| 电影学院 | [CILECT 成员名单](https://www.cilect.org/members)（182 个成员） | 逐校核对过；CalArts 和 ZHdK 不是成员，作为补充列入 |

QS 综合前 50 里没有对口单位、列入观察的 8 所：Caltech、TUM、McGill、复旦、曼彻斯特、UBC、巴黎综合理工学院（IP Paris）、昆士兰大学。另有港大、港中文只找到文学院层面的单位，对口较弱，已列入下表，但优先级放低。

## 三、名单与接入方式

"接入方式"一列中：
- "RSS ✅"：已实测，返回的是真正的订阅源。
- "搜索订阅源"：用 Google News 按"单位名 + AI/艺术关键词"检索。
- 评论订阅源（comments/feed）和站点地图（sitemap.rss）不算 RSS。

### QS 综合前 50

| 排名 | 学校 | 对口单位 | 地址 | 接入方式 |
|---|---|---|---|---|
| 1 | MIT | MIT Arts / CAST | https://arts.mit.edu/news/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 1 | MIT | MIT Media Lab | https://www.media.mit.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 1 | MIT | MIT CMS/W | https://cmsw.mit.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 2 | Imperial College London | Dyson School of Design Engineering | https://www.imperial.ac.uk/design-engineering/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 3 | Stanford | Stanford Arts | https://arts.stanford.edu/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 3 | Stanford | Art & Art History | https://art.stanford.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 3 | Stanford | d.school | https://dschool.stanford.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 3 | Stanford | CCRMA | https://ccrma.stanford.edu/ | RSS ✅ `https://ccrma.stanford.edu/recent-news/feed` |
| 4 | Oxford | Ruskin School of Art | https://www.rsa.ox.ac.uk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 4 | Oxford | TORCH | https://www.torch.ox.ac.uk/ | RSS ✅ `https://www.torch.ox.ac.uk/rss.xml` |
| 5 | Harvard | Art, Film, and Visual Studies | https://afvs.fas.harvard.edu/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 5 | Harvard | metaLAB | https://mlml.io/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 5 | Harvard | Graduate School of Design | https://www.gsd.harvard.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 6 | Cambridge | Cambridge Digital Humanities | https://www.cdh.cam.ac.uk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 6 | Cambridge | Leverhulme CFI | https://www.lcfi.ac.uk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 7 | ETH Zurich | ETH AI Center | https://ai.ethz.ch/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 7 | ETH Zurich | Game Technology Center | https://gtc.inf.ethz.ch/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 8 | NUS | Communications and New Media | https://cnm.nus.edu.sg/ | 拒绝自动访问（000）→ 搜索订阅源 |
| 8 | NUS | Division of Industrial Design | https://cde.nus.edu.sg/did/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 9 | UCL | Bartlett School of Architecture | https://www.ucl.ac.uk/bartlett/architecture/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 9 | UCL | Slade School of Fine Art | https://www.ucl.ac.uk/slade/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 11 | HKU | Faculty of Arts | https://arts.hku.hk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 12 | NTU Singapore | School of Art, Design and Media | https://www.ntu.edu.sg/adm | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 13 | UChicago | Cinema and Media Studies | https://cms.uchicago.edu/ | RSS ✅ `https://cms.uchicago.edu/rss.xml` |
| 14 | Peking University | School of Arts | https://www.art.pku.edu.cn/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 15 | UPenn | Digital Media Design | https://www.cis.upenn.edu/dmd/ | RSS ✅ `https://www.cis.upenn.edu/feed/` |
| 15 | UPenn | Weitzman School of Design | https://www.design.upenn.edu/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 16 | Cornell | Performing and Media Arts | https://pma.cornell.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 17 | Tsinghua | Academy of Arts & Design | https://www.ad.tsinghua.edu.cn/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 17 | UC Berkeley | Berkeley Center for New Media | https://bcnm.berkeley.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 17 | UC Berkeley | Film & Media | https://filmmedia.berkeley.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 19 | Melbourne | Faculty of Fine Arts and Music (VCA) | https://finearts-music.unimelb.edu.au/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 20 | UNSW | UNSW iCinema | https://www.icinema.unsw.edu.au/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 20 | UNSW | School of Art & Design | https://www.unsw.edu.au/arts-design-architecture/our-schools/art-design | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 21 | Yale | School of Art | https://www.art.yale.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 21 | Yale | CCAM | https://ccam.yale.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 21 | Yale | Film & Media Studies | https://filmstudies.yale.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 22 | EPFL | EPFL+ECAL Lab | https://www.epfl-ecal-lab.ch/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 22 | EPFL | EPFL Pavilions | https://epfl-pavilions.ch/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 24 | Johns Hopkins | Film and Media | https://krieger.jhu.edu/film-media/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 25 | Princeton | Lewis Center for the Arts | https://arts.princeton.edu/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 25 | Sydney | School of Art, Communication and English | https://www.sydney.edu.au/arts/schools/school-of-art-communication-and-english.html | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 28 | PSL | EnsAD | https://www.ensad.fr/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 28 | PSL | Beaux-Arts de Paris | https://beauxartsparis.fr/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 28 | PSL | La Fémis | https://www.femis.fr/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 29 | Toronto | Cinema Studies Institute | https://www.cinema.utoronto.ca/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 31 | King's College London | Digital Humanities | https://www.kcl.ac.uk/ddh | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 32 | ANU | School of Art & Design | https://soad.cass.anu.edu.au/ | RSS ✅ `https://soad.cass.anu.edu.au/rss.xml?q=/rss.xml` |
| 32 | CUHK | Cultural Management / Fine Arts | https://www.arts.cuhk.edu.hk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 34 | Edinburgh | Edinburgh College of Art | https://www.eca.ed.ac.uk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 34 | Edinburgh | Edinburgh Futures Institute | https://efi.ed.ac.uk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 36 | Monash | MADA | https://www.monash.edu/mada | 拒绝自动访问（403）→ 搜索订阅源 |
| 36 | Monash | SensiLab | https://sensilab.monash.edu/ | 拒绝自动访问（503）→ 搜索订阅源 |
| 36 | UTokyo | III (Information Studies) | https://www.iii.u-tokyo.ac.jp/ | RSS ✅ `https://www.iii.u-tokyo.ac.jp/feed` |
| 38 | Columbia | School of the Arts | https://arts.columbia.edu/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 38 | Seoul National University | College of Fine Arts | https://art.snu.ac.kr/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 42 | Northwestern | School of Communication (RTVF) | https://communication.northwestern.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 44 | HKUST | Computational Media and Arts (GZ) | https://cma.hkust-gz.edu.cn/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 45 | Michigan | Stamps School of Art & Design | https://stamps.umich.edu/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 45 | Michigan | Film, Television & Media | https://lsa.umich.edu/ftvm | 拒绝自动访问（403）→ 搜索订阅源 |
| 46 | UCLA | School of Theater, Film and Television | https://www.tft.ucla.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 46 | UCLA | Design Media Arts | https://dma.ucla.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 47 | TU Delft | Industrial Design Engineering | https://www.tudelft.nl/io | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 47 | SJTU | School of Design | https://designschool.sjtu.edu.cn/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 49 | Zhejiang | International Design Institute | https://idi.zju.edu.cn/ | 拒绝自动访问（000）→ 搜索订阅源 |
| 50 | Yonsei | Underwood International College (CSD) | https://uic.yonsei.ac.kr/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |

### QS 艺术与设计前 20

| 排名 | 学校 | 对口单位 | 地址 | 接入方式 |
|---|---|---|---|---|
| 1 | Royal College of Art | RCA | https://www.rca.ac.uk/news-and-events/news/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 2 | UAL | Creative Computing Institute | https://www.arts.ac.uk/creative-computing-institute | 拒绝自动访问（403）→ 搜索订阅源 |
| 2 | UAL | UAL News | https://www.arts.ac.uk/about-ual/press-office/stories | 拒绝自动访问（403）→ 搜索订阅源 |
| 3 | The New School | Parsons | https://www.newschool.edu/parsons/ | 拒绝自动访问（429）→ 搜索订阅源 |
| 4 | RISD | RISD News | https://www.risd.edu/news | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 5 | Pratt | Pratt News | https://www.pratt.edu/news/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 7 | Politecnico di Milano | School of Design | https://www.design.polimi.it/en/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 8 | Glasgow School of Art | GSA News | https://www.gsa.ac.uk/about-gsa/news-press/ | 拒绝自动访问（404）→ 搜索订阅源 |
| 9 | Aalto | School of Arts, Design and Architecture | https://www.aalto.fi/en/school-of-arts-design-and-architecture | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 10 | Design Academy Eindhoven | DAE | https://www.designacademy.nl/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 11 | SAIC | SAIC News | https://www.saic.edu/news | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 12 | ArtCenter | ArtCenter News | https://www.artcenter.edu/connect/dot-magazine.html | 拒绝自动访问（404）→ 搜索订阅源 |
| 14 | CAFA | CAFA | https://www.cafa.edu.cn/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 15 | SCAD | SCAD News | https://www.scad.edu/about/news-and-press | 拒绝自动访问（403）→ 搜索订阅源 |
| 16 | Tongji | College of Design and Innovation | https://tjdi.tongji.edu.cn/ | 拒绝自动访问（403）→ 搜索订阅源 |
| 18 | SVA | SVA News | https://sva.edu/features | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 19 | Carnegie Mellon | Entertainment Technology Center | https://www.etc.cmu.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| 19 | Carnegie Mellon | College of Fine Arts | https://www.cmu.edu/cfa/ | RSS ✅ `https://cfa.cmu.edu/rss` |
| 19 | Carnegie Mellon | STUDIO for Creative Inquiry | https://studioforcreativeinquiry.org/ | RSS ✅ `https://studioforcreativeinquiry.org/feed` |
| 19 | RMIT | RMIT Design | https://www.rmit.edu.au/about/schools-colleges/design | 可访问，无 RSS → 搜索订阅源（必要时列表页） |

### 电影学院（CILECT 等）

| 排名 | 学校 | 对口单位 | 地址 | 接入方式 |
|---|---|---|---|---|
| - | USC | School of Cinematic Arts | https://cinema.usc.edu/news/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | NYU | Tisch School of the Arts | https://tisch.nyu.edu/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | AFI | AFI Conservatory | https://conservatory.afi.com/ | RSS ✅ `https://conservatory.afi.com/feed/` |
| - | NFTS | National Film and Television School | https://nfts.co.uk/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | FAMU | FAMU Prague | https://www.famu.cz/en/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | Łódź Film School | PWSFTviT | https://filmschool.lodz.pl/en/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | HFF Munich | HFF München | https://www.hff-muc.de/en_GB/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | Filmakademie BW | Filmakademie Baden-Württemberg | https://www.filmakademie.de/en/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | Tokyo Univ. of the Arts | Graduate School of Film and New Media | https://fm.geidai.ac.jp/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | AFTRS | AFTRS | https://www.aftrs.edu.au/ | RSS ✅ `https://www.aftrs.edu.au/feed/` |
| - | Tel Aviv University | Steve Tisch School of Film & TV | https://arts.tau.ac.il/en/film | 拒绝自动访问（404）→ 搜索订阅源 |
| - | Aalto | ELO Film School | https://www.aalto.fi/en/department-of-film-television-and-scenography | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | Communication Univ. of China | CUC | https://www.cuc.edu.cn/ | 可访问，无 RSS → 搜索订阅源（必要时列表页） |
| - | CalArts | CalArts (A&D 23, not CILECT) | https://calarts.edu/news | RSS ✅ `https://calarts.edu/rss.xml` |
| - | ZHdK | Zurich University of the Arts | https://www.zhdk.ch/en | 可访问，无 RSS → 搜索订阅源（必要时列表页） |

## 四、对比表样例：MIT、耶鲁、皇家艺术学院（RCA）

用样例检验对比表每一栏是否填得出来。每格都附证据，未打开原文确认的标"待核实"。

| 维度 | MIT | Yale | Royal College of Art |
|---|---|---|---|
| 对口单位 | Arts at MIT / CAST（艺术·科学·技术中心）、Media Lab、Morningside Academy for Design（MAD）、建筑与规划学院 | School of Art、CCAM（协作艺术与媒体中心，设在耶鲁学院，与建筑、艺术、戏剧、音乐四个学院合作，[官网](https://ccam.yale.edu/)）、Film & Media Studies、建筑学院 | 全校即艺术与设计 |
| 专设学位/项目 | 没有专门的"AI 艺术"学位 | 没有。艺术学院目前不把跨媒介、电影录像列为正式学位方向（待核实） | **新设 MA/MFA Artificial Intelligence & Digital Art（AiDA）**，2026-10-01 公布，2027 年首届，一年制 MA 或两年制 MFA（[e-flux 公告](https://www.e-flux.com/announcements/6788112/academic-programmes-for-2027-28)） |
| 代表课程 | 4.453 Creative Machine Learning for Design（2025 春，研究生课，上限 20 人，[课程页](https://architecture.mit.edu/node/1092)）；MAS.S66 Computer Visions: Generative Methods for Creative Applications（2022 秋，[课程页](https://visions.media.mit.edu/fall22)）；MAS.S63 Critical Matter: Body, Emotion, and Material Intelligence（Media Lab，Behnaz Farahi 讲授，她同时是 MAD 教授；内容包括机器感知与人工智能；按 2026-09-04 截止预选推断为 2026 秋季开课，[课程页](https://www.media.mit.edu/courses/critical-matter-body-emotion-material-intelligence/)） | 24519 AI Aesthetics（建筑学院，后半程用 Runway 做设计提案，[课程页](https://www.architecture.yale.edu/courses/24519-ai-aesthetics)，学期待核实）；HUMS 4165 Culture and Artificial Intelligence（[课程页](https://humanities.yale.edu/hums-4165-culture-and-artificial-intelligence)）；跨系电影录像课程描述里提到"AI 辅助创作"，与 CCAM 合开（待核实） | 现有项目 Digital Narrative Arts（原 Digital Direction）、Intelligent Mobility Design，与帝国理工合办的 Innovation Design Engineering（同上 e-flux 公告） |
| 研究与平台 | MIT–HPI AI and Creativity Hub（MHACH）：MAD、Schwarzman 计算学院与德国哈索·普拉特纳研究所（HPI）共建的十年计划，2026 年 3 月宣布，由哈索·普拉特纳基金会出资，设教席、研究生奖学金和暑期交流（[MIT 设计新闻](https://design.mit.edu/news/mit-and-hasso-plattner-institute-establish-collaborative-hub-for-ai-and-creativity)，[项目页](https://computing.mit.edu/mhach/)） | AI Steering Committee（AI 指导委员会），2025 年秋由教务长办公室和风险管理办公室设立，负责全校 AI 的开发与部署；教学类项目另由数据治理委员会负责（[AI 审查框架](https://ai.yale.edu/ai-review-framework)）。没有找到面向艺术教学的 AI 平台 | 2024 年 6 月发布《Responsible AI Report》（[RCA Research Online](https://researchonline.rca.ac.uk/5909/1/Responsible%20AI%20Report_final%20version_June2024.pdf)）；正为 AiDA 招聘研究人员（待核实） |
| 生成式 AI 政策层级 | 没有全校统一的学生规则，由院系和任课老师定；信息技术部门要求披露 AI 使用；校内特设委员会建议做"政策菜单"（均为二手摘要，待核实） | 校级有教务长发布的使用指南（[2023](https://provost.yale.edu/news/guidelines-use-generative-ai-tools)），课程层面由任课老师定 | 有校级指南《Using Generative AI at the Royal College of Art》（[PDF](https://rca-media2.rca.ac.uk/documents/Using_Generative_AI_at_the_Royal_College_of_Art.pdf)，元数据为 2026-07）：十条通用原则，包括保护敏感数据、核对生成内容、尊重版权、"公开使用 AI"、注意偏见和能耗；没有写评分或作业层面的具体规则。看起来面向全校师生，不专门针对学生作业） |
| 近期动态 | CAST 圆桌"生成式 AI 如何改变艺术与设计"（[2023-10-26](https://arts.mit.edu/considering-generative-ai)） | 《耶鲁日报》报道各系新开 AI 课程（2025-05-17，[链接](https://yaledailynews.com/blog/2025/05/17/yale-confronts-ai-with-new-classes-varied-policies-and-an-ethics-focus)，原文被限流，未读到） | 把传播学院和设计学院合并为一个学院（Creative Boom 报道标题，细节待核实） |

### 样例暴露的问题，以及对字段设计的修正

- **"生成式 AI 政策"区分度低。** 三所学校都是"校级给原则，课程层面由老师定"，这一格多半会填成一样的内容。改成只记两项：政策在哪一层（校级、院级、课程级），是否要求披露。
- **"代表课程"最费工夫，也最容易过时。** 课程目录每年都变，名校还常常拒绝自动访问。改为每校最多列 3 门，必须附课程页链接和学期，并且每学期核实一次。
- **"专设学位或项目"区分度最高。** 比如 RCA 新开 AiDA，MIT 和耶鲁都没有专门学位。它应该放在对比表的第一列。
- 最终字段：专设项目｜代表课程（≤3）｜研究平台｜政策层级与是否要求披露｜设施（动作捕捉、XR、算力，选填）｜近期变化｜证据链接与核实日期。

## 五、下一步（等你确认）

1. 名单：确认三组的取舍，包括观察名单要不要纳入，以及 CalArts、ZHdK 两所补充学校留不留。
2. 字段：确认第四节末尾的最终字段。
3. 我按确认后的名单和字段，分批填对比表，每批 10 所，交你审。
4. 第 1 步配置：
   - 新增"院校教育"分类和教育类信源类别，门槛高于 32。
   - 接入 11 个已实测可用的 RSS，再加按单位名建的搜索订阅源，先挑 20 个噪声最低的。
   - 为每所学校建专题页，先做 20 所。
