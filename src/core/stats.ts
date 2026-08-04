import type {
  DailyFocusStat,
  FocusTimelineLog,
  PomodoroStatsRecord,
  TodoFocusStat,
} from "./types.js";

/**
 * 创建空白的初始专注统计记录
 * @param nowIso ISO 时间戳
 * @returns PomodoroStatsRecord 初始对象
 */
export function createInitialStats(nowIso: string): PomodoroStatsRecord {
  return {
    version: 1,
    totalCompletedPomodoros: 0,
    totalFocusMinutes: 0,
    dailyStats: {},
    todoStats: {},
    timelineLogs: [],
    lastUpdated: nowIso,
  };
}

/**
 * 在完成一个番茄钟后纯函数更新统计对象
 * @param current 当前统计记录
 * @param focusMinutes 本次专注的分钟数
 * @param now Date 实例
 * @param todoInfo 可选的关联 Todo 信息
 * @returns 更新后的全新 PomodoroStatsRecord 实例
 */
export function recordCompletedPomodoro(
  current: PomodoroStatsRecord,
  focusMinutes: number,
  now: Date,
  todoInfo?: { id: string; title: string } | null,
): PomodoroStatsRecord {
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM
  const nowIso = now.toISOString();

  // 1. 更新每日统计
  const existingDaily: DailyFocusStat = current.dailyStats[dateStr] ?? {
    date: dateStr,
    completedPomodoros: 0,
    totalFocusMinutes: 0,
  };
  const updatedDaily: DailyFocusStat = {
    ...existingDaily,
    completedPomodoros: existingDaily.completedPomodoros + 1,
    totalFocusMinutes: existingDaily.totalFocusMinutes + focusMinutes,
  };

  // 2. 更新特定 Todo 统计
  const nextTodoStats = { ...current.todoStats };
  if (todoInfo) {
    const existingTodo: TodoFocusStat = nextTodoStats[todoInfo.id] ?? {
      todoId: todoInfo.id,
      todoTitle: todoInfo.title,
      completedPomodoros: 0,
      totalFocusMinutes: 0,
    };
    nextTodoStats[todoInfo.id] = {
      ...existingTodo,
      todoTitle: todoInfo.title,
      completedPomodoros: existingTodo.completedPomodoros + 1,
      totalFocusMinutes: existingTodo.totalFocusMinutes + focusMinutes,
    };
  }

  // 3. 增加时间线日志条目 (保持最新 50 条)
  const newLog: FocusTimelineLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: timeStr,
    minutes: focusMinutes,
    todoTitle: todoInfo?.title,
    date: dateStr,
  };
  const currentLogs = current.timelineLogs ?? [];
  const updatedLogs = [newLog, ...currentLogs].slice(0, 50);

  return {
    version: 1,
    totalCompletedPomodoros: current.totalCompletedPomodoros + 1,
    totalFocusMinutes: current.totalFocusMinutes + focusMinutes,
    dailyStats: {
      ...current.dailyStats,
      [dateStr]: updatedDaily,
    },
    todoStats: nextTodoStats,
    timelineLogs: updatedLogs,
    lastUpdated: nowIso,
  };
}
