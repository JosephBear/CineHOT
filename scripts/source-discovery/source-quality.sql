-- 近14天每个信源：抓到多少、预筛相关多少、相关条目平均分、进了多少精选。按精选数从少到多排。
WITH latest AS (
  SELECT DISTINCT ON (an.article_id) an.article_id, an.relevance, an.score
  FROM analyses an JOIN articles ar ON ar.id = an.article_id
  WHERE ar.discovered_at > now() - interval '14 days'
  ORDER BY an.article_id, an.id DESC)
SELECT s.id, s.name,
  count(ar.id) AS 资料数,
  count(*) FILTER (WHERE latest.relevance = 'pass') AS 相关数,
  round(avg(latest.score) FILTER (WHERE latest.relevance = 'pass'), 1) AS 相关平均分,
  count(p.article_id) FILTER (WHERE p.selected) AS 精选数
FROM sources s
LEFT JOIN articles ar ON ar.source_id = s.id AND ar.discovered_at > now() - interval '14 days'
LEFT JOIN latest ON latest.article_id = ar.id
LEFT JOIN publications p ON p.article_id = ar.id
WHERE s.enabled
GROUP BY s.id, s.name
ORDER BY 精选数, 相关平均分 NULLS FIRST;
