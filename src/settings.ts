import { defineView, plugin } from "@todoflowy/plugin-sdk";

import type { PomodoroSettings } from "./core/types.js";
import { button, element } from "./dom.js";
import { loadSettings, saveSettings, type StorageGateway } from "./storage.js";

export interface SettingsDependencies {
  readonly getLocale: () => Promise<string>;
  readonly getTheme: () => Promise<"dark" | "light">;
  readonly storage: StorageGateway;
  readonly toast: (message: string) => Promise<void>;
}

export async function mountSettingsView(
  root: HTMLElement,
  dependencies: SettingsDependencies,
): Promise<() => void> {
  let active = true;
  let currentSettings: PomodoroSettings = await loadSettings(
    dependencies.storage,
  );

  if (!active) return () => {};

  const styleEl = element("style", {
    text: `
    .pomodoro-settings {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      max-width: 480px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--theme-text-color, #1f2937);
    }
    .pomodoro-settings__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pomodoro-settings__label {
      font-size: 14px;
      font-weight: 600;
    }
    .pomodoro-settings__input {
      padding: 8px 12px;
      font-size: 14px;
      border-radius: 6px;
      border: 1px solid var(--theme-border-color, #d1d5db);
      background: var(--theme-input-bg, #ffffff);
      color: var(--theme-text-color, #111827);
    }
    .pomodoro-settings__btn {
      align-self: flex-start;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      background-color: var(--theme-btn-primary-bg, #ef4444);
      color: #ffffff;
      cursor: pointer;
    }
    .pomodoro-settings__btn:hover {
      opacity: 0.9;
    }
    `,
  });

  const container = element("div", { className: "pomodoro-settings" });
  const title = element("h3", { text: "Pomodoro Focus Settings" });

  // 1. 专注时长
  const fieldWork = element("div", { className: "pomodoro-settings__field" });
  const labelWork = element("label", {
    className: "pomodoro-settings__label",
    text: "Focus Duration (Minutes)",
  });
  const inputWork = element("input", {
    className: "pomodoro-settings__input",
  }) as HTMLInputElement;
  inputWork.type = "number";
  inputWork.min = "1";
  inputWork.max = "120";
  inputWork.value = String(currentSettings.workDurationMinutes);
  fieldWork.appendChild(labelWork);
  fieldWork.appendChild(inputWork);

  // 2. 短休时长
  const fieldShort = element("div", { className: "pomodoro-settings__field" });
  const labelShort = element("label", {
    className: "pomodoro-settings__label",
    text: "Short Break Duration (Minutes)",
  });
  const inputShort = element("input", {
    className: "pomodoro-settings__input",
  }) as HTMLInputElement;
  inputShort.type = "number";
  inputShort.min = "1";
  inputShort.max = "60";
  inputShort.value = String(currentSettings.shortBreakDurationMinutes);
  fieldShort.appendChild(labelShort);
  fieldShort.appendChild(inputShort);

  // 3. 长休时长
  const fieldLong = element("div", { className: "pomodoro-settings__field" });
  const labelLong = element("label", {
    className: "pomodoro-settings__label",
    text: "Long Break Duration (Minutes)",
  });
  const inputLong = element("input", {
    className: "pomodoro-settings__input",
  }) as HTMLInputElement;
  inputLong.type = "number";
  inputLong.min = "1";
  inputLong.max = "60";
  inputLong.value = String(currentSettings.longBreakDurationMinutes);
  fieldLong.appendChild(labelLong);
  fieldLong.appendChild(inputLong);

  // 4. 备注前缀
  const fieldPrefix = element("div", { className: "pomodoro-settings__field" });
  const labelPrefix = element("label", {
    className: "pomodoro-settings__label",
    text: "Todo Note Prefix",
  });
  const inputPrefix = element("input", {
    className: "pomodoro-settings__input",
  }) as HTMLInputElement;
  inputPrefix.type = "text";
  inputPrefix.value = currentSettings.notePrefix;
  fieldPrefix.appendChild(labelPrefix);
  fieldPrefix.appendChild(inputPrefix);

  // 保存按钮
  const saveBtn = button(
    "Save Settings",
    () => void handleSave(),
    "pomodoro-settings__btn",
  );

  const handleSave = async () => {
    const workDurationMinutes = Math.max(
      1,
      parseInt(inputWork.value, 10) || 25,
    );
    const shortBreakDurationMinutes = Math.max(
      1,
      parseInt(inputShort.value, 10) || 5,
    );
    const longBreakDurationMinutes = Math.max(
      1,
      parseInt(inputLong.value, 10) || 15,
    );
    const notePrefix = inputPrefix.value.trim() || "[Focus]";

    const nextSettings: PomodoroSettings = {
      ...currentSettings,
      workDurationMinutes,
      shortBreakDurationMinutes,
      longBreakDurationMinutes,
      notePrefix,
    };

    await saveSettings(dependencies.storage, nextSettings);
    currentSettings = nextSettings;
    await dependencies.toast("Pomodoro settings saved!");
  };

  container.appendChild(styleEl);
  container.appendChild(title);
  container.appendChild(fieldWork);
  container.appendChild(fieldShort);
  container.appendChild(fieldLong);
  container.appendChild(fieldPrefix);
  container.appendChild(saveBtn);

  root.replaceChildren(container);

  return () => {
    if (!active) return;
    active = false;
    root.replaceChildren();
  };
}

/* v8 ignore start -- production SDK lifecycle wiring */
export const { mount } = defineView({
  mount: (root) =>
    mountSettingsView(root, {
      getLocale: () => plugin.context.getLocale(),
      getTheme: () => plugin.theme.get(),
      storage: plugin.storage,
      toast: (message) => plugin.ui.toast({ message, variant: "info" }),
    }),
});
/* v8 ignore stop */
