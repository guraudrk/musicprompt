import type { Project } from "./schema";
import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";

/**
 * Async because Phase 2 adds a real Postgres-backed implementation (PrismaProjectRepository)
 * alongside the in-memory one used by Phase 0-1's pipeline tests (ADR-002: swappable backends
 * behind a stable domain interface).
 */
export interface ProjectRepository {
  create(input: { ownerId: string; spec: SongDesignSpec }): Promise<Project>;
  get(id: string): Promise<Project | undefined>;
  list(ownerId: string): Promise<Project[]>;
  /** Replaces the spec and increments currentVersion. Returns undefined if the project doesn't exist. */
  update(id: string, spec: SongDesignSpec): Promise<Project | undefined>;
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory implementation for unit tests and any code path that doesn't need real persistence.
 * `PrismaProjectRepository` (src/domain/project/prismaProjectRepository.ts) is the Postgres-backed
 * implementation used by the API routes.
 */
export class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  async create(input: { ownerId: string; spec: SongDesignSpec }): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: input.spec.projectId,
      ownerId: input.ownerId,
      currentVersion: input.spec.version,
      spec: input.spec,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(project.id, project);
    return project;
  }

  async get(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async list(ownerId: string): Promise<Project[]> {
    return [...this.projects.values()].filter((p) => p.ownerId === ownerId);
  }

  async update(id: string, spec: SongDesignSpec): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    const updated: Project = {
      ...existing,
      spec,
      currentVersion: existing.currentVersion + 1,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }
}
