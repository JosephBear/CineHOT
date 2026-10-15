// Names that are also ordinary words/places must not suppress grounded cinematography summaries;
// known camera brands and unambiguous models still guard against invented attribution.
import assert from "node:assert/strict";
import { test } from "node:test";
import { enforceIdentity, matchEntityIds } from "@aihot/backend/editorial/writing";

test("a translated red-light technique retains its summary without inventing a RED camera", () => {
  const copy = { titleZh: "红光布景方法", summaryZh: "使用 red light 营造夜景。" };
  const result = enforceIdentity({ title: "红光布景方法", text: "通过红光形成夜景氛围。", sourceKind: "rss" }, copy);
  assert.equal(result.identityGuard.outcome, "pass");
  assert.equal(result.summaryZh, copy.summaryZh);
  assert.deepEqual(matchEntityIds(["red light", "red filter", "red shadows"]), []);
});

test("a Venice festival story can be translated without being attributed to Sony", () => {
  const result = enforceIdentity({ title: "电影节摄影奖结果", text: "公布了威尼斯电影节摄影奖结果。", sourceKind: "rss" }, { titleZh: "电影节摄影奖结果", summaryZh: "Venice Film Festival 公布摄影奖结果。" });
  assert.equal(result.identityGuard.outcome, "pass");
  assert.deepEqual(matchEntityIds(["Venice Film Festival", "VENICE FILM FESTIVAL", "a street in Venice"]), []);
});

test("real RED brands and model names still identify their maker", () => {
  for (const text of ["RED Digital Cinema", "RED KOMODO", "KOMODO-X", "V-RAPTOR", "red digital cinema"]) assert.ok(matchEntityIds([text]).includes("red"), text);
  const result = enforceIdentity({ title: "布光经验", text: "分享布光方法。", sourceKind: "rss" }, { titleZh: "RED 发布摄影机", summaryZh: "RED 推出新摄影机。" });
  assert.equal(result.identityGuard.outcome, "fallback");
  assert.equal(result.summaryZh, "");
});

test("Sony and an unambiguous VENICE camera reference still identify the maker", () => {
  for (const text of ["Sony VENICE", "VENICE 2", "Venice 2", "venice camera", "VENICE camera", "VENICE 摄影机", "BURANO", "FX6"]) assert.ok(matchEntityIds([text]).includes("sony"), text);
  const result = enforceIdentity({ title: "Sony releases firmware", text: "Sony updates its VENICE camera.", sourceKind: "rss" }, { titleZh: "索尼更新 VENICE 固件", summaryZh: "Sony 更新 VENICE 摄影机固件。" });
  assert.equal(result.identityGuard.outcome, "pass");
});
