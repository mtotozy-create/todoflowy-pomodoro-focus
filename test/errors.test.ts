import { describe, expect, it } from "vitest";

import {
  PluginDomainError,
  StorageRecordError,
  TodoOperationError,
} from "../src/errors.js";

describe("errors tests", () => {
  it("creates domain errors with proper name and message", () => {
    const err1 = new PluginDomainError("base error");
    expect(err1.name).toBe("PluginDomainError");
    expect(err1.message).toBe("base error");

    const err2 = new StorageRecordError("storage fail");
    expect(err2.name).toBe("StorageRecordError");

    const err3 = new TodoOperationError("todo fail");
    expect(err3.name).toBe("TodoOperationError");
  });
});
