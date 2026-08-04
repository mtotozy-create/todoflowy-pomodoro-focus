import { describe, expect, it } from "vitest";

import { mountSettingsView } from "../src/settings.js";
import { loadSettings } from "../src/storage.js";
import { MemoryStorage } from "./helpers.js";

describe("settings view tests", () => {
  it("mounts settings view and saves modified values", async () => {
    const root = document.createElement("div");
    const storage = new MemoryStorage();
    const toasts: string[] = [];

    const unmount = await mountSettingsView(root, {
      getLocale: async () => "en-US",
      getTheme: async () => "light",
      storage,
      toast: async (msg) => {
        toasts.push(msg);
      },
    });

    expect(root.querySelector(".pomodoro-settings")).not.toBeNull();

    const inputs = root.querySelectorAll<HTMLInputElement>(
      ".pomodoro-settings__input",
    );
    expect(inputs.length).toBe(4);

    // 改变 Focus duration 输入框值为 30
    inputs[0].value = "30";

    const saveBtn = root.querySelector<HTMLButtonElement>(
      ".pomodoro-settings__btn",
    );
    saveBtn?.click();

    // 稍微等待微任务完成
    await new Promise((resolve) => setTimeout(resolve, 50));

    const saved = await loadSettings(storage);
    expect(saved.workDurationMinutes).toBe(30);
    expect(toasts).toContain("Pomodoro settings saved!");

    unmount();
    expect(root.children.length).toBe(0);
  });
});
