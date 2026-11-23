// 读者看得到的文字里本站不用的词，每项是要找的写法和改法（例如 [/重磅|炸裂/u, "不用夸张的说法，直接写发生了什么"]）。
// 写作那一步写完中文标题、摘要和推荐理由后逐个查，用了就让模型只改这些地方一次（packages/backend/src/editorial/
// analyze.ts 的 mendWording）。只列一眼就能判断的写法：拿不准的不列，否则会误改正常的词。空着就不查。

export const READER_WORDING: ReadonlyArray<readonly [RegExp, string]> = [
  // 2026-11-17 线上摘要出现过“rookie 警察”：普通英文词夹在中文句子里。
  [/\brookies?\b/iu, "译成中文（新人、新手），不夹英文"],
  // 2026-11-17 线上摘要把 Tallinn Black Nights 写成“塔林黑 nights 电影节”。
  [/Black Nights|黑 ?nights/iu, "写作“塔林黑夜电影节”"],
];
