import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { projectRepository } from "./repositories";
import type { Project } from "@/domain/project/schema";

export type OwnedProjectResult =
  | { ok: true; project: Project; userId: string }
  | { ok: false; status: 401 | 403 | 404 };

/** Enforces "another user cannot access it" (IMPLEMENTATION_PLAN.md Phase 2 definition of done). */
export async function requireOwnedProject(projectId: string): Promise<OwnedProjectResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, status: 401 };

  const project = await projectRepository.get(projectId);
  if (!project) return { ok: false, status: 404 };
  if (project.ownerId !== userId) return { ok: false, status: 403 };

  return { ok: true, project, userId };
}

const STATUS_MESSAGES = { 401: "Unauthorized", 403: "Forbidden", 404: "Not found" } as const;

export function errorResponse(status: 401 | 403 | 404) {
  return NextResponse.json({ error: STATUS_MESSAGES[status] }, { status });
}
