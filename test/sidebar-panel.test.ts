import { describe, expect, it, vi } from "vitest";

import { mountSidebarPanel } from "../src/sidebar-panel.js";
import { saveSessionState } from "../src/storage.js";
import { createTodoGateway } from "../src/todos.js";
import { MemoryStorage, MemoryTodoSdk } from "./helpers.js";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("sidebar-panel view tests", () => {
  it("mounts sidebar panel and renders timer and controls cleanly", async () => {
    vi.useFakeTimers();

    const root = document.createElement("div");
    const storage = new MemoryStorage();
    const sdk = new MemoryTodoSdk();
    const todos = createTodoGateway(sdk);

    let eventListener: ((payload: unknown) => void) | null = null;

    const unmount = await mountSidebarPanel(root, {
      getLocale: async () => "en-US",
      getTheme: async () => "light",
      now: () => new Date("2026-08-04T12:00:00.000Z"),
      on: (type, listener) => {
        eventListener = listener;
        return () => {
          eventListener = null;
        };
      },
      storage,
      todos,
      toast: async () => {},
    });

    expect(root.querySelector(".pomodoro-panel")).not.toBeNull();
    expect(root.querySelector(".pomodoro-panel__timer")?.textContent).toBe(
      "25:00",
    );

    // 1. 点击 Start Focus 按钮
    const startBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-panel__btn--primary",
    );
    expect(startBtn).not.toBeNull();
    startBtn?.click();

    // 2. 选择 Todo
    const select = root.querySelector<HTMLSelectElement>(
      ".pomodoro-panel__todo-select",
    );
    expect(select).not.toBeNull();
    if (select) {
      select.value = "todo-1";
      select.dispatchEvent(new Event("change"));

      // 切换为空
      select.value = "";
      select.dispatchEvent(new Event("change"));
    }

    // 3. 触发 todos.changed 事件重新加载
    if (eventListener) {
      (eventListener as () => void)();
    }

    // 推进 1 秒轮询定时器更新界面
    await vi.advanceTimersByTimeAsync(1050);
    await flushPromises();

    // 4. 点击 Pause 按钮
    const pauseBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-panel__btn--secondary",
    );
    pauseBtn?.click();

    await vi.advanceTimersByTimeAsync(1050);
    await flushPromises();

    // 5. 点击 Resume 按钮
    const resumeBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-panel__btn--primary",
    );
    resumeBtn?.click();

    await vi.advanceTimersByTimeAsync(1050);
    await flushPromises();

    // 6. 点击 Reset 按钮
    const buttons = root.querySelectorAll<HTMLButtonElement>(
      ".pomodoro-panel__btn",
    );
    buttons[1]?.click(); // Reset btn

    // 7. 测试在 shortBreak 和 longBreak 模式下的 UI 渲染
    const currentSession = await storage.get("pomodoro_focus_session_v1");
    if (currentSession && typeof currentSession === "object") {
      await saveSessionState(storage, {
        ...(currentSession as never),
        mode: "longBreak",
      });
    }

    await vi.advanceTimersByTimeAsync(1050);
    await flushPromises();

    const skipBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-panel__btn--secondary",
    );
    skipBtn?.click();

    // 卸载
    unmount();
    expect(root.children.length).toBe(0);

    vi.useRealTimers();
  });

  it("handles fetch pending todos error gracefully during mount", async () => {
    const root = document.createElement("div");
    const storage = new MemoryStorage();
    const failingTodos = {
      async listPendingTodos() {
        throw new Error("Failed");
      },
      async appendFocusRecord() {
        throw new Error("Failed");
      },
    };

    const unmount = await mountSidebarPanel(root, {
      getLocale: async () => "en-US",
      getTheme: async () => "light",
      now: () => new Date(),
      on: () => () => {},
      storage,
      todos: failingTodos as never,
      toast: async () => {},
    });

    expect(root.querySelector(".pomodoro-panel")).not.toBeNull();
    unmount();
  });
});
