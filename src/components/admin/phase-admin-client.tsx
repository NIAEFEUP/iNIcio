"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Calendar, Plus, Search } from "lucide-react";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { GridView } from "@/components/data-table/grid-view";
import { GridCard } from "@/components/data-table/grid-card";
import { setPhasesViewMode } from "@/cookies/set";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableView } from "@/components/data-table/data-table-view";
import { DataTableColumnToggle } from "@/components/data-table/data-table-column-toggle";
import { DataTableFilter } from "@/components/data-table/data-table-filter";
import {
  DataTableSortableHeader,
  DataTableEntityCell,
  getActionsColumn,
  getSelectColumn,
} from "@/components/data-table/data-table-column-helpers";
import { BulkActions } from "@/components/data-table/bulk-actions";
import { toast } from "@/components/ui/toast";
import { RecruitmentPhase } from "@/lib/db";
import { getPhaseState, type PhaseState } from "@/lib/recruitment-state";
import { cn } from "@/lib/utils";

const PHASE_STATE_LABELS: Record<PhaseState, string> = {
  upcoming: "Futura",
  open: "A decorrer",
  closed: "Terminada",
};

const STATE_DOT_CLASSES: Record<PhaseState, string> = {
  open: "bg-emerald-500",
  upcoming: "bg-amber-500",
  closed: "bg-muted-foreground/40",
};

const STATE_TEXT_CLASSES: Record<PhaseState, string> = {
  open: "text-emerald-600 dark:text-emerald-400 font-medium",
  upcoming: "text-amber-600 dark:text-amber-400 font-medium",
  closed: "text-muted-foreground font-normal",
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const ROLE_LABELS: Record<string, string> = {
  candidate: "Candidato",
  recruiter: "Recrutador",
};

interface PhaseAdminClientProps {
  initialViewMode?: ViewMode;
  phases: RecruitmentPhase[];
  addPhase: (p: RecruitmentPhase) => Promise<void>;
  editPhase: (p: RecruitmentPhase) => Promise<void>;
  deletePhase: (id: number) => Promise<void>;
  defaultRecruitmentId?: number;
}

export default function PhaseAdminClient({
  initialViewMode = "list",
  phases,
  addPhase,
  editPhase,
  deletePhase,
  defaultRecruitmentId,
}: PhaseAdminClientProps) {
  const [phasesState, setPhasesState] = useState<RecruitmentPhase[]>(phases);
  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode);
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    setPhasesViewMode(mode);
  };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<RecruitmentPhase | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    start: "",
    end: "",
    clientIdentifier: "",
    role: "candidate",
    recruitmentId: defaultRecruitmentId?.toString() ?? "",
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  // Keep phase badges fresh while the page stays open.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);

    return () => clearInterval(interval);
  }, []);

  const resetForm = () =>
    setForm({
      id: "",
      title: "",
      description: "",
      start: "",
      end: "",
      role: "candidate",
      clientIdentifier: "",
      recruitmentId: defaultRecruitmentId?.toString() ?? "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing && !form.recruitmentId) {
      toast.add({
        title: "Não existe um recrutamento ativo para associar a fase",
      });
      return;
    }

    const phase: any = {
      id: form.id ? Number.parseInt(form.id) : undefined,
      recruitmentId: Number.parseInt(form.recruitmentId),
      title: form.title,
      description: form.description,
      clientIdentifier: form.clientIdentifier,
      start: form.start ? new Date(form.start) : null,
      end: form.end ? new Date(form.end) : null,
      role: form.role,
    };

    if (editing) {
      try {
        await editPhase(phase);
        setPhasesState((prev) =>
          prev.map((p) => (p.id === phase.id ? { ...p, ...phase } : p)),
        );
        toast.add({ title: "Fase atualizada" });
        setIsEditOpen(false);
      } catch (err) {
        console.error(err);
        toast.add({ title: "Ocorreu um erro na submissão" });
        return;
      }
    } else {
      try {
        await addPhase(phase);
        setPhasesState((prev) => [...prev, phase]);
        toast.add({ title: "Fase adicionada" });
        setIsAddOpen(false);
      } catch (err) {
        console.error(err);
        toast.add({ title: "Ocorreu um erro na submissão" });
        return;
      }
    }

    setEditing(null);
    resetForm();
  };

  const handleEdit = useCallback((p: RecruitmentPhase) => {
    setEditing(p);
    setForm({
      id: p.id?.toString() ?? "",
      title: p.title ?? "",
      description: p.description ?? "",
      start: p.start ? new Date(p.start).toISOString().slice(0, 16) : "",
      end: p.end ? new Date(p.end).toISOString().slice(0, 16) : "",
      role: (p.role as string) ?? "candidate",
      clientIdentifier: p.clientIdentifier ?? "",
      recruitmentId: p.recruitmentId?.toString() ?? "",
    });
    setIsEditOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deletePhase(id);
        setPhasesState((prev) => prev.filter((p) => p.id !== id));
        toast.add({ title: "Fase apagada" });
      } catch (err) {
        console.error(err);
        toast.add({ title: "Ocorreu um erro na submissao" });
        return;
      }
    },
    [deletePhase],
  );

  const columns = useMemo<ColumnDef<RecruitmentPhase>[]>(() => {
    return [
      getSelectColumn<RecruitmentPhase>(),
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Título" />
        ),
        cell: ({ row }) => <DataTableEntityCell name={row.original.title} />,
      },
      {
        accessorKey: "clientIdentifier",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Identificador" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.clientIdentifier || "-"}
          </span>
        ),
      },
      {
        id: "description",
        accessorFn: (p) => p.description,
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Descrição" />
        ),
        cell: ({ row }) => (
          <span className="max-w-xl text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap break-words">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "start",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Início" />
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {formatDate(row.original.start)}
          </span>
        ),
      },
      {
        accessorKey: "end",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Fim" />
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {formatDate(row.original.end)}
          </span>
        ),
      },
      {
        id: "state",
        accessorFn: (p) => getPhaseState(p, now),
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
          const state = getPhaseState(row.original, now);
          return (
            <div className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  STATE_DOT_CLASSES[state],
                )}
                aria-hidden="true"
              />
              <span className={STATE_TEXT_CLASSES[state]}>
                {PHASE_STATE_LABELS[state]}
              </span>
            </div>
          );
        },
        filterFn: (row, _id, value: string[]) => {
          if (!value || value.length === 0) return true;
          const state = getPhaseState(row.original, now);
          return value.includes(state);
        },
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Papel" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {ROLE_LABELS[row.original.role] ?? row.original.role}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          const a = ROLE_LABELS[rowA.original.role] ?? rowA.original.role;
          const b = ROLE_LABELS[rowB.original.role] ?? rowB.original.role;
          return a.localeCompare(b, "pt");
        },
        filterFn: (row, _id, value: string[]) => {
          if (!value || value.length === 0) return true;
          return value.includes(row.original.role);
        },
      },
      getActionsColumn<RecruitmentPhase>({
        onEdit: (p) => handleEdit(p),
        onDelete: (p) => {
          if (p.id != null) handleDelete(p.id);
        },
      }),
    ];
    // `now` is intentionally a dependency so the Estado filter stays fresh.
  }, [now, handleEdit, handleDelete]);

  const table = useReactTable({
    data: phasesState,
    columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: (u) => {
      if (isMountedRef.current) setSorting(u);
    },
    onColumnFiltersChange: (u) => {
      if (isMountedRef.current) setColumnFilters(u);
    },
    onGlobalFilterChange: (u) => {
      if (isMountedRef.current) setGlobalFilter(u);
    },
    onRowSelectionChange: (u) => {
      if (isMountedRef.current) setRowSelection(u);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedStates =
    (columnFilters.find((f) => f.id === "state")?.value as
      string[] | undefined) ?? [];
  const selectedRoles =
    (columnFilters.find((f) => f.id === "role")?.value as
      string[] | undefined) ?? [];

  const setStateFilter = (values: string[]) => {
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== "state"),
      ...(values.length > 0 ? [{ id: "state", value: values }] : []),
    ]);
  };

  const setRoleFilter = (values: string[]) => {
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== "role"),
      ...(values.length > 0 ? [{ id: "role", value: values }] : []),
    ]);
  };

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k],
  ).length;

  const handleBulkExportCSV = () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;

    const headers = [
      "ID",
      "Título",
      "Descrição",
      "Início",
      "Fim",
      "Papel",
      "Identificador",
    ];

    const rows = selectedRows.map((p) => {
      return [
        `"${p.id ?? ""}"`,
        `"${(p.title || "").replace(/"/g, '""')}"`,
        `"${(p.description || "").replace(/"/g, '""')}"`,
        `"${p.start ? new Date(p.start).toISOString() : ""}"`,
        `"${p.end ? new Date(p.end).toISOString() : ""}"`,
        `"${ROLE_LABELS[p.role] ?? p.role}"`,
        `"${(p.clientIdentifier || "").replace(/"/g, '""')}"`,
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
      `fases_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const ids = selectedRows
        .map((p) => p.id)
        .filter((id): id is number => id != null);
      await Promise.all(ids.map((id) => deletePhase(id)));
      setPhasesState((prev) => prev.filter((p) => !ids.includes(p.id!)));
      table.toggleAllRowsSelected(false);
      toast.add({ title: "Fases apagadas com sucesso" });
    } catch (err) {
      console.error(err);
      toast.add({ title: "Ocorreu um erro ao apagar as fases" });
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fases"
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
              placeholder="Procurar fase..."
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
        }
        actions={
          <>
            {viewMode === "list" && (
              <DataTableColumnToggle
                table={table}
                columnLabels={{
                  title: "Título",
                  clientIdentifier: "Identificador",
                  description: "Descrição",
                  start: "Início",
                  end: "Fim",
                  state: "Estado",
                  role: "Papel",
                }}
              />
            )}
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                resetForm();
                setIsAddOpen(true);
              }}
              disabled={!defaultRecruitmentId}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              Adicionar
            </Button>
          </>
        }
        filters={
          <>
            <DataTableFilter
              title="Estado"
              pluralTitle="Estados"
              allLabel="Todos os estados"
              options={[
                { value: "upcoming", label: "Futura" },
                { value: "open", label: "A decorrer" },
                { value: "closed", label: "Terminada" },
              ]}
              selectedValues={selectedStates}
              onSelectedValuesChange={setStateFilter}
            />
            <DataTableFilter
              title="Papel"
              pluralTitle="Papéis"
              allLabel="Todos os papéis"
              options={[
                { value: "candidate", label: "Candidato" },
                { value: "recruiter", label: "Recrutador" },
              ]}
              selectedValues={selectedRoles}
              onSelectedValuesChange={setRoleFilter}
            />
          </>
        }
      />

      <DataTableView
        table={table}
        viewMode={viewMode}
        emptyTitle="Sem fases"
        emptyDescription="Adiciona fases para este período de recrutamento."
        renderGrid={(t) => (
          <GridView
            table={t}
            getItemKey={(p) => String(p.id)}
            renderCard={(p, { isSelected, onSelectChange }) => {
              const state = getPhaseState(p, now);
              return (
                <GridCard
                  avatar={
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Calendar className="size-5" />
                    </div>
                  }
                  title={p.title}
                  subtitle={ROLE_LABELS[p.role] ?? p.role}
                  badge={
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          STATE_DOT_CLASSES[state],
                        )}
                      />
                      <span className={STATE_TEXT_CLASSES[state]}>
                        {PHASE_STATE_LABELS[state]}
                      </span>
                    </div>
                  }
                  isSelected={isSelected}
                  onSelectChange={onSelectChange}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => {
                    if (p.id != null) handleDelete(p.id);
                  }}
                  editLabel="Editar"
                  deleteLabel="Eliminar"
                >
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    {p.clientIdentifier && (
                      <div className="flex items-center justify-between">
                        <span>Identificador:</span>
                        <span className="font-mono text-foreground font-medium">
                          {p.clientIdentifier}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Início:</span>
                      <span className="text-foreground">
                        {formatDate(p.start)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fim:</span>
                      <span className="text-foreground">
                        {formatDate(p.end)}
                      </span>
                    </div>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-foreground/80 italic">
                        {p.description}
                      </p>
                    )}
                  </div>
                </GridCard>
              );
            }}
          />
        )}
      />

      {/* Add phase dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Adicionar Fase
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Criar uma nova fase de recrutamento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="phase-title"
                  className="text-right text-card-foreground"
                >
                  Título
                </Label>
                <Input
                  id="phase-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="phase-clientIdentifier"
                  className="text-right text-card-foreground"
                >
                  Identificador
                </Label>
                <Input
                  id="phase-clientIdentifier"
                  value={form.clientIdentifier}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      clientIdentifier: e.target.value,
                    }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="phase-description"
                  className="text-right text-card-foreground"
                >
                  Descrição
                </Label>
                <Textarea
                  id="phase-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="phase-start"
                  className="text-right text-card-foreground"
                >
                  Início
                </Label>
                <Input
                  id="phase-start"
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="phase-end"
                  className="text-right text-card-foreground"
                >
                  Fim
                </Label>
                <Input
                  id="phase-end"
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="phase-role"
                  className="text-right text-card-foreground"
                >
                  Papel
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(val) =>
                      setForm((f) => ({ ...f, role: val as string }))
                    }
                  >
                    <SelectTrigger id="phase-role" className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candidate">Candidato</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit phase dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditing(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Editar Fase
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Atualizar os detalhes da fase
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="edit-phase-title"
                  className="text-right text-card-foreground"
                >
                  Título
                </Label>
                <Input
                  id="edit-phase-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="edit-phase-clientIdentifier"
                  className="text-right text-card-foreground"
                >
                  Identificador
                </Label>
                <Input
                  id="edit-phase-clientIdentifier"
                  value={form.clientIdentifier}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      clientIdentifier: e.target.value,
                    }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="edit-phase-description"
                  className="text-right text-card-foreground"
                >
                  Descrição
                </Label>
                <Textarea
                  id="edit-phase-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="edit-phase-start"
                  className="text-right text-card-foreground"
                >
                  Início
                </Label>
                <Input
                  id="edit-phase-start"
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="edit-phase-end"
                  className="text-right text-card-foreground"
                >
                  Fim
                </Label>
                <Input
                  id="edit-phase-end"
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end: e.target.value }))
                  }
                  className="col-span-3 bg-input border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="edit-phase-role"
                  className="text-right text-card-foreground"
                >
                  Papel
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(val) =>
                      setForm((f) => ({ ...f, role: val as string }))
                    }
                    value={form.role}
                  >
                    <SelectTrigger id="edit-phase-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candidate">Candidato</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Atualizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk actions toolbar */}
      <BulkActions
        selectedCount={selectedCount}
        entityLabel="fase"
        entityPluralLabel="fases"
        onExport={handleBulkExportCSV}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onClear={() => table.toggleAllRowsSelected(false)}
      />

      {/* Confirm bulk delete dialog */}
      <Dialog
        open={isBulkDeleteOpen}
        onOpenChange={(open) => !open && setIsBulkDeleteOpen(false)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Tens a certeza que queres apagar?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedCount === 1
                ? "Esta fase será eliminada permanentemente."
                : `Estas ${selectedCount} fases serão eliminadas permanentemente.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBulkDeleteOpen(false)}
              disabled={isBulkDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "A apagar..." : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
