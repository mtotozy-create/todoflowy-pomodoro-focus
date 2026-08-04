import { describe, expect, it, vi } from "vitest";

import { mountSidebarPanel } from "../src/sidebar-panel.js";
import { createTodoGateway } from "../src/todos.js";
import { MemoryStorage, MemoryTodoSdk } from "./helpers.js";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("sidebar-panel view tests", () => {
  it("mounts desktop studio panel, handles presets, search input and controls cleanly", async () => {
    vi.useFakeTimers();

    const root = document.createElement("div");
    const storage = new MemoryStorage();
    const sdk = new MemoryTodoSdk();
    const todos = createTodoGateway(sdk);

    let eventListener: ((payload: unknown) => void) | null = null;
    let currentTime = new Date("2026-08-04T12:00:00.000Z");

    const unmount = await mountSidebarPanel(root, {
      getLocale: async () => "en-US",
      getTheme: async () => "light",
      now: () => currentTime,
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

    expect(root.querySelector(".pomodoro-studio-app")).not.toBeNull();
    expect(
      root.querySelector(".pomodoro-timer-display")?.textContent,
    ).toBe("25:00");

    // 1. 点击 Deep Preset (50m) 按钮
    const presets = root.querySelectorAll<HTMLButtonElement>(
      ".pomodoro-preset-btn",
    );
    expect(presets.length).toBe(3);
    presets[1].click(); // Deep 50m

    await vi.advanceTimersByTimeAsync(50);
    await flushPromises();
    expect(
      root.querySelector(".pomodoro-timer-display")?.textContent,
    ).toBe("50:00");

    // 2. 点击 Start Focus 按钮
    const startBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-btn-giant-primary",
    );
    expect(startBtn).not.toBeNull();
    startBtn?.click();

    // 模拟时间跳动 5 秒
    currentTime = new Date(currentTime.getTime() + 5000);
    await vi.advanceTimersByTimeAsync(1050);
    await flushPromises();

    // 3. 在搜索框中输入筛选文本
    const searchInput = root.querySelector<HTMLInputElement>(
      ".pomodoro-search-input",
    );
    expect(searchInput).not.toBeNull();
    if (searchInput) {
      searchInput.value = "Write";
      searchInput.dispatchEvent(new Event("input"));
    }

    // 4. 点击任务卡片
    const todoCard = root.querySelector<HTMLDivElement>(
      ".pomodoro-todo-card",
    );
    todoCard?.click();

    // 5. 触发 todos.changed 事件重新加载
    if (eventListener) {
      (eventListener as () => void)();
    }

    // 6. 点击 Reset 按钮
    const subBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-btn-giant-sub",
    );
    subBtn?.click();

    unmount();
    expect(root.children.length).toBe(0);

    vi.useRealTimers();
  });
});
