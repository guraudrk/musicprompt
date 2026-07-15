import type { Locale } from "../locale";
import type { Dictionary } from "./types";
import { en } from "./en";
import { ko } from "./ko";
import { ja } from "./ja";

export const dictionaries: Record<Locale, Dictionary> = { en, ko, ja };
export type { Dictionary } from "./types";
