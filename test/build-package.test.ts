import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("build package integrity tests", () => {
  it("manifest and required entry files exist when built", () => {
    const root = resolve(import.meta.dirname, "..");
    const manifestPath = resolve(root, "manifest.json");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest.id).toBe("todoflowy/pomodoro-focus");
    expect(manifest.manifestVersion).toBe(2);
    expect(manifest.version).toBe("1.2.0");
    expect(manifest.runtime.entry).toBe("dist/runtime.js");
  });
});
