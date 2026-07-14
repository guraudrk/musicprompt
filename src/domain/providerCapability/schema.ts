import { z } from "zod";

export const CapabilityStateSchema = z.enum(["true", "false", "partial", "unknown"]);
export type CapabilityState = z.infer<typeof CapabilityStateSchema>;

/** PRODUCT_SPEC §8.3 — the required capability keys every provider profile must report on. */
export const REQUIRED_CAPABILITY_KEYS = [
  "textToMusic",
  "fullSong",
  "instrumental",
  "vocals",
  "customLyrics",
  "multilingualLyrics",
  "sectionTags",
  "negativePromptOrExclude",
  "durationControl",
  "bpmControl",
  "keyControl",
  "audioReference",
  "melodyConditioning",
  "continuation",
  "sectionEditing",
  "stems",
  "apiAvailability",
  "localExecution",
] as const;
export type RequiredCapabilityKey = (typeof REQUIRED_CAPABILITY_KEYS)[number];

export const ProviderPromptSchemaSchema = z.object({
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
  fieldConstraints: z
    .record(z.string(), z.object({ maxLength: z.number().int().positive().optional(), pattern: z.string().optional() }))
    .optional(),
});
export type ProviderPromptSchema = z.infer<typeof ProviderPromptSchemaSchema>;

export const ProviderCapabilityProfileSchema = z.object({
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  officialUrl: z.string().url(),
  profileVersion: z.string().min(1),
  lastVerifiedAt: z.string().min(1), // ISO date string
  freshness: z.enum(["current", "aging", "stale", "unknown"]),
  capabilities: z.record(z.string(), CapabilityStateSchema),
  promptSchema: ProviderPromptSchemaSchema,
  limitations: z.array(z.string()),
  officialSourceUrls: z.array(z.string().url()),
  termsNotice: z.string().min(1),
});
export type ProviderCapabilityProfile = z.infer<typeof ProviderCapabilityProfileSchema>;
