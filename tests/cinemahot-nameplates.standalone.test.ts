// Regenerating a local CineHOT must work with the licensed font already in the repository.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import sharp from "sharp";

test("the nameplate generator renders every edition without downloading a font package", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "cinemahot-nameplates-"));
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL("../scripts/nameplates.ts", import.meta.url))], { cwd: dir, stdio: "pipe" });
    for (const name of ["daily", "weekly", "monthly", "archive"]) {
      const svg = readFileSync(path.join(dir, "site/brand/nameplates", name + ".svg"));
      assert.ok(svg.includes(Buffer.from('<path id="accent"')));
      const metadata = await sharp(svg).metadata();
      assert.ok(metadata.width && metadata.height, name);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
