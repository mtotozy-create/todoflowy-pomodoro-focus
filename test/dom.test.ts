import { describe, expect, it } from "vitest";

import { button, element } from "../src/dom.js";

describe("dom helper tests", () => {
  it("creates elements safely with options", () => {
    const el = element("div", {
      className: "card",
      id: "c1",
      text: "hello",
      title: "card title",
      attributes: { "data-test": "val" },
    });

    expect(el.className).toBe("card");
    expect(el.id).toBe("c1");
    expect(el.textContent).toBe("hello");
    expect(el.title).toBe("card title");
    expect(el.getAttribute("data-test")).toBe("val");
  });

  it("creates button and triggers click listener", () => {
    let clicked = false;
    const btn = button("Click Me", () => {
      clicked = true;
    });

    expect(btn.textContent).toBe("Click Me");
    btn.click();
    expect(clicked).toBe(true);
  });
});
