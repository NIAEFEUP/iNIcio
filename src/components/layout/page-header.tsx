"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

function useSafeSidebar() {
  try {
    return useSidebar();
  } catch {
    return null;
  }
}
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: React.ReactNode;
  viewModeToggle?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  showSidebarTrigger?: boolean;
  backHref?: string;
  onBack?: () => void;
  showBack?: boolean;
  backLabel?: string;
  inlineOnMobile?: boolean;
}

export function PageHeader({
  title,
  viewModeToggle,
  search,
  actions,
  filters,
  className,
  children,
  showSidebarTrigger = true,
  backHref,
  onBack,
  showBack,
  backLabel,
  inlineOnMobile,
}: PageHeaderProps) {
  const router = useRouter();
  const sidebar = useSafeSidebar();
  const canShowTrigger = showSidebarTrigger && Boolean(sidebar);
  const hasBack = Boolean(backHref || onBack || showBack);

  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        className={cn(
          "flex flex-wrap justify-between gap-4",
          inlineOnMobile
            ? "flex-row items-center"
            : "flex-col lg:flex-row lg:items-center",
        )}
      >
        <div
          className={cn(
            "flex flex-1 items-center gap-2 min-w-0",
            !inlineOnMobile && "w-full",
          )}
        >
          {canShowTrigger && (
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground shrink-0" />
          )}

          {hasBack &&
            (backHref ? (
              <Button
                nativeButton={false}
                variant="ghost"
                size={backLabel ? "sm" : "icon-sm"}
                className={
                  backLabel
                    ? "h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                    : "size-7 text-muted-foreground hover:text-foreground shrink-0"
                }
                render={<Link href={backHref} />}
                title={backLabel || "Voltar"}
                aria-label={backLabel || "Voltar"}
              >
                <ArrowLeft className="size-4" />
                {backLabel && <span>{backLabel}</span>}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size={backLabel ? "sm" : "icon"}
                className={
                  backLabel
                    ? "h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                    : "size-7 text-muted-foreground hover:text-foreground shrink-0"
                }
                onClick={handleBack}
                title={backLabel || "Voltar"}
                aria-label={backLabel || "Voltar"}
              >
                <ArrowLeft className="size-4" />
                {backLabel && <span>{backLabel}</span>}
              </Button>
            ))}

          {(canShowTrigger || hasBack) && (
            <Separator orientation="vertical" className="mx-1 h-4 shrink-0" />
          )}

          {typeof title === "string" ? (
            <h1
              className="min-w-0 truncate text-xl font-semibold tracking-tight text-foreground"
              title={title}
            >
              {title}
            </h1>
          ) : (
            <div className="min-w-0 truncate">{title}</div>
          )}
          {viewModeToggle && (
            <div className="ml-auto flex shrink-0 items-center md:ml-0 [&:has(>.hidden:only-child)]:hidden max-md:[&_button>span]:hidden max-md:[&_button]:px-2">
              {viewModeToggle}
            </div>
          )}
        </div>

        {(search || actions) && (
          <div
            className={cn(
              "flex items-center gap-2",
              inlineOnMobile ? "shrink-0" : "w-full lg:w-auto",
            )}
          >
            {search && (
              <div className="flex-1 min-w-0 md:w-auto md:flex-none [&>div]:w-full md:[&>div]:w-auto [&_input]:w-full md:[&_input]:w-auto">
                {search}
              </div>
            )}
            {actions && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  search
                    ? "shrink-0"
                    : "w-full flex-1 min-w-0 lg:w-auto lg:flex-none",
                  inlineOnMobile && "w-auto shrink-0",
                )}
              >
                {actions}
              </div>
            )}
          </div>
        )}
      </div>

      {filters && (
        <div className="flex flex-wrap items-center gap-3 w-full max-md:[&_button]:w-full">
          {filters}
        </div>
      )}

      {children}
    </div>
  );
}
