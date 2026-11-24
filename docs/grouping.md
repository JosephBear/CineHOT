# 事件归组与关系评测

站点先用标题和摘要召回最近两周的候选事实（配了向量服务时比向量，没配时比文字重合度），再让模型判断报道之间的关系，同时判断这篇报道相对精选里已有的内容有没有新信息（分数够了的报道要靠这一条才进精选，见 [精选与校准](selection.md)）。关系定义和站点实际使用的提示词在 `industry/prompts/group-*.md`，代码入口在 `packages/backend/src/events/relate.ts` 和 `group.ts`。

四种关系是：

- `SAME_OCCURRENCE`：同一次真实发生，例如同一发布的官方原文和媒体报道。
- `SAME_STORY`：不是同一次发生，但属于同一具体事件的直接进展，例如发布后的上架、评测或回应。
- `UNRELATED`：不同的事，即使主体、产品或话题相同。
- `ROUNDUP`：其中一方是包含多个话题的汇总。

## CineHOT 的同事件去重（2026-11-24）

**现象**：2026-11-17 松下 LUMIX SHX1 发布后，发布、PetaPixel 评测、CineD 实验室测试、CineD 专访和两个配件在精选里各占一张卡片（6 张，首页 20 张里占 4 张）；可灵 Image 4.0 的预告和正式发布也各占一张。

**原因**：两段都有短板。
1. **召回**：没配向量服务时，候选按标题和摘要的文字重合度找（`LEXICAL_MIN = 0.25`）。中英混排、同一产品从不同角度写的报道，字面重合低，召回不到一起。
2. **判断**：关系定义里没有器材行业的例子，模型容易把“评测、专访、同期配件”判成 `UNRELATED`。

**做法**：引擎本身不改。
1. `industry/prompts/group-definitions.md` 补了器材与 AI 工具的常见情形：发布与首发评测、实验室测试、专访是 `SAME_STORY`；同期配件是 `SAME_OCCURRENCE`；同周不同机型仍是 `UNRELATED`。
2. 配一个向量服务（`.env.example` 的“让事件归组更准”一节），召回改用向量相似度。按需二选一：金山云等平台的 OpenAI 兼容向量接口（`EMBEDDING_*`），或阿里云百炼（`DASHSCOPE_API_KEY`）。本站每天新增约百条，向量费用很低。
3. 上线前用真实案例评测：`industry/relation-gold.cinehot.jsonl` 收了上面 SHX1、可灵的 6 对报道（含 1 对同日不相关的对照），运行

   ```bash
   node --env-file=.env scripts/eval-relations.ts --gold industry/relation-gold.cinehot.jsonl
   ```

   看发布与评测、专访、配件几对是否判对，同日不相关的那对是否没被误合。样本少，只用来确认方向；更多边界样本放 `.data/relation-gold.jsonl`。

改动的效果只对改后新归组的报道生效；已有的事件不会自动重组。

## 用自己的标注样本评测两两关系判断

`scripts/eval-relations.ts` 只评测模型对两篇报道之间关系的判断。它直接复用站点归组时用的 `PAIR_SYSTEM`、`pairUser()`、`PairSchema` 和提示词版本，因此提示词变了，评测也跟着变。它不重新跑候选召回，也不把结果写回事件归组。

把自己的标注数据放在 `.data/` 下（该目录不会提交到 Git）。`industry/relation-gold.example.jsonl` 给了四条虚构示例。每行一条：

```json
{"caseId":"release-001","a":{"title":"...","source":"...","firstParty":true,"publishedAt":"2026-09-01T09:00:00+08:00","summary":"..."},"b":{"title":"...","source":"...","firstParty":false,"publishedAt":"2026-09-01T09:20:00+08:00","summary":"..."},"samplingContext":{"benchmarkSplit":"development","samplingStratum":"same-release"},"gold":{"relation":"SAME_OCCURRENCE"}}
```

`a`、`b` 也可以带和站点内部 `ReportView` 一致的可选 `frame`：

```json
{"subject":"Acme","action":"发布","object":"Acme-2","occurredAt":"2026-09-01"}
```

建议把容易混淆的边界样本放进开发集，再留一部分 `benchmarkSplit: "holdout"` 最后检查。`samplingStratum` 是可选的分组标签，用来看错在哪一类，不影响模型输入。

### 运行

先按正常部署方式配置数据库和模型，再运行：

```bash
node --env-file=.env scripts/eval-relations.ts \
  --gold .data/relation-gold.jsonl \
  --split development
```

默认使用“归组复核”这一步当前的模型：后台“模型与评测”页切换过的优先，其次是环境变量 `GROUP_REVIEW_MODEL`，再其次是 `site/models.ts` 的 `DEFAULTS.groupReview`，都没有就用默认模型。也可以显式比较多个已配置的模型：

```bash
node --env-file=.env scripts/eval-relations.ts \
  --gold .data/relation-gold.jsonl \
  --models default,deepseek-flash \
  --split development \
  --n 200 \
  --seed 7 \
  --thresholds 0.75,0.8
```

可用参数：

| 参数 | 默认值 | 说明 |
|---|---:|---|
| `--gold` | `.data/relation-gold.jsonl` | 标注样本文件（JSONL） |
| `--models` | “归组复核”当前的模型 | 逗号分隔的模型名 |
| `--split` | `all` | `development`、`holdout` 或自己定的分组 |
| `--n` | `200` | 最多评测多少条 |
| `--seed` | `7` | 抽样用的随机种子，种子相同，每次抽到的样本相同 |
| `--concurrency` | `6` | 同时发出的模型请求数 |
| `--thresholds` | production 的 `STORY_REVIEW_MIN_CONFIDENCE,TIE_MIN_CONFIDENCE` | 判断两篇报道“连进同一事件”时用的置信度门槛；显式传参会覆盖默认值 |

完整报告写到 `.data/eval/relations-*.json`。每个模型会得到：

- 4 × 4 的对照表：每种标注关系被模型判成了哪种关系；
- 每种关系的查准率、查全率、F1 和样本数（只统计成功得到结构化判断的样本）；
- `coverage`：成功得到结构化判断的样本占全部金标样本的比例；
- `accuracy` 与四类 macro-F1：只衡量成功得到结构化判断后的判断质量；`completeAccuracy` 则用全部金标样本作分母，把调用失败或回答不合格式也算作没有正确完成；
- 把 `SAME_OCCURRENCE`、`SAME_STORY` 都算作“连进同一事件”时，各个置信度门槛下的查准率、查全率和 F1，同时给出同一批样本的 `coverage` 与 `completeAccuracy`；
- 调用出错的条数、token 用量、每次请求的平均耗时和整次评测的总耗时；
- 每条样本的判断、置信度、模型写的差别说明（`difference`）和回执编号。

模型调用照常经过回执和预算熔断。相同模型、提示词和输入的重复评测会复用已有回执；同一次运行中输入相同的样本共享一次请求结果，各自按自己的标注计分，失败也共享，不在这次运行里重复请求。报告里的 `reused` 包括共享的成功或失败结果，以及复用的已有成功回执。评测的回执用单独的用途 `eval_relation_pair`，不计入站点归组那几步在后台的统计。

token 用量和平均耗时按报告引用的回执对应的全部请求尝试汇总，包括之前解析失败的响应；同一张回执不会因为多条样本重复计算。用已有结果重跑时仍显示这些历史用量，不代表这次新增的费用。

CI 检查 JSONL 解析、固定种子的抽样、各项指标，以及本地假模型服务下的并发复用和重试用量统计，不访问外部模型服务。
