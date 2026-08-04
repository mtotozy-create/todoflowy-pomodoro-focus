import { describe, expect, it } from "vitest";

import {
  completeSessionStep,
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

  it("starts shortBreak and longBreak sessions", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const shortB = startSession(initial, DEFAULT_SETTINGS, "shortBreak");
    expect(shortB.remainingSeconds).toBe(5 * 60);

    const longB = startSession(initial, DEFAULT_SETTINGS, "longBreak");
    expect(longB.remainingSeconds).toBe(15 * 60);
  });

  it("handles pause and resume no-op branches", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const pausedNoop = pauseSession(initial);
    expect(pausedNoop.isRunning).toBe(false);

    const resumedNoop = resumeSession(initial);
    expect(resumedNoop.isRunning).toBe(false);
  });

  it("ticks countdown seconds correctly and ignores when not running or 0 remaining", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    expect(tickSession(initial, 1)).toEqual(initial);

    const started = startSession(initial, DEFAULT_SETTINGS, "work");
    const ticked = tickSession(started, 5);

    expect(ticked.remainingSeconds).toBe(25 * 60 - 5);
    expect(ticked.isRunning).toBe(true);

    const zeroRemaining = { ...started, remainingSeconds: 0 };
    expect(tickSession(zeroRemaining, 1)).toEqual(zeroRemaining);
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

  it("completes 4th work session and transitions to long break", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const zeroState = {
      ...initial,
      mode: "work" as const,
      completedPomodorosInCycle: 3,
      remainingSeconds: 0,
    };

    const { nextState } = completeSessionStep(zeroState, DEFAULT_SETTINGS);

    expect(nextState.mode).toBe("longBreak");
    expect(nextState.completedPomodorosInCycle).toBe(0);
  });

  it("completes break session and transitions to idle", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const zeroBreak = {
      ...initial,
      mode: "shortBreak" as const,
      remainingSeconds: 0,
    };

    const { nextState, completedWorkMode } = completeSessionStep(
      zeroBreak,
      DEFAULT_SETTINGS,
    );
    expect(completedWorkMode).toBe(false);
    expect(nextState.mode).toBe("idle");
  });

  it("resets and skips break", () => {
    const initial = createInitialSessionState(DEFAULT_SETTINGS);
    const breakState = { ...initial, mode: "shortBreak" as const };

    const skipped = skipBreak(breakState, DEFAULT_SETTINGS);
    expect(skipped.mode).toBe("idle");

    const nonBreakSkipped = skipBreak(initial, DEFAULT_SETTINGS);
    expect(nonBreakSkipped.mode).toBe("idle");

    const reseted = resetSession(DEFAULT_SETTINGS);
    expect(reseted.mode).toBe("idle");
  });
});
