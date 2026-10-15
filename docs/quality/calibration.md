# CinemaHOT 标注与精选校准

状态：**尚未校准**。按使用者选择，现阶段交付本地试运行和真实文章待标注清单，不运行付费评测，不伪造人工判断，也不调整门槛数字。

## 已准备的清单

项目 `.data/labeling/`（不进 Git）包含：

- `real-articles.csv`：可编辑的 101 条真实文章清单；`decision`、`reason` 留空。
- `real-articles.jsonl`：相同元数据，包含原文链接、日期、信源、分级和短订阅摘要。
- `manifest.json`：来源数量、日期范围和未校准状态。

来自 2026-10-14 保存的公开页面与订阅：ARRI 11 条、Blackmagic Design 40 条、Wandering DP 10 条、Team Deakins 39 条、影视工业网 1 条；发布时间覆盖 2025-07-30 至 2026-10-14。只保留元数据与短订阅摘录，没有执行页面脚本或保留页面账户字段。它是 17 个信源中的 5 个来源的便利样本，有明显的来源和时间偏差，不能直接代表线上信息分布。

## 人工标注

1. 打开原文，确认内容与发布时间；不要只凭标题判定。`materialStatus` 表明现有材料仅是标题或订阅摘录。
2. 在 `decision` 填 `select`（该选）、`reject`（不该选）或 `either`（两可），并写 `reason`。不要把同一新闻的重复报道直接当作噪声，当前评分评测不含最终归组去重。
3. 阅读材料不可访问、事实无法确认时，保留 `pending`，不要猜标签。完成的样本再把 `annotationStatus` 改为 `reviewed`。
4. 补充其他信源、中文媒体、影展/协会及难例；复核分级与日期。已有 development/holdout 划分仅便于组织，不代表样本已独立、已去重或已完成盲测。相同事件应放在同一份中。
5. 将已完成条目整理为 `docs/selection.md` 规定的 `.data/gold.jsonl`：保留原始标题与日期，补齐实际阅读材料，写入 `gold.decision`；不要将这里的扁平待标注 JSONL 直接当作评测输入。

## 之后的评测

人工标注完成且明确启用模型、配置好服务商与预算后，使用已有评测脚本：

```sh
node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl --split development --label 'CinemaHOT 首轮人工标注'
node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl --split holdout --label 'CinemaHOT 留出集验收'
```

评测会调用模型并可能计费，本次没有执行。对比查准率、查全率、F1、覆盖率、完整准确率和错例；先调整标准，再决定是否调整门槛，最后用未参与调参的留出集验证。`industry/gold.example.jsonl` 仅为明确标注的虚构格式示例，不能用于证明真实质量。

当前 T1/T1_5/T2 门槛仍是 60/65/76，`understandFloor` 为 50。不能将当前分数视为已经验证的电影摄影推荐质量。
