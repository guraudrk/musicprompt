import type { PrismaClient } from "@/generated/prisma/client";

type FakeProjectRow = { id: string; ownerId: string; currentVersion: number; createdAt: Date; updatedAt: Date };
type FakeVersionRow = { id: string; projectId: string; version: number; songDesignSpec: unknown; createdAt: Date };

/**
 * Hand-written fake implementing only the Prisma Client methods PrismaProjectRepository calls
 * (project/projectVersion CRUD + $transaction). Lets us test ownership/versioning logic without a
 * live Postgres connection (this sandbox has none — see IMPLEMENTATION_PLAN.md Phase 2 notes).
 */
export class FakePrismaClient {
  private readonly projects = new Map<string, FakeProjectRow>();
  private readonly versions = new Map<string, FakeVersionRow>();
  private idCounter = 1;

  project = {
    create: async ({ data }: { data: { id?: string; ownerId: string; currentVersion: number } }) => {
      const id = data.id ?? String(this.idCounter++);
      const now = new Date();
      const row: FakeProjectRow = { id, ownerId: data.ownerId, currentVersion: data.currentVersion, createdAt: now, updatedAt: now };
      this.projects.set(id, row);
      return row;
    },
    findUnique: async ({ where }: { where: { id: string } }) => this.projects.get(where.id) ?? null,
    findMany: async ({ where }: { where: { ownerId: string } }) =>
      [...this.projects.values()].filter((p) => p.ownerId === where.ownerId),
    update: async ({ where, data }: { where: { id: string }; data: { currentVersion: number } }) => {
      const existing = this.projects.get(where.id);
      if (!existing) throw new Error("Record to update not found.");
      const updated: FakeProjectRow = { ...existing, currentVersion: data.currentVersion, updatedAt: new Date() };
      this.projects.set(where.id, updated);
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const existing = this.projects.get(where.id);
      if (!existing) throw new Error("Record to delete does not exist.");
      this.projects.delete(where.id);
      return existing;
    },
  };

  projectVersion = {
    create: async ({ data }: { data: { projectId: string; version: number; songDesignSpec: unknown } }) => {
      const now = new Date();
      const row: FakeVersionRow = {
        id: `${data.projectId}:${data.version}`,
        projectId: data.projectId,
        version: data.version,
        songDesignSpec: data.songDesignSpec,
        createdAt: now,
      };
      this.versions.set(row.id, row);
      return row;
    },
    findUnique: async ({ where }: { where: { projectId_version: { projectId: string; version: number } } }) =>
      this.versions.get(`${where.projectId_version.projectId}:${where.projectId_version.version}`) ?? null,
  };

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    return fn(this);
  }
}

export function createFakePrismaClient(): PrismaClient {
  return new FakePrismaClient() as unknown as PrismaClient;
}
