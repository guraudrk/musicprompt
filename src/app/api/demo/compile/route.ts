import { NextResponse } from "next/server";
import { z } from "zod";
import { compilePromptPackage } from "@/compiler/pipeline";
import { compilePipelineDeps } from "@/lib/compilerDeps";
import { buildDefaultSpec } from "@/domain/songDesignSpec/defaultSpec";
import { extractHints } from "@/domain/songDesignSpec/extractHints";
import { checkDemoRateLimit } from "@/lib/demoRateLimit";

/**
 * Anonymous, no-login demo of the compile pipeline for the landing page. Deliberately isolated
 * from the real project/auth system: no `@/lib/authz`, no repository, no `prisma` call, no
 * persistence at all.
 *
 * Uses the same `compilePipelineDeps` (real Gemini when configured, Mock fallback in dev, Mock-only
 * when unconfigured) every authenticated compile uses — including the 7 composition-theory engines
 * and the theoryAddressal enforcement (ADR-045) — protected by `checkDemoRateLimit` instead of the
 * previous structural Mock-only guarantee (ADR-036, superseded by ADR-046): unlimited outside
 * production, 5 requests per IP per hour in production. See DECISIONS.md ADR-046.
 */
const BodySchema = z.object({ idea: z.string().min(1).max(2000) });

export async function POST(request: Request) {
  const rateLimit = checkDemoRateLimit(request);
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000);
    return NextResponse.json(
      { error: "Too many demo requests from this address. Please try again later, or sign up for unlimited access." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

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
    const result = await compilePromptPackage(spec, "generic", "balanced", compilePipelineDeps);
    return NextResponse.json({ package: result.package });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Compile failed." }, { status: 400 });
  }
}
