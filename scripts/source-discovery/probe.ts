// Finds a collectable entry for a candidate source: a feed, a dated article list, embedded JSON, or an
// official YouTube channel. Reads public pages with the collector's own User-Agent, so a site that blocks
// the crawler shows up here too. Writes nothing. See README.md in this folder.
//   node scripts/source-discovery/probe.ts https://example.org/news @SomeYouTubeHandle ...
import { DEFAULT_UA } from "@aihot/backend/lib/http-fetch";

const DATE = /(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}, 20\d{2}|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* 20\d{2})/;
const FEED_PATHS = ["/feed/", "/rss.xml", "/feed.xml", "/rss", "/atom.xml", "/index.xml", "/blog/feed/", "/news/feed/", "/blog/rss.xml", "/news/rss.xml"];

async function get(url: string): Promise<{ status: number; type: string; url: string; text: string } | { error: string }> {
  try {
    const res = await fetch(url, { headers: { "user-agent": DEFAULT_UA, "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" }, signal: AbortSignal.timeout(25_000), redirect: "follow" });
    return { status: res.status, type: res.headers.get("content-type") ?? "", url: res.url, text: await res.text() };
  } catch (error) {
    return { error: error instanceof Error ? (error.cause instanceof Error ? error.cause.message : error.message) : String(error) };
  }
}

function feedSummary(text: string): string | null {
  if (!/<(rss|feed|rdf:RDF)\b/.test(text.slice(0, 3000))) return null;
  const items = [...text.matchAll(/<(item|entry)\b([\s\S]*?)<\/\1>/g)].map((m) => m[2]!);
  const date = items[0] && /<(pubDate|published|updated|dc:date)>([^<]+)</.exec(items[0])?.[2];
  const title = items[0] && /<title[^>]*>(?:<!\[CDATA\[)?([^<\]]+)/.exec(items[0])?.[1];
  return `${items.length} items; latest ${date?.trim() ?? "UNDATED"}${title ? ` — ${title.trim().slice(0, 60)}` : ""}`;
}

async function youtube(handle: string) {
  const page = await get(`https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`);
  if ("error" in page) return console.log(`  ✗ ${page.error}`);
  const id = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/.exec(page.text)?.[1];
  const name = /<meta property="og:title" content="([^"]+)"/.exec(page.text)?.[1];
  if (!id) return console.log(`  ✗ no channel (HTTP ${page.status})`);
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
  const feed = await get(feedUrl);
  const summary = "error" in feed ? feed.error : feedSummary(feed.text) ?? `HTTP ${feed.status}, not a feed`;
  console.log(`  channel ${name} (${id})\n  feed: ${summary}`);
  console.log(`  config: {"feedUrl":"${feedUrl}"}  — check it is the official channel and still posting`);
}

async function site(url: string) {
  const page = await get(url);
  if ("error" in page) return console.log(`  ✗ ${page.error}`);
  console.log(`  HTTP ${page.status} ${page.type.split(";")[0]} ${Math.round(page.text.length / 1024)} KB → ${page.url}`);
  if (page.status === 403 || page.status === 412 || page.status === 429) console.log("  ! the site refuses the crawler; try its YouTube channel or another official page");
  const direct = feedSummary(page.text);
  if (direct) return console.log(`  feed: ${direct}\n  config: {"feedUrl":"${page.url}"}`);

  const base = new URL(page.url);
  const declared = [...page.text.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/g)].map((m) => /href="([^"]+)"/.exec(m[0])?.[1]).filter((h): h is string => !!h);
  const tried = new Set<string>();
  for (const href of [...declared, ...FEED_PATHS]) {
    const feedUrl = new URL(href.replace(/&amp;/g, "&"), href.startsWith("/") ? base.origin : page.url).toString();
    if (tried.has(feedUrl)) continue;
    tried.add(feedUrl);
    const feed = await get(feedUrl);
    const summary = "error" in feed ? null : feedSummary(feed.text);
    if (summary) console.log(`  feed${declared.includes(href) ? " (declared)" : ""}: ${feedUrl} — ${summary}`);
  }

  const html = page.text.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, "");
  const dated: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const text = m[2]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 10) continue;
    const date = DATE.exec(html.slice(Math.max(0, m.index! - 200), m.index! + m[0].length + 300))?.[1];
    if (date) dated.push(`${date} | ${text.slice(0, 50)} | ${m[1]!.slice(0, 80)}`);
  }
  if (dated.length) console.log(`  dated links in the HTML (${dated.length}) — a web_list candidate:\n${dated.slice(0, 6).map((d) => `    ${d}`).join("\n")}`);
  const embedded = ["__NEXT_DATA__", "self.__next_f", "__NUXT__", "window._ROUTER_DATA", "__INITIAL_STATE__"].filter((k) => page.text.includes(k));
  if (embedded.length) console.log(`  embedded data: ${embedded.join(", ")} — a json_list (html_json_key / html_window_var) candidate`);
  if (!tried.size && !dated.length && !embedded.length) console.log("  nothing found; the list may load by script (check the browser's network requests)");
}

const args = process.argv.slice(2);
if (!args.length) console.log("usage: node scripts/source-discovery/probe.ts <url | @youtube-handle> ...");
for (const a of args) {
  console.log(`\n## ${a}`);
  await (a.startsWith("@") || /youtube\.com\/@/.test(a) ? youtube(a.replace(/^.*youtube\.com\//, "")) : site(a));
}
