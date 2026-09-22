"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { setCandidatesViewMode } from "@/cookies/set";
import { getInitials } from "@/lib/utils";

import { CandidateWithMetadata } from "@/lib/candidate";
import CandidateGridCard from "./candidate-grid-card";
import { ClassificationText, DecisionText } from "./candidate-text";

import {
  availableClassifications,
  availableCourses,
  availableCurricularYears,
} from "@/lib/constants";

interface CandidatesClientProps {
  authUser?: { id?: string } | null;
  candidates: Array<CandidateWithMetadata>;
  availableDepartments: Array<string>;
  initialViewMode?: ViewMode;
}

const PAGE_SIZE = 48;

const PREVIOUS_APPLICATION_OPTIONS = [
  { value: "yes", label: "Já se candidatou" },
  { value: "no", label: "Primeira candidatura" },
];

const DECISION_OPTIONS = [
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "pending", label: "Pendente" },
];

const multiIncludes = (
  row: { original: CandidateWithMetadata },
  value: string | string[] | undefined,
  extract: (c: CandidateWithMetadata) => string[],
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
}: CandidatesClientProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode);
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    setCandidatesViewMode(mode);
  };
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    email: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  const columns = useMemo<ColumnDef<CandidateWithMetadata>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => (
          <DataTableEntityCell
            image={row.original.image || undefined}
            imageAlt={row.original.name}
            name={
              <Link
                href={`/candidate/${row.original.id}`}
                className="transition-colors hover:text-primary"
              >
                {row.original.name || "Sem nome"}
              </Link>
            }
            initials={getInitials(row.original.name)}
            subtitle={
              row.original.application?.studentNumber
                ? `nº ${row.original.application.studentNumber}`
                : undefined
            }
          />
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email ?? "-"}
          </span>
        ),
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
        header: "Recandidatura",
        enableSorting: false,
        cell: ({ row }) => {
          const years = row.original.previousApplicationYears ?? [];
          return (
            <span className="text-sm text-foreground">
              {years.length > 0 ? years.join(", ") : "-"}
            </span>
          );
        },
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
      pagination,
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
    onPaginationChange: (updater) => {
      if (isMountedRef.current) setPagination(updater);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value ?? "")
        .toLowerCase()
        .trim();
      if (!q) return true;
      const c = row.original as CandidateWithMetadata;
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

  const setFilter = (id: string, values: string[]) => {
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== id),
      ...(values.length > 0 ? [{ id, value: values }] : []),
    ]);
  };

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col gap-6">
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
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Procurar candidato..."
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
        }
        actions={
          <DataTableColumnToggle
            table={table}
            columnLabels={{
              name: "Nome",
              email: "Email",
              course: "Curso",
              year: "Ano",
              previousApplications: "Recandidatura",
              departments: "Departamentos",
              interviewClassification: "Entrevista",
              dynamicClassification: "Dinâmica",
              decision: "Decisão",
            }}
          />
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
          </>
        }
      />

      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        <span className="font-semibold text-foreground">{filteredCount}</span>{" "}
        candidaturas
      </p>

      <DataTableView
        table={table}
        viewMode={viewMode}
        emptyTitle="Sem candidatos"
        emptyDescription="Nenhum candidato corresponde aos filtros selecionados."
        renderGrid={(t) => (
          <GridView
            table={t}
            getItemKey={(c) => c.id ?? `candidate-${c.email}`}
            renderCard={(c) => (
              <CandidateGridCard
                candidate={c}
                friends={c.knownRecruiters}
                authUser={authUser}
              />
            )}
          />
        )}
      />
    </div>
  );
}
