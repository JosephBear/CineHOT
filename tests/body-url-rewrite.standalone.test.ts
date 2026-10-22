import "./setup.ts";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";
import { config } from "@aihot/backend/config";
import { extractFromUrl } from "@aihot/backend/content/extract";
const { MockAgent, getGlobalDispatcher, setGlobalDispatcher } = createRequire(new URL("../packages/backend/package.json", import.meta.url))("undici");
const previousDispatcher = getGlobalDispatcher();
const mock = new MockAgent(); mock.disableNetConnect(); setGlobalDispatcher(mock);
const previousPrivate = config.allowPrivateNetworkFetch, previousProxy = config.egressProxyUrl;
config.allowPrivateNetworkFetch = true; config.egressProxyUrl = null;
after(async () => { config.allowPrivateNetworkFetch = previousPrivate; config.egressProxyUrl = previousProxy; setGlobalDispatcher(previousDispatcher); await mock.close(); });
const canonical = "https://publisher.example/media/release/20260415-01";
const rewrite = { from: "https://publisher.example/media/release/", to: "https://publisher.example/media/partial/release/" };
const body = "A cinematographer discusses lighting, exposure and camera workflow in this official product announcement. ".repeat(8);
const html = (text: string) => `<html><body><article><p>${text}</p><a href="../reference">Reference</a></article></body></html>`;
mock.get("https://publisher.example").intercept({path:"/media/release/20260415-01"}).reply(200,html("Copyright and navigation. ".repeat(20)),{headers:{"content-type":"text/html"}}).persist();
mock.get("https://publisher.example").intercept({path:"/media/partial/release/20260415-01"}).reply(200,html(body),{headers:{"content-type":"text/html"}}).persist();
test("body extraction reads the same-origin fragment while relative links retain the canonical article base", async () => {
  const got = await extractFromUrl(canonical,"test-rewrite",{ bodyUrlPrefixRewrite: rewrite });
  assert.ok(got);
  assert.ok(got.text.includes(body.trim()));
  assert.ok(got.html.includes('href="https://publisher.example/media/reference"'));
});
test("a body rewrite cannot move the request to another origin", async () => {
  await assert.rejects(extractFromUrl(canonical,"test-rewrite",{ bodyUrlPrefixRewrite: {...rewrite,to:"https://other.example/media/"} }), /same origin/i);
});
