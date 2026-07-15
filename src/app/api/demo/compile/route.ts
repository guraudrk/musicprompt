import { NextResponse } from "next/server";
import { z } from "zod";
import { compilePromptPackage } from "@/compiler/pipeline";
import { InMemoryProviderRegistry } from "@/providers/registry";
import { MockPromptCompiler } from "@/llm/mock/mockPromptCompiler";
import { MockPromptEvaluator } from "@/llm/mock/mockPromptEvaluator";
import { buildDefaultSpec } from "@/domain/songDesignSpec/defaultSpec";
import { extractHints } from "./extractHints";

/**
 * Anonymous, no-login demo of the compile pipeline for the landing page. Deliberately isolated
 * from the real project/auth system: no `@/lib/authz`, no repository, no `prisma` call, no
 * persistence at all. Deliberately Mock-only — this hand-builds its own deps instead of importing
 * `compilePipelineDeps` from `@/lib/compilerDeps`, which would resolve to real Gemini whenever
 * GEMINI_API_KEY/GEMINI_MODEL/GEMINI_API_MODE are configured. There is no rate limiting yet
 * (tracked as a pending gap since Phase 0), so an unauthenticated route must never be able to
 * trigger a real, billable Gemini call. See DECISIONS.md.
 */
const BodySchema = z.object({ idea: z.string().min(1).max(2000) });

const demoDeps = {
  registry: new InMemoryProviderRegistry(),
  compiler: new MockPromptCompiler(),
  evaluator: new MockPromptEvaluator(),
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A musical idea (1-2000 characters) is required." }, { status: 400 });
  }

  const spec = buildDefaultSpec(crypto.randomUUID());
  spec.northStar.audienceExperience = parsed.data.idea;

  const hints = extractHints(parsed.data.idea);
  if (hints.genres.length > 0) {
    spec.musicalIdentity.genres = hints.genres.map((tag) => ({ tag, weight: 50 }));
  }
  if (hints.tempo) {
    spec.musicalIdentity.tempoDescription = hints.tempo;
  }
  if (hints.vocal) {
    spec.musicalIdentity.instrumentation = [hints.vocal];
  }

  try {
    const result = await compilePromptPackage(spec, "generic", "balanced", demoDeps);
    return NextResponse.json({ package: result.package });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Compile failed." }, { status: 400 });
  }
}
