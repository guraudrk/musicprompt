/*
  Warnings:

  - Added the required column `apiMode` to the `PromptPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latencyMs` to the `PromptPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `PromptPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptTemplateVersion` to the `PromptPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schemaVersion` to the `PromptPackage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Backfill defaults ("unknown"/0) are for the rows that existed before this migration (local dev
-- smoke-test data from the Phase 2 walkthrough); every compile from this point on always supplies
-- real values explicitly (see src/compiler/pipeline.ts / the compile API routes), so the column
-- defaults are a one-time backfill convenience, not a relied-upon app behavior.
ALTER TABLE "PromptPackage" ADD COLUMN     "apiMode" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "latencyMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "promptTemplateVersion" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "repairCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schemaVersion" TEXT NOT NULL DEFAULT 'unknown';
