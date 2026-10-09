"use client";

import { useEffect, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";

export interface UseTableUrlFiltersOptions {
  filterKeys: string[];
  initialFilters?: ColumnFiltersState;
}

export function useTableUrlFilters({
  filterKeys,
  initialFilters = [],
}: UseTableUrlFiltersOptions): [
  ColumnFiltersState,
  React.Dispatch<React.SetStateAction<ColumnFiltersState>>,
] {
  // Always initialize with initialFilters so SSR and initial client hydration match identically
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters);

  // Sync columnFilters to URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    let changed = false;

    for (const key of filterKeys) {
      const filter = columnFilters.find((f) => f.id === key);
      const values = Array.isArray(filter?.value)
        ? (filter.value as string[]).filter(Boolean)
        : [];
      const currentVal = url.searchParams.get(key);

      if (values.length > 0) {
        const nextVal = values.join(",");
        if (currentVal !== nextVal) {
          url.searchParams.set(key, nextVal);
          changed = true;
        }
      } else if (currentVal !== null) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    if (changed) {
      const search = url.searchParams.toString();
      const newPath = search ? `${url.pathname}?${search}` : url.pathname;
      window.history.replaceState(window.history.state, "", newPath);
    }
  }, [columnFilters, filterKeys]);

  // Synchronize on browser history navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setColumnFilters((prev) => {
        const nonManaged = prev.filter((f) => !filterKeys.includes(f.id));
        const updated: ColumnFiltersState = [...nonManaged];
        for (const key of filterKeys) {
          const val = params.get(key);
          if (val) {
            const parts = val
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
            if (parts.length > 0) {
              updated.push({ id: key, value: parts });
            }
          }
        }
        return updated;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [filterKeys]);

  return [columnFilters, setColumnFilters];
}
