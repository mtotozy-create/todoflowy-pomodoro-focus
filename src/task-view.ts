import { defineView, plugin } from "@todoflowy/plugin-sdk";

import { formatDuration, formatTime } from "./core/formatter.js";
import {
  completeSessionStep,
  pauseSession,
  resetSession,
  resumeSession,
  skipBreak,
  startSession,
  tickSession,
} from "./core/timer.js";
import type {
  ActiveTodoInfo,
  PomodoroSessionState,
  PomodoroSettings,
  PomodoroStatsRecord,
} from "./core/types.js";
import { button, element } from "./dom.js";
import { TASK_VIEW_CSS } from "./task-view.css.js";
import {
  loadSessionState,
  loadSettings,
  loadStats,
  saveSessionState,
  saveStats,
  type StorageGateway,
} from "./storage.js";
import { createTodoGateway, type TodoGateway, type TodoItem } from "./todos.js";

type EventType = "locale.changed" | "theme.changed" | "todos.changed";

export interface TaskViewDependencies {
  readonly getLocale: () => Promise<string>;
  readonly getTheme: () => Promise<"dark" | "light">;
  readonly now: () => Date;
  readonly on: (
    type: EventType,
    listener: (payload: unknown) => void,
  ) => () => void;
  readonly storage: StorageGateway;
  readonly todos: TodoGateway;
  readonly toast: (message: string) => Promise<void>;
}

export async function mountTaskView(
  root: HTMLElement,
  dependencies: TaskViewDependencies,
): Promise<() => void> {
  let active = true;
  let timerId: ReturnType<typeof setInterval> | null = null;

  let settings: PomodoroSettings = await loadSettings(dependencies.storage);
  let sessionState: PomodoroSessionState = await loadSessionState(
    dependencies.storage,
    settings,
  );
  let statsRecord: PomodoroStatsRecord = await loadStats(dependencies.storage);
  let pendingTodos: readonly TodoItem[] = [];

  try {
    pendingTodos = await dependencies.todos.listPendingTodos();
  } catch {
    pendingTodos = [];
  }

  if (!active) return () => {};

  // 创建主工作区 DOM 元素
  const styleEl = element("style", { text: TASK_VIEW_CSS });
  const container = element("section", { className: "pomodoro-view" });
  const layout = element("div", { className: "pomodoro-view__layout" });

  const card = element("div", { className: "pomodoro-view__card" });
  const modeBadge = element("span", {
    className: "pomodoro-view__mode-badge",
    text: "FOCUS",
  });
  const timerDisplay = element("div", {
    className: "pomodoro-view__timer",
    text: "25:00",
  });

  // Todo 下拉框
  const todoSelect = element("select", {
    className: "pomodoro-view__todo-select",
  });
  const controlsContainer = element("div", {
    className: "pomodoro-view__controls",
  });

  card.appendChild(modeBadge);
  card.appendChild(timerDisplay);
  card.appendChild(todoSelect);
  card.appendChild(controlsContainer);

  // 统计面板卡片
  const statsContainer = element("div", {
    className: "pomodoro-view__stats",
  });
  const statBoxTodayCount = element("div", {
    className: "pomodoro-view__stat-box",
  });
  const numTodayCount = element("div", {
    className: "pomodoro-view__stat-num",
    text: "0",
  });
  const labelTodayCount = element("div", {
    className: "pomodoro-view__stat-label",
    text: "Today Completed",
  });
  statBoxTodayCount.appendChild(numTodayCount);
  statBoxTodayCount.appendChild(labelTodayCount);

  const statBoxTodayTime = element("div", {
    className: "pomodoro-view__stat-box",
  });
  const numTodayTime = element("div", {
    className: "pomodoro-view__stat-num",
    text: "0m",
  });
  const labelTodayTime = element("div", {
    className: "pomodoro-view__stat-label",
    text: "Today Focus",
  });
  statBoxTodayTime.appendChild(numTodayTime);
  statBoxTodayTime.appendChild(labelTodayTime);

  statsContainer.appendChild(statBoxTodayCount);
  statsContainer.appendChild(statBoxTodayTime);

  layout.appendChild(card);
  layout.appendChild(statsContainer);
  container.appendChild(styleEl);
  container.appendChild(layout);

  root.replaceChildren(container);

  const updateTodoSelectOptions = () => {
    todoSelect.replaceChildren();
    const defaultOpt = element("option", {
      text: "-- Select a Todo (Optional) --",
    });
    defaultOpt.value = "";
    todoSelect.appendChild(defaultOpt);

    for (const item of pendingTodos) {
      const opt = element("option", { text: item.title });
      opt.value = item.id;
      if (sessionState.activeTodo?.id === item.id) {
        opt.selected = true;
      }
      todoSelect.appendChild(opt);
    }
  };

  todoSelect.addEventListener("change", () => {
    const selectedId = todoSelect.value;
    const found = pendingTodos.find((t) => t.id === selectedId);
    let activeTodo: ActiveTodoInfo | null = null;
    if (found) {
      activeTodo = {
        id: found.id,
        title: found.title,
        revision: found.revision,
      };
    }
    sessionState = {
      ...sessionState,
      activeTodo,
    };
    void saveSessionState(dependencies.storage, sessionState);
  });

  const renderUI = () => {
    if (!active) return;

    // 格式化模式标题
    let badgeText = "IDLE";
    let badgeBg = "#e5e7eb";
    let badgeFg = "#374151";

    if (sessionState.mode === "work") {
      badgeText = "FOCUS";
      badgeBg = "#fee2e2";
      badgeFg = "#dc2626";
    } else if (sessionState.mode === "shortBreak") {
      badgeText = "SHORT BREAK";
      badgeBg = "#d1fae5";
      badgeFg = "#059669";
    } else if (sessionState.mode === "longBreak") {
      badgeText = "LONG BREAK";
      badgeBg = "#dbeafe";
      badgeFg = "#2563eb";
    }

    modeBadge.textContent = badgeText;
    modeBadge.style.backgroundColor = badgeBg;
    modeBadge.style.color = badgeFg;

    // 定时器倒计时呈现
    timerDisplay.textContent = formatTime(sessionState.remainingSeconds);

    // 渲染控制按钮
    controlsContainer.replaceChildren();

    if (sessionState.mode === "idle") {
      const startBtn = button(
        "🍅 Start Focus",
        () => void handleStart(),
        "pomodoro-view__btn pomodoro-view__btn--primary",
      );
      controlsContainer.appendChild(startBtn);
    } else if (sessionState.mode === "work") {
      if (sessionState.isRunning) {
        const pauseBtn = button(
          "⏸️ Pause",
          () => void handlePause(),
          "pomodoro-view__btn pomodoro-view__btn--secondary",
        );
        const resetBtn = button(
          "🔄 Reset",
          () => void handleReset(),
          "pomodoro-view__btn pomodoro-view__btn--secondary",
        );
        controlsContainer.appendChild(pauseBtn);
        controlsContainer.appendChild(resetBtn);
      } else {
        const resumeBtn = button(
          "▶️ Resume",
          () => void handleResume(),
          "pomodoro-view__btn pomodoro-view__btn--primary",
        );
        const resetBtn = button(
          "🔄 Reset",
          () => void handleReset(),
          "pomodoro-view__btn pomodoro-view__btn--secondary",
        );
        controlsContainer.appendChild(resumeBtn);
        controlsContainer.appendChild(resetBtn);
      }
    } else {
      // 休息阶段
      const skipBtn = button(
        "⏭️ Skip Break",
        () => void handleSkipBreak(),
        "pomodoro-view__btn pomodoro-view__btn--secondary",
      );
      controlsContainer.appendChild(skipBtn);
    }

    // 更新统计呈现
    const todayStr = dependencies.now().toISOString().slice(0, 10);
    const todayStat = statsRecord.dailyStats[todayStr];
    numTodayCount.textContent = String(todayStat?.completedPomodoros ?? 0);
    numTodayTime.textContent = formatDuration(todayStat?.totalFocusMinutes ?? 0);
  };

  const handleStart = async () => {
    settings = await loadSettings(dependencies.storage);
    sessionState = startSession(
      sessionState,
      settings,
      "work",
      sessionState.activeTodo,
      dependencies.now().toISOString(),
    );
    await saveSessionState(dependencies.storage, sessionState);
    renderUI();
  };

  const handlePause = async () => {
    sessionState = pauseSession(sessionState);
    await saveSessionState(dependencies.storage, sessionState);
    renderUI();
  };

  const handleResume = async () => {
    sessionState = resumeSession(
      sessionState,
      dependencies.now().toISOString(),
    );
    await saveSessionState(dependencies.storage, sessionState);
    renderUI();
  };

  const handleReset = async () => {
    settings = await loadSettings(dependencies.storage);
    sessionState = resetSession(settings);
    await saveSessionState(dependencies.storage, sessionState);
    renderUI();
  };

  const handleSkipBreak = async () => {
    settings = await loadSettings(dependencies.storage);
    sessionState = skipBreak(sessionState, settings);
    await saveSessionState(dependencies.storage, sessionState);
    renderUI();
  };

  updateTodoSelectOptions();
  renderUI();

  // 定时读取最新 sessionState 与 stats 进行 UI 同步
  timerId = setInterval(async () => {
    if (!active) return;
    sessionState = await loadSessionState(dependencies.storage, settings);
    statsRecord = await loadStats(dependencies.storage);
    renderUI();
  }, 1000);

  const unsubscribers = [
    dependencies.on("todos.changed", async () => {
      try {
        pendingTodos = await dependencies.todos.listPendingTodos();
        if (active) updateTodoSelectOptions();
      } catch {
        // ignore fetch error
      }
    }),
  ];

  return () => {
    if (!active) return;
    active = false;
    if (timerId !== null) clearInterval(timerId);
    for (const unsub of unsubscribers) unsub();
    root.replaceChildren();
  };
}

/* v8 ignore start -- production SDK lifecycle wiring */
export const { mount } = defineView({
  mount: (root) =>
    mountTaskView(root, {
      getLocale: () => plugin.context.getLocale(),
      getTheme: () => plugin.theme.get(),
      now: () => new Date(),
      on: (type, listener) => plugin.events.on(type, listener as never),
      storage: plugin.storage,
      todos: createTodoGateway(plugin.todos),
      toast: (message) => plugin.ui.toast({ message, variant: "info" }),
    }),
});
/* v8 ignore stop */
