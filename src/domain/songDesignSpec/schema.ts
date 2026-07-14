import { z } from "zod";
import { FieldProvenanceSchema } from "@/domain/provenance";
import { ReferenceSchema } from "./reference";
import { DeliberateDifferenceSchema, MINIMUM_DELIBERATE_DIFFERENCES } from "./difference";
import { GenerativeCoreSchema } from "./generativeCore";
import { MusicalIdentitySchema } from "./musicalIdentity";
import {
  ContrastPlanSchema,
  DramaticSectionSchema,
  EmotionPointSchema,
  HookPlanSchema,
  RepetitionPlanSchema,
} from "./structure";
import { CompositionTheorySpecSchema } from "./theory";
import { LyricsDesignSpecSchema } from "./lyrics";

export const IdentitySchema = z.object({
  workingTitle: z.string().optional(),
  purpose: z.string().min(1),
  language: z.string().min(1),
  instrumental: z.boolean(),
  targetAudience: z.string().optional(),
  listeningContext: z.string().optional(),
});
export type Identity = z.infer<typeof IdentitySchema>;

export const NorthStarSchema = z.object({
  audienceExperience: z.string().min(1),
  centralQuestion: z.string().optional(),
  finalAftertaste: z.string().min(1),
  nonNegotiableCore: z.string().min(1),
  status: z.enum(["draft", "confirmed"]),
});
export type NorthStar = z.infer<typeof NorthStarSchema>;

export const ProviderSelectionSchema = z.object({
  mode: z.enum(["manual", "recommend", "generic", "compare"]),
  selectedProviderIds: z.array(z.string()),
});
export type ProviderSelection = z.infer<typeof ProviderSelectionSchema>;

export const SongDesignSpecSchema = z
  .object({
    projectId: z.string().min(1),
    version: z.number().int().min(1),

    identity: IdentitySchema,
    northStar: NorthStarSchema,
    reference: ReferenceSchema.optional(),
    deliberateDifferences: z.array(DeliberateDifferenceSchema),

    generativeCore: GenerativeCoreSchema,
    musicalIdentity: MusicalIdentitySchema,

    structure: z.array(DramaticSectionSchema),
    emotionCurve: z.array(EmotionPointSchema),
    contrastPlan: z.array(ContrastPlanSchema),
    hookPlan: HookPlanSchema,
    repetitionPlan: RepetitionPlanSchema,
    compositionTheory: CompositionTheorySpecSchema,
    lyricsDesign: LyricsDesignSpecSchema,
    exclusions: z.array(z.string()),

    providerSelection: ProviderSelectionSchema,

    lockedFields: z.array(z.string()),
    provenance: z.array(FieldProvenanceSchema),
  })
  .check((ctx) => {
    // PRODUCT_SPEC §5.2: once a reference is declared, at least three deliberate differences
    // are required. A name change alone does not count as a difference (enforced by requiring
    // fromReference !== toNew, checked structurally rather than semantically here).
    if (ctx.value.reference && ctx.value.deliberateDifferences.length < MINIMUM_DELIBERATE_DIFFERENCES) {
      ctx.issues.push({
        code: "custom",
        message: `At least ${MINIMUM_DELIBERATE_DIFFERENCES} deliberate differences are required when a reference is set.`,
        path: ["deliberateDifferences"],
        input: ctx.value.deliberateDifferences,
      });
    }
  });

export type SongDesignSpec = z.infer<typeof SongDesignSpecSchema>;
