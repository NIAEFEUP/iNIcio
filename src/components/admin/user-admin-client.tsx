"use client";

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
  type VisibilityState,
} from "@tanstack/react-table";
import { KeyRound, Loader2, Search, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { DataTableFilter } from "@/components/data-table/data-table-filter";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/data-table/view-mode-toggle";
import { GridView } from "@/components/data-table/grid-view";
import { GridCard } from "@/components/data-table/grid-card";
import { BulkActions } from "@/components/data-table/bulk-actions";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { toast } from "@/components/ui/toast";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import type { AdminUserItem } from "@/lib/admin";
import type { Recruitment } from "@/lib/db";

interface Props {
  users: AdminUserItem[];
  recruitments: Recruitment[];
  currentUserId?: string;
  updateUser: (formData: FormData) => Promise<{
    success: boolean;
    user?: Partial<AdminUserItem>;
    error?: string;
  }>;
  deleteUser: (
    userId: string,
    adminPassword: string,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  sendPasswordResetEmail: (userId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export default function UserAdminClient({
  users,
  recruitments,
  currentUserId,
  updateUser,
  deleteUser,
  sendPasswordResetEmail,
}: Props) {
  const [list, setList] = useState<AdminUserItem[]>(users || []);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    candidateRecruitmentIds: false,
    recruiterRecruitmentIds: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Edit User State
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingResetInModal, setIsSendingResetInModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  const recruitmentOptions = useMemo(() => {
    return recruitments.map((r) => ({
      value: String(r.id),
      label: r.title
        ? `${r.title} (${r.lectiveYear})`
        : `${r.lectiveYear} • ${r.semester}º Semestre`,
      description: `${r.lectiveYear} • Semestre ${r.semester}`,
    }));
  }, [recruitments]);

  const setFilter = (id: string, values: string[]) => {
    setColumnFilters((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (values.length > 0) {
        return [...next, { id, value: values }];
      }
      return next;
    });
  };

  const selectedCandidateRecruitments = useMemo(() => {
    const filter = columnFilters.find(
      (f) => f.id === "candidateRecruitmentIds",
    );
    return (filter?.value as string[]) || [];
  }, [columnFilters]);

  const selectedRecruiterRecruitments = useMemo(() => {
    const filter = columnFilters.find(
      (f) => f.id === "recruiterRecruitmentIds",
    );
    return (filter?.value as string[]) || [];
  }, [columnFilters]);

  const openEditModal = useCallback((targetUser: AdminUserItem) => {
    setEditingUser(targetUser);
    setEditName(targetUser.name);
    setEditEmail(targetUser.email);
    setAvatarFile(null);
    setAvatarPreview(targetUser.image || null);
    setRemoveAvatar(false);
  }, []);

  const closeEditModal = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setEditingUser(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
  };

  const openDeleteModal = useCallback(
    (targetUser: AdminUserItem) => {
      if (currentUserId && targetUser.id === currentUserId) {
        toast.add({
          type: "error",
          title: "Ação não permitida",
          description:
            "Não podes eliminar a tua própria conta de administrador.",
        });
        return;
      }
      setDeletingUser(targetUser);
    },
    [currentUserId],
  );

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeletingUser(null);
  };

  const handleConfirmDelete = async (adminPassword: string) => {
    if (!deletingUser) return false;
    setIsDeleting(true);
    try {
      const res = await deleteUser(deletingUser.id, adminPassword);
      if (!res.success) {
        throw new Error(res.error || "Falha ao eliminar utilizador");
      }

      const deletedId = deletingUser.id;
      setList((prev) => prev.filter((u) => u.id !== deletedId));
      setRowSelection((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });
      if (editingUser?.id === deletedId) {
        closeEditModal();
      }
      setDeletingUser(null);
      toast.add({
        type: "success",
        title: "Utilizador eliminado",
        description:
          "O utilizador e todos os registos associados foram eliminados com sucesso.",
      });
      return true;
    } catch (err) {
      toast.add({
        type: "error",
        title: "Erro ao eliminar utilizador",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível eliminar o utilizador.",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.add({
        type: "error",
        title: "Ficheiro inválido",
        description: "Por favor seleciona uma imagem (PNG, JPG, WEBP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        type: "error",
        title: "Imagem demasiado grande",
        description: "O tamanho máximo permitido é de 5MB.",
      });
      return;
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName) {
      return toast.add({
        type: "error",
        title: "Nome obrigatório",
        description: "Por favor preenche o nome do utilizador.",
      });
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return toast.add({
        type: "error",
        title: "Email inválido",
        description: "Por favor introduz um endereço de email válido.",
      });
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("userId", editingUser.id);
      formData.append("name", trimmedName);
      formData.append("email", trimmedEmail);
      formData.append("removeAvatar", removeAvatar ? "true" : "false");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateUser(formData);

      if (!res.success) {
        throw new Error(res.error || "Ocorreu um erro ao guardar alterações");
      }

      setList((prev) =>
        prev.map((u) => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              name: trimmedName,
              email: trimmedEmail,
              image: res.user?.image !== undefined ? res.user.image : u.image,
              updatedAt: new Date().toISOString(),
            };
          }
          return u;
        }),
      );

      closeEditModal();
      toast.add({
        type: "success",
        title: "Utilizador atualizado",
        description: "Os dados da conta foram guardados com sucesso.",
      });
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao atualizar utilizador",
        description:
          err instanceof Error ? err.message : "Não foi possível guardar.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendResetPasswordInModal = async () => {
    if (!editingUser) return;
    setIsSendingResetInModal(true);
    try {
      const res = await sendPasswordResetEmail(editingUser.id);
      if (!res.success) {
        throw new Error(res.error || "Falha ao enviar email");
      }
      toast.add({
        type: "success",
        title: "Email enviado",
        description: `Email de recuperação enviado para ${editingUser.email}.`,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro no envio",
        description:
          err instanceof Error ? err.message : "Não foi possível enviar email.",
      });
    } finally {
      setIsSendingResetInModal(false);
    }
  };

  // Bulk Actions
  const handleBulkExportCSV = () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;

    const headers = ["ID", "Nome", "Email", "Data de Registo"];

    const rows = selectedRows.map((u) => {
      return [
        `"${u.id}"`,
        `"${(u.name || "").replace(/"/g, '""')}"`,
        `"${(u.email || "").replace(/"/g, '""')}"`,
        `"${formatDate(u.createdAt)}"`,
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
      `utilizadores_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Columns definition (clean typography, no badges)
  const columns = useMemo<ColumnDef<AdminUserItem>[]>(
    () => [
      getSelectColumn<AdminUserItem>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Nome" />
        ),
        cell: ({ row }) => {
          const u = row.original;
          return (
            <DataTableEntityCell
              name={u.name || "Sem nome"}
              image={u.image || undefined}
              initials={getInitials(u.name || u.email || u.id)}
            />
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableSortableHeader column={column} title="Registo" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      getActionsColumn<AdminUserItem>({
        onEdit: (user) => openEditModal(user),
        onDelete: (user) => openDeleteModal(user),
      }),
      // Filter accessor columns (hidden from display)
      {
        accessorKey: "candidateRecruitmentIds",
        header: "Candidato em",
        enableHiding: true,
        filterFn: (row, columnId, filterValues: string[]) => {
          if (!filterValues || filterValues.length === 0) return true;
          const userRecruitmentIds = row.getValue<number[]>(columnId) || [];
          return filterValues.some((v) =>
            userRecruitmentIds.includes(Number(v)),
          );
        },
      },
      {
        accessorKey: "recruiterRecruitmentIds",
        header: "Recrutador em",
        enableHiding: true,
        filterFn: (row, columnId, filterValues: string[]) => {
          if (!filterValues || filterValues.length === 0) return true;
          const userRecruitmentIds = row.getValue<number[]>(columnId) || [];
          return filterValues.some((v) =>
            userRecruitmentIds.includes(Number(v)),
          );
        },
      },
    ],
    [openEditModal, openDeleteModal],
  );

  const table = useReactTable({
    data: list,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    autoResetPageIndex: false,
    onSortingChange: (u) => isMountedRef.current && setSorting(u),
    onGlobalFilterChange: (u) => isMountedRef.current && setGlobalFilter(u),
    onColumnFiltersChange: (u) => isMountedRef.current && setColumnFilters(u),
    onColumnVisibilityChange: (u) =>
      isMountedRef.current && setColumnVisibility(u),
    onRowSelectionChange: (u) => isMountedRef.current && setRowSelection(u),
    globalFilterFn: (row, columnId, filterValue: string) => {
      const q = filterValue.toLowerCase().trim();
      if (!q) return true;
      const u = row.original;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k],
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Utilizadores"
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
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Procurar utilizador..."
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
        }
        actions={
          viewMode === "list" ? (
            <DataTableColumnToggle
              table={table}
              columnLabels={{
                name: "Nome",
                email: "Email",
                createdAt: "Data de Registo",
              }}
            />
          ) : undefined
        }
        filters={
          <>
            <DataTableFilter
              title="Recrutamento como Candidato"
              pluralTitle="Recrutamentos como Candidato"
              allLabel="Todos os recrutamentos"
              options={recruitmentOptions}
              selectedValues={selectedCandidateRecruitments}
              onSelectedValuesChange={(values) =>
                setFilter("candidateRecruitmentIds", values)
              }
            />
            <DataTableFilter
              title="Recrutamento como Recrutador"
              pluralTitle="Recrutamentos como Recrutador"
              allLabel="Todos os recrutamentos"
              options={recruitmentOptions}
              selectedValues={selectedRecruiterRecruitments}
              onSelectedValuesChange={(values) =>
                setFilter("recruiterRecruitmentIds", values)
              }
            />
          </>
        }
      />

      <DataTableView
        table={table}
        viewMode={viewMode}
        emptyTitle="Sem utilizadores encontrados"
        emptyDescription="Tenta redefinir os teus filtros ou termo de pesquisa."
        renderGrid={(t) => (
          <GridView
            table={t}
            getItemKey={(r) => r.id}
            renderCard={(r) => {
              const row = t
                .getRowModel()
                .rows.find((row) => row.original.id === r.id);
              const isSelected = row ? row.getIsSelected() : false;

              return (
                <GridCard
                  avatar={
                    r.image ? (
                      <Avatar className="size-10 border border-border">
                        <AvatarImage
                          src={getStableImageUrl(r.image)}
                          alt={r.name}
                        />
                        <AvatarFallback>
                          <InitialsAvatar
                            initials={getInitials(r.name || r.email || r.id)}
                            size="md"
                          />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <InitialsAvatar
                        initials={getInitials(r.name || r.email || r.id)}
                        size="md"
                      />
                    )
                  }
                  title={r.name || "Sem nome"}
                  subtitle={r.email}
                  isSelected={isSelected}
                  onSelectChange={(val) => row?.toggleSelected(val)}
                  onEdit={() => openEditModal(r)}
                  onDelete={() => openDeleteModal(r)}
                  editLabel="Editar"
                  deleteLabel="Eliminar"
                >
                  <p className="text-xs text-muted-foreground">
                    Registado em {formatDate(r.createdAt)}
                  </p>
                </GridCard>
              );
            }}
          />
        )}
      />

      {/* Bulk actions toolbar */}
      <BulkActions
        selectedCount={selectedCount}
        entityLabel="utilizador"
        entityPluralLabel="utilizadores"
        onExport={handleBulkExportCSV}
        onClear={() => table.toggleAllRowsSelected(false)}
      />

      {/* Edit User Dialog */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => !open && closeEditModal()}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
            <DialogDescription>
              Altera as informações da conta de utilizador.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveUser} className="space-y-6 pt-2">
              <div className="grid gap-4">
                {/* Avatar Section */}
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label className="sm:text-right">Foto de Perfil</Label>
                  <div className="sm:col-span-3 flex items-center gap-4">
                    <div className="relative shrink-0">
                      {removeAvatar ? (
                        <InitialsAvatar
                          size="lg"
                          initials={getInitials(editName || editEmail || "?")}
                          className="size-14 text-sm"
                        />
                      ) : avatarPreview ? (
                        <Avatar className="size-14 border border-border">
                          <AvatarImage
                            src={
                              avatarPreview.startsWith("blob:")
                                ? avatarPreview
                                : getStableImageUrl(avatarPreview)
                            }
                            alt={editName}
                          />
                          <AvatarFallback>
                            <InitialsAvatar
                              size="lg"
                              initials={getInitials(
                                editName || editEmail || "?",
                              )}
                              className="size-14 text-sm"
                            />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <InitialsAvatar
                          size="lg"
                          initials={getInitials(editName || editEmail || "?")}
                          className="size-14 text-sm"
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarFileChange}
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="size-3.5 mr-1.5" />
                          Alterar foto
                        </Button>
                        {(avatarPreview ||
                          (!removeAvatar && editingUser.image)) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5 mr-1.5" />
                            Remover
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG ou WEBP até 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="edit-name" className="sm:text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome completo"
                    className="sm:col-span-3"
                    required
                  />
                </div>

                {/* Email */}
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="edit-email" className="sm:text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="utilizador@exemplo.com"
                    className="sm:col-span-3"
                    required
                  />
                </div>

                {/* Password Reset */}
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label className="sm:text-right">Palavra-passe</Label>
                  <div className="sm:col-span-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendResetPasswordInModal}
                      disabled={isSendingResetInModal || isSaving}
                    >
                      {isSendingResetInModal ? (
                        <Loader2 className="size-4 mr-1.5 animate-spin" />
                      ) : (
                        <KeyRound className="size-4 mr-1.5" />
                      )}
                      Enviar email de recuperação
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const u = editingUser;
                    closeEditModal();
                    openDeleteModal(u);
                  }}
                  disabled={isSaving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Eliminar utilizador
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditModal}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "A guardar..." : "Guardar Alterações"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteUserDialog
        key={deletingUser?.id ?? "none"}
        open={deletingUser !== null}
        onOpenChange={(open) => !open && closeDeleteModal()}
        user={deletingUser}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
