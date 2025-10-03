import { THEMES_VALUES } from "@/constants/theme.const";
import { DEFAULT_VALUES } from "@/constants/cookies.const";

export type TTheme = (typeof THEMES_VALUES)[number];

export function getTheme(): TTheme {
  return DEFAULT_VALUES.theme as TTheme;
}
