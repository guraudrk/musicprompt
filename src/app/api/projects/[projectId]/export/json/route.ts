import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  return new NextResponse(JSON.stringify(result.project.spec, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="project-${projectId}.json"`,
    },
  });
}
