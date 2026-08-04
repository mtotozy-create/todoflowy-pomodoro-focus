import { describe, expect, it } from "vitest";

import {
  buildTodoFocusNote,
  formatDuration,
  formatTime,
} from "../src/core/formatter.js";

describe("formatter core tests", () => {
  it("formatTime formatted seconds correctly", () => {
    expect(formatTime(1500)).toBe("25:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(-10)).toBe("00:00");
  });

  it("formatDuration formats minutes to readable string", () => {
    expect(formatDuration(25)).toBe("25m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("buildTodoFocusNote builds correct single line string", () => {
    const res = buildTodoFocusNote("[Focus]", 25, "2026-08-04T12:00:00.000Z");
    expect(res).toBe("[Focus] 🍅 Completed 1 pomodoro (25m) on 2026-08-04");
  });
});
