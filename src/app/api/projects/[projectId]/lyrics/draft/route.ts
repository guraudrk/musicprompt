import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { lyricsDraftGenerator } from "@/lib/lyricsDeps";
import { validateLyricsDraftSet } from "@/lyrics/validateDraftSet";

type Params = { params: Promise<{ projectId: string }> };

/**
 * Generates 3 lyric drafts (A/B/C) for the project's currently saved spec (Phase 5). Not
 * persisted — applying a chosen draft is a normal spec edit via the existing
 * `PATCH /api/projects/{id}`, same reuse pattern as Phase 4's theory-warning dismiss/lock.
 */
export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  try {
    const draftSet = await lyricsDraftGenerator.draft({ spec: result.project.spec });

    const validation = validateLyricsDraftSet(result.project.spec, draftSet);
    if (!validation.ok) {
      return NextResponse.json({ error: "Lyrics drafts failed validation.", issues: validation.errors }, { status: 400 });
    }

    return NextResponse.json(draftSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Draft generation failed." }, { status: 400 });
  }
}
