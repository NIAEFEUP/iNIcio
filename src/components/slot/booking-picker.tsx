"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import useSWR from "swr";
import { Loader2, Search, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import {
  assignRecruiter,
  getAllTeamRecruiters,
  unassignRecruiter,
} from "@/app/actions";
import { useAvailableRecruiters } from "@/lib/hooks/use-available-recruiters";
import { overlap } from "@/lib/date";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { cn, getInitials } from "@/lib/utils";
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
  selectedRecruiters: User[];
  setSelectedRecruiters: Dispatch<SetStateAction<User[]>>;
  recruitmentId?: number;
}

export function BookingPicker({
  start,
  duration,
  booking,
  candidates,
  type,
  selectedRecruiters,
  setSelectedRecruiters,
  recruitmentId,
}: BookingPickerProps) {
  const effectiveRecruitmentId =
    recruitmentId ?? booking.recruitmentId ?? booking.slot?.recruitmentId;

  const startDate = useMemo(() => new Date(start), [start]);
  const endDate = useMemo(
    () => new Date(startDate.getTime() + duration * 60 * 1000),
    [startDate, duration],
  );

  const {
    recruiters: availableRecruiters,
    isLoading: isLoadingAvailable,
    mutate: mutateAvailable,
  } = useAvailableRecruiters(startDate, endDate);

  const { data: teamRecruiters = [], isLoading: isLoadingTeam } = useSWR(
    effectiveRecruitmentId ? ["team-recruiters", effectiveRecruitmentId] : null,
    () => getAllTeamRecruiters(effectiveRecruitmentId),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  const handleAddRecruiter = async (interviewer: UserWithRecruiter) => {
    if (actionLoadingId) return;
    setActionLoadingId(interviewer.id);

    try {
      await assignRecruiter(booking.id, interviewer.id, type);
      setSelectedRecruiters((prev) => [...prev, interviewer]);
      mutateAvailable();
      toast.add({
        title: `${interviewer.name} atribuído à sessão.`,
      });
    } catch (err: unknown) {
      toast.add({
        title:
          "Erro ao atribuir recrutador: " +
          (err instanceof Error ? err.message : String(err)),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveRecruiter = async (interviewerId: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(interviewerId);

    try {
      await unassignRecruiter(booking.id, interviewerId, type);
      setSelectedRecruiters((prev) =>
        prev.filter((i) => i.id !== interviewerId),
      );
      mutateAvailable();
      toast.add({
        title: "Recrutador removido da sessão.",
      });
    } catch (err: unknown) {
      toast.add({
        title:
          "Erro ao remover recrutador: " +
          (err instanceof Error ? err.message : String(err)),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Combine and sort recruiters: available for this slot first, then others
  const allRecruitersList = useMemo(() => {
    const map = new Map<string, User>();
    for (const r of availableRecruiters) {
      map.set(r.id, r);
    }
    for (const r of teamRecruiters) {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    }

    const availableIds = new Set(availableRecruiters.map((r) => r.id));

    return Array.from(map.values()).sort((a, b) => {
      const aAvail = availableIds.has(a.id) ? 1 : 0;
      const bAvail = availableIds.has(b.id) ? 1 : 0;
      if (aAvail !== bAvail) return bAvail - aAvail;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [availableRecruiters, teamRecruiters]);

  const filteredRecruiters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allRecruitersList;
    return allRecruitersList.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q),
    );
  }, [allRecruitersList, searchQuery]);

  const isLoading = isLoadingAvailable && isLoadingTeam;

  return (
    <div className="flex flex-col gap-4 py-1">
      {/* Dynamic multiple candidates overview */}
      {type === SlotType.dynamic && candidates.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Candidatos ({candidates.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground"
              >
                <Avatar size="sm" className="size-4">
                  <AvatarImage src={getStableImageUrl(c.image) || undefined} />
                  <AvatarFallback className="text-[9px]">
                    {getInitials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recrutadores Atribuídos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Recrutadores Atribuídos</span>
          <span className="font-normal text-muted-foreground tabular-nums">
            {selectedRecruiters.length}
          </span>
        </div>

        {selectedRecruiters.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            Nenhum recrutador atribuído a esta sessão.
          </p>
        ) : (
          <div className="divide-y divide-border/60 rounded-md border border-border/80">
            {selectedRecruiters.map((interviewer) => {
              const isKnown = knowsCandidate(interviewer as UserWithRecruiter);

              return (
                <div
                  key={interviewer.id}
                  className="flex items-center justify-between p-2.5 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar size="sm">
                      <AvatarImage
                        src={getStableImageUrl(interviewer.image) || undefined}
                        alt={interviewer.name}
                      />
                      <AvatarFallback className="text-[11px] font-medium">
                        {getInitials(interviewer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {interviewer.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {interviewer.email}
                        {isKnown && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                            • Conhece o candidato
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    disabled={actionLoadingId === interviewer.id}
                    onClick={() => handleRemoveRecruiter(interviewer.id)}
                    title="Remover recrutador"
                  >
                    {actionLoadingId === interviewer.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator className="my-1" />

      {/* Adicionar Recrutador */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Adicionar Recrutador</span>
          {availableRecruiters.length > 0 && (
            <span className="font-normal normal-case text-muted-foreground">
              {availableRecruiters.length} disponível(is) neste horário
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Procurar por nome ou email..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            <span>A carregar recrutadores...</span>
          </div>
        ) : filteredRecruiters.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground italic">
            {searchQuery
              ? "Nenhum recrutador encontrado."
              : "Nenhum recrutador registado na equipa."}
          </p>
        ) : (
          <div className="divide-y divide-border/60 rounded-md border border-border/80 max-h-56 overflow-y-auto">
            {filteredRecruiters.map((recruiter) => {
              const isSelected = selectedRecruiters.some(
                (r) => r.id === recruiter.id,
              );
              const isAvailable = availableRecruiters.some(
                (r) => r.id === recruiter.id,
              );
              const isConflict = hasConflict(recruiter as UserWithRecruiter);
              const isKnown = knowsCandidate(recruiter as UserWithRecruiter);
              const isPending = actionLoadingId === recruiter.id;

              return (
                <div
                  key={recruiter.id}
                  className={cn(
                    "flex items-center justify-between p-2.5 gap-2 transition-colors",
                    isSelected && "bg-muted/30 opacity-60",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar size="sm">
                      <AvatarImage
                        src={getStableImageUrl(recruiter.image) || undefined}
                        alt={recruiter.name}
                      />
                      <AvatarFallback className="text-[11px] font-medium">
                        {getInitials(recruiter.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {recruiter.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <span>{recruiter.email}</span>
                        {isAvailable && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            • Disponível
                          </span>
                        )}
                        {isConflict && (
                          <span className="text-destructive font-medium">
                            • Ocupado
                          </span>
                        )}
                        {isKnown && (
                          <span className="text-amber-600 dark:text-amber-400">
                            • Conhece candidato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="text-xs text-muted-foreground font-medium px-2 py-1">
                        Atribuído
                      </span>
                    ) : isConflict ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        disabled
                        className="h-7 text-xs text-muted-foreground"
                        title="Recrutador já tem outra sessão marcada neste horário"
                      >
                        Ocupado
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          handleAddRecruiter(recruiter as UserWithRecruiter)
                        }
                        className="h-7 text-xs font-medium"
                      >
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : null}
                        Atribuir
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
