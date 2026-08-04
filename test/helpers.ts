import type { PluginTodo } from "@todoflowy/plugin-contracts";

import type { StorageGateway } from "../src/storage.js";
import type { TodoPluginSdkGateway } from "../src/todos.js";

export class MemoryStorage implements StorageGateway {
  private data = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, JSON.parse(JSON.stringify(value)));
  }
}

export class MemoryTodoSdk implements TodoPluginSdkGateway {
  public items: PluginTodo[] = [
    {
      id: "todo-1",
      title: "Write documentation",
      status: "todo",
      priority: "medium",
      projectId: null,
      description: "Initial draft",
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "todo-2",
      title: "Review pull requests",
      status: "in_progress",
      priority: "high",
      projectId: null,
      revision: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  async list(): Promise<{ items: PluginTodo[]; nextCursor: string | null }> {
    return { items: [...this.items], nextCursor: null };
  }

  async get(id: string): Promise<PluginTodo | null> {
    const found = this.items.find((item) => item.id === id);
    return found ? { ...found } : null;
  }

  async create(): Promise<PluginTodo> {
    throw new Error("Not implemented");
  }

  async complete(): Promise<PluginTodo> {
    throw new Error("Not implemented");
  }

  async update(
    id: string,
    changes: { description?: string; revision?: number },
  ): Promise<PluginTodo> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Not found");
    const current = this.items[index];
    if (changes.revision !== undefined && current.revision !== changes.revision) {
      throw new Error("CONFLICT");
    }
    const updated: PluginTodo = {
      ...current,
      ...(changes.description !== undefined
        ? { description: changes.description }
        : {}),
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    this.items[index] = updated;
    return updated;
  }
}
