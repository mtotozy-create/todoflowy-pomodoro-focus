import { defineRuntime, plugin } from "@todoflowy/plugin-sdk";

import { recordCompletedPomodoro } from "./core/stats.js";
import {
  completeSessionStep,
  computeCurrentRemainingSeconds,
  resumeSession,
  startSession,
} from "./core/timer.js";
import type {
  PomodoroSessionState,
  PomodoroSettings,
  PomodoroStatsRecord,
} from "./core/types.js";
import {
  loadSessionState,
  loadSettings,
  loadStats,
  saveSessionState,
  saveStats,
  type StorageGateway,
} from "./storage.js";
import { createTodoGateway, type TodoGateway } from "./todos.js";

export interface RuntimeDependencies {
  readonly now: () => Date;
  readonly onCommand: (listener: (payload: unknown) => void) => () => void;
  readonly storage: StorageGateway;
  readonly todos: TodoGateway;
  readonly toast: (message: string) => Promise<void>;
}

export async function startPomodoroRuntime(
  dependencies: RuntimeDependencies,
): Promise<() => void> {
  let active = true;
  let timerId: ReturnType<typeof setInterval> | null = null;

  let settings: PomodoroSettings = await loadSettings(dependencies.storage);
  let sessionState: PomodoroSessionState = await loadSessionState(
    dependencies.storage,
    settings,
  );
  let statsRecord: PomodoroStatsRecord = await loadStats(dependencies.storage);

  if (!active) return () => {};

  const processTick = async () => {
    if (!active) return;
    sessionState = await loadSessionState(dependencies.storage, settings);

    if (!sessionState.isRunning) return;

    const remainingSecs = computeCurrentRemainingSeconds(
      sessionState,
      dependencies.now().getTime(),
    );

    // 检查倒计时归零
    if (remainingSecs <= 0) {
      const { nextState, completedWorkMode, completedMinutes } =
        completeSessionStep(
          sessionState,
          settings,
          dependencies.now().toISOString(),
        );

      sessionState = nextState;
      await saveSessionState(dependencies.storage, sessionState);

      if (completedWorkMode) {
        statsRecord = await loadStats(dependencies.storage);
        statsRecord = recordCompletedPomodoro(
          statsRecord,
          completedMinutes,
          dependencies.now(),
          sessionState.activeTodo,
        );
        await saveStats(dependencies.storage, statsRecord);

        // 追加 Todo 描述
        if (sessionState.activeTodo) {
          try {
            await dependencies.todos.appendFocusRecord(
              sessionState.activeTodo.id,
              completedMinutes,
              settings.notePrefix,
            );
          } catch {
            await dependencies.toast(
              "Pomodoro finished! (Failed to update todo note due to conflict)",
            );
          }
        }

        await dependencies.toast(
          `🎉 Pomodoro completed! Focused for ${completedMinutes} mins. Time for a break!`,
        );
      } else {
        await dependencies.toast("🔔 Break finished! Ready to focus again?");
      }
    }
  };

  timerId = setInterval(() => {
    void processTick();
  }, 1000);

  // 监听工具栏快捷启动按键
  const unsubscribeCommand = dependencies.onCommand(async (payload) => {
    if (
      payload !== null &&
      typeof payload === "object" &&
      "command" in payload &&
      payload.command === "pomodoro-focus.start"
    ) {
      if (!active) return;
      settings = await loadSettings(dependencies.storage);
      sessionState = await loadSessionState(dependencies.storage, settings);

      if (sessionState.mode === "idle") {
        let activeTodo = sessionState.activeTodo;
        if (!activeTodo) {
          try {
            const pendingList = await dependencies.todos.listPendingTodos({ limit: 1 });
            if (pendingList.length > 0) {
              const first = pendingList[0];
              activeTodo = {
                id: first.id,
                title: first.title,
                revision: first.revision,
              };
            }
          } catch {
            // ignore listing error
          }
        }

        sessionState = startSession(
          sessionState,
          settings,
          "work",
          activeTodo,
          dependencies.now().toISOString(),
        );
        await saveSessionState(dependencies.storage, sessionState);
        await dependencies.toast(
          `🍅 Started Pomodoro focus (${settings.workDurationMinutes}m)`,
        );
      } else if (!sessionState.isRunning) {
        sessionState = resumeSession(
          sessionState,
          dependencies.now().toISOString(),
        );
        await saveSessionState(dependencies.storage, sessionState);
        await dependencies.toast("▶️ Pomodoro focus resumed.");
      } else {
        const remaining = computeCurrentRemainingSeconds(
          sessionState,
          dependencies.now().getTime(),
        );
        await dependencies.toast(
          `⏱️ Pomodoro in progress (${Math.ceil(remaining / 60)}m remaining)`,
        );
      }
    }
  });

  return () => {
    if (!active) return;
    active = false;
    if (timerId !== null) clearInterval(timerId);
    unsubscribeCommand();
  };
}

/* v8 ignore start -- production SDK lifecycle wiring */
let runtimeCleanup: (() => void) | undefined;
export const { activate, deactivate } = defineRuntime({
  activate: async () => {
    runtimeCleanup = await startPomodoroRuntime({
      now: () => new Date(),
      onCommand: (listener) =>
        plugin.events.on("command.invoked", listener as never),
      storage: plugin.storage,
      todos: createTodoGateway(plugin.todos),
      toast: (message) => plugin.ui.toast({ message, variant: "info" }),
    });
  },
  deactivate: () => runtimeCleanup?.(),
});
/* v8 ignore stop */
