/**
 * 将总秒数转化为 MM:SS 显示字符串
 * @param seconds 总秒数
 * @returns 格式化后的时间字符串 (如 "25:00")
 */
export function formatTime(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  const paddedMins = String(mins).padStart(2, "0");
  const paddedSecs = String(secs).padStart(2, "0");
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * 将分钟数转换为易读的专注时长表达
 * @param minutes 分钟数
 * @returns 格式化的时长文本
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * 构造写入待办备注的专注记录文本
 * @param prefix 前缀标识，例如 "[Focus]"
 * @param durationMinutes 本次专注分钟数
 * @param dateStr 专注日期 ISO 字符串
 * @returns 追加在 Todo 描述或备注中的单行记录
 */
export function buildTodoFocusNote(
  prefix: string,
  durationMinutes: number,
  dateStr: string,
): string {
  const formattedDate = dateStr.slice(0, 10);
  return `${prefix} 🍅 Completed 1 pomodoro (${durationMinutes}m) on ${formattedDate}`;
}
