import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { specInterpreter } from "@/lib/specInterpreterDeps";
import { validateInterpretation } from "@/spec-interpreter/validateInterpretation";

type Params = { params: Promise<{ projectId: string }> };

/**
 * Suggests musicalIdentity/lyricsDesign.mode values inferred from the project's currently saved
 * North Star text (ADR-044) — not persisted; applying a suggestion is a normal spec edit via the
 * existing PATCH /api/projects/{id}, same reuse pattern as the lyrics-draft and theory-warning
 * flows. Requires the North Star to already be saved, matching the existing Analyze/Generate
 * Drafts precedent.
 */
export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  try {
    const interpretation = await specInterpreter.interpret({ spec: result.project.spec });
    const validated = validateInterpretation(result.project.spec, interpretation);
    return NextResponse.json({ interpretation: validated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Spec interpretation failed." },
      { status: 400 },
    );
  }
}
