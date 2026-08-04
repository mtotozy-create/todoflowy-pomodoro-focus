interface ElementOptions<T extends HTMLElement> {
  readonly className?: string;
  readonly id?: string;
  readonly text?: string;
  readonly title?: string;
  readonly attributes?: Record<string, string>;
}

/**
 * 安全创建 HTML 元素，禁止使用 innerHTML 以符合 Plugin 安全规范
 * @param tag HTML 标签名称
 * @param options 可选的属性与文本配置
 * @returns 实例化的 HTML 元素
 */
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.id) el.id = options.id;
  if (options.text !== undefined) el.textContent = options.text;
  if (options.title !== undefined) el.title = options.title;
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

/**
 * 创建按钮辅助函数
 * @param label 按钮显示文本
 * @param onClick 点击事件回调
 * @param className 可选 CSS 类名
 * @returns HTMLButtonElement 实例
 */
export function button(
  label: string,
  onClick: (event: MouseEvent) => void,
  className = "",
): HTMLButtonElement {
  const btn = element("button", { className, text: label });
  btn.type = "button";
  btn.addEventListener("click", onClick);
  return btn;
}
