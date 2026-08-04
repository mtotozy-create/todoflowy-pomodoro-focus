import { defineView, plugin } from "@todoflowy/plugin-sdk";

import { formatDuration, formatTime } from "./core/formatter.js";
import {
  applyPreset,
  completeSessionStep,
  computeCurrentRemainingSeconds,
  pauseSession,
  resetSession,
  resumeSession,
  skipBreak,
  startSession,
} from "./core/timer.js";
import type {
  ActiveTodoInfo,
  FocusPreset,
  PomodoroSessionState,
  PomodoroSettings,
  PomodoroStatsRecord,
} from "./core/types.js";
import { button, element } from "./dom.js";
import {
  loadSessionState,
  loadSettings,
  loadStats,
  saveSessionState,
  saveSettings,
  saveStats,
  type StorageGateway,
} from "./storage.js";
import { TASK_VIEW_CSS } from "./task-view.css.js";
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
  let searchQuery = "";

  try {
    pendingTodos = await dependencies.todos.listPendingTodos({ limit: 20 });
  } catch {
    pendingTodos = [];
  }

  if (!active) return () => {};

  // 构建 DOM 节点结构
  const styleEl = element("style", { text: TASK_VIEW_CSS });
  const appContainer = element("section", { className: "pomodoro-studio-app" });

  // 1. 顶部 App Bar
  const appBar = element("div", { className: "pomodoro-studio__bar" });
  const appTitle = element("div", {
    className: "pomodoro-studio__title",
    text: "🍅 Pomodoro Focus Studio ",
  });
  const appBadge = element("span", {
    className: "pomodoro-studio__badge",
    text: "DESKTOP PRO",
  });
  appTitle.appendChild(appBadge);

  const pillsContainer = element("div", {
    className: "pomodoro-studio__pills",
  });
  appBar.appendChild(appTitle);
  appBar.appendChild(pillsContainer);

  // 2. 双列 Bento Grid 网格
  const grid = element("div", { className: "pomodoro-studio__grid" });

  // 左栏: 主控制台
  const mainCol = element("div", { className: "pomodoro-studio__main" });

  // Presets Quick Switch Bar
  const presetsBar = element("div", { className: "pomodoro-presets" });
  const btnPresetClassic = button(
    "🍅 Classic (25m)",
    () => void handlePresetChange("classic"),
    "pomodoro-preset-btn",
  );
  const btnPresetDeep = button(
    "⚡ Deep (50m)",
    () => void handlePresetChange("deep"),
    "pomodoro-preset-btn",
  );
  const btnPresetSprint = button(
    "🚀 Sprint (15m)",
    () => void handlePresetChange("sprint"),
    "pomodoro-preset-btn",
  );
  presetsBar.appendChild(btnPresetClassic);
  presetsBar.appendChild(btnPresetDeep);
  presetsBar.appendChild(btnPresetSprint);

  // Timer Core Card
  const timerCard = element("div", { className: "pomodoro-timer-card" });
  const modeBadge = element("div", {
    className: "pomodoro-mode-badge",
    text: "● FOCUS SESSION",
  });
  const timerDisplay = element("div", {
    className: "pomodoro-timer-display",
    text: "25:00",
  });

  const targetBanner = element("div", {
    className: "pomodoro-target-banner",
  });
  const bannerHeader = element("div", {
    className: "pomodoro-target-banner__header",
  });
  const bannerHeaderLeft = element("span", { text: "CURRENT TARGET TASK" });
  const bannerHeaderRight = element("span", { text: "Target: 🍅 1" });
  bannerHeader.appendChild(bannerHeaderLeft);
  bannerHeader.appendChild(bannerHeaderRight);

  const bannerTitle = element("div", {
    className: "pomodoro-target-banner__title",
    text: "-- Click a Todo on the right panel to start focusing --",
  });
  targetBanner.appendChild(bannerHeader);
  targetBanner.appendChild(bannerTitle);

  const controlsRow = element("div", {
    className: "pomodoro-controls-row",
  });

  timerCard.appendChild(modeBadge);
  timerCard.appendChild(timerDisplay);
  timerCard.appendChild(targetBanner);
  timerCard.appendChild(controlsRow);

  mainCol.appendChild(presetsBar);
  mainCol.appendChild(timerCard);

  // 右栏: 侧边抽屉 (Search Task Picker + Timeline Log)
  const sidebarCol = element("div", { className: "pomodoro-studio__sidebar" });

  // 任务选择面板 Card
  const pickerCard = element("div", { className: "pomodoro-panel-card" });
  const pickerHeader = element("div", {
    text: "🎯 Select Focus Task (limit: 20)",
  });
  pickerHeader.style.fontWeight = "700";
  pickerHeader.style.fontSize = "14px";

  const searchInput = element("input", {
    className: "pomodoro-search-input",
  }) as HTMLInputElement;
  searchInput.placeholder = "🔍 Search todos...";

  const todoListContainer = element("div", {
    className: "pomodoro-todo-list",
  });
  todoListContainer.style.display = "flex";
  todoListContainer.style.flexDirection = "column";
  todoListContainer.style.gap = "8px";
  todoListContainer.style.maxHeight = "220px";
  todoListContainer.style.overflowY = "auto";

  pickerCard.appendChild(pickerHeader);
  pickerCard.appendChild(searchInput);
  pickerCard.appendChild(todoListContainer);

  // 时间线面板 Card
  const timelineCard = element("div", { className: "pomodoro-panel-card" });
  const timelineHeader = element("div", {
    text: "📊 Today's Focus Timeline",
  });
  timelineHeader.style.fontWeight = "700";
  timelineHeader.style.fontSize = "14px";
  const timelineList = element("div", { className: "pomodoro-timeline-list" });

  timelineCard.appendChild(timelineHeader);
  timelineCard.appendChild(timelineList);

  sidebarCol.appendChild(pickerCard);
  sidebarCol.appendChild(timelineCard);

  grid.appendChild(mainCol);
  grid.appendChild(sidebarCol);

  appContainer.appendChild(styleEl);
  appContainer.appendChild(appBar);
  appContainer.appendChild(grid);

  root.replaceChildren(appContainer);

  // 渲染并更新功能组件 UI
  const renderTodoList = () => {
    todoListContainer.replaceChildren();
    if (pendingTodos.length === 0) {
      const emptyNote = element("div", { text: "No pending todos found." });
      emptyNote.style.fontSize = "12px";
      emptyNote.style.color = "var(--theme-muted-color, #6b7280)";
      todoListContainer.appendChild(emptyNote);
      return;
    }

    for (const item of pendingTodos) {
      const isSelected = sessionState.activeTodo?.id === item.id;
      const cardEl = element("div", {
        className: `pomodoro-todo-card ${isSelected ? "pomodoro-todo-card--selected" : ""}`,
      });

      const infoEl = element("div");
      const titleEl = element("div", { text: item.title });
      titleEl.style.fontSize = "13px";
      titleEl.style.fontWeight = "600";
      infoEl.appendChild(titleEl);

      cardEl.appendChild(infoEl);
      cardEl.addEventListener("click", () => {
        const activeTodo: ActiveTodoInfo = {
          id: item.id,
          title: item.title,
          revision: item.revision,
          estimatedPomodoros: 1,
        };
        sessionState = {
          ...sessionState,
          activeTodo,
        };
        void saveSessionState(dependencies.storage, sessionState);
        renderUI();
      });

      todoListContainer.appendChild(cardEl);
    }
  };

  const renderTimeline = () => {
    timelineList.replaceChildren();
    const todayStr = dependencies.now().toISOString().slice(0, 10);
    const logs = (statsRecord.timelineLogs ?? []).filter(
      (l) => l.date === todayStr,
    );

    if (logs.length === 0) {
      const empty = element("div", { text: "No focus records today yet." });
      empty.style.fontSize = "12px";
      empty.style.color = "var(--theme-muted-color, #6b7280)";
      timelineList.appendChild(empty);
      return;
    }

    for (const log of logs.slice(0, 5)) {
      const itemEl = element("div", { className: "pomodoro-timeline-item" });
      const textEl = element("span", {
        text: `🍅 ${log.todoTitle ? log.todoTitle : "Focus Session"} (${log.minutes}m)`,
      });
      const timeEl = element("span", { text: log.time });
      timeEl.style.color = "var(--theme-muted-color, #6b7280)";
      timeEl.style.fontFamily = "ui-monospace, monospace";

      itemEl.appendChild(textEl);
      itemEl.appendChild(timeEl);
      timelineList.appendChild(itemEl);
    }
  };

  const renderUI = () => {
    if (!active) return;

    // 1. 根据物理时间戳实时计算剩余时间
    const currentRemaining = computeCurrentRemainingSeconds(
      sessionState,
      dependencies.now().getTime(),
    );
    timerDisplay.textContent = formatTime(currentRemaining);

    // 2. Preset 激活状态更新
    const activePreset = sessionState.currentPreset ?? "classic";
    btnPresetClassic.className = `pomodoro-preset-btn ${activePreset === "classic" ? "pomodoro-preset-btn--active" : ""}`;
    btnPresetDeep.className = `pomodoro-preset-btn ${activePreset === "deep" ? "pomodoro-preset-btn--active" : ""}`;
    btnPresetSprint.className = `pomodoro-preset-btn ${activePreset === "sprint" ? "pomodoro-preset-btn--active" : ""}`;

    // 3. Mode Badge 呈现
    let badgeText = "● IDLE";
    let badgeBg = "rgba(125, 125, 125, 0.1)";
    let badgeFg = "var(--theme-text-color, CanvasText)";

    if (sessionState.mode === "work") {
      badgeText = sessionState.isRunning ? "● FOCUSING" : "❚❚ PAUSED";
      badgeBg = "rgba(239, 68, 68, 0.15)";
      badgeFg = "#ef4444";
    } else if (sessionState.mode === "shortBreak") {
      badgeText = "● SHORT BREAK";
      badgeBg = "rgba(16, 185, 129, 0.15)";
      badgeFg = "#10b981";
    } else if (sessionState.mode === "longBreak") {
      badgeText = "● LONG BREAK";
      badgeBg = "rgba(59, 130, 246, 0.15)";
      badgeFg = "#3b82f6";
    }

    modeBadge.textContent = badgeText;
    modeBadge.style.backgroundColor = badgeBg;
    modeBadge.style.color = badgeFg;

    // 4. Banner Task 呈现
    if (sessionState.activeTodo) {
      bannerTitle.textContent = `📘 ${sessionState.activeTodo.title}`;
    } else {
      bannerTitle.textContent = "-- Select a task on the right panel to focus --";
    }

    // 5. 控制按钮组
    controlsRow.replaceChildren();
    if (sessionState.mode === "idle") {
      const startBtn = button(
        "🍅 Start Focus",
        () => void handleStart(),
        "pomodoro-btn-giant-primary",
      );
      controlsRow.appendChild(startBtn);
    } else if (sessionState.mode === "work") {
      if (sessionState.isRunning) {
        const pauseBtn = button(
          "⏸️ Pause",
          () => void handlePause(),
          "pomodoro-btn-giant-sub",
        );
        const resetBtn = button(
          "🔄 Reset",
          () => void handleReset(),
          "pomodoro-btn-giant-sub",
        );
        controlsRow.appendChild(pauseBtn);
        controlsRow.appendChild(resetBtn);
      } else {
        const resumeBtn = button(
          "▶️ Resume Focus",
          () => void handleResume(),
          "pomodoro-btn-giant-primary",
        );
        const resetBtn = button(
          "🔄 Reset",
          () => void handleReset(),
          "pomodoro-btn-giant-sub",
        );
        controlsRow.appendChild(resumeBtn);
        controlsRow.appendChild(resetBtn);
      }
    } else {
      const skipBtn = button(
        "⏭️ Skip Break",
        () => void handleSkipBreak(),
        "pomodoro-btn-giant-sub",
      );
      controlsRow.appendChild(skipBtn);
    }

    // 6. Pills 汇总
    pillsContainer.replaceChildren();
    const todayStr = dependencies.now().toISOString().slice(0, 10);
    const todayStat = statsRecord.dailyStats[todayStr];

    const p1 = element("div", {
      className: "pomodoro-studio__pill",
      text: `Today: ${todayStat?.completedPomodoros ?? 0} 🍅`,
    });
    const p2 = element("div", {
      className: "pomodoro-studio__pill",
      text: `Focus: ${formatDuration(todayStat?.totalFocusMinutes ?? 0)}`,
    });
    pillsContainer.appendChild(p1);
    pillsContainer.appendChild(p2);

    renderTodoList();
    renderTimeline();
  };

  searchInput.addEventListener("input", async () => {
    searchQuery = searchInput.value;
    try {
      pendingTodos = await dependencies.todos.listPendingTodos({
        search: searchQuery,
        limit: 20,
      });
      renderTodoList();
    } catch {
      // ignore search error
    }
  });

  const handlePresetChange = async (preset: FocusPreset) => {
    const { state, updatedSettings } = applyPreset(
      preset,
      sessionState,
      settings,
    );
    sessionState = state;
    settings = updatedSettings;
    await saveSettings(dependencies.storage, settings);
    await saveSessionState(dependencies.storage, sessionState);
    renderUI();
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
    sessionState = pauseSession(sessionState, dependencies.now().getTime());
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

  renderUI();

  // 1s 轮询步进
  timerId = setInterval(async () => {
    if (!active) return;
    statsRecord = await loadStats(dependencies.storage);

    if (sessionState.isRunning) {
      const currentRemaining = computeCurrentRemainingSeconds(
        sessionState,
        dependencies.now().getTime(),
      );
      if (currentRemaining <= 0) {
        const { nextState, completedWorkMode } = completeSessionStep(
          sessionState,
          settings,
          dependencies.now().toISOString(),
        );
        sessionState = nextState;
        await saveSessionState(dependencies.storage, sessionState);
        if (completedWorkMode) {
          statsRecord = await loadStats(dependencies.storage);
        }
      }
    }

    renderUI();
  }, 1000);

  const unsubscribers = [
    dependencies.on("todos.changed", async () => {
      try {
        pendingTodos = await dependencies.todos.listPendingTodos({
          search: searchQuery,
          limit: 20,
        });
        if (active) renderTodoList();
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
