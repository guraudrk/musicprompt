import "server-only";
import fs from "node:fs";
import path from "node:path";

const PROMPTS_DIR = path.join(process.cwd(), "src/llm/gemini/prompts");

/** Reads one of the versioned system-instruction template files (IMPLEMENTATION_PLAN.md §3.5). */
export function readSystemInstructionTemplate(filename: string): string {
  return fs.readFileSync(path.join(PROMPTS_DIR, filename), "utf8");
}
