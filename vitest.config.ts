import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      thresholds: {
        branches: 68,
        functions: 75,
        lines: 85,
        statements: 84,
      },
    },
  },
});
