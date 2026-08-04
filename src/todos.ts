import type { PluginTodo } from "@todoflowy/plugin-contracts";
import type { PluginApi } from "@todoflowy/plugin-sdk";

import { buildTodoFocusNote } from "./core/formatter.js";
import { TodoOperationError } from "./errors.js";

export type TodoItem = PluginTodo;

export type TodoPluginSdkGateway = PluginApi["todos"];

export interface TodoGateway {
  listPendingTodos(query?: {
    search?: string;
    limit?: number;
  }): Promise<readonly TodoItem[]>;
  appendFocusRecord(
    todoId: string,
    durationMinutes: number,
    prefix: string,
  ): Promise<TodoItem>;
}

export function createTodoGateway(sdk: TodoPluginSdkGateway): TodoGateway {
  return {
    async listPendingTodos(query?: {
      search?: string;
      limit?: number;
    }): Promise<readonly TodoItem[]> {
      try {
        const limit = query?.limit ?? 20; // 默认拉取 20 条，不加载全量
        const response = await sdk.list({
          limit,
          search: query?.search,
        });
        const items = response.items ?? [];
        let pending = items.filter(
          (item) => item.status !== "done" && item.status !== "cancelled",
        );

        if (query?.search && query.search.trim().length > 0) {
          const keyword = query.search.trim().toLowerCase();
          pending = pending.filter(
            (item) =>
              item.title.toLowerCase().includes(keyword) ||
              item.description?.toLowerCase().includes(keyword),
          );
        }

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
        const updated = await sdk.update(todoId, {
          description: updatedDescription,
          revision: currentTodo.revision,
        });
        return updated;
      } catch (err) {
        throw new TodoOperationError(
          `Failed to update todo note: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
  };
}
