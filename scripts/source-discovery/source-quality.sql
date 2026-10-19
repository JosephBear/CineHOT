-- 近14天每个信源：抓到多少、模型处理了多少、相关多少、相关条目平均分、按最新判定入选多少。只读。
-- 未处理的资料不算“不相关”；入选按每篇资料最新一次判定计算（反映判定当时的门槛），
-- 所以换门槛或提示词后，至少等采集运行一周、“最近判定”都在升级之后，再用结果决定删除哪些信源。
WITH latest AS (
  SELECT DISTINCT ON (an.article_id) an.article_id, an.relevance, an.score, an.selected, an.created_at
  FROM analyses an JOIN articles ar ON ar.id = an.article_id
  WHERE ar.discovered_at > now() - interval '14 days'
  ORDER BY an.article_id, an.id DESC)
SELECT s.id, s.name,
  count(ar.id) AS 资料数,
  count(latest.article_id) AS 已处理数,
  count(*) FILTER (WHERE latest.relevance = 'pass') AS 相关数,
  round(avg(latest.score) FILTER (WHERE latest.relevance = 'pass'), 1) AS 相关平均分,
  count(*) FILTER (WHERE latest.selected) AS 入选数,
  to_char(max(latest.created_at) AT TIME ZONE 'Asia/Shanghai', 'MM-DD HH24:MI') AS 最近判定
FROM sources s
LEFT JOIN articles ar ON ar.source_id = s.id AND ar.discovered_at > now() - interval '14 days'
LEFT JOIN latest ON latest.article_id = ar.id
WHERE s.enabled
GROUP BY s.id, s.name
ORDER BY 入选数, 相关平均分 NULLS FIRST, 已处理数;
