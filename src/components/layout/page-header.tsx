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
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2">
          {canShowTrigger && (
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          )}

          {hasBack &&
            (backHref ? (
              <Button
                nativeButton={false}
                variant="ghost"
                size={backLabel ? "sm" : "icon-sm"}
                className={
                  backLabel
                    ? "h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    : "size-7 text-muted-foreground hover:text-foreground"
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
                    ? "h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    : "size-7 text-muted-foreground hover:text-foreground"
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
            <Separator orientation="vertical" className="mx-1 h-4" />
          )}

          {typeof title === "string" ? (
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            title
          )}
          {viewModeToggle}
        </div>

        {(search || actions) && (
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            {search}
            {actions}
          </div>
        )}
      </div>

      {filters && (
        <div className="flex flex-wrap items-center gap-3">{filters}</div>
      )}

      {children}
    </div>
  );
}
