"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Plus, Search, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableView } from "@/components/data-table/data-table-view";
import { DataTableColumnToggle } from "@/components/data-table/data-table-column-toggle";
import {
  DataTableEntityCell,
  DataTableSortableHeader,
  getActionsColumn,
  getSelectColumn,
} from "@/components/data-table/data-table-column-helpers";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { GridView } from "@/components/data-table/grid-view";
import { GridCard } from "@/components/data-table/grid-card";
import { BulkActions } from "@/components/data-table/bulk-actions";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getInitials } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface RecruiterRow {
  userId: string;
  name?: string;
  email?: string;
  availabilityMinutes?: number;
  availabilitySlots?: number;
  interviews?: number;
  dynamics?: number;
}

function formatAvailability(minutes?: number) {
  const total = minutes ?? 0;
  if (total <= 0) return "—";
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

interface Props {
  recruiters: RecruiterRow[];
  users: Array<{ id: string; name: string; email: string }>;
  addRecruiter: (userId: string) => Promise<void>;
  removeRecruiter: (userId: string) => Promise<void>;
}

const PAGE_SIZE = 6;

export default function RecruiterAdminClient({
  recruiters,
  users,
  addRecruiter,
  removeRecruiter,
}: Props) {
  const [list, setList] = useState<RecruiterRow[]>(recruiters || []);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const debounceRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (!query) {
        setResults([]);
        return;
      }
      const q = query.toLowerCase();
      const filtered = (users || []).filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
      setResults(filtered.slice(0, 50));
    }, 150);
  }, [query, users]);

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    const idToAdd = selected ? selected.id : userId;
    if (!idToAdd)
      return toast.add({ type: "error", title: "Escolhe um utilizador" });

    try {
      await addRecruiter(idToAdd);

      if (selected) {
        setList((s) => [
          ...s,
          { userId: idToAdd, name: selected.name, email: selected.email },
        ]);
      } else {
        const u = (users || []).find(
          (x) =>
            x.id === idToAdd || x.id.toLowerCase() === idToAdd.toLowerCase(),
        );
        if (u) {
          setList((s) => [
            ...s,
            { userId: idToAdd, name: u.name, email: u.email },
          ]);
        } else {
          setList((s) => [...s, { userId: idToAdd }]);
        }
      }
      setUserId("");
      setQuery("");
      setResults([]);
      setSelected(null);
      setIsAddOpen(false);
      toast.add({ type: "success", title: "Recrutador adicionado" });
    } catch (err) {
      console.error(err);
      toast.add({ type: "error", title: "Ocorreu um erro na submissao" });
    }
  }

  function confirmRemove() {
    if (!pendingDeleteId) return;
    handleRemove(pendingDeleteId);
    setPendingDeleteId(null);
  }

  async function handleRemove(id: string) {
    try {
      await removeRecruiter(id);
      setList((s) => s.filter((r) => r.userId !== id));
      toast.add({ type: "success", title: "Recrutador removido" });
    } catch (err) {
      console.error(err);
      toast.add({ type: "error", title: "Ocorreu um erro na submissao" });
    }
  }

  const columns = useMemo<ColumnDef<RecruiterRow>[]>(
    () => [
      getSelectColumn<RecruiterRow>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => (
          <DataTableEntityCell
            name={row.original.name ?? "Sem nome"}
            initials={getInitials(
              row.original.name ?? row.original.email ?? row.original.userId,
            )}
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
        accessorKey: "availabilityMinutes",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Disponibilidade" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatAvailability(row.original.availabilityMinutes)}
          </span>
        ),
      },
      {
        accessorKey: "interviews",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Entrevistas" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground tabular-nums">
            {row.original.interviews ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "dynamics",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Dinâmicas" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground tabular-nums">
            {row.original.dynamics ?? 0}
          </span>
        ),
      },
      getActionsColumn<RecruiterRow>({
        onDelete: (r) => setPendingDeleteId(r.userId),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: list,
    columns,
    state: { sorting, globalFilter, pagination, rowSelection },
    autoResetPageIndex: false,
    onSortingChange: (u) => {
      if (isMountedRef.current) setSorting(u);
    },
    onGlobalFilterChange: (u) => {
      if (isMountedRef.current) setGlobalFilter(u);
    },
    onPaginationChange: (u) => {
      if (isMountedRef.current) setPagination(u);
    },
    onRowSelectionChange: (u) => {
      if (isMountedRef.current) setRowSelection(u);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
      "Nome",
      "Email",
      "Disponibilidade",
      "Entrevistas",
      "Dinâmicas",
    ];

    const rows = selectedRows.map((r) => {
      return [
        `"${r.userId}"`,
        `"${(r.name || "").replace(/"/g, '""')}"`,
        `"${(r.email || "").replace(/"/g, '""')}"`,
        `"${formatAvailability(r.availabilityMinutes)}"`,
        `"${r.interviews ?? 0}"`,
        `"${r.dynamics ?? 0}"`,
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
      `recrutadores_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  async function handleBulkRemove() {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const ids = selectedRows.map((r) => r.userId);
      await Promise.all(ids.map((id) => removeRecruiter(id)));
      setList((s) => s.filter((r) => !ids.includes(r.userId)));
      table.toggleAllRowsSelected(false);
      toast.add({ type: "success", title: "Recrutadores removidos" });
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Ocorreu um erro na remoção dos recrutadores",
      });
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Recrutadores"
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
              placeholder="Procurar recrutador..."
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
                  name: "Nome",
                  email: "Email",
                  availabilityMinutes: "Disponibilidade",
                  interviews: "Entrevistas",
                  dynamics: "Dinâmicas",
                }}
              />
            )}
            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <UserRoundPlus className="size-3.5" />
              Adicionar
            </Button>
          </>
        }
      />

      <DataTableView
        table={table}
        viewMode={viewMode}
        emptyTitle="Sem recrutadores"
        emptyDescription="Adiciona recrutadores para este período de recrutamento."
        renderGrid={(t) => (
          <GridView
            table={t}
            getItemKey={(r) => r.userId}
            renderCard={(r) => {
              const row = t
                .getRowModel()
                .rows.find((row) => row.original.userId === r.userId);
              const isSelected = row ? row.getIsSelected() : false;

              return (
                <GridCard
                  avatar={
                    <InitialsAvatar
                      size="md"
                      initials={getInitials(r.name ?? r.email ?? r.userId)}
                    />
                  }
                  title={r.name ?? "Sem nome"}
                  subtitle={r.email}
                  isSelected={isSelected}
                  onSelectChange={(val) => row?.toggleSelected(val)}
                  onDelete={() => setPendingDeleteId(r.userId)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Disponibilidade
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatAvailability(r.availabilityMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entrevistas</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {r.interviews ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dinâmicas</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {r.dynamics ?? 0}
                    </span>
                  </div>
                </GridCard>
              );
            }}
          />
        )}
      />

      {/* Add recruiter dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Adicionar Recrutador
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Procurar por nome, email ou id
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar utilizador..."
              />
              <div className="mt-2 max-h-40 overflow-auto">
                {results.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelected(u);
                      setUserId(u.id);
                      setResults([]);
                      setQuery(`${u.name} — ${u.email}`);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-muted"
                  >
                    <InitialsAvatar size="sm" initials={getInitials(u.name)} />
                    <div>
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">
                <Plus className="size-4" />
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm remove dialog */}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Tens a certeza que queres remover?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              O utilizador deixará de ser recrutador deste período de
              recrutamento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDeleteId(null)}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmRemove}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk actions toolbar */}
      <BulkActions
        selectedCount={selectedCount}
        entityLabel="recrutador"
        entityPluralLabel="recrutadores"
        onExport={handleBulkExportCSV}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onClear={() => table.toggleAllRowsSelected(false)}
      />

      {/* Confirm bulk remove dialog */}
      <Dialog
        open={isBulkDeleteOpen}
        onOpenChange={(open) => !open && setIsBulkDeleteOpen(false)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Tens a certeza que queres remover?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedCount === 1
                ? "O recrutador selecionado deixará de ser recrutador deste período de recrutamento."
                : `Os ${selectedCount} recrutadores selecionados deixarão de ser recrutadores deste período de recrutamento.`}
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
              onClick={handleBulkRemove}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "A remover..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
