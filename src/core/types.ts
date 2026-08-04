/**
 * 番茄钟会话模式：空闲、专注中、短休中、长休中
 */
export type PomodoroMode = "idle" | "work" | "shortBreak" | "longBreak";

/**
 * 预设专注模式类型：经典 (25m)、深度 (50m)、冲刺 (15m)
 */
export type FocusPreset = "classic" | "deep" | "sprint";

/**
 * 番茄钟设置选项
 */
export interface PomodoroSettings {
  /** 专注时长（分钟），默认 25 */
  readonly workDurationMinutes: number;
  /** 短休时长（分钟），默认 5 */
  readonly shortBreakDurationMinutes: number;
  /** 长休时长（分钟），默认 15 */
  readonly longBreakDurationMinutes: number;
  /** 触发长休所需的连续完成番茄数，默认 4 */
  readonly longBreakInterval: number;
  /** 是否在倒计时结束时自动开始休/专注，默认 false */
  readonly autoStartBreaks: boolean;
  /** 自动更新待办备注的前缀标签，默认 "[Focus]" */
  readonly notePrefix: string;
}

/**
 * 关联的待办摘要
 */
export interface ActiveTodoInfo {
  readonly id: string;
  readonly title: string;
  readonly revision: number;
  /** 预估番茄数 (1 - 8)，默认 1 */
  readonly estimatedPomodoros?: number;
  /** 已完成番茄数 */
  readonly completedPomodoros?: number;
}

/**
 * 实时番茄钟运行快照状态
 */
export interface PomodoroSessionState {
  readonly mode: PomodoroMode;
  readonly isRunning: boolean;
  readonly remainingSeconds: number;
  readonly totalDurationSeconds: number;
  readonly activeTodo: ActiveTodoInfo | null;
  readonly completedPomodorosInCycle: number;
  readonly lastStartedAt: string | null;
  readonly currentPreset?: FocusPreset;
}

/**
 * 每日专注数据条目
 */
export interface DailyFocusStat {
  readonly date: string; // YYYY-MM-DD
  readonly completedPomodoros: number;
  readonly totalFocusMinutes: number;
}

/**
 * 按 Todo 划分的统计记录
 */
export interface TodoFocusStat {
  readonly todoId: string;
  readonly todoTitle: string;
  readonly completedPomodoros: number;
  readonly totalFocusMinutes: number;
}

/**
 * 专注时间线日志
 */
export interface FocusTimelineLog {
  readonly id: string;
  readonly time: string; // HH:MM
  readonly minutes: number;
  readonly todoTitle?: string;
  readonly date: string; // YYYY-MM-DD
}

/**
 * 全局专注统计数据持久化 Schema
 */
export interface PomodoroStatsRecord {
  readonly version: 1;
  readonly totalCompletedPomodoros: number;
  readonly totalFocusMinutes: number;
  readonly dailyStats: Record<string, DailyFocusStat>;
  readonly todoStats: Record<string, TodoFocusStat>;
  readonly timelineLogs?: readonly FocusTimelineLog[];
  readonly lastUpdated: string;
}
