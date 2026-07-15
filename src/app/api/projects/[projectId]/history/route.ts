import { NextResponse } from "next/server";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

const HISTORY_LIMIT = 50;

/**
 * Read-only history of past compiles for this project — every PromptPackage row is already
 * persisted on each successful compile (see compile/compare/route.ts); this just lists them back
 * out, newest first, instead of only ever showing the most recent result.
 */
export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  const packages = await prisma.promptPackage.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  const history = packages.map((pkg) => {
    const fields = pkg.fields as { style?: string; lyrics?: string };
    return {
      id: pkg.id,
      strategy: pkg.strategy,
      providerId: pkg.providerId,
      model: pkg.model,
      apiMode: pkg.apiMode,
      style: fields.style ?? null,
      lyrics: fields.lyrics ?? null,
      createdAt: pkg.createdAt,
    };
  });

  return NextResponse.json({ history });
}
