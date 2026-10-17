import "./setup.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { StructureSchema } from "@aihot/backend/editorial/analyze";
import { feedCategoryLabel, toPublicApiCategory } from "@aihot/contracts/taxonomy";

test("AI filmmaking analysis survives structure validation and public category mapping", () => {
  const item = StructureSchema.parse({scope:"single",category:"ai",tags:["教程/实践","AI影视创作"],subjects:[],fact:null});
  assert.equal(item.category,"ai","a supported AI category must not silently become null");
  assert.equal(toPublicApiCategory(item.category),"ai","the public filter and RSS must retain the category");
  assert.equal(feedCategoryLabel("ai" as never),"AI影视创作");
});

const { matchEntityIds, enforceIdentity } = await import("@aihot/backend/editorial/writing");
for (const [text, expected] of [
  ["James Wan discusses horror-film lighting", []],
  ["The runway was closed during filming", []],
  ["Runway show lighting uses LED fixtures", []],
  ["Runway AI introduces an image-to-video tool", ["runway"]],
  ["Wan2.2 video generation workflow", ["wan"]],
  ["Wan2.1 open video model", ["wan"]],
  ["wan2.2 video generation workflow", ["wan"]],
  ["通义万相发布视频生成工具", ["wan"]],
] as const) test(`AI identity distinguishes film vocabulary: ${text}`, () => {
  assert.deepEqual(matchEntityIds([text]), expected);
});

for (const original of ["Runway launches a new video generation model for filmmakers.", "Wan2.1 is an open video generation model.", "wan2.2 video generation workflow"]) test(`AI brand translation keeps supported identity: ${original}`, () => {
  const wan = /wan2/i.test(original);
  const copy = {titleZh: wan ? "通义万相视频生成工具" : "Runway发布视频生成模型", summaryZh: wan ? "通义万相提供视频生成工作流。" : "Runway发布面向影视创作者的视频生成模型。"};
  const result = enforceIdentity({title:original,text:original,sourceKind:"rss"},copy);
  assert.equal(result.titleZh,copy.titleZh);
  assert.equal(result.summaryZh,copy.summaryZh);
});
