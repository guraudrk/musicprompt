import "server-only";
import type { PrismaClient, Project as PrismaProjectRow, ProjectVersion as PrismaProjectVersionRow } from "@/generated/prisma/client";
import { SongDesignSpecSchema, type SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { Project } from "./schema";
import type { ProjectRepository } from "./projectRepository";

function toDomainProject(project: PrismaProjectRow, version: PrismaProjectVersionRow): Project {
  return {
    id: project.id,
    ownerId: project.ownerId,
    currentVersion: project.currentVersion,
    spec: SongDesignSpecSchema.parse(version.songDesignSpec),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/**
 * Postgres-backed implementation of ProjectRepository (Phase 2, ADR-025). `SongDesignSpec`
 * snapshots live in `ProjectVersion.songDesignSpec` (jsonb); `Project.currentVersion` always
 * points at the latest one. Create/update use a transaction so the two stay in sync.
 */
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { ownerId: string; spec: SongDesignSpec }): Promise<Project> {
    const { project, version } = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        // `id` is set explicitly (rather than relying on @default(cuid())) so it matches
        // `input.spec.projectId`, which the caller generates upfront (see /api/projects POST).
        data: { id: input.spec.projectId, ownerId: input.ownerId, currentVersion: input.spec.version },
      });
      const version = await tx.projectVersion.create({
        data: { projectId: project.id, version: input.spec.version, songDesignSpec: input.spec },
      });
      return { project, version };
    });
    return toDomainProject(project, version);
  }

  async get(id: string): Promise<Project | undefined> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) return undefined;

    const version = await this.prisma.projectVersion.findUnique({
      where: { projectId_version: { projectId: id, version: project.currentVersion } },
    });
    if (!version) return undefined;

    return toDomainProject(project, version);
  }

  async list(ownerId: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({ where: { ownerId } });

    const results = await Promise.all(
      projects.map(async (project) => {
        const version = await this.prisma.projectVersion.findUnique({
          where: { projectId_version: { projectId: project.id, version: project.currentVersion } },
        });
        return version ? toDomainProject(project, version) : undefined;
      }),
    );

    return results.filter((p): p is Project => p !== undefined);
  }

  async update(id: string, spec: SongDesignSpec): Promise<Project | undefined> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) return undefined;

    const nextVersion = existing.currentVersion + 1;
    const { project, version } = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({ where: { id }, data: { currentVersion: nextVersion } });
      const version = await tx.projectVersion.create({
        data: { projectId: id, version: nextVersion, songDesignSpec: spec },
      });
      return { project, version };
    });

    return toDomainProject(project, version);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.project.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
