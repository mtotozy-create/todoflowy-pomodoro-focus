import { describe, expect, it } from "vitest";

import {
  applyPreset,
  completeSessionStep,
  computeCurrentRemainingSeconds,
  createInitialSessionState,
  DEFAULT_SETTINGS,
  pauseSession,
  resetSession,
  resumeSession,
  skipBreak,
  startSession,
  tickSession,
} from "../src/core/timer.js";

describe("timer core state machine tests", () => {
  it("initializes with default settings", () => {
    const state = createInitialSessionState(DEFAULT_SETTINGS);
    expect(state.mode).toBe("idle");
    expect(state.isRunning).toBe(false);
    expect(state.remainingSeconds).toBe(25 * 60);
  });

  it("applies classic, deep and sprint presets", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);

    const deep = applyPreset("deep", initial, DEFAULT_SETTINGS);
    expect(deep.updatedSettings.workDurationMinutes).toBe(50);
    expect(deep.state.remainingSeconds).toBe(50 * 60);

    const sprint = applyPreset("sprint", initial, DEFAULT_SETTINGS);
    expect(sprint.updatedSettings.workDurationMinutes).toBe(15);
    expect(sprint.state.remainingSeconds).toBe(15 * 60);
  });

  it("computes physical remaining seconds based on timestamps", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const startMs = new Date("2026-08-04T12:00:00.000Z").getTime();
    const started = startSession(
      initial,
      DEFAULT_SETTINGS,
      "work",
      null,
      new Date(startMs).toISOString(),
    );

    // 假设时间流逝了 10 秒
    const nowMs = startMs + 10 * 1000;
    const computed = computeCurrentRemainingSeconds(started, nowMs);
    expect(computed).toBe(25 * 60 - 10);
  });

  it("handles pause and resume no-op branches", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const pausedNoop = pauseSession(initial);
    expect(pausedNoop.isRunning).toBe(false);

    const resumedNoop = resumeSession(initial);
    expect(resumedNoop.isRunning).toBe(false);
  });

  it("ticks countdown seconds correctly based on timestamp", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    expect(tickSession(initial)).toEqual(initial);

    const startMs = new Date("2026-08-04T12:00:00.000Z").getTime();
    const started = startSession(
      initial,
      DEFAULT_SETTINGS,
      "work",
      null,
      new Date(startMs).toISOString(),
    );

    const ticked = tickSession(started, startMs + 5000);
    expect(ticked.remainingSeconds).toBe(25 * 60 - 5);
  });

  it("completes work session and transitions to short break", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const started = startSession(initial, DEFAULT_SETTINGS, "work");
    const zeroState = { ...started, remainingSeconds: 0 };

    const { nextState, completedWorkMode, completedMinutes } =
      completeSessionStep(zeroState, DEFAULT_SETTINGS);

    expect(completedWorkMode).toBe(true);
    expect(completedMinutes).toBe(25);
    expect(nextState.mode).toBe("shortBreak");
    expect(nextState.completedPomodorosInCycle).toBe(1);
  });

  it("resets and skips break", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const breakState = { ...initial, mode: "shortBreak" as const };

    const skipped = skipBreak(breakState, DEFAULT_SETTINGS);
    expect(skipped.mode).toBe("idle");

    const reseted = resetSession(DEFAULT_SETTINGS);
    expect(reseted.mode).toBe("idle");
  });
});
