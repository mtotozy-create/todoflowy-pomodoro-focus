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
  let activeTab: "today" | "all" = "today";

  const fetchTodoList = async () => {
    try {
      pendingTodos = await dependencies.todos.listPendingTodos({
        filter: activeTab,
        limit: 20,
        search: searchQuery,
        todayIsoDate: dependencies.now().toISOString(),
      });
    } catch {
      pendingTodos = [];
    }
  };

  await fetchTodoList();

  if (!active) return () => {};

  // DOM node tree
  const styleEl = element("style", { text: TASK_VIEW_CSS });
  const appContainer = element("section", { className: "pomodoro-studio-app" });

  // 1. App Bar
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

  // 2. Bento Grid
  const grid = element("div", { className: "pomodoro-studio__grid" });

  // Left Column: Main Console
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
  const bannerHeaderRight = element("span");
  bannerHeader.appendChild(bannerHeaderLeft);
  bannerHeader.appendChild(bannerHeaderRight);

  const bannerTitle = element("div", {
    className: "pomodoro-target-banner__title",
    text: "-- Select a Todo on the right panel to start focusing --",
  });
  const bannerIcons = element("div", { className: "pomodoro-banner-icons-row" });

  targetBanner.appendChild(bannerHeader);
  targetBanner.appendChild(bannerTitle);
  targetBanner.appendChild(bannerIcons);

  const controlsRow = element("div", {
    className: "pomodoro-controls-row",
  });

  timerCard.appendChild(modeBadge);
  timerCard.appendChild(timerDisplay);
  timerCard.appendChild(targetBanner);
  timerCard.appendChild(controlsRow);

  mainCol.appendChild(presetsBar);
  mainCol.appendChild(timerCard);

  // Right Column: Task Picker & Timeline Log
  const sidebarCol = element("div", { className: "pomodoro-studio__sidebar" });

  const pickerCard = element("div", { className: "pomodoro-panel-card" });
  const pickerHeaderRow = element("div");
  pickerHeaderRow.style.display = "flex";
  pickerHeaderRow.style.justifyContent = "space-between";
  pickerHeaderRow.style.alignItems = "center";

  const pickerHeaderTitle = element("span", {
    text: "🎯 Select Todo (limit: 20)",
  });
  pickerHeaderTitle.style.fontWeight = "800";
  pickerHeaderTitle.style.fontSize = "14px";
  const pickerHeaderPage = element("span", { text: "Page 1/2" });
  pickerHeaderPage.style.fontSize = "12px";
  pickerHeaderPage.style.color = "var(--theme-muted-color, #6b7280)";

  pickerHeaderRow.appendChild(pickerHeaderTitle);
  pickerHeaderRow.appendChild(pickerHeaderPage);

  const searchInput = element("input", {
    className: "pomodoro-search-input",
  }) as HTMLInputElement;
  searchInput.placeholder = "🔍 Search todo title...";

  // Picker Tabs
  const pickerTabs = element("div", { className: "pomodoro-picker-tabs" });
  const tabToday = element("div", {
    className: "pomodoro-tab-item pomodoro-tab-item--active",
    text: "Today",
  });
  const tabAll = element("div", {
    className: "pomodoro-tab-item",
    text: "All",
  });

  tabToday.addEventListener("click", async () => {
    activeTab = "today";
    tabToday.className = "pomodoro-tab-item pomodoro-tab-item--active";
    tabAll.className = "pomodoro-tab-item";
    await fetchTodoList();
    renderTodoList();
  });

  tabAll.addEventListener("click", async () => {
    activeTab = "all";
    tabAll.className = "pomodoro-tab-item pomodoro-tab-item--active";
    tabToday.className = "pomodoro-tab-item";
    await fetchTodoList();
    renderTodoList();
  });

  pickerTabs.appendChild(tabToday);
  pickerTabs.appendChild(tabAll);

  const todoListContainer = element("div", {
    className: "pomodoro-todo-list",
  });
  todoListContainer.style.display = "flex";
  todoListContainer.style.flexDirection = "column";
  todoListContainer.style.gap = "8px";
  todoListContainer.style.maxHeight = "240px";
  todoListContainer.style.overflowY = "auto";

  pickerCard.appendChild(pickerHeaderRow);
  pickerCard.appendChild(searchInput);
  pickerCard.appendChild(pickerTabs);
  pickerCard.appendChild(todoListContainer);

  // Timeline Card
  const timelineCard = element("div", { className: "pomodoro-panel-card" });
  const timelineHeader = element("div", {
    text: "📊 Today's Focus Timeline",
  });
  timelineHeader.style.fontWeight = "800";
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

  // Render Todo Items
  const renderTodoList = () => {
    todoListContainer.replaceChildren();
    if (pendingTodos.length === 0) {
      const emptyNote = element("div", {
        text: activeTab === "today" ? "No planned todos for today." : "No pending todos found.",
      });
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
      titleEl.style.fontWeight = "700";

      const metaEl = element("div", {
        text: `Priority: ${item.priority ? item.priority.toUpperCase() : "NORMAL"}`,
      });
      metaEl.style.fontSize = "11px";
      metaEl.style.color = "var(--theme-muted-color, #6b7280)";
      metaEl.style.marginTop = "2px";

      infoEl.appendChild(titleEl);
      infoEl.appendChild(metaEl);

      // Estimated Pomodoros Controls
      const estContainer = element("div", { className: "pomodoro-est-controls" });
      const estCount = isSelected
        ? sessionState.activeTodo?.estimatedPomodoros ?? 1
        : 1;

      const minusBtn = button("-", (e) => {
        e.stopPropagation();
        const nextEst = Math.max(1, estCount - 1);
        updateActiveTodoEst(item, nextEst);
      }, "pomodoro-est-btn");

      const countSpan = element("span", { text: `${estCount} 🍅` });

      const plusBtn = button("+", (e) => {
        e.stopPropagation();
        const nextEst = Math.min(8, estCount + 1);
        updateActiveTodoEst(item, nextEst);
      }, "pomodoro-est-btn");

      estContainer.appendChild(minusBtn);
      estContainer.appendChild(countSpan);
      estContainer.appendChild(plusBtn);

      cardEl.appendChild(infoEl);
      cardEl.appendChild(estContainer);

      cardEl.addEventListener("click", () => {
        const activeTodo: ActiveTodoInfo = {
          id: item.id,
          title: item.title,
          revision: item.revision,
          estimatedPomodoros: estCount,
          completedPomodoros: 0,
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

  const updateActiveTodoEst = (item: TodoItem, nextEst: number) => {
    const activeTodo: ActiveTodoInfo = {
      id: item.id,
      title: item.title,
      revision: item.revision,
      estimatedPomodoros: nextEst,
      completedPomodoros: sessionState.activeTodo?.completedPomodoros ?? 0,
    };
    sessionState = {
      ...sessionState,
      activeTodo,
    };
    void saveSessionState(dependencies.storage, sessionState);
    renderUI();
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

    // 1. Calculate remaining seconds based on physical timestamp
    const currentRemaining = computeCurrentRemainingSeconds(
      sessionState,
      dependencies.now().getTime(),
    );
    timerDisplay.textContent = formatTime(currentRemaining);

    // 2. Update Preset Active Status
    const activePreset = sessionState.currentPreset ?? "classic";
    btnPresetClassic.className = `pomodoro-preset-btn ${activePreset === "classic" ? "pomodoro-preset-btn--active" : ""}`;
    btnPresetDeep.className = `pomodoro-preset-btn ${activePreset === "deep" ? "pomodoro-preset-btn--active" : ""}`;
    btnPresetSprint.className = `pomodoro-preset-btn ${activePreset === "sprint" ? "pomodoro-preset-btn--active" : ""}`;

    // 3. Mode Badge Presentation
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

    // 4. Target Banner Presentation & Tomato Icon Progress Bar
    bannerIcons.replaceChildren();
    if (sessionState.activeTodo) {
      bannerTitle.textContent = `📘 ${sessionState.activeTodo.title}`;
      const est = sessionState.activeTodo.estimatedPomodoros ?? 1;
      const comp = sessionState.activeTodo.completedPomodoros ?? 0;
      bannerHeaderRight.textContent = `Target Progress: 🍅 ${comp} / ${est}`;

      for (let i = 0; i < est; i++) {
        const isComp = i < comp;
        const dot = element("span", {
          className: `pomodoro-icon-dot ${isComp ? "pomodoro-icon-dot--completed" : "pomodoro-icon-dot--pending"}`,
          text: isComp ? "🍅" : "⚪",
        });
        bannerIcons.appendChild(dot);
      }
    } else {
      bannerTitle.textContent = "-- Select a todo on the right panel to start focusing --";
      bannerHeaderRight.textContent = "Target Progress: 🍅 0 / 1";
      const dot = element("span", {
        className: "pomodoro-icon-dot pomodoro-icon-dot--pending",
        text: "⚪",
      });
      bannerIcons.appendChild(dot);
    }

    // 5. Control Buttons
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
          "⏸️ Pause Focus",
          () => void handlePause(),
          "pomodoro-btn-giant-warning",
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

    // 6. Pills Summary
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
    const p3 = element("div", {
      className: "pomodoro-studio__pill",
      text: `Total: ${statsRecord.totalCompletedPomodoros} 🍅`,
    });
    pillsContainer.appendChild(p1);
    pillsContainer.appendChild(p2);
    pillsContainer.appendChild(p3);

    renderTodoList();
    renderTimeline();
  };

  searchInput.addEventListener("input", async () => {
    searchQuery = searchInput.value;
    await fetchTodoList();
    renderTodoList();
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

  // 1s interval tick
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

        if (completedWorkMode && nextState.activeTodo) {
          const prevComp = nextState.activeTodo.completedPomodoros ?? 0;
          const updatedActiveTodo = {
            ...nextState.activeTodo,
            completedPomodoros: prevComp + 1,
          };
          sessionState = { ...nextState, activeTodo: updatedActiveTodo };
        } else {
          sessionState = nextState;
        }

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
      await fetchTodoList();
      if (active) renderTodoList();
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
