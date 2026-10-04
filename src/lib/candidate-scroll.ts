"use client";

import { useEffect } from "react";

const CANDIDATES_SCROLL_Y_KEY = "candidates_scroll_y";
const CANDIDATES_RESTORE_SCROLL_KEY = "candidates_restore_scroll";
const CANDIDATES_RETURN_URL_KEY = "candidates_return_url";

export function saveCandidatesScrollPosition() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CANDIDATES_SCROLL_Y_KEY, String(window.scrollY));
  sessionStorage.setItem(CANDIDATES_RESTORE_SCROLL_KEY, "true");
  sessionStorage.setItem(
    CANDIDATES_RETURN_URL_KEY,
    window.location.pathname + window.location.search,
  );
}

export function getCandidatesReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CANDIDATES_RETURN_URL_KEY);
}

export function useCandidatesScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldRestore =
      sessionStorage.getItem(CANDIDATES_RESTORE_SCROLL_KEY) === "true";
    const savedYStr = sessionStorage.getItem(CANDIDATES_SCROLL_Y_KEY);

    if (!shouldRestore || !savedYStr) return;

    const targetY = parseInt(savedYStr, 10);
    if (isNaN(targetY) || targetY <= 0) {
      sessionStorage.removeItem(CANDIDATES_RESTORE_SCROLL_KEY);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const tryScroll = () => {
      if (cancelled) return;
      window.scrollTo({ top: targetY, behavior: "instant" });
      if (Math.abs(window.scrollY - targetY) < 5 || attempts >= maxAttempts) {
        sessionStorage.removeItem(CANDIDATES_RESTORE_SCROLL_KEY);
        return;
      }
      attempts++;
      requestAnimationFrame(tryScroll);
    };

    const rafId = requestAnimationFrame(tryScroll);
    const timeoutId1 = setTimeout(tryScroll, 50);
    const timeoutId2 = setTimeout(tryScroll, 150);
    const timeoutId3 = setTimeout(tryScroll, 300);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, []);
}
