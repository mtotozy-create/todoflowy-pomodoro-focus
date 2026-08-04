import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { parse as parseModule } from "acorn";
import { build } from "vite";

const pluginRoot = resolve(import.meta.dirname, "..");
const output = resolve(pluginRoot, "dist");
const entries = ["runtime", "task-view", "settings"];

await rm(output, { force: true, recursive: true });

for (const entry of entries) {
  await build({
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(pluginRoot, `src/${entry}.ts`),
        fileName: () => `${entry}.js`,
        formats: ["es"],
      },
      minify: false,
      outDir: output,
      rolldownOptions: { output: { codeSplitting: false } },
      sourcemap: false,
      target: "es2022",
    },
    configFile: false,
    logLevel: "silent",
  });
}

function containsModuleDependency(value) {
  if (Array.isArray(value)) return value.some(containsModuleDependency);
  if (value === null || typeof value !== "object") return false;
  if (
    value.type === "ImportDeclaration" ||
    value.type === "ImportExpression" ||
    value.type === "ExportAllDeclaration" ||
    (value.type === "ExportNamedDeclaration" &&
      value.source !== null &&
      value.source !== undefined)
  ) {
    return true;
  }
  return Object.values(value).some(containsModuleDependency);
}

for (const entry of entries) {
  const path = resolve(output, `${entry}.js`);
  const module = parseModule(await readFile(path, "utf8"), {
    allowHashBang: true,
    ecmaVersion: "latest",
    sourceType: "module",
  });
  if (containsModuleDependency(module)) {
    throw new Error(`Executable entry is not self-contained: dist/${entry}.js`);
  }
}
