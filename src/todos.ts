import type { PluginTodo } from "@todoflowy/plugin-contracts";
import type { PluginApi } from "@todoflowy/plugin-sdk";

import { buildTodoFocusNote } from "./core/formatter.js";
import { TodoOperationError } from "./errors.js";

export type TodoItem = PluginTodo;

export type TodoPluginSdkGateway = PluginApi["todos"];

export interface TodoGateway {
  listPendingTodos(): Promise<readonly TodoItem[]>;
  appendFocusRecord(
    todoId: string,
    durationMinutes: number,
    prefix: string,
  ): Promise<TodoItem>;
}

export function createTodoGateway(sdk: TodoPluginSdkGateway): TodoGateway {
  return {
    async listPendingTodos(): Promise<readonly TodoItem[]> {
      try {
        const response = await sdk.list({ limit: 100 });
        const items = response.items ?? [];
        const pending = items.filter(
          (item) => item.status !== "done" && item.status !== "cancelled",
        );
        return pending;
      } catch (err) {
        throw new TodoOperationError(
          `Failed to fetch todo list: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },

    async appendFocusRecord(
      todoId: string,
      durationMinutes: number,
      prefix: string,
    ): Promise<TodoItem> {
      const currentTodo = await sdk.get(todoId);
      if (!currentTodo) {
        throw new TodoOperationError(`Todo not found: ${todoId}`);
      }

      const noteLine = buildTodoFocusNote(
        prefix,
        durationMinutes,
        new Date().toISOString(),
      );

      const existingDescription = currentTodo.description ?? "";
      const updatedDescription = existingDescription
        ? `${existingDescription}\n${noteLine}`
        : noteLine;

      try {
        const updated = await sdk.update(
          todoId,
          {
            description: updatedDescription,
            revision: currentTodo.revision,
          },
        );
        return updated;
      } catch (err) {
        throw new TodoOperationError(
          `Failed to update todo note: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
  };
}
