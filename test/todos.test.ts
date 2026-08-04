import { describe, expect, it } from "vitest";

import { TodoOperationError } from "../src/errors.js";
import { createTodoGateway } from "../src/todos.js";
import { MemoryTodoSdk } from "./helpers.js";

describe("todos gateway tests", () => {
  it("lists pending todos and filters with search keyword and today filter", async () => {
    const sdk = new MemoryTodoSdk();
    const gateway = createTodoGateway(sdk);

    const pending = await gateway.listPendingTodos({ limit: 10 });
    expect(pending.length).toBe(2);

    const filtered = await gateway.listPendingTodos({ search: "Write" });
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Write documentation");

    const todayFiltered = await gateway.listPendingTodos({
      filter: "today",
      todayIsoDate: "2026-08-04T12:00:00.000Z",
    });
    expect(todayFiltered.length).toBeGreaterThan(0);
  });

  it("appends focus record to todo note with correct revision", async () => {
    const sdk = new MemoryTodoSdk();
    const gateway = createTodoGateway(sdk);

    const updated = await gateway.appendFocusRecord("todo-1", 25, "[Focus]");
    expect(updated.revision).toBe(2);
    expect(updated.description).toContain("Initial draft");
    expect(updated.description).toContain(
      "[Focus] 🍅 Completed 1 pomodoro (25m)",
    );
  });

  it("throws TodoOperationError on todo not found or conflict", async () => {
    const sdk = new MemoryTodoSdk();
    const gateway = createTodoGateway(sdk);

    await expect(
      gateway.appendFocusRecord("non-existent-id", 25, "[Focus]"),
    ).rejects.toThrow(TodoOperationError);
  });
});
