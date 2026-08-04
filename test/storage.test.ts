import { describe, expect, it } from "vitest";

import {
  loadSessionState,
  loadSettings,
  loadStats,
  saveSessionState,
  saveSettings,
  saveStats,
} from "../src/storage.js";
import { MemoryStorage } from "./helpers.js";

describe("storage gateway tests", () => {
  it("loads default settings when empty or corrupt", async () => {
    const storage = new MemoryStorage();
    const settings = await loadSettings(storage);
    expect(settings.workDurationMinutes).toBe(25);

    await storage.set("pomodoro_focus_settings_v1", "invalid_string");
    const corrupted = await loadSettings(storage);
    expect(corrupted.workDurationMinutes).toBe(25);
  });

  it("saves and loads custom settings", async () => {
    const storage = new MemoryStorage();
    const custom = {
      workDurationMinutes: 30,
      shortBreakDurationMinutes: 10,
      longBreakDurationMinutes: 20,
      longBreakInterval: 4,
      autoStartBreaks: true,
      notePrefix: "[FocusTime]",
    };

    await saveSettings(storage, custom);
    const loaded = await loadSettings(storage);
    expect(loaded).toEqual(custom);
  });

  it("handles fallback and error states for stats and sessionState", async () => {
    const storage = new MemoryStorage();

    // 写入未知 version
    await storage.set("pomodoro_focus_stats_v1", { version: 999 });
    const statsFallback = await loadStats(storage, "2026-08-04T12:00:00.000Z");
    expect(statsFallback.version).toBe(1);
    expect(statsFallback.totalCompletedPomodoros).toBe(0);

    // 写入畸形存储
    await storage.set("pomodoro_focus_session_v1", "corrupted");
    const sessionFallback = await loadSessionState(storage);
    expect(sessionFallback.mode).toBe("idle");

    const sessionState = {
      mode: "work" as const,
      isRunning: false,
      remainingSeconds: 1200,
      totalDurationSeconds: 1500,
      activeTodo: null,
      completedPomodorosInCycle: 1,
      lastStartedAt: null,
    };

    await saveSessionState(storage, sessionState);
    const loadedState = await loadSessionState(storage);
    expect(loadedState.mode).toBe("work");
    expect(loadedState.remainingSeconds).toBe(1200);

    const stats = {
      version: 1 as const,
      totalCompletedPomodoros: 5,
      totalFocusMinutes: 125,
      dailyStats: {},
      todoStats: {},
      lastUpdated: "2026-08-04T12:00:00.000Z",
    };

    await saveStats(storage, stats);
    const loadedStats = await loadStats(storage);
    expect(loadedStats.totalCompletedPomodoros).toBe(5);
  });
});
