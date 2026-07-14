import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { projectRepository } from "@/lib/repositories";
import { buildDefaultSpec } from "@/domain/songDesignSpec/defaultSpec";
import { SongDesignSpecSchema } from "@/domain/songDesignSpec/schema";
import { errorResponse } from "@/lib/authz";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse(401);

  const projects = await projectRepository.list(userId);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse(401);

  const projectId = randomUUID();
  const body = await request.json().catch(() => null);
  const specInput = { ...buildDefaultSpec(projectId), ...(body?.spec ?? {}), projectId };

  const parsed = SongDesignSpecSchema.safeParse(specInput);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid song design spec.", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await projectRepository.create({ ownerId: userId, spec: parsed.data });
  return NextResponse.json({ project }, { status: 201 });
}
