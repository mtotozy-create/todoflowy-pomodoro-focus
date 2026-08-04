import { describe, expect, it, vi } from "vitest";

import { startPomodoroRuntime } from "../src/runtime.js";
import { saveSettings } from "../src/storage.js";
import { createTodoGateway } from "../src/todos.js";
import { MemoryStorage, MemoryTodoSdk } from "./helpers.js";

describe("runtime background process tests", () => {
  it("handles toolbar pomodoro-focus.start command, interval tick, completion toast, and cleanup cleanly", async () => {
    vi.useFakeTimers();

    const storage = new MemoryStorage();
    const sdk = new MemoryTodoSdk();
    const todos = createTodoGateway(sdk);

    // 设置超短的 1 分钟专注时间以方便测试倒计时与归零
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

    const cleanup = await startPomodoroRuntime({
      now: () => new Date("2026-08-04T12:00:00.000Z"),
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

    // 1. 触发工具栏按钮 command (在 idle 模式下启动 1 分钟专注)
    if (commandListener) {
      await (commandListener as (p: unknown) => Promise<void>)({
        command: "pomodoro-focus.start",
      });
    }

    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]).toContain("Started Pomodoro focus");

    // 2. 二次触发快捷键命令 (已在运行中状态)
    if (commandListener) {
      await (commandListener as (p: unknown) => Promise<void>)({
        command: "pomodoro-focus.start",
      });
    }
    expect(toasts[toasts.length - 1]).toContain("Pomodoro in progress");

    // 3. 推进 60 秒定时器步进，使 1 分钟专注倒计时归零
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(toasts.some((t) => t.includes("Pomodoro completed"))).toBe(true);

    // 运行清理
    cleanup();
    expect(commandListener).toBeNull();

    vi.useRealTimers();
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
