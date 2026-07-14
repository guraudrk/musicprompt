import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { runTheoryEngines } from "@/theory/runTheoryEngines";

type Params = { params: Promise<{ projectId: string }> };

/**
 * Read-only: runs the 7 theory engines against the project's currently saved spec and returns the
 * result. Nothing is persisted here — dismissing a warning or locking a field is a normal spec
 * edit, saved via the existing `PATCH /api/projects/{id}` (Phase 4, IMPLEMENTATION_PLAN.md).
 */
export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  const compositionTheory = runTheoryEngines(result.project.spec);
  return NextResponse.json({ compositionTheory });
}
