import { describe, expect, it } from "vitest";
import { InMemoryProjectRepository } from "@/domain/project/projectRepository";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

describe("InMemoryProjectRepository", () => {
  it("supports create, get, list, update, and delete", () => {
    const repo = new InMemoryProjectRepository();
    const spec = buildValidSpec();

    const created = repo.create({ ownerId: "user-1", spec });
    expect(repo.get(created.id)).toEqual(created);
    expect(repo.list("user-1")).toEqual([created]);
    expect(repo.list("user-2")).toEqual([]);

    const updatedSpec = buildValidSpec({ version: 2 });
    const updated = repo.update(created.id, updatedSpec);
    expect(updated?.currentVersion).toBe(created.currentVersion + 1);
    expect(updated?.spec.version).toBe(2);

    expect(repo.delete(created.id)).toBe(true);
    expect(repo.get(created.id)).toBeUndefined();
  });

  it("returns undefined when updating a project that does not exist", () => {
    const repo = new InMemoryProjectRepository();
    expect(repo.update("missing-id", buildValidSpec())).toBeUndefined();
  });
});
