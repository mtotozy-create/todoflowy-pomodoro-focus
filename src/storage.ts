import {
  createInitialSessionState,
  DEFAULT_SETTINGS,
} from "./core/timer.js";
import { createInitialStats } from "./core/stats.js";
import type {
  PomodoroSessionState,
  PomodoroSettings,
  PomodoroStatsRecord,
} from "./core/types.js";

export interface StorageGateway {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

const SETTINGS_KEY = "pomodoro_focus_settings_v1";
const SESSION_STATE_KEY = "pomodoro_focus_session_v1";
const STATS_KEY = "pomodoro_focus_stats_v1";

/**
 * 加载番茄钟配置，如不存在或异常则回退到 DEFAULT_SETTINGS
 */
export async function loadSettings(
  storage: StorageGateway,
): Promise<PomodoroSettings> {
  try {
    const raw = await storage.get(SETTINGS_KEY);
    if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
    const obj = raw as Record<string, unknown>;
    return {
      workDurationMinutes:
        typeof obj.workDurationMinutes === "number" && obj.workDurationMinutes > 0
          ? obj.workDurationMinutes
          : DEFAULT_SETTINGS.workDurationMinutes,
      shortBreakDurationMinutes:
        typeof obj.shortBreakDurationMinutes === "number" &&
        obj.shortBreakDurationMinutes > 0
          ? obj.shortBreakDurationMinutes
          : DEFAULT_SETTINGS.shortBreakDurationMinutes,
      longBreakDurationMinutes:
        typeof obj.longBreakDurationMinutes === "number" &&
        obj.longBreakDurationMinutes > 0
          ? obj.longBreakDurationMinutes
          : DEFAULT_SETTINGS.longBreakDurationMinutes,
      longBreakInterval:
        typeof obj.longBreakInterval === "number" && obj.longBreakInterval > 0
          ? obj.longBreakInterval
          : DEFAULT_SETTINGS.longBreakInterval,
      autoStartBreaks:
        typeof obj.autoStartBreaks === "boolean"
          ? obj.autoStartBreaks
          : DEFAULT_SETTINGS.autoStartBreaks,
      notePrefix:
        typeof obj.notePrefix === "string" && obj.notePrefix.length > 0
          ? obj.notePrefix
          : DEFAULT_SETTINGS.notePrefix,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存番茄钟配置
 */
export async function saveSettings(
  storage: StorageGateway,
  settings: PomodoroSettings,
): Promise<void> {
  await storage.set(SETTINGS_KEY, settings);
}

/**
 * 加载持久化的专注统计
 */
export async function loadStats(
  storage: StorageGateway,
  nowIso: string = new Date().toISOString(),
): Promise<PomodoroStatsRecord> {
  try {
    const raw = await storage.get(STATS_KEY);
    if (!raw || typeof raw !== "object") return createInitialStats(nowIso);

    const obj = raw as Record<string, unknown>;
    if (obj.version !== 1) {
      return createInitialStats(nowIso);
    }

    return {
      version: 1,
      totalCompletedPomodoros:
        typeof obj.totalCompletedPomodoros === "number"
          ? obj.totalCompletedPomodoros
          : 0,
      totalFocusMinutes:
        typeof obj.totalFocusMinutes === "number" ? obj.totalFocusMinutes : 0,
      dailyStats:
        obj.dailyStats && typeof obj.dailyStats === "object"
          ? (obj.dailyStats as PomodoroStatsRecord["dailyStats"])
          : {},
      todoStats:
        obj.todoStats && typeof obj.todoStats === "object"
          ? (obj.todoStats as PomodoroStatsRecord["todoStats"])
          : {},
      timelineLogs: Array.isArray(obj.timelineLogs)
        ? (obj.timelineLogs as PomodoroStatsRecord["timelineLogs"])
        : [],
      lastUpdated:
        typeof obj.lastUpdated === "string" ? obj.lastUpdated : nowIso,
    };
  } catch {
    return createInitialStats(nowIso);
  }
}

/**
 * 保存专注统计
 */
export async function saveStats(
  storage: StorageGateway,
  stats: PomodoroStatsRecord,
): Promise<void> {
  await storage.set(STATS_KEY, stats);
}

/**
 * 读取恢复倒计时运行状态
 */
export async function loadSessionState(
  storage: StorageGateway,
  settings: PomodoroSettings = DEFAULT_SETTINGS,
): Promise<PomodoroSessionState> {
  try {
    const raw = await storage.get(SESSION_STATE_KEY);
    if (!raw || typeof raw !== "object") {
      return createInitialSessionState(settings);
    }
    const obj = raw as Record<string, unknown>;
    return {
      mode:
        obj.mode === "work" || obj.mode === "shortBreak" || obj.mode === "longBreak"
          ? obj.mode
          : "idle",
      isRunning: typeof obj.isRunning === "boolean" ? obj.isRunning : false,
      remainingSeconds:
        typeof obj.remainingSeconds === "number"
          ? obj.remainingSeconds
          : settings.workDurationMinutes * 60,
      totalDurationSeconds:
        typeof obj.totalDurationSeconds === "number"
          ? obj.totalDurationSeconds
          : settings.workDurationMinutes * 60,
      activeTodo:
        obj.activeTodo && typeof obj.activeTodo === "object"
          ? (obj.activeTodo as PomodoroSessionState["activeTodo"])
          : null,
      completedPomodorosInCycle:
        typeof obj.completedPomodorosInCycle === "number"
          ? obj.completedPomodorosInCycle
          : 0,
      lastStartedAt:
        typeof obj.lastStartedAt === "string" ? obj.lastStartedAt : null,
      currentPreset:
        obj.currentPreset === "classic" ||
        obj.currentPreset === "deep" ||
        obj.currentPreset === "sprint"
          ? obj.currentPreset
          : "classic",
    };
  } catch {
    return createInitialSessionState(settings);
  }
}

/**
 * 保存倒计时运行状态
 */
export async function saveSessionState(
  storage: StorageGateway,
  state: PomodoroSessionState,
): Promise<void> {
  await storage.set(SESSION_STATE_KEY, state);
}
