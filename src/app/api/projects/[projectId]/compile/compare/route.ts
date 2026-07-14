import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { compileAllStrategies } from "@/compiler/pipeline";
import { compilePipelineDeps } from "@/lib/compilerDeps";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({ providerId: z.string().min(1) });

type Params = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  const body = await request.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "providerId is required." }, { status: 400 });
  }

  try {
    const { safe, balanced, bold } = await compileAllStrategies(
      result.project.spec,
      parsedBody.data.providerId,
      compilePipelineDeps,
    );

    await prisma.promptPackage.createMany({
      data: [safe, balanced, bold].map(({ package: pkg }) => ({
        projectId,
        providerId: pkg.providerId,
        providerProfileVersion: pkg.providerProfileVersion,
        strategy: pkg.strategy,
        fields: pkg.fields,
        warnings: pkg.warnings,
        promptQuality: pkg.promptQuality,
      })),
    });

    return NextResponse.json({ safe: safe.package, balanced: balanced.package, bold: bold.package });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Compile failed." }, { status: 400 });
  }
}
