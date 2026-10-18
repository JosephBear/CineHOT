// Local labeling for selection calibration (docs/selection.md): collect recent real articles from the
// configured sources, label them in a local web page, and export .data/gold.jsonl for eval-selection.ts.
// Reads public pages only: no database, no models, no paid services (no Jina fallback).
//   node --env-file=.env scripts/label-selection.ts collect [--per-source 3] [--days 45] [--max 200]
//   node --env-file=.env scripts/label-selection.ts serve [--port 4321]
//   node --env-file=.env scripts/label-selection.ts export
import http from "node:http";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";
import { fetchRss } from "@aihot/backend/sources/rss";
import { fetchDetail, fetchWebList, needsTitle } from "@aihot/backend/sources/web-list";
import { fetchJsonList } from "@aihot/backend/sources/json-list";
import { admitListing } from "@aihot/backend/sources/filters";
import { pageFetchable, readable } from "@aihot/backend/content/extract";
import { guardedFetch } from "@aihot/backend/lib/http-fetch";
import type { Candidate, SourceRow } from "@aihot/backend/sources/types";

const DIR = new URL("../.data/labeling/", import.meta.url);
const ITEMS = new URL("items.json", DIR);
const LABELS = new URL("labels.json", DIR);
const GOLD = new URL("../.data/gold.jsonl", import.meta.url);
const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : Number(process.argv[i + 1]);
};

interface Item {
  caseId: string; sourceId: string; sourceName: string; sourceKind: string; tier: string; tags: string[];
  title: string; url: string; publishedAt: string; language: "zh" | "en"; body: string; bodySource: "feed" | "page" | "excerpt";
  split: "development" | "holdout";
}
interface Label { decision: "select" | "reject" | "either"; reason: string; at: string }

const readJson = <T>(url: URL, fallback: T): T => existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) as T : fallback;
/** Labels are the only hand-made data here: write a whole new file, then swap it in. */
function writeAtomic(url: URL, text: string) {
  mkdirSync(DIR, { recursive: true });
  const tmp = new URL(`${url.pathname.split("/").pop()}.tmp`, url);
  writeFileSync(tmp, text);
  renameSync(tmp, url);
}
const hash = (s: string) => createHash("sha1").update(s).digest("hex");
const language = (s: string): "zh" | "en" => ((s.match(/[一-鿿]/g)?.length ?? 0) > s.length * 0.15 ? "zh" : "en");

async function bodyFor(c: Candidate, source: SourceRow): Promise<{ body: string; bodySource: Item["bodySource"] }> {
  if (c.bodyText && c.bodyText.length > 200) return { body: c.bodyText, bodySource: "feed" };
  if (pageFetchable(c.url, source.kind)) {
    try {
      const res = await guardedFetch(c.url, { timeoutMs: 20_000, maxBytes: 6 * 1024 * 1024 });
      const got = res.status === 200 && /html/.test(res.headers.get("content-type") ?? "") ? readable(res.text(), res.url) : null;
      if (got?.text) return { body: got.text, bodySource: "page" };
    } catch { /* an unreadable page keeps the listing's excerpt */ }
  }
  return { body: c.excerpt ?? c.bodyText ?? "", bodySource: "excerpt" };
}

async function collect() {
  const perSource = arg("per-source", 3), days = arg("days", 45), max = arg("max", 200);
  const { sources } = JSON.parse(readFileSync(new URL("../industry/sources.json", import.meta.url), "utf8")) as { sources: Array<SourceRow & { tags: string[] }> };
  const since = Date.now() - days * 86400_000;
  const kept = new Map(readJson<Item[]>(ITEMS, []).map((i) => [i.caseId, i]));
  const perSourceItems: Item[][] = [];
  let next = 0;
  // A few sources at a time: polite to publishers, and one slow site does not stall the rest.
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < sources.length) {
      const seed = sources[next++]!;
      if (seed.kind === "external") continue;
      const source = { ...seed, first_party: seed.tier === "T1", enabled: true, cursor: null, fail_count: 0 } as SourceRow;
      try {
        assertSupportedConfig(source.kind, source.config);
        const raw = source.kind === "rss" ? (await fetchRss(source, { force: true })).candidates : source.kind === "json_list" ? await fetchJsonList(source) : await fetchWebList(source);
        const listed = admitListing(raw, source);
        // Listings dated only on their article pages get those dates the way collection does.
        if (source.config.detail) for (const c of listed.slice(0, perSource * 2)) {
          if (!c.publishedAt) c.publishedAt = await fetchDetail(c.url, source, { date: true, title: false, summary: false, body: false }).then((d) => d.publishedAt, () => null);
        }
        const recent = listed.filter((c) => c.publishedAt && c.publishedAt.getTime() >= since)
          .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime()).slice(0, perSource);
        const items: Item[] = [];
        for (const c of recent) {
          const caseId = `${seed.id}-${hash(c.url).slice(0, 10)}`;
          const old = kept.get(caseId);
          if (old) { items.push(old); continue; }
          // Titles a listing cannot give come from the article page, as collection takes them.
          const d = source.config.detail;
          if (d && (d.titleSelector || d.titleRegex) && (d.titleAuthoritative === true || needsTitle(c.title))) {
            const got = await fetchDetail(c.url, source, { date: false, title: true, summary: false, body: false }).catch(() => null);
            if (got?.title) c.title = got.title;
          }
          const { body, bodySource } = await bodyFor(c, source);
          items.push({
            caseId, sourceId: seed.id, sourceName: seed.name, sourceKind: seed.kind, tier: seed.tier, tags: seed.tags ?? [],
            title: c.title, url: c.url, publishedAt: c.publishedAt!.toISOString(), language: language(`${c.title} ${body.slice(0, 2000)}`),
            body: body.slice(0, 8000), bodySource, split: parseInt(hash(caseId).slice(0, 8), 16) % 4 === 0 ? "holdout" : "development",
          });
        }
        perSourceItems.push(items);
        console.log(`${seed.id}: ${items.length}`);
      } catch (error) {
        console.log(`${seed.id}: failed (${error instanceof Error ? error.message : error})`);
      }
    }
  }));
  // Round-robin across sources so a cap keeps the sample varied instead of filling up with the first sites.
  const out: Item[] = [];
  for (let round = 0; out.length < max && perSourceItems.some((l) => l[round]); round++) {
    for (const list of perSourceItems) if (list[round] && out.length < max) out.push(list[round]!);
  }
  writeAtomic(ITEMS, JSON.stringify(out, null, 1));
  console.log(`\n${out.length} items → .data/labeling/items.json (labels in labels.json are kept)`);
}

function exportGold() {
  const items = readJson<Item[]>(ITEMS, []);
  const labels = readJson<Record<string, Label>>(LABELS, {});
  const lines = items.filter((i) => labels[i.caseId]).map((i) => JSON.stringify({
    caseId: i.caseId,
    material: { title: i.title, originalTitle: null, publishedAt: i.publishedAt, sourceName: i.sourceName, bodyZh: i.language === "zh" ? i.body : null, bodyOriginal: i.language === "zh" ? null : i.body },
    sourceFacts: { sourceKind: i.sourceKind, sourceTier: i.tier, firstParty: i.tier === "T1", language: i.language },
    samplingContext: { benchmarkSplit: i.split, samplingStratum: i.tags.find((t) => t !== "官方") ?? i.tier },
    gold: { decision: labels[i.caseId]!.decision },
  }));
  writeAtomic(GOLD, lines.join("\n") + (lines.length ? "\n" : ""));
  return lines.length;
}

function serve() {
  const port = arg("port", 4321);
  const server = http.createServer(async (req, res) => {
    const send = (status: number, body: string, type = "application/json; charset=utf-8") => { res.writeHead(status, { "content-type": type, "cache-control": "no-store" }); res.end(body); };
    try {
      if (req.method === "GET" && req.url === "/") return send(200, PAGE, "text/html; charset=utf-8");
      if (req.method === "GET" && req.url === "/api/data") return send(200, JSON.stringify({ items: readJson<Item[]>(ITEMS, []), labels: readJson<Record<string, Label>>(LABELS, {}) }));
      if (req.method === "POST" && req.url === "/api/label") {
        let raw = "";
        for await (const chunk of req) { raw += chunk; if (raw.length > 64_000) return send(413, '{"error":"too large"}'); }
        const { caseId, decision, reason } = JSON.parse(raw) as { caseId: string; decision: Label["decision"] | null; reason?: string };
        if (!readJson<Item[]>(ITEMS, []).some((i) => i.caseId === caseId)) return send(400, '{"error":"unknown case"}');
        if (decision !== null && !["select", "reject", "either"].includes(decision)) return send(400, '{"error":"bad decision"}');
        const labels = readJson<Record<string, Label>>(LABELS, {});
        if (decision === null) delete labels[caseId];
        else labels[caseId] = { decision, reason: String(reason ?? "").slice(0, 2000), at: new Date().toISOString() };
        writeAtomic(LABELS, JSON.stringify(labels, null, 1));
        return send(200, '{"ok":true}');
      }
      if (req.method === "POST" && req.url === "/api/export") return send(200, JSON.stringify({ exported: exportGold() }));
      send(404, '{"error":"not found"}');
    } catch (error) {
      send(500, JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
  });
  server.listen(port, "127.0.0.1", () => console.log(`labeling page: http://127.0.0.1:${port}/`));
}

const PAGE = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>精选标注</title><style>
:root{--bg:#f6f6f4;--card:#fff;--ink:#1d1f21;--ink2:#5d6166;--line:#e2e2de;--sel:#1f8a4c;--rej:#c0392b;--eit:#b7791f;--acc:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#141618;--card:#1d2023;--ink:#e8e8e6;--ink2:#9aa0a6;--line:#2e3236;--acc:#6ea8fe}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;z-index:1}
header b{font-size:16px}.bar{flex:1;min-width:120px;height:6px;background:var(--line);border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;background:var(--acc)}
select,button,textarea{font:inherit;color:inherit}select,button{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:5px 10px;cursor:pointer}
main{max-width:860px;margin:0 auto;padding:16px}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px}
.meta{color:var(--ink2);font-size:13px;display:flex;flex-wrap:wrap;gap:4px 12px}.tag{border:1px solid var(--line);border-radius:999px;padding:0 8px}
h1{font-size:20px;line-height:1.4;margin:10px 0}h1 a{color:inherit}.body{white-space:pre-wrap;max-height:46vh;overflow:auto;border-top:1px solid var(--line);margin-top:10px;padding-top:10px;font-size:14px}
.note{color:var(--ink2);font-size:12px}.choices{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 8px}.choices button{flex:1;min-width:110px;padding:10px;font-weight:600}
.choices button.on[data-d=select]{background:var(--sel);color:#fff;border-color:var(--sel)}.choices button.on[data-d=reject]{background:var(--rej);color:#fff;border-color:var(--rej)}.choices button.on[data-d=either]{background:var(--eit);color:#fff;border-color:var(--eit)}
textarea{width:100%;min-height:64px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px}nav{display:flex;justify-content:space-between;margin-top:12px;gap:8px}
.help{color:var(--ink2);font-size:12px;margin-top:14px}kbd{border:1px solid var(--line);border-radius:4px;padding:0 4px;font-size:11px}
</style></head><body>
<header><b>精选标注</b><span id="count"></span><div class="bar"><i id="prog"></i></div>
<select id="filter"><option value="todo">只看未标</option><option value="all">全部</option><option value="select">该选</option><option value="reject">不该选</option><option value="either">两可</option></select>
<select id="source"><option value="">全部信源</option></select><button id="export">导出 gold.jsonl</button></header>
<main><div class="card" id="card"></div>
<p class="help">问自己：<b>学电影和影像的师生，会不会愿意在今天的精选里看到这条？</b>按这条资料本身判断，不管是否和别的报道重复。<br>
快捷键：<kbd>1</kbd> 该选 <kbd>2</kbd> 不该选 <kbd>3</kbd> 两可 <kbd>0</kbd> 清除 · <kbd>←</kbd><kbd>→</kbd> 上一条/下一条 · 理由框里按 <kbd>Esc</kbd> 退出输入</p></main>
<script>
const NAMES={select:"该选",reject:"不该选",either:"两可"};let items=[],labels={},view=[],pos=0;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
async function load(){const d=await (await fetch("/api/data")).json();items=d.items;labels=d.labels;
 const srcs=[...new Map(items.map(i=>[i.sourceId,i.sourceName])).entries()];$("#source").innerHTML='<option value="">全部信源</option>'+srcs.map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v)+'</option>').join("");refresh(true)}
function refresh(reset){const f=$("#filter").value,s=$("#source").value,cur=view[pos]?.caseId;
 view=items.filter(i=>(!s||i.sourceId===s)&&(f==="all"||(f==="todo"?!labels[i.caseId]:labels[i.caseId]?.decision===f)));
 pos=reset?0:Math.max(0,view.findIndex(i=>i.caseId===cur));if(pos<0)pos=0;render()}
function stats(){const n=Object.keys(labels).filter(k=>items.some(i=>i.caseId===k)).length;$("#count").textContent=n+" / "+items.length+" 已标";$("#prog").style.width=(items.length?100*n/items.length:0)+"%"}
function render(){stats();const i=view[pos];if(!i){$("#card").innerHTML='<p>这个筛选下没有条目了。'+(items.length?'':'先运行 collect 抓取样本。')+'</p>';return}
 const l=labels[i.caseId]||{};const date=new Date(i.publishedAt).toLocaleDateString("zh-CN");
 $("#card").innerHTML='<div class="meta"><span>'+(pos+1)+' / '+view.length+'</span><span>'+esc(i.sourceName)+'</span><span class="tag">'+esc(i.tier)+'</span>'+i.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+'<span>'+date+'</span></div>'+
 '<h1><a href="'+esc(i.url)+'" target="_blank" rel="noopener">'+esc(i.title)+'</a></h1>'+
 '<div class="note">'+(i.bodySource==="excerpt"?"只取到摘要，建议点标题读原文后再判断":"正文摘自原文页面")+'</div>'+
 '<div class="body">'+esc(i.body||"（没有正文，请打开原文）")+'</div>'+
 '<div class="choices">'+["select","reject","either"].map(d=>'<button data-d="'+d+'" class="'+(l.decision===d?"on":"")+'">'+NAMES[d]+'</button>').join("")+'</div>'+
 '<textarea id="reason" placeholder="理由（可选，但很有用）：比如“器材软文”“学生会关心的影展结果”">'+esc(l.reason||"")+'</textarea>'+
 '<nav><button id="prev">← 上一条</button><button id="next">下一条 →</button></nav>';
 document.querySelectorAll(".choices button").forEach(b=>b.onclick=()=>mark(b.dataset.d));$("#prev").onclick=()=>go(-1);$("#next").onclick=()=>go(1);
 $("#reason").onchange=()=>{if(labels[i.caseId])save(i.caseId,labels[i.caseId].decision)}}
async function save(caseId,decision){const reason=$("#reason")?.value||"";const r=await fetch("/api/label",{method:"POST",body:JSON.stringify({caseId,decision,reason})});
 if(!r.ok){alert("保存失败："+(await r.text()));return false}if(decision)labels[caseId]={decision,reason};else delete labels[caseId];return true}
async function mark(d){const i=view[pos];if(!i||!await save(i.caseId,d))return;if($("#filter").value==="todo"){const p=pos;refresh(true);pos=Math.min(p,Math.max(0,view.length-1));render()}else{render();go(1)}}
function go(n){pos=Math.min(Math.max(0,pos+n),Math.max(0,view.length-1));render();scrollTo(0,0)}
document.onkeydown=e=>{if(e.target.tagName==="TEXTAREA"){if(e.key==="Escape")e.target.blur();return}if(e.target.tagName==="SELECT")return;
 if(e.key==="1")mark("select");else if(e.key==="2")mark("reject");else if(e.key==="3")mark("either");else if(e.key==="0")mark(null);else if(e.key==="ArrowRight")go(1);else if(e.key==="ArrowLeft")go(-1)};
$("#filter").onchange=()=>refresh(true);$("#source").onchange=()=>refresh(true);
$("#export").onclick=async()=>{const r=await (await fetch("/api/export",{method:"POST"})).json();alert(r.error?"导出失败："+r.error:"已导出 "+r.exported+" 条到 .data/gold.jsonl")};
load();
</script></body></html>`;

const cmd = process.argv[2];
if (cmd === "collect") await collect();
else if (cmd === "serve") serve();
else if (cmd === "export") console.log(`${exportGold()} labeled cases → .data/gold.jsonl`);
else console.log("usage: node --env-file=.env scripts/label-selection.ts collect|serve|export");
