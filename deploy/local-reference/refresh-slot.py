"""Make each automatic source due once per UTC+8 six-hour slot."""
from pathlib import Path
import subprocess
work=Path(__file__).resolve().parent
query="""
WITH slot AS (
 SELECT date_trunc('day', now() AT TIME ZONE 'Asia/Shanghai')
  + floor(extract(hour from now() AT TIME ZONE 'Asia/Shanghai')/6)*interval '6 hours' AS starts
), changed AS (
 UPDATE sources SET next_fetch_at=now()
 WHERE enabled AND kind IN ('rss','web_list','json_list')
 AND (last_fetch_at IS NULL OR last_fetch_at < (SELECT starts AT TIME ZONE 'Asia/Shanghai' FROM slot))
 AND (next_fetch_at IS NULL OR next_fetch_at > now())
 RETURNING id
) SELECT count(*) AS sources_made_due FROM changed;
"""
subprocess.run([str(work/'postgres17/bin/psql'),'-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','55434','-U','postgres','-d','cinemahot_local','-c',query],check=True)
