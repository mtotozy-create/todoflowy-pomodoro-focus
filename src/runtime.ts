import { defineRuntime, plugin } from "@todoflowy/plugin-sdk";

import { recordCompletedPomodoro } from "./core/stats.js";
import {
  completeSessionStep,
  createInitialSessionState,
  resumeSession,
  startSession,
  tickSession,
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
    if (!active || !sessionState.isRunning) return;

    sessionState = tickSession(sessionState, 1);
    await saveSessionState(dependencies.storage, sessionState);

    // 检查倒计时归零
    if (sessionState.remainingSeconds <= 0) {
      const { nextState, completedWorkMode, completedMinutes } =
        completeSessionStep(sessionState, settings, dependencies.now().toISOString());

      sessionState = nextState;
      await saveSessionState(dependencies.storage, sessionState);

      if (completedWorkMode) {
        // 1. 专注模式归零，记录统计数据
        statsRecord = recordCompletedPomodoro(
          statsRecord,
          completedMinutes,
          dependencies.now(),
          sessionState.activeTodo,
        );
        await saveStats(dependencies.storage, statsRecord);

        // 2. 追加 Todo 备注（若有选中的 Todo）
        if (sessionState.activeTodo) {
          try {
            await dependencies.todos.appendFocusRecord(
              sessionState.activeTodo.id,
              completedMinutes,
              settings.notePrefix,
            );
          } catch {
            // HACK: API 冲突时不阻塞整体流程，仅弹框提示
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

  // 启动 1s 轮询定时器
  timerId = setInterval(() => {
    void processTick();
  }, 1000);

  // 监听宿主工具栏点击触发
  const unsubscribeCommand = dependencies.onCommand(async (payload) => {
    if (
      payload !== null &&
      typeof payload === "object" &&
      "command" in payload &&
      payload.command === "pomodoro-focus.start"
    ) {
      if (!active) return;
      settings = await loadSettings(dependencies.storage);

      if (sessionState.mode === "idle") {
        // 如果是从空闲状态直接工具栏启动，尝试选取首条未完成待办
        let activeTodo = sessionState.activeTodo;
        if (!activeTodo) {
          try {
            const pendingList = await dependencies.todos.listPendingTodos();
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
        // 如果处于暂停状态，进行恢复
        sessionState = resumeSession(
          sessionState,
          dependencies.now().toISOString(),
        );
        await saveSessionState(dependencies.storage, sessionState);
        await dependencies.toast("▶️ Pomodoro focus resumed.");
      } else {
        await dependencies.toast(
          `⏱️ Pomodoro in progress (${Math.ceil(sessionState.remainingSeconds / 60)}m remaining)`,
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
