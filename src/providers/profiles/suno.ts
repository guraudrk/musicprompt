import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";

/**
 * Seed data only. Capabilities marked "unknown" reflect fields this repository has not verified
 * against Suno's current official documentation (ADR-017 / PRODUCT_SPEC.md §8.3 — unknown
 * capabilities must not be presented as facts). Re-verify and bump profileVersion +
 * lastVerifiedAt before relying on this in a real compile.
 */
export const sunoProviderProfile: ProviderCapabilityProfile = {
  providerId: "suno",
  displayName: "Suno",
  officialUrl: "https://suno.com",
  profileVersion: "0.1.0-seed",
  lastVerifiedAt: "2026-07-14",
  freshness: "unknown",
  capabilities: {
    textToMusic: "true",
    fullSong: "true",
    instrumental: "true",
    vocals: "true",
    customLyrics: "true",
    multilingualLyrics: "true",
    sectionTags: "true",
    negativePromptOrExclude: "partial",
    durationControl: "partial",
    bpmControl: "partial",
    keyControl: "unknown",
    audioReference: "partial",
    melodyConditioning: "unknown",
    continuation: "true",
    sectionEditing: "partial",
    stems: "partial",
    apiAvailability: "unknown",
    localExecution: "false",
  },
  promptSchema: {
    requiredFields: ["style"],
    optionalFields: ["lyrics", "exclude", "title", "guidanceTags"],
    fieldConstraints: {
      style: { maxLength: 1000 },
    },
  },
  limitations: [
    "Exact field names, length limits, and current parameter set are unverified against official docs as of this seed's lastVerifiedAt.",
    "Do not present capability values above as guaranteed provider behavior; re-verify before production use.",
  ],
  officialSourceUrls: ["https://suno.com"],
  termsNotice:
    "Refer to Suno's current official terms of service and commercial-use policy at https://suno.com before commercial use.",
};
