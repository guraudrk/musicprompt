import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { projectRepository } from "@/lib/repositories";
import { SongDesignSpecSchema } from "@/domain/songDesignSpec/schema";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  return NextResponse.json({ project: result.project });
}

export async function PATCH(request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  const body = await request.json().catch(() => null);
  // Server-side version increment (ignores any client-supplied version) — this slice does
  // deliberately-simplified autosave, not full optimistic-concurrency conflict rejection.
  const specInput = { ...body, projectId, version: result.project.currentVersion + 1 };

  const parsed = SongDesignSpecSchema.safeParse(specInput);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid song design spec.", issues: parsed.error.issues }, { status: 400 });
  }

  const updated = await projectRepository.update(projectId, parsed.data);
  return NextResponse.json({ project: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  await projectRepository.delete(projectId);
  return new NextResponse(null, { status: 204 });
}
