import type {
  ActiveTodoInfo,
  FocusPreset,
  PomodoroMode,
  PomodoroSessionState,
  PomodoroSettings,
} from "./types.js";

/** 默认番茄钟设置 */
export const DEFAULT_SETTINGS: PomodoroSettings = {
  workDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  notePrefix: "[Focus]",
};

/**
 * 获取初始空闲状态
 */
export function createInitialSessionState(
  settings: PomodoroSettings = DEFAULT_SETTINGS,
): PomodoroSessionState {
  return {
    mode: "idle",
    isRunning: false,
    remainingSeconds: settings.workDurationMinutes * 60,
    totalDurationSeconds: settings.workDurationMinutes * 60,
    activeTodo: null,
    completedPomodorosInCycle: 0,
    lastStartedAt: null,
    currentPreset: "classic",
  };
}

/**
 * 切换 preset 预设模式 (25m / 50m / 15m)
 */
export function applyPreset(
  preset: FocusPreset,
  state: PomodoroSessionState,
  settings: PomodoroSettings,
): { state: PomodoroSessionState; updatedSettings: PomodoroSettings } {
  let workMins = 25;
  let shortMins = 5;
  if (preset === "deep") {
    workMins = 50;
    shortMins = 10;
  } else if (preset === "sprint") {
    workMins = 15;
    shortMins = 3;
  }

  const updatedSettings: PomodoroSettings = {
    ...settings,
    workDurationMinutes: workMins,
    shortBreakDurationMinutes: shortMins,
  };

  const workSecs = workMins * 60;
  const nextState: PomodoroSessionState = {
    ...state,
    mode: "idle",
    isRunning: false,
    remainingSeconds: workSecs,
    totalDurationSeconds: workSecs,
    currentPreset: preset,
    lastStartedAt: null,
  };

  return { state: nextState, updatedSettings };
}

/**
 * 启动新的番茄专注/休息会话
 */
export function startSession(
  state: PomodoroSessionState,
  settings: PomodoroSettings,
  mode: PomodoroMode = "work",
  todo?: ActiveTodoInfo | null,
  nowIso: string = new Date().toISOString(),
): PomodoroSessionState {
  let durationMinutes = settings.workDurationMinutes;
  if (mode === "shortBreak") {
    durationMinutes = settings.shortBreakDurationMinutes;
  } else if (mode === "longBreak") {
    durationMinutes = settings.longBreakDurationMinutes;
  }

  const totalSecs = durationMinutes * 60;
  return {
    ...state,
    mode,
    isRunning: true,
    remainingSeconds: totalSecs,
    totalDurationSeconds: totalSecs,
    activeTodo: todo !== undefined ? todo : state.activeTodo,
    lastStartedAt: nowIso,
  };
}

/**
 * 暂停当前运行中的倒计时
 */
export function pauseSession(
  state: PomodoroSessionState,
  nowMs: number = Date.now(),
): PomodoroSessionState {
  if (!state.isRunning) return state;

  // 结算当前流逝时间
  const computed = computeCurrentRemainingSeconds(state, nowMs);

  return {
    ...state,
    isRunning: false,
    remainingSeconds: computed,
    lastStartedAt: null,
  };
}

/**
 * 恢复暂停的倒计时
 */
export function resumeSession(
  state: PomodoroSessionState,
  nowIso: string = new Date().toISOString(),
): PomodoroSessionState {
  if (state.isRunning || state.mode === "idle") return state;
  return {
    ...state,
    isRunning: true,
    lastStartedAt: nowIso,
  };
}

/**
 * 基于物理时间戳计算当前真实剩余秒数 (修复时间不走 Bug 的核心)
 */
export function computeCurrentRemainingSeconds(
  state: PomodoroSessionState,
  nowMs: number = Date.now(),
): number {
  if (!state.isRunning || !state.lastStartedAt) {
    return Math.max(0, state.remainingSeconds);
  }

  const startedMs = new Date(state.lastStartedAt).getTime();
  const elapsedSecs = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
  return Math.max(0, state.remainingSeconds - elapsedSecs);
}

/**
 * 步进倒计时（根据真实物理时间戳）
 */
export function tickSession(
  state: PomodoroSessionState,
  nowMs: number = Date.now(),
): PomodoroSessionState {
  if (!state.isRunning) return state;

  const currentRemaining = computeCurrentRemainingSeconds(state, nowMs);
  return {
    ...state,
    remainingSeconds: currentRemaining,
    isRunning: currentRemaining > 0,
  };
}

/**
 * 重置番茄钟至空闲状态
 */
export function resetSession(
  settings: PomodoroSettings = DEFAULT_SETTINGS,
): PomodoroSessionState {
  return createInitialSessionState(settings);
}

/**
 * 跳过休息阶段直接准备开始下一次工作
 */
export function skipBreak(
  state: PomodoroSessionState,
  settings: PomodoroSettings,
): PomodoroSessionState {
  if (state.mode !== "shortBreak" && state.mode !== "longBreak") {
    return state;
  }
  const workSecs = settings.workDurationMinutes * 60;
  return {
    ...state,
    mode: "idle",
    isRunning: false,
    remainingSeconds: workSecs,
    totalDurationSeconds: workSecs,
    lastStartedAt: null,
  };
}

/**
 * 在倒计时归零时决定下一个模式与状态
 */
export function completeSessionStep(
  state: PomodoroSessionState,
  settings: PomodoroSettings,
  nowIso: string = new Date().toISOString(),
): {
  nextState: PomodoroSessionState;
  completedWorkMode: boolean;
  completedMinutes: number;
} {
  if (state.mode === "work") {
    const nextCycle = state.completedPomodorosInCycle + 1;
    const isLongBreakTime = nextCycle % settings.longBreakInterval === 0;
    const nextMode: PomodoroMode = isLongBreakTime ? "longBreak" : "shortBreak";
    const durationMins = isLongBreakTime
      ? settings.longBreakDurationMinutes
      : settings.shortBreakDurationMinutes;
    const totalSecs = durationMins * 60;

    const nextState: PomodoroSessionState = {
      ...state,
      mode: nextMode,
      isRunning: settings.autoStartBreaks,
      remainingSeconds: totalSecs,
      totalDurationSeconds: totalSecs,
      completedPomodorosInCycle: isLongBreakTime ? 0 : nextCycle,
      lastStartedAt: settings.autoStartBreaks ? nowIso : null,
    };

    return {
      nextState,
      completedWorkMode: true,
      completedMinutes: settings.workDurationMinutes,
    };
  }

  // 刚刚结束的是休息阶段
  const workSecs = settings.workDurationMinutes * 60;
  const nextState: PomodoroSessionState = {
    ...state,
    mode: "idle",
    isRunning: false,
    remainingSeconds: workSecs,
    totalDurationSeconds: workSecs,
    lastStartedAt: null,
  };

  return {
    nextState,
    completedWorkMode: false,
    completedMinutes: 0,
  };
}
