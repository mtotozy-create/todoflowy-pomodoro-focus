export const TASK_VIEW_CSS = `
:host, .pomodoro-studio-app {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--theme-text-color, CanvasText);
  background-color: var(--theme-bg-color, Canvas);
}

.pomodoro-studio-app {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

/* 顶部 App Bar */
.pomodoro-studio__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
}

.pomodoro-studio__title {
  font-size: 20px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pomodoro-studio__badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--theme-badge-bg, rgba(239, 68, 68, 0.15));
  color: var(--theme-badge-fg, #ef4444);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.pomodoro-studio__pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pomodoro-studio__pill {
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 桌面级双列 Bento Grid 充满剩余高度 */
.pomodoro-studio__grid {
  display: grid;
  grid-template-columns: 1fr minmax(340px, 380px);
  gap: 24px;
  width: 100%;
  flex: 1;
}

@media (max-width: 860px) {
  .pomodoro-studio__grid {
    grid-template-columns: 1fr;
  }
}

/* 左栏：主专注控制台 */
.pomodoro-studio__main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

/* Presets Quick Switch Bar */
.pomodoro-presets {
  display: flex;
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  padding: 6px;
  border-radius: 12px;
  gap: 8px;
}

.pomodoro-preset-btn {
  flex: 1;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--theme-muted-color, #6b7280);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.pomodoro-preset-btn--active {
  background: var(--theme-primary-color, #ef4444);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* 大气超大 Timer 核心卡片 */
.pomodoro-timer-card {
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  border-radius: 20px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  flex: 1;
  justify-content: center;
}

.pomodoro-timer-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 5px;
  background: linear-gradient(90deg, #ef4444, #f59e0b);
}

.pomodoro-mode-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

/* 无斜线的纯圆柱数字字体 */
.pomodoro-timer-display {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 88px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--theme-text-color, CanvasText);
  line-height: 1;
  margin: 10px 0;
}

/* 当前目标 Todo Banner */
.pomodoro-target-banner {
  width: 100%;
  max-width: 600px;
  background: var(--theme-bg-color, Canvas);
  border: 1px dashed var(--theme-border-color, rgba(125, 125, 125, 0.3));
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pomodoro-target-banner__header {
  font-size: 12px;
  font-weight: 700;
  color: var(--theme-muted-color, #6b7280);
  display: flex;
  justify-content: space-between;
}

.pomodoro-target-banner__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--theme-text-color, CanvasText);
}

/* 番茄进度图标列表组 */
.pomodoro-banner-icons-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.pomodoro-icon-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.pomodoro-icon-dot--completed {
  background: rgba(239, 68, 68, 0.15);
}

.pomodoro-icon-dot--pending {
  background: rgba(125, 125, 125, 0.15);
  border: 1px dashed var(--theme-border-color, rgba(125, 125, 125, 0.4));
  color: var(--theme-muted-color, #9ca3af);
  font-size: 10px;
}

/* 控制按钮组 */
.pomodoro-controls-row {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 480px;
}

.pomodoro-btn-giant-primary {
  flex: 2;
  padding: 16px;
  font-size: 16px;
  font-weight: 800;
  border-radius: 12px;
  border: none;
  background: var(--theme-primary-color, #ef4444);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
  transition: transform 0.15s ease, opacity 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pomodoro-btn-giant-primary:hover {
  opacity: 0.95;
}

.pomodoro-btn-giant-primary:active {
  transform: scale(0.98);
}

.pomodoro-btn-giant-warning {
  flex: 1;
  padding: 16px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pomodoro-btn-giant-warning:hover {
  background: rgba(245, 158, 11, 0.2);
}

.pomodoro-btn-giant-sub {
  flex: 1;
  padding: 16px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  color: var(--theme-text-color, CanvasText);
  cursor: pointer;
  transition: background-color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 右栏：侧边管理抽屉 (Task Picker & Timeline Logs) */
.pomodoro-studio__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.pomodoro-panel-card {
  background: var(--theme-card-bg, rgba(125, 125, 125, 0.05));
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pomodoro-search-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  background: var(--theme-bg-color, Canvas);
  color: var(--theme-text-color, CanvasText);
  outline: none;
}

.pomodoro-search-input:focus {
  border-color: var(--theme-primary-color, #ef4444);
}

.pomodoro-picker-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  padding-bottom: 8px;
}

.pomodoro-tab-item {
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-muted-color, #6b7280);
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
}

.pomodoro-tab-item--active {
  color: var(--theme-primary-color, #ef4444);
  background: var(--theme-badge-bg, rgba(239, 68, 68, 0.15));
}

.pomodoro-todo-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.2));
  background: var(--theme-bg-color, Canvas);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pomodoro-todo-card:hover, .pomodoro-todo-card--selected {
  border-color: var(--theme-primary-color, #ef4444);
  background: var(--theme-badge-bg, rgba(239, 68, 68, 0.1));
}

.pomodoro-est-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.pomodoro-est-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid var(--theme-border-color, rgba(125, 125, 125, 0.3));
  background: var(--theme-bg-color, Canvas);
  color: var(--theme-text-color, CanvasText);
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pomodoro-timeline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--theme-border-color, rgba(125, 125, 125, 0.2));
  font-size: 13px;
}

.pomodoro-timeline-item:last-child {
  border-bottom: none;
}
`;
