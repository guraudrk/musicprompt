import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnedProject, errorResponse } from "@/lib/authz";
import { compilePromptPackage } from "@/compiler/pipeline";
import { compilePipelineDeps } from "@/lib/compilerDeps";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({ strategy: z.enum(["safe", "balanced", "bold"]) });

type Params = { params: Promise<{ projectId: string; providerId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { projectId, providerId } = await params;
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return errorResponse(result.status);

  const body = await request.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "strategy must be safe, balanced, or bold." }, { status: 400 });
  }

  try {
    const { package: pkg, metadata } = await compilePromptPackage(
      result.project.spec,
      providerId,
      parsedBody.data.strategy,
      compilePipelineDeps,
    );

    await prisma.promptPackage.create({
      data: {
        projectId,
        providerId: pkg.providerId,
        providerProfileVersion: pkg.providerProfileVersion,
        strategy: pkg.strategy,
        fields: pkg.fields,
        warnings: pkg.warnings,
        promptQuality: pkg.promptQuality,
        model: metadata.model,
        apiMode: metadata.apiMode,
        promptTemplateVersion: metadata.promptTemplateVersion,
        schemaVersion: metadata.schemaVersion,
        latencyMs: metadata.latencyMs,
        repairCount: metadata.repairCount,
      },
    });

    return NextResponse.json({ package: pkg });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Compile failed." }, { status: 400 });
  }
}
