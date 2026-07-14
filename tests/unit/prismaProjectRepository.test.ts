import { describe, expect, it } from "vitest";
import { PrismaProjectRepository } from "@/domain/project/prismaProjectRepository";
import { createFakePrismaClient } from "./fixtures/fakePrismaClient";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

describe("PrismaProjectRepository (against a fake Prisma Client)", () => {
  it("creates a project using the spec's projectId, then gets/lists/updates/deletes it", async () => {
    const repo = new PrismaProjectRepository(createFakePrismaClient());
    const spec = buildValidSpec({ projectId: "proj-1" });

    const created = await repo.create({ ownerId: "user-1", spec });
    expect(created.id).toBe("proj-1");
    expect(created.spec).toEqual(spec);

    expect(await repo.get("proj-1")).toEqual(created);
    expect(await repo.list("user-1")).toEqual([created]);
    expect(await repo.list("user-2")).toEqual([]);

    const updatedSpec = buildValidSpec({ projectId: "proj-1", version: 2 });
    const updated = await repo.update("proj-1", updatedSpec);
    expect(updated?.currentVersion).toBe(created.currentVersion + 1);
    expect(updated?.spec.version).toBe(2);

    // The prior version snapshot must still be retrievable's not required by this interface,
    // but the *current* getter must reflect the latest version after update.
    expect((await repo.get("proj-1"))?.spec.version).toBe(2);

    expect(await repo.delete("proj-1")).toBe(true);
    expect(await repo.get("proj-1")).toBeUndefined();
  });

  it("returns undefined when getting or updating a project that does not exist", async () => {
    const repo = new PrismaProjectRepository(createFakePrismaClient());
    expect(await repo.get("missing")).toBeUndefined();
    expect(await repo.update("missing", buildValidSpec())).toBeUndefined();
  });

  it("returns false when deleting a project that does not exist", async () => {
    const repo = new PrismaProjectRepository(createFakePrismaClient());
    expect(await repo.delete("missing")).toBe(false);
  });
});
