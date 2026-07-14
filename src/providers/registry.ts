import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";
import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import { genericProviderProfile } from "./profiles/generic";
import { sunoProviderProfile } from "./profiles/suno";
import { udioProviderProfile } from "./profiles/udio";

export type ProviderRecommendation = { providerId: string; score: number; reasons: string[] };

export interface ProviderRegistry {
  list(): ProviderCapabilityProfile[];
  get(providerId: string): ProviderCapabilityProfile | undefined;
  recommend(spec: SongDesignSpec): ProviderRecommendation[];
}

const CAPABILITY_SCORE: Record<string, number> = {
  true: 1,
  partial: 0.5,
  unknown: 0,
  false: 0,
};

/**
 * In-memory registry seeded from versioned profile data (IMPLEMENTATION_PLAN.md Phase 1:
 * "Use versioned seed data"). Recommendation scoring is deliberately simple for this slice: it
 * rewards providers whose declared capabilities match what the spec actually needs, and never
 * claims a provider is unsupported vs. merely "unknown" (PRODUCT_SPEC.md §8.3).
 */
export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly profiles: ProviderCapabilityProfile[];

  constructor(profiles: ProviderCapabilityProfile[] = [genericProviderProfile, sunoProviderProfile, udioProviderProfile]) {
    this.profiles = profiles;
  }

  list(): ProviderCapabilityProfile[] {
    return this.profiles;
  }

  get(providerId: string): ProviderCapabilityProfile | undefined {
    return this.profiles.find((p) => p.providerId === providerId);
  }

  recommend(spec: SongDesignSpec): ProviderRecommendation[] {
    const wantsCustomLyrics = !spec.identity.instrumental;
    const wantsMultilingual = spec.identity.language.trim().length > 0;

    return this.profiles
      .map((profile) => {
        const reasons: string[] = [];
        let score = 0;

        if (wantsCustomLyrics) {
          score += CAPABILITY_SCORE[profile.capabilities.customLyrics ?? "unknown"];
          reasons.push(`customLyrics=${profile.capabilities.customLyrics ?? "unknown"}`);
        } else {
          score += CAPABILITY_SCORE[profile.capabilities.instrumental ?? "unknown"];
          reasons.push(`instrumental=${profile.capabilities.instrumental ?? "unknown"}`);
        }

        if (wantsMultilingual) {
          score += CAPABILITY_SCORE[profile.capabilities.multilingualLyrics ?? "unknown"];
          reasons.push(`multilingualLyrics=${profile.capabilities.multilingualLyrics ?? "unknown"}`);
        }

        return { providerId: profile.providerId, score, reasons };
      })
      .sort((a, b) => b.score - a.score);
  }
}
