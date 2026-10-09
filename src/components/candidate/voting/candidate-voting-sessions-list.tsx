"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowRight,
  Loader2,
  Plus,
  Search,
  SquareSquare,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableView } from "@/components/data-table/data-table-view";
import { DataTableColumnToggle } from "@/components/data-table/data-table-column-toggle";
import { DataTableFilter } from "@/components/data-table/data-table-filter";
import {
  DataTableEntityCell,
  DataTableSortableHeader,
} from "@/components/data-table/data-table-column-helpers";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { GridView } from "@/components/data-table/grid-view";
import { GridCard } from "@/components/data-table/grid-card";
import { terminateVotingSessionAction } from "@/app/candidate/actions";
import { getDateStringPT, getTimeString } from "@/lib/date";
import { toast } from "@/components/ui/toast";

export interface VotingPhaseSummary {
  id: number;
  recruitmentId: number;
  created_at: Date | null;
  terminated?: boolean;
  status?: {
    candidateId: string | null;
    accepted_candidates: number;
    rejected_candidates: number;
  } | null;
  candidates?: Array<{
    candidateId: string;
    voteFinished: boolean;
  }>;
}

interface CandidateVotingSessionsListProps {
  votingPhases: Array<VotingPhaseSummary>;
  isAdmin?: boolean;
}

export function CandidateVotingSessionsList({
  votingPhases,
  isAdmin = false,
}: CandidateVotingSessionsListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "id", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [terminatingId, setTerminatingId] = useState<number | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);

  const selectedStates = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === "state");
    return (filter?.value as string[]) || [];
  }, [columnFilters]);

  const setStateFilter = (values: string[]) => {
    setColumnFilters((prev) => {
      const other = prev.filter((f) => f.id !== "state");
      if (values.length === 0) return other;
      return [...other, { id: "state", value: values }];
    });
  };

  const columns = useMemo<ColumnDef<VotingPhaseSummary>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Sessão" />
        ),
        cell: ({ row }) => {
          const vp = row.original;
          const dateStr = vp.created_at
            ? `${getDateStringPT(vp.created_at)}, ${getTimeString(vp.created_at)}`
            : "Data desconhecida";

          return (
            <DataTableEntityCell
              avatar={
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  <Vote className="size-4" />
                </div>
              }
              name={`Sessão #${vp.id}`}
              subtitle={dateStr}
            />
          );
        },
      },
      {
        id: "candidates",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Candidatos" />
        ),
        accessorFn: (row) => row.candidates?.length ?? 0,
        cell: ({ row }) => {
          const total = row.original.candidates?.length ?? 0;
          return (
            <span className="text-xs font-medium text-foreground">
              {total} {total === 1 ? "candidato" : "candidatos"}
            </span>
          );
        },
      },
      {
        id: "state",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Estado" />
        ),
        accessorFn: (row) => {
          const total = row.candidates?.length ?? 0;
          const finished =
            row.candidates?.filter((c) => c.voteFinished).length ?? 0;
          const isFinished =
            Boolean(row.terminated) || (total > 0 && finished === total);
          return isFinished ? "closed" : "open";
        },
        cell: ({ row }) => {
          const total = row.original.candidates?.length ?? 0;
          const finished =
            row.original.candidates?.filter((c) => c.voteFinished).length ?? 0;
          const isFinished =
            Boolean(row.original.terminated) ||
            (total > 0 && finished === total);

          if (!isFinished) {
            return (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Em curso</span>
              </div>
            );
          }

          return (
            <div className="inline-flex items-center text-xs font-normal text-muted-foreground">
              <span>Concluída</span>
            </div>
          );
        },
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return true;
          const state = row.getValue(id) as string;
          return value.includes(state);
        },
      },
      {
        id: "results",
        header: "Resultados",
        cell: ({ row }) => {
          const accepted = row.original.status?.accepted_candidates ?? 0;
          const rejected = row.original.status?.rejected_candidates ?? 0;

          return (
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-emerald-600 dark:text-emerald-400">
                {accepted} aceites
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-rose-600 dark:text-rose-400">
                {rejected} rejeitados
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "progress",
        header: "Progresso",
        cell: ({ row }) => {
          const total = row.original.candidates?.length ?? 0;
          const finished =
            row.original.candidates?.filter((c) => c.voteFinished).length ?? 0;
          const percent = total > 0 ? Math.round((finished / total) * 100) : 0;

          return (
            <div className="flex items-center gap-2.5 min-w-32">
              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                <div
                  style={{ width: `${percent}%` }}
                  className="h-full bg-primary transition-all duration-300"
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {finished}/{total}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const vp = row.original;
          const total = vp.candidates?.length ?? 0;
          const finished =
            vp.candidates?.filter((c) => c.voteFinished).length ?? 0;
          const isFinished = total > 0 && finished === total;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {isAdmin && !isFinished && (
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setTerminatingId(vp.id)}
                  title="Terminar sessão"
                  className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
                >
                  <SquareSquare className="size-3.5" />
                </Button>
              )}
              <Button
                nativeButton={false}
                variant={!isFinished ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                render={<Link href={`/candidates/voting/${vp.id}`} />}
              >
                <span>Abrir</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [isAdmin],
  );

  const table = useReactTable({
    data: votingPhases,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleConfirmTerminate = async () => {
    if (!terminatingId || isTerminating) return;
    setIsTerminating(true);
    try {
      const res = await terminateVotingSessionAction(terminatingId);
      if (res.success) {
        toast.add({
          type: "success",
          title: "Sessão de votação terminada com sucesso",
        });
        setTerminatingId(null);
        router.refresh();
      } else {
        toast.add({
          type: "error",
          title: res.error || "Erro ao terminar sessão de votação",
        });
      }
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao terminar sessão",
      });
    } finally {
      setIsTerminating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Votações"
        viewModeToggle={
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            listLabel="Lista"
            gridLabel="Grelha"
          />
        }
        search={
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Procurar sessão..."
              className="h-8 w-full pl-8 text-xs md:w-56"
            />
          </div>
        }
        filters={
          <DataTableFilter
            title="Estado"
            pluralTitle="Estados"
            allLabel="Todos os estados"
            options={[
              { value: "open", label: "Em curso" },
              { value: "closed", label: "Concluída" },
            ]}
            selectedValues={selectedStates}
            onSelectedValuesChange={setStateFilter}
          />
        }
        actions={
          <>
            {viewMode === "list" && (
              <DataTableColumnToggle
                table={table}
                columnLabels={{
                  id: "Sessão",
                  candidates: "Candidatos",
                  state: "Estado",
                  results: "Resultados",
                  progress: "Progresso",
                }}
              />
            )}
            {isAdmin && (
              <Button
                nativeButton={false}
                render={<Link href="/candidates" />}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Criar votação</span>
              </Button>
            )}
          </>
        }
      />

      <DataTableView
        table={table}
        viewMode={viewMode}
        emptyTitle="Sem sessões de votação"
        emptyDescription={
          isAdmin
            ? "Cria uma sessão de votação selecionando candidatos na página de Candidatos."
            : "Ainda não existem sessões de votação registadas neste recrutamento."
        }
        renderGrid={(t) => (
          <GridView
            table={t}
            getItemKey={(vp) => String(vp.id)}
            renderCard={(vp) => {
              const total = vp.candidates?.length ?? 0;
              const finished =
                vp.candidates?.filter((c) => c.voteFinished).length ?? 0;
              const isFinished =
                Boolean(vp.terminated) || (total > 0 && finished === total);
              const accepted = vp.status?.accepted_candidates ?? 0;
              const rejected = vp.status?.rejected_candidates ?? 0;
              const dateStr = vp.created_at
                ? `${getDateStringPT(vp.created_at)}, ${getTimeString(vp.created_at)}`
                : "Data desconhecida";

              return (
                <GridCard
                  avatar={
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Vote className="size-5" />
                    </div>
                  }
                  title={`Sessão #${vp.id}`}
                  subtitle={dateStr}
                  badge={
                    !isFinished ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Em curso</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center text-xs font-normal text-muted-foreground">
                        <span>Concluída</span>
                      </div>
                    )
                  }
                  actions={
                    <div className="flex items-center gap-2 w-full">
                      {isAdmin && !isFinished && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTerminatingId(vp.id)}
                          className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
                          title="Terminar sessão"
                        >
                          <SquareSquare className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        nativeButton={false}
                        variant={!isFinished ? "default" : "outline"}
                        size="sm"
                        className="h-8 flex-1 text-xs gap-1.5"
                        render={<Link href={`/candidates/voting/${vp.id}`} />}
                      >
                        <span>Abrir sessão</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </div>
                  }
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Candidatos</span>
                      <span className="font-medium text-foreground">
                        {total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Resultados</span>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {accepted} aceites
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-rose-600 dark:text-rose-400">
                          {rejected} rejeitados
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progresso</span>
                        <span className="font-medium text-foreground">
                          {finished}/{total} decididos
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          style={{
                            width: `${total > 0 ? (finished / total) * 100 : 0}%`,
                          }}
                          className="h-full bg-primary transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </GridCard>
              );
            }}
          />
        )}
      />

      {/* Confirmation Modal to Terminate Voting Phase */}
      <Dialog
        open={terminatingId !== null}
        onOpenChange={(open) => {
          if (!open) setTerminatingId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terminar sessão de votação?</DialogTitle>
            <DialogDescription>
              Esta ação irá encerrar a sessão de votação #{terminatingId}. Os
              recrutadores deixarão de poder votar nesta sessão e os candidatos
              pendentes permanecerão por decidir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminatingId(null)}
              disabled={isTerminating}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmTerminate}
              disabled={isTerminating}
              className="gap-1.5"
            >
              {isTerminating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <SquareSquare className="size-3.5" />
              )}
              <span>Confirmar e Terminar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
