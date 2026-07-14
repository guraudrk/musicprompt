import type { Project } from "./schema";
import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";

export interface ProjectRepository {
  create(input: { ownerId: string; spec: SongDesignSpec }): Project;
  get(id: string): Project | undefined;
  list(ownerId: string): Project[];
  /** Replaces the spec and increments currentVersion. Returns undefined if the project doesn't exist. */
  update(id: string, spec: SongDesignSpec): Project | undefined;
  delete(id: string): boolean;
}

let nextId = 1;

/**
 * In-memory implementation for the first slice and unit tests. Phase 2 replaces this with a
 * Postgres-backed repository behind the same interface (ADR-002: providers/backends change
 * without touching domain logic).
 */
export class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  create(input: { ownerId: string; spec: SongDesignSpec }): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: String(nextId++),
      ownerId: input.ownerId,
      currentVersion: input.spec.version,
      spec: input.spec,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(project.id, project);
    return project;
  }

  get(id: string): Project | undefined {
    return this.projects.get(id);
  }

  list(ownerId: string): Project[] {
    return [...this.projects.values()].filter((p) => p.ownerId === ownerId);
  }

  update(id: string, spec: SongDesignSpec): Project | undefined {
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

  delete(id: string): boolean {
    return this.projects.delete(id);
  }
}
