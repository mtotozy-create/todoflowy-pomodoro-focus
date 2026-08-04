import type {
  ActiveTodoInfo,
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
  };
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
export function pauseSession(state: PomodoroSessionState): PomodoroSessionState {
  if (!state.isRunning) return state;
  return {
    ...state,
    isRunning: false,
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
 * 步进倒计时（通常每秒触发）
 * @param state 当前状态
 * @param secondsToSubtract 每次递减秒数，默认为 1
 * @returns 步进后的新状态
 */
export function tickSession(
  state: PomodoroSessionState,
  secondsToSubtract = 1,
): PomodoroSessionState {
  if (!state.isRunning || state.remainingSeconds <= 0) return state;

  const nextRemaining = Math.max(0, state.remainingSeconds - secondsToSubtract);
  return {
    ...state,
    remainingSeconds: nextRemaining,
    isRunning: nextRemaining > 0,
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
  };
}

/**
 * 在倒计时归零时决定下一个模式与状态（专注结束 -> 休息；休息结束 -> 空闲/下一次专注）
 * @param state 已归零的当前状态
 * @param settings 番茄钟配置
 * @returns { nextState, sessionJustCompleted }
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
      mode: nextMode,
      isRunning: settings.autoStartBreaks,
      remainingSeconds: totalSecs,
      totalDurationSeconds: totalSecs,
      activeTodo: state.activeTodo,
      completedPomodorosInCycle: isLongBreakTime ? 0 : nextCycle,
      lastStartedAt: settings.autoStartBreaks ? nowIso : null,
    };

    return {
      nextState,
      completedWorkMode: true,
      completedMinutes: settings.workDurationMinutes,
    };
  }

  // 如果刚刚结束的是休息阶段
  const workSecs = settings.workDurationMinutes * 60;
  const nextState: PomodoroSessionState = {
    mode: "idle",
    isRunning: false,
    remainingSeconds: workSecs,
    totalDurationSeconds: workSecs,
    activeTodo: state.activeTodo,
    completedPomodorosInCycle: state.completedPomodorosInCycle,
    lastStartedAt: null,
  };

  return {
    nextState,
    completedWorkMode: false,
    completedMinutes: 0,
  };
}
