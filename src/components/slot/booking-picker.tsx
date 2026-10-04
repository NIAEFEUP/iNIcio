"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  assignRecruiter,
  getAllTeamRecruiters,
  unassignRecruiter,
} from "@/app/actions";
import { useAvailableRecruiters } from "@/lib/hooks/use-available-recruiters";
import { overlap } from "@/lib/date";
import { cn } from "@/lib/utils";
import type {
  Dynamic,
  Interview,
  RecruiterToCandidate,
  Slot,
  User,
} from "@/lib/db";
import { SlotType } from "../admin/slot-admin-calendar";

export interface CandidateWithMeta extends User {
  interviewClassification?: string | null;
  dynamicClassification?: string | null;
}

interface RecruiterData {
  knownCandidates: { candidateId: string }[];
  interviews: Array<{
    interview?: { id?: number; slot?: Slot };
    slot?: Slot;
  }>;
  dynamics: Array<{
    dynamic?: { id?: number; slot?: Slot };
    slot?: Slot;
  }>;
}

export interface UserWithRecruiter extends User {
  recruiter?: RecruiterData;
}

interface BookingPickerProps {
  start: Date;
  duration: number;
  booking: (Interview | Dynamic) & {
    id: number;
    recruitmentId?: number;
    recruiters: RecruiterToCandidate[];
    slot?: Slot;
  };
  candidates: CandidateWithMeta[];
  type: SlotType;
  recruitmentId?: number;
  onClose?: () => void;
  // Optional backward compatibility props
  selectedRecruiters?: User[];
  setSelectedRecruiters?: React.Dispatch<React.SetStateAction<User[]>>;
}

export function BookingPicker({
  start,
  duration,
  booking,
  candidates,
  type,
  recruitmentId,
  onClose,
}: BookingPickerProps) {
  const router = useRouter();
  const effectiveRecruitmentId =
    recruitmentId ?? booking.recruitmentId ?? booking.slot?.recruitmentId;

  const startDate = useMemo(() => new Date(start), [start]);
  const endDate = useMemo(
    () => new Date(startDate.getTime() + duration * 60 * 1000),
    [startDate, duration],
  );

  const initialIds = useMemo(() => {
    return (booking.recruiters || [])
      .map(
        (r: any) =>
          r.recruiter?.user?.id ||
          r.recruiter?.userId ||
          r.recruiterId ||
          r.userId ||
          r.id,
      )
      .filter(Boolean) as string[];
  }, [booking.recruiters]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { recruiters: availableRecruiters, isLoading: isLoadingAvailable } =
    useAvailableRecruiters(startDate, endDate, effectiveRecruitmentId);

  const { data: teamRecruiters = [], isLoading: isLoadingTeam } = useSWR(
    effectiveRecruitmentId ? ["team-recruiters", effectiveRecruitmentId] : null,
    () => getAllTeamRecruiters(effectiveRecruitmentId),
  );

  const candidateIdSet = useMemo(
    () => new Set(candidates.map((c) => c.id)),
    [candidates],
  );

  const knowsCandidate = (recruiter: UserWithRecruiter): boolean => {
    const known = recruiter.recruiter?.knownCandidates || [];
    return known.some((k) => candidateIdSet.has(k.candidateId));
  };

  const hasConflict = (recruiter: UserWithRecruiter): boolean => {
    const rec = recruiter.recruiter;
    if (!rec) return false;

    const interviews = rec.interviews || [];
    const dynamics = rec.dynamics || [];

    const hasInterviewOverlap = interviews.some((item) => {
      const interviewObj = (item.interview || item) as {
        id?: number;
        slot?: Slot;
      };
      const slotObj = item.slot || item.interview?.slot;
      if (type === SlotType.interview && interviewObj?.id === booking.id) {
        return false;
      }
      if (!slotObj) return false;
      return overlap(slotObj, startDate, duration);
    });

    const hasDynamicOverlap = dynamics.some((item) => {
      const dynamicObj = (item.dynamic || item) as {
        id?: number;
        slot?: Slot;
      };
      const slotObj = item.slot || item.dynamic?.slot;
      if (type === SlotType.dynamic && dynamicObj?.id === booking.id) {
        return false;
      }
      if (!slotObj) return false;
      return overlap(slotObj, startDate, duration);
    });

    return hasInterviewOverlap || hasDynamicOverlap;
  };

  const getRecruiterWarnings = (recruiter: UserWithRecruiter): string[] => {
    const warnings: string[] = [];
    const isAvailable = availableRecruiters.some((r) => r.id === recruiter.id);
    const isConflict = hasConflict(recruiter);
    const isKnown = knowsCandidate(recruiter);

    if (!isAvailable) {
      warnings.push("Não tem disponibilidade declarada para este horário.");
    }
    if (isConflict) {
      warnings.push("Está ocupado(a) noutra sessão neste horário.");
    }
    if (isKnown) {
      warnings.push(
        type === SlotType.dynamic && candidates.length > 1
          ? "Declarou que conhece pelo menos um dos candidatos."
          : "Declarou que conhece o candidato.",
      );
    }
    return warnings;
  };

  // Combine and sort recruiters: selected first, then available, then others
  const allRecruitersList = useMemo(() => {
    const map = new Map<string, UserWithRecruiter>();
    for (const r of availableRecruiters) {
      map.set(r.id, r as UserWithRecruiter);
    }
    for (const r of teamRecruiters) {
      if (!map.has(r.id)) {
        map.set(r.id, r as UserWithRecruiter);
      }
    }

    const availableIds = new Set(availableRecruiters.map((r) => r.id));
    const selectedSet = new Set(selectedIds);

    return Array.from(map.values()).sort((a, b) => {
      const aSel = selectedSet.has(a.id) ? 1 : 0;
      const bSel = selectedSet.has(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;

      const aAvail = availableIds.has(a.id) ? 1 : 0;
      const bAvail = availableIds.has(b.id) ? 1 : 0;
      if (aAvail !== bAvail) return bAvail - aAvail;

      return (a.name || "").localeCompare(b.name || "");
    });
  }, [availableRecruiters, teamRecruiters, selectedIds]);

  const filteredRecruiters = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allRecruitersList;
    return allRecruitersList.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [allRecruitersList, search]);

  const handleRowClick = (recruiter: UserWithRecruiter) => {
    const isSelected = selectedIds.includes(recruiter.id);
    if (isSelected) {
      setSelectedIds((prev) => prev.filter((item) => item !== recruiter.id));
    } else {
      const warnings = getRecruiterWarnings(recruiter);
      if (warnings.length > 0) {
        toast.add({
          type: "warning",
          title: `Aviso: ${recruiter.name || "Recrutador"}`,
          description: warnings.join(" "),
        });
      }
      setSelectedIds((prev) => [...prev, recruiter.id]);
    }
  };

  const handleSave = async () => {
    const initialSet = new Set(initialIds);
    const selectedSet = new Set(selectedIds);

    const toAdd = selectedIds.filter((id) => !initialSet.has(id));
    const toRemove = initialIds.filter((id) => !selectedSet.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      onClose?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all([
        ...toRemove.map((id) => unassignRecruiter(booking.id, id, type)),
        ...toAdd.map((id) => assignRecruiter(booking.id, id, type, true)),
      ]);

      toast.add({
        type: "success",
        title: "Recrutadores atualizados com sucesso",
      });
      router.refresh();
      onClose?.();
    } catch (err: unknown) {
      console.error(err);
      toast.add({
        type: "error",
        title:
          "Erro ao atualizar recrutadores: " +
          (err instanceof Error ? err.message : String(err)),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingAvailable && isLoadingTeam;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Dynamic candidates banner (if dynamic with candidates) */}
        {type === SlotType.dynamic && candidates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-muted/30 border border-border/40 text-xs">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
              Candidatos ({candidates.length}):
            </span>
            {candidates.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-xs font-medium border border-border/60"
              >
                {c.name}
              </span>
            ))}
          </div>
        )}

        {/* Search Bar matching add recruiters modal */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou email..."
              className="h-8 pl-8 pr-2 text-xs"
              autoFocus
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer shrink-0 transition-colors"
              onClick={() => setSelectedIds([])}
            >
              Limpar ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Recruiter List */}
        <div className="max-h-60 overflow-y-auto space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>A carregar recrutadores...</span>
            </div>
          ) : filteredRecruiters.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {search
                ? "Nenhum recrutador encontrado"
                : "Nenhum recrutador registado na equipa"}
            </div>
          ) : (
            filteredRecruiters.map((recruiter) => {
              const isSelected = selectedIds.includes(recruiter.id);
              const isAvailable = availableRecruiters.some(
                (r) => r.id === recruiter.id,
              );
              const isConflict = hasConflict(recruiter);
              const isKnown = knowsCandidate(recruiter);

              return (
                <div
                  key={recruiter.id}
                  onClick={() => handleRowClick(recruiter)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md p-2 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/80",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleRowClick(recruiter)}
                    className="size-4 pointer-events-none shrink-0"
                  />
                  <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-xs truncate">
                        {recruiter.name || "Sem nome"}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        {recruiter.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 text-[10px] sm:text-xs">
                      {isAvailable && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="hidden sm:inline">Disponível</span>
                          <span className="sm:hidden">Disp.</span>
                        </span>
                      )}
                      {isConflict && (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>Ocupado</span>
                        </span>
                      )}
                      {!isAvailable && !isConflict && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                          <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                          <span className="hidden sm:inline">Indisponível</span>
                          <span className="sm:hidden">Indisp.</span>
                        </span>
                      )}
                      {isKnown && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="hidden sm:inline">
                            Conhece candidato
                          </span>
                          <span className="sm:hidden">Conhece</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer matching add recruiters modal */}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting
            ? "A guardar..."
            : selectedIds.length > 0
              ? `Guardar (${selectedIds.length})`
              : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}
