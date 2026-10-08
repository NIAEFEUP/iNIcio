"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { History, Loader2, Search, Vote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableView } from "@/components/data-table/data-table-view";
import { DataTableColumnToggle } from "@/components/data-table/data-table-column-toggle";
import { DataTableFilter } from "@/components/data-table/data-table-filter";
import {
  DataTableEntityCell,
  DataTableSortableHeader,
  getSelectColumn,
} from "@/components/data-table/data-table-column-helpers";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { GridView } from "@/components/data-table/grid-view";
import { BulkActions } from "@/components/data-table/bulk-actions";
import { setCandidatesViewMode } from "@/cookies/set";
import { cn, getInitials } from "@/lib/utils";

import type { CandidateListMetadata } from "@/lib/candidate";
import CandidateGridCard from "./candidate-grid-card";
import { CandidateAvatarLightbox } from "./candidate-avatar-lightbox";
import { ClassificationText, DecisionText } from "./candidate-text";
import { getStableImageUrl } from "@/lib/stable-image-url";

import {
  availableClassifications,
  availableCourses,
  availableCurricularYears,
} from "@/lib/constants";
import { useTableUrlFilters } from "@/hooks/use-table-url-filters";
import {
  saveCandidatesScrollPosition,
  useCandidatesScrollRestoration,
} from "@/lib/candidate-scroll";
import { createVotingSessionAction } from "@/app/candidate/actions";

const CANDIDATE_FILTER_KEYS = [
  "course",
  "year",
  "previousApplications",
  "departments",
  "interviewClassification",
  "dynamicClassification",
  "decision",
  "scheduling",
];

interface CandidatesClientProps {
  authUser?: { id?: string; isAdmin?: boolean } | null;
  candidates: Array<CandidateListMetadata>;
  availableDepartments: Array<string>;
  initialViewMode?: ViewMode;
  initialScheduling?: string[];
  initialFilters?: ColumnFiltersState;
}

const PREVIOUS_APPLICATION_OPTIONS = [
  { value: "yes", label: "Já se candidatou" },
  { value: "no", label: "Primeira candidatura" },
];

const DECISION_OPTIONS = [
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "pending", label: "Pendente" },
];

const SCHEDULING_OPTIONS = [
  { value: "sem-entrevista", label: "Sem entrevista" },
  { value: "sem-dinamica", label: "Sem dinâmica" },
  { value: "sem-ambas", label: "Sem ambas" },
];

const multiIncludes = (
  row: { original: CandidateListMetadata },
  value: string | string[] | undefined,
  extract: (c: CandidateListMetadata) => string[],
) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return true;
  const wanted = Array.isArray(value) ? value : [value];
  if (wanted.length === 0) return true;
  const haystack = extract(row.original);
  return wanted.some((w) => haystack.includes(w));
};

export default function CandidatesClient({
  authUser,
  candidates,
  availableDepartments,
  initialViewMode = "grid",
  initialScheduling = [],
  initialFilters = [],
}: CandidatesClientProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode);
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    setCandidatesViewMode(mode);
  };
  const [sorting, setSorting] = useState<SortingState>([]);

  const effectiveInitialFilters = useMemo(() => {
    if (initialFilters && initialFilters.length > 0) {
      return initialFilters;
    }
    if (initialScheduling && initialScheduling.length > 0) {
      return [{ id: "scheduling", value: initialScheduling }];
    }
    return [];
  }, [initialFilters, initialScheduling]);

  const [columnFilters, setColumnFilters] = useTableUrlFilters({
    filterKeys: CANDIDATE_FILTER_KEYS,
    initialFilters: effectiveInitialFilters,
  });

  useCandidatesScrollRestoration();

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    previousApplications: false,
    departments: false,
  });
  const router = useRouter();
  const [isCreatingVoting, setIsCreatingVoting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const isMountedRef = useRef(false);

  // `user` is rebuilt on every render; keep the props and callbacks passed to
  // the memoized grid cards stable so they can bail out.
  const authUserId = authUser?.id;
  const authUserIsAdmin = authUser?.isAdmin;
  const memoizedAuthUser = useMemo<{ id?: string; isAdmin?: boolean } | null>(
    () => (authUserId ? { id: authUserId, isAdmin: authUserIsAdmin } : null),
    [authUserId, authUserIsAdmin],
  );

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  const columns = useMemo<ColumnDef<CandidateListMetadata>[]>(
    () => [
      getSelectColumn<CandidateListMetadata>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => {
          const previousApplicationYears =
            row.original.previousApplicationYears ?? [];
          const picture = getStableImageUrl(row.original.image);
          const name = row.original.name || "Sem nome";
          const initials = getInitials(row.original.name);

          return (
            <DataTableEntityCell
              avatar={
                <CandidateAvatarLightbox
                  picture={picture}
                  name={name}
                  initials={initials}
                  size="sm"
                />
              }
              name={
                <Link
                  href={`/candidate/${row.original.id}`}
                  className="transition-colors hover:text-primary"
                  onClick={saveCandidatesScrollPosition}
                >
                  {name}
                </Link>
              }
              badge={
                previousApplicationYears.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger
                      className="-ml-0.5 inline-flex shrink-0 cursor-help items-center text-muted-foreground"
                      aria-label={`Candidatou-se anteriormente em ${previousApplicationYears.join(", ")}`}
                    >
                      <History className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Candidatou-se anteriormente em{" "}
                      {previousApplicationYears.join(", ")}
                    </TooltipContent>
                  </Tooltip>
                ) : undefined
              }
              subtitle={
                row.original.application?.studentNumber
                  ? `${row.original.application.studentNumber}`
                  : undefined
              }
            />
          );
        },
      },
      {
        id: "course",
        accessorFn: (c) => c.application?.degree ?? "",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Curso" />
        ),
        cell: ({ row }) => (
          <span className="text-sm uppercase text-foreground">
            {row.original.application?.degree || "-"}
          </span>
        ),
        filterFn: (row, _id, value: string[]) =>
          multiIncludes(row, value, (c) =>
            c.application?.degree ? [c.application.degree] : [],
          ),
      },
      {
        id: "year",
        accessorFn: (c) => c.application?.curricularYear ?? "",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Ano" />
        ),
        cell: ({ row }) => {
          const year = row.original.application?.curricularYear;
          return (
            <span className="text-sm text-foreground">
              {year
                ? /^\d+$/.test(String(year))
                  ? `${year}º ano`
                  : String(year)
                : "-"}
            </span>
          );
        },
        filterFn: (row, _id, value: string[]) =>
          multiIncludes(row, value, (c) =>
            c.application?.curricularYear ? [c.application.curricularYear] : [],
          ),
      },
      {
        id: "previousApplications",
        accessorFn: (c) => (c.previousApplicationYears ?? []).join(", "),
        enableHiding: false,
        filterFn: (row, _id, value: string[]) => {
          if (!value || value.length === 0) return true;
          const applied =
            (row.original.previousApplicationYears ?? []).length > 0;
          return value.some((v) => (v === "yes" ? applied : !applied));
        },
      },
      {
        id: "departments",
        accessorFn: (c) => (c.application?.interests ?? []).join(", "),
        header: "Departamentos",
        enableSorting: false,
        cell: ({ row }) => {
          const interests = row.original.application?.interests ?? [];
          return (
            <div className="flex flex-wrap gap-1">
              {interests.slice(0, 2).map((i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {i}
                </Badge>
              ))}
              {interests.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{interests.length - 2}
                </Badge>
              )}
            </div>
          );
        },
        filterFn: (row, _id, value: string[]) =>
          multiIncludes(row, value, (c) =>
            (c.application?.interests ?? []).map((i) => i.toLowerCase()),
          ),
      },
      {
        id: "interviewClassification",
        accessorFn: (c) => c.interviewClassification ?? "",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Entrevista" />
        ),
        cell: ({ row }) => (
          <ClassificationText level={row.original.interviewClassification} />
        ),
        filterFn: (row, _id, value: string[]) =>
          multiIncludes(row, value, (c) =>
            c.interviewClassification ? [c.interviewClassification] : [],
          ),
      },
      {
        id: "dynamicClassification",
        accessorFn: (c) => c.dynamicClassification ?? "",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Dinâmica" />
        ),
        cell: ({ row }) => (
          <ClassificationText level={row.original.dynamicClassification} />
        ),
        filterFn: (row, _id, value: string[]) =>
          multiIncludes(row, value, (c) =>
            c.dynamicClassification ? [c.dynamicClassification] : [],
          ),
      },
      {
        id: "scheduling",
        accessorFn: (c) =>
          `${c.interview ? "interview" : "none"}-${c.dynamic ? "dynamic" : "none"}`,
        header: "Marcação",
        enableSorting: false,
        cell: ({ row }) => {
          const hasInterview = Boolean(row.original.interview);
          const hasDynamic = Boolean(row.original.dynamic);

          if (hasInterview && hasDynamic) {
            return (
              <Badge variant="secondary" className="text-[10px]">
                Agendado
              </Badge>
            );
          }

          const missing = [
            !hasInterview ? "Sem entrevista" : null,
            !hasDynamic ? "Sem dinâmica" : null,
          ].filter(Boolean) as string[];

          return (
            <div className="flex flex-wrap gap-1">
              {missing.map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="text-[10px] text-muted-foreground"
                >
                  {label}
                </Badge>
              ))}
            </div>
          );
        },
        filterFn: (row, _id, value: string[]) => {
          if (!value || value.length === 0) return true;
          const hasInterview = Boolean(row.original.interview);
          const hasDynamic = Boolean(row.original.dynamic);
          return value.some((v) =>
            v === "sem-entrevista"
              ? !hasInterview
              : v === "sem-dinamica"
                ? !hasDynamic
                : v === "sem-ambas"
                  ? !hasInterview && !hasDynamic
                  : false,
          );
        },
      },
      {
        id: "decision",
        accessorFn: (c) =>
          c.votingDecision?.decision === "approve"
            ? "approved"
            : c.votingDecision?.decision === "reject"
              ? "rejected"
              : "pending",
        header: "Decisão",
        enableSorting: false,
        cell: ({ row }) => (
          <DecisionText
            decision={row.original.votingDecision?.decision ?? null}
          />
        ),
        filterFn: (row, _id, value: string[]) => {
          if (!value || value.length === 0) return true;
          const decision = row.original.votingDecision?.decision;
          return value.some((v) =>
            v === "approved"
              ? decision === "approve"
              : v === "rejected"
                ? decision === "reject"
                : v === "pending"
                  ? !decision
                  : false,
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: candidates,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
    autoResetPageIndex: false,
    onSortingChange: (updater) => {
      if (isMountedRef.current) setSorting(updater);
    },
    onColumnFiltersChange: (updater) => {
      if (isMountedRef.current) setColumnFilters(updater);
    },
    onColumnVisibilityChange: (updater) => {
      if (isMountedRef.current) setColumnVisibility(updater);
    },
    onGlobalFilterChange: (updater) => {
      if (isMountedRef.current) setGlobalFilter(updater);
    },
    onRowSelectionChange: (updater) => {
      if (isMountedRef.current) setRowSelection(updater);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value ?? "")
        .toLowerCase()
        .trim();
      if (!q) return true;
      const c = row.original as CandidateListMetadata;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        `${c.application?.studentNumber ?? ""}`.includes(q)
      );
    },
  });

  const selectedCourses =
    (columnFilters.find((f) => f.id === "course")?.value as
      string[] | undefined) ?? [];
  const selectedYears =
    (columnFilters.find((f) => f.id === "year")?.value as
      string[] | undefined) ?? [];
  const selectedPreviousApplications =
    (columnFilters.find((f) => f.id === "previousApplications")?.value as
      string[] | undefined) ?? [];
  const selectedDepartments =
    (columnFilters.find((f) => f.id === "departments")?.value as
      string[] | undefined) ?? [];
  const selectedInterviewClassifications =
    (columnFilters.find((f) => f.id === "interviewClassification")?.value as
      string[] | undefined) ?? [];
  const selectedDynamicClassifications =
    (columnFilters.find((f) => f.id === "dynamicClassification")?.value as
      string[] | undefined) ?? [];
  const selectedDecisions =
    (columnFilters.find((f) => f.id === "decision")?.value as
      string[] | undefined) ?? [];
  const selectedScheduling =
    (columnFilters.find((f) => f.id === "scheduling")?.value as
      string[] | undefined) ?? [];

  const setFilter = (id: string, values: string[]) => {
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== id),
      ...(values.length > 0 ? [{ id, value: values }] : []),
    ]);
  };

  const filteredRows = table.getFilteredRowModel().rows;
  const filteredCount = filteredRows.length;
  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k],
  ).length;

  const isAllFilteredSelected =
    filteredCount > 0 && filteredRows.every((row) => row.getIsSelected());
  const isSomeFilteredSelected =
    filteredCount > 0 &&
    !isAllFilteredSelected &&
    filteredRows.some((row) => row.getIsSelected());

  const handleToggleSelectAll = (checked: boolean | "indeterminate") => {
    if (isAllFilteredSelected || !checked) {
      setRowSelection((prev) => {
        const next = { ...prev };
        for (const row of filteredRows) {
          delete next[row.id];
        }
        return next;
      });
    } else {
      setRowSelection((prev) => {
        const next = { ...prev };
        for (const row of filteredRows) {
          next[row.id] = true;
        }
        return next;
      });
    }
  };

  const handleBulkExportCSV = () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;

    const headers = [
      "Nome",
      "Email",
      "Número de Estudante",
      "Curso",
      "Ano",
      "Departamentos",
      "Entrevista",
      "Dinâmica",
      "Decisão",
    ];

    const rows = selectedRows.map((c) => {
      const decisionText =
        c.votingDecision?.decision === "approve"
          ? "Aprovado"
          : c.votingDecision?.decision === "reject"
            ? "Rejeitado"
            : "Pendente";

      return [
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${(c.email || "").replace(/"/g, '""')}"`,
        `"${String(c.application?.studentNumber ?? "").replace(/"/g, '""')}"`,
        `"${(c.application?.degree || "").replace(/"/g, '""')}"`,
        `"${c.application?.curricularYear ?? ""}"`,
        `"${(c.application?.interests || []).join(", ").replace(/"/g, '""')}"`,
        `"${(c.interviewClassification || "").replace(/"/g, '""')}"`,
        `"${(c.dynamicClassification || "").replace(/"/g, '""')}"`,
        `"${decisionText}"`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `candidatos_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateVotingSession = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;

    const candidateIds = selectedRows
      .map((c) => c.id)
      .filter((id): id is string => Boolean(id));

    if (candidateIds.length === 0) return;

    setIsCreatingVoting(true);
    try {
      const res = await createVotingSessionAction(candidateIds);
      if (res.success && res.id) {
        toast.add({
          type: "success",
          title: "Sessão de votação criada com sucesso!",
        });
        router.push(`/candidates/voting/${res.id}`);
      } else {
        toast.add({
          type: "error",
          title: "Erro ao criar votação",
          description: res.error || "Ocorreu um erro inesperado",
        });
      }
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao criar votação",
      });
    } finally {
      setIsCreatingVoting(false);
    }
  };

  const renderGrid = useMemo(() => {
    const render = (t: typeof table) => (
      <GridView
        table={t}
        getItemKey={(c) => c.id ?? `candidate-${c.email}`}
        renderCard={(c) => {
          const row = t
            .getRowModel()
            .rows.find((row) => row.original.id === c.id);
          const isSelected = row ? row.getIsSelected() : false;

          return (
            <CandidateGridCard
              candidate={c}
              friends={c.knownRecruiters}
              authUser={memoizedAuthUser}
              isSelected={isSelected}
              onSelectChange={(val) => row?.toggleSelected(val)}
            />
          );
        }}
      />
    );
    render.displayName = "CandidatesGrid";
    return render;
  }, [memoizedAuthUser]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('a[href^="/candidate/"]');
    if (target) {
      saveCandidatesScrollPosition();
    }
  };

  return (
    <div className="flex flex-col gap-6" onClickCapture={handleContainerClick}>
      <PageHeader
        title="Candidatos"
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
              placeholder="Procurar candidato..."
              className="h-8 w-full pl-8 text-xs md:w-56"
            />
          </div>
        }
        actions={
          viewMode === "list" ? (
            <DataTableColumnToggle
              table={table}
              columnLabels={{
                name: "Nome",
                course: "Curso",
                year: "Ano",
                departments: "Departamentos",
                interviewClassification: "Entrevista",
                dynamicClassification: "Dinâmica",
                scheduling: "Marcação",
                decision: "Decisão",
              }}
            />
          ) : undefined
        }
        filters={
          <>
            <DataTableFilter
              title="Curso"
              pluralTitle="Cursos"
              allLabel="Todos os cursos"
              options={availableCourses.map((c) => ({
                value: c,
                label: c.toUpperCase(),
              }))}
              selectedValues={selectedCourses}
              onSelectedValuesChange={(values) => setFilter("course", values)}
            />
            <DataTableFilter
              title="Ano"
              pluralTitle="Anos"
              allLabel="Todos os anos"
              options={availableCurricularYears.map((y) => ({
                value: y,
                label: y.toUpperCase(),
              }))}
              selectedValues={selectedYears}
              onSelectedValuesChange={(values) => setFilter("year", values)}
            />
            <DataTableFilter
              title="Recandidatura"
              pluralTitle="Recandidaturas"
              allLabel="Todas as candidaturas"
              options={PREVIOUS_APPLICATION_OPTIONS}
              selectedValues={selectedPreviousApplications}
              onSelectedValuesChange={(values) =>
                setFilter("previousApplications", values)
              }
            />
            <DataTableFilter
              title="Departamento"
              pluralTitle="Departamentos"
              allLabel="Todos os departamentos"
              options={availableDepartments.map((d) => ({
                value: d.toLowerCase(),
                label: d,
              }))}
              selectedValues={selectedDepartments}
              onSelectedValuesChange={(values) =>
                setFilter("departments", values)
              }
            />
            <DataTableFilter
              title="Entrevista"
              pluralTitle="Classificações de Entrevista"
              allLabel="Todas as classificações"
              options={availableClassifications.map((c) => ({
                value: c,
                label:
                  c === "muito fraco"
                    ? "Muito fraco"
                    : c === "muito forte"
                      ? "Muito forte"
                      : c === "normal"
                        ? "Normal"
                        : c,
              }))}
              selectedValues={selectedInterviewClassifications}
              onSelectedValuesChange={(values) =>
                setFilter("interviewClassification", values)
              }
            />
            <DataTableFilter
              title="Dinâmica"
              pluralTitle="Classificações de Dinâmica"
              allLabel="Todas as classificações"
              options={availableClassifications.map((c) => ({
                value: c,
                label:
                  c === "muito fraco"
                    ? "Muito fraco"
                    : c === "muito forte"
                      ? "Muito forte"
                      : c === "normal"
                        ? "Normal"
                        : c,
              }))}
              selectedValues={selectedDynamicClassifications}
              onSelectedValuesChange={(values) =>
                setFilter("dynamicClassification", values)
              }
            />
            <DataTableFilter
              title="Decisão"
              pluralTitle="Decisões"
              allLabel="Todas as decisões"
              options={DECISION_OPTIONS}
              selectedValues={selectedDecisions}
              onSelectedValuesChange={(values) => setFilter("decision", values)}
            />
            <DataTableFilter
              title="Marcação"
              pluralTitle="Marcações"
              allLabel="Todas as marcações"
              options={SCHEDULING_OPTIONS}
              selectedValues={selectedScheduling}
              onSelectedValuesChange={(values) =>
                setFilter("scheduling", values)
              }
            />
          </>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="select-all-candidates"
            checked={
              isAllFilteredSelected
                ? true
                : isSomeFilteredSelected
                  ? "indeterminate"
                  : false
            }
            disabled={filteredCount === 0}
            onCheckedChange={handleToggleSelectAll}
            aria-label="Selecionar todos os candidatos apresentados"
          />
          <label
            htmlFor="select-all-candidates"
            className={cn(
              "text-sm select-none cursor-pointer text-muted-foreground transition-colors hover:text-foreground",
              filteredCount === 0 && "cursor-not-allowed opacity-50",
            )}
          >
            Selecionar todos (
            <span className="font-semibold text-foreground">
              {filteredCount}
            </span>{" "}
            {filteredCount === 1 ? "candidatura" : "candidaturas"})
          </label>
        </div>
      </div>

      <DataTableView
        table={table}
        viewMode={viewMode}
        emptyTitle="Sem candidatos"
        emptyDescription="Nenhum candidato corresponde aos filtros selecionados."
        renderGrid={renderGrid}
      />

      {/* Bulk actions toolbar */}
      <BulkActions
        selectedCount={selectedCount}
        entityLabel="candidato"
        entityPluralLabel="candidatos"
        onExport={handleBulkExportCSV}
        onClear={() => table.toggleAllRowsSelected(false)}
      >
        {authUser?.isAdmin && (
          <Button
            size="sm"
            onClick={handleCreateVotingSession}
            disabled={isCreatingVoting}
          >
            {isCreatingVoting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Vote className="size-4" />
            )}
            Criar votação
          </Button>
        )}
      </BulkActions>
    </div>
  );
}
