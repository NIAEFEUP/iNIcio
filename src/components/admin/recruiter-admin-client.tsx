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
} from "@/components/data-table/data-table-column-helpers";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { GridView } from "@/components/data-table/grid-view";
import { GridCard } from "@/components/data-table/grid-card";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getInitials } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface RecruiterRow {
  userId: string;
  name?: string;
  email?: string;
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
      getActionsColumn<RecruiterRow>({
        onDelete: (r) => setPendingDeleteId(r.userId),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: list,
    columns,
    state: { sorting, globalFilter, pagination },
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
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
            <DataTableColumnToggle
              table={table}
              columnLabels={{ name: "Nome", email: "Email" }}
            />
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
            renderCard={(r) => (
              <GridCard
                avatar={
                  <InitialsAvatar
                    size="md"
                    initials={getInitials(r.name ?? r.email ?? r.userId)}
                  />
                }
                title={r.name ?? "Sem nome"}
                subtitle={r.email}
                onDelete={() => setPendingDeleteId(r.userId)}
              />
            )}
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
    </div>
  );
}
