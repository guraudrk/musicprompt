import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  const spec = result.project.spec;
  const text = [
    `Working title: ${spec.identity.workingTitle ?? "Untitled"}`,
    `North Star: ${spec.northStar.audienceExperience}`,
    `Final aftertaste: ${spec.northStar.finalAftertaste}`,
    `Non-negotiable core: ${spec.northStar.nonNegotiableCore}`,
    "",
    `Lyrics mode: ${spec.lyricsDesign.mode}`,
    spec.lyricsDesign.originalLyrics ?? "",
  ].join("\n");

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="project-${projectId}.txt"`,
    },
  });
}
