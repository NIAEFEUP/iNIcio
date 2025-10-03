import {
  THEME_COOKIE_NAME,
  THEME_COOKIE_MAX_AGE,
} from "@/constants/cookies.const";

export function setTheme(theme: any) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}`;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
}
