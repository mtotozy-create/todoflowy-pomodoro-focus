import { describe, expect, it } from "vitest";

import { createInitialStats, recordCompletedPomodoro } from "../src/core/stats.js";

describe("stats core calculation tests", () => {
  it("creates initial stats correctly", () => {
    const initial = createInitialStats("2026-08-04T12:00:00.000Z");
    expect(initial.version).toBe(1);
    expect(initial.totalCompletedPomodoros).toBe(0);
    expect(initial.totalFocusMinutes).toBe(0);
  });

  it("records completed pomodoro and updates daily/todo statistics", () => {
    const initial = createInitialStats("2026-08-04T12:00:00.000Z");
    const now = new Date("2026-08-04T14:00:00.000Z");

    const updated = recordCompletedPomodoro(initial, 25, now, {
      id: "todo-1",
      title: "Write code",
    });

    expect(updated.totalCompletedPomodoros).toBe(1);
    expect(updated.totalFocusMinutes).toBe(25);

    const daily = updated.dailyStats["2026-08-04"];
    expect(daily).toBeDefined();
    expect(daily.completedPomodoros).toBe(1);
    expect(daily.totalFocusMinutes).toBe(25);

    const todoStat = updated.todoStats["todo-1"];
    expect(todoStat).toBeDefined();
    expect(todoStat.completedPomodoros).toBe(1);
    expect(todoStat.totalFocusMinutes).toBe(25);
    expect(todoStat.todoTitle).toBe("Write code");
  });
});
