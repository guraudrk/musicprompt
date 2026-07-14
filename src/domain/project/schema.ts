import { z } from "zod";
import { SongDesignSpecSchema } from "@/domain/songDesignSpec/schema";

/**
 * Pure domain model for project CRUD. No persistence is wired in this slice — see
 * IMPLEMENTATION_PLAN.md Phase 2 for the Postgres-backed repository and auth/ownership.
 */
export const ProjectSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  currentVersion: z.number().int().min(1),
  spec: SongDesignSpecSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;
