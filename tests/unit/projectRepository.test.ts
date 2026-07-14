import { describe, expect, it } from "vitest";
import { InMemoryProjectRepository } from "@/domain/project/projectRepository";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

describe("InMemoryProjectRepository", () => {
  it("supports create, get, list, update, and delete", async () => {
    const repo = new InMemoryProjectRepository();
    const spec = buildValidSpec();

    const created = await repo.create({ ownerId: "user-1", spec });
    expect(await repo.get(created.id)).toEqual(created);
    expect(await repo.list("user-1")).toEqual([created]);
    expect(await repo.list("user-2")).toEqual([]);

    const updatedSpec = buildValidSpec({ version: 2 });
    const updated = await repo.update(created.id, updatedSpec);
    expect(updated?.currentVersion).toBe(created.currentVersion + 1);
    expect(updated?.spec.version).toBe(2);

    expect(await repo.delete(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeUndefined();
  });

  it("returns undefined when updating a project that does not exist", async () => {
    const repo = new InMemoryProjectRepository();
    expect(await repo.update("missing-id", buildValidSpec())).toBeUndefined();
  });
});
