import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";

/**
 * The Generic profile is not a real external tool. It represents the provider-neutral design
 * itself (PRODUCT_SPEC.md §9.2 Stage C "provider-neutral compiler input"), useful when the user
 * defers tool selection or wants a portable design document. It has no audio/API surface, so
 * capabilities tied to a live generation backend are "false" rather than "unknown".
 */
export const genericProviderProfile: ProviderCapabilityProfile = {
  providerId: "generic",
  displayName: "Generic (tool-neutral design)",
  officialUrl: "https://example.invalid/generic",
  profileVersion: "0.1.0-seed",
  lastVerifiedAt: "2026-07-14",
  freshness: "current",
  capabilities: {
    textToMusic: "true",
    fullSong: "true",
    instrumental: "true",
    vocals: "true",
    customLyrics: "true",
    multilingualLyrics: "true",
    sectionTags: "true",
    negativePromptOrExclude: "true",
    durationControl: "true",
    bpmControl: "true",
    keyControl: "true",
    audioReference: "false",
    melodyConditioning: "false",
    continuation: "false",
    sectionEditing: "false",
    stems: "false",
    apiAvailability: "false",
    localExecution: "false",
  },
  promptSchema: {
    requiredFields: ["prompt"],
    optionalFields: ["style", "lyrics", "negativePrompt", "title", "guidanceTags", "structureNotes"],
  },
  limitations: [
    "Not a real generation backend. Intended as a portable design document to translate into a chosen tool later.",
  ],
  officialSourceUrls: [],
  termsNotice:
    "This profile has no external terms of service since it does not call any external tool.",
};
