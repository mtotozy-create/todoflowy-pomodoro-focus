import { describe, expect, it } from "vitest";

import { startPomodoroRuntime } from "../src/runtime.js";
import { saveSessionState, saveSettings } from "../src/storage.js";
import { createTodoGateway } from "../src/todos.js";
import { MemoryStorage, MemoryTodoSdk } from "./helpers.js";

describe("runtime background process tests", () => {
  it("handles toolbar pomodoro-focus.start command, interval tick, completion toast, and cleanup cleanly", async () => {
    const storage = new MemoryStorage();
    const sdk = new MemoryTodoSdk();
    const todos = createTodoGateway(sdk);

    await saveSettings(storage, {
      workDurationMinutes: 1,
      shortBreakDurationMinutes: 1,
      longBreakDurationMinutes: 1,
      longBreakInterval: 4,
      autoStartBreaks: false,
      notePrefix: "[Focus]",
    });

    let commandListener: ((payload: unknown) => void) | null = null;
    const toasts: string[] = [];

    // 手动步进的当前时间
    let currentTime = new Date("2026-08-04T12:00:00.000Z");

    const cleanup = await startPomodoroRuntime({
      now: () => currentTime,
      onCommand: (listener) => {
        commandListener = listener;
        return () => {
          commandListener = null;
        };
      },
      storage,
      todos,
      toast: async (msg) => {
        toasts.push(msg);
      },
    });

    expect(commandListener).not.toBeNull();

    // 1. 触发工具栏按钮 command
    if (commandListener) {
      await (commandListener as (p: unknown) => Promise<void>)({
        command: "pomodoro-focus.start",
      });
    }

    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]).toContain("Started Pomodoro focus");

    // 2. 将 sessionState 中的 remainingSeconds 模拟直接推至已过状态
    const activeSession = await storage.get("pomodoro_focus_session_v1");
    if (activeSession && typeof activeSession === "object") {
      await saveSessionState(storage, {
        ...(activeSession as never),
        remainingSeconds: 0,
        isRunning: true,
      });
    }

    // 稍等 1.1 秒让真实的 setInterval(processTick, 1000) 运行完成
    await new Promise((r) => setTimeout(r, 1100));

    expect(toasts.some((t) => t.includes("Pomodoro completed"))).toBe(true);

    cleanup();
    expect(commandListener).toBeNull();
  });

  it("handles unknown command payloads gracefully", async () => {
    const storage = new MemoryStorage();
    const sdk = new MemoryTodoSdk();
    const todos = createTodoGateway(sdk);

    let commandListener: ((payload: unknown) => void) | null = null;
    const cleanup = await startPomodoroRuntime({
      now: () => new Date(),
      onCommand: (listener) => {
        commandListener = listener;
        return () => {
          commandListener = null;
        };
      },
      storage,
      todos,
      toast: async () => {},
    });

    if (commandListener) {
      await (commandListener as (p: unknown) => Promise<void>)({
        command: "unknown.command",
      });
      await (commandListener as (p: unknown) => Promise<void>)(null);
    }

    cleanup();
  });
});
