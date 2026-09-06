"use client";

import { useSyncExternalStore } from "react";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

import { setTheme } from "@/cookies/set";

const themeListeners = new Set<() => void>();

function readTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ToggleTheme() {
  const currentTheme = useSyncExternalStore(
    (listener) => {
      themeListeners.add(listener);
      return () => themeListeners.delete(listener);
    },
    readTheme,
    () => "light",
  );

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    themeListeners.forEach((listener) => listener());
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {currentTheme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}
