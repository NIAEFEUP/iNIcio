import {
  CANDIDATES_VIEW_MODE_COOKIE_MAX_AGE,
  CANDIDATES_VIEW_MODE_COOKIE_NAME,
  SELECTED_RECRUITMENT_COOKIE_MAX_AGE,
  SELECTED_RECRUITMENT_COOKIE_NAME,
  THEME_COOKIE_NAME,
  THEME_COOKIE_MAX_AGE,
} from "@/constants/cookies.const";

export function setTheme(theme: any) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}`;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
}

export function setSelectedRecruitment(recruitmentId: number) {
  document.cookie = `${SELECTED_RECRUITMENT_COOKIE_NAME}=${recruitmentId}; path=/; max-age=${SELECTED_RECRUITMENT_COOKIE_MAX_AGE}`;
}

export function setCandidatesViewMode(mode: "list" | "grid") {
  document.cookie = `${CANDIDATES_VIEW_MODE_COOKIE_NAME}=${mode}; path=/; max-age=${CANDIDATES_VIEW_MODE_COOKIE_MAX_AGE}`;
}
