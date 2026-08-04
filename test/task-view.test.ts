import { describe, expect, it, vi } from "vitest";

import { mountTaskView } from "../src/task-view.js";
import { createTodoGateway } from "../src/todos.js";
import { MemoryStorage, MemoryTodoSdk } from "./helpers.js";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("task-view view tests", () => {
  it("mounts desktop studio panel, handles presets, tabs, est controls, search input and controls cleanly", async () => {
    vi.useFakeTimers();

    const root = document.createElement("div");
    const storage = new MemoryStorage();
    const sdk = new MemoryTodoSdk();
    const todos = createTodoGateway(sdk);

    let eventListener: ((payload: unknown) => void) | null = null;
    let currentTime = new Date("2026-08-04T12:00:00.000Z");

    const unmount = await mountTaskView(root, {
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

    // 1. 测试 Tab 切换
    const tabs = root.querySelectorAll<HTMLDivElement>(".pomodoro-tab-item");
    expect(tabs.length).toBe(2);
    tabs[1].click(); // 点击 全部分页
    tabs[0].click(); // 点击 今日待办

    // 2. 点击 Deep Preset (50m) 按钮
    const presets = root.querySelectorAll<HTMLButtonElement>(
      ".pomodoro-preset-btn",
    );
    expect(presets.length).toBe(3);
    presets[1].click();

    await vi.advanceTimersByTimeAsync(50);
    await flushPromises();

    // 3. 点击任务卡片
    const todoCard = root.querySelector<HTMLDivElement>(
      ".pomodoro-todo-card",
    );
    todoCard?.click();

    // 4. 点击加减预估番茄按钮
    const estBtns = root.querySelectorAll<HTMLButtonElement>(
      ".pomodoro-est-btn",
    );
    if (estBtns.length >= 2) {
      estBtns[1].click(); // +
      estBtns[0].click(); // -
    }

    // 5. 点击 Start Focus 按钮
    const startBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-btn-giant-primary",
    );
    expect(startBtn).not.toBeNull();
    startBtn?.click();

    // 模拟时间跳动 5 秒
    currentTime = new Date(currentTime.getTime() + 5000);
    await vi.advanceTimersByTimeAsync(1050);
    await flushPromises();

    // 6. 在搜索框中输入筛选文本
    const searchInput = root.querySelector<HTMLInputElement>(
      ".pomodoro-search-input",
    );
    expect(searchInput).not.toBeNull();
    if (searchInput) {
      searchInput.value = "Write";
      searchInput.dispatchEvent(new Event("input"));
    }

    // 7. 触发 todos.changed 事件重新加载
    if (eventListener) {
      (eventListener as () => void)();
    }

    // 8. 点击 Reset 按钮
    const subBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-btn-giant-sub",
    );
    subBtn?.click();

    unmount();
    expect(root.children.length).toBe(0);

    vi.useRealTimers();
  });
});
