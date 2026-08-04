import { describe, expect, it } from "vitest";

import {
  applyPreset,
  completeSessionStep,
  computeCurrentRemainingSeconds,
  createInitialSessionState,
  DEFAULT_SETTINGS,
  pauseSession,
  resumeSession,
  startSession,
} from "../src/core/timer.js";

describe("timer core logic tests", () => {
  it("initializes default session state correctly", () => {
    const state = createInitialSessionState();
    expect(state.mode).toBe("idle");
    expect(state.isRunning).toBe(false);
    expect(state.remainingSeconds).toBe(1500);
  });

  it("applies presets (sprint 15m, deep 50m) correctly", () => {
    const initial = createInitialSessionState();
    const { state: sprintState, updatedSettings: sprintSettings } = applyPreset(
      "sprint",
      initial,
      DEFAULT_SETTINGS,
    );
    expect(sprintState.remainingSeconds).toBe(900);
    expect(sprintSettings.workDurationMinutes).toBe(15);
    expect(sprintSettings.shortBreakDurationMinutes).toBe(3);

    const { state: deepState, updatedSettings: deepSettings } = applyPreset(
      "deep",
      initial,
      DEFAULT_SETTINGS,
    );
    expect(deepState.remainingSeconds).toBe(3000);
    expect(deepSettings.workDurationMinutes).toBe(50);
  });

  it("starts, pauses and resumes session using physical timestamps", () => {
    const initial = createInitialSessionState();
    const nowIso = "2026-08-04T12:00:00.000Z";
    const started = startSession(initial, DEFAULT_SETTINGS, "work", null, nowIso);
    expect(started.isRunning).toBe(true);
    expect(started.lastStartedAt).toBe(nowIso);

    // 假设时间流逝了 100 秒
    const nowMsAfter100s = new Date("2026-08-04T12:01:40.000Z").getTime();
    const computed = computeCurrentRemainingSeconds(started, nowMsAfter100s);
    expect(computed).toBe(1400);

    const paused = pauseSession(started, nowMsAfter100s);
    expect(paused.isRunning).toBe(false);
    expect(paused.remainingSeconds).toBe(1400);

    const resumed = resumeSession(paused, "2026-08-04T12:02:00.000Z");
    expect(resumed.isRunning).toBe(true);
  });

  it("completes work session with actual duration minutes for sprint mode", () => {
    const initial = createInitialSessionState();
    const { state: sprintState, updatedSettings } = applyPreset(
      "sprint",
      initial,
      DEFAULT_SETTINGS,
    );
    const startedSprint = startSession(
      sprintState,
      updatedSettings,
      "work",
      null,
      "2026-08-04T12:00:00.000Z",
    );

    const result = completeSessionStep(startedSprint, updatedSettings);
    expect(result.completedWorkMode).toBe(true);
    expect(result.completedMinutes).toBe(15); // 确保精确计算为 15 分钟而不是 25 分钟
  });
});
