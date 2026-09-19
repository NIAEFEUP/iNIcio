"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { RecruitmentOption } from "@/components/sidebar/sidebar-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { setSelectedRecruitment } from "@/cookies/set";
import {
  createRecruitment,
  duplicateRecruitmentPhases,
  removeRecruitment,
  updateRecruitment,
} from "@/lib/recruitment-actions";
import { cn } from "@/lib/utils";
import type { Recruitment } from "@/lib/db";

interface RecruitmentManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recruitments: RecruitmentOption[];
  initialMode?: "overview" | "create";
}

interface RecruitmentForm {
  lectiveYear: string;
  semester: number;
  title: string;
  start: string;
  end: string;
  active: boolean;
}

type ManagerMode = "overview" | "create" | "edit";

const defaultLectiveYear = () => {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

const emptyForm = (): RecruitmentForm => ({
  lectiveYear: defaultLectiveYear(),
  semester: 1,
  title: "Recrutamento 1º Semestre",
  start: "",
  end: "",
  active: true,
});

function serializeDate(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}

/** Converts an ISO timestamp to a `datetime-local` value in the browser's timezone. */
function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const isActive = (value: boolean | string) =>
  value === true || value === "true";

function toOption(recruitment: Recruitment): RecruitmentOption {
  return {
    id: recruitment.id,
    year: Number.parseInt(recruitment.lectiveYear, 10),
    semester: recruitment.semester,
    title: recruitment.title,
    active: isActive(recruitment.active),
    start: serializeDate(recruitment.start),
    end: serializeDate(recruitment.end),
  };
}

function toOptionFromEditable(recruitment: {
  id: number;
  lectiveYear: string;
  semester: number;
  title: string;
  active: boolean;
  start: string;
  end: string;
}): RecruitmentOption {
  return {
    id: recruitment.id,
    year: Number.parseInt(recruitment.lectiveYear, 10),
    semester: recruitment.semester,
    title: recruitment.title,
    active: recruitment.active,
    start: recruitment.start,
    end: recruitment.end,
  };
}

/** Mirrors the server invariant: an active recruitment deactivates others. */
function upsertRecruitment(
  rows: RecruitmentOption[],
  updated: RecruitmentOption,
): RecruitmentOption[] {
  const exists = rows.some((r) => r.id === updated.id);
  const next = exists
    ? rows.map((r) => (r.id === updated.id ? updated : r))
    : [...rows, updated];

  return updated.active
    ? next.map((r) => (r.id === updated.id ? r : { ...r, active: false }))
    : next;
}

export function RecruitmentManagerDialog({
  open,
  onOpenChange,
  recruitments,
  initialMode = "overview",
}: RecruitmentManagerDialogProps) {
  const router = useRouter();

  const [mode, setMode] = React.useState<ManagerMode>(initialMode);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<RecruitmentForm>(emptyForm);
  const [list, setList] = React.useState<RecruitmentOption[]>(recruitments);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<RecruitmentOption | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const applyDefaultsFromStart = (start: string) => {
    const date = new Date(start);
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const isFirstSemester = date.getMonth() >= 6;
    const semester = isFirstSemester ? 1 : 2;
    const lectiveYear = isFirstSemester
      ? `${year}/${year + 1}`
      : `${year - 1}/${year}`;

    setForm((prev) => ({
      ...prev,
      lectiveYear,
      semester,
      title: `Recrutamento ${semester}º Semestre`,
    }));
  };

  const handleEdit = (recruitment: RecruitmentOption) => {
    setEditId(recruitment.id);
    setForm({
      lectiveYear: `${recruitment.year}/${recruitment.year + 1}`,
      semester: recruitment.semester,
      title: recruitment.title,
      start: toDateTimeLocal(recruitment.start),
      end: toDateTimeLocal(recruitment.end),
      active: recruitment.active,
    });
    setMode("edit");
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate >= endDate
    ) {
      toast.error("A data de fim tem de ser posterior à data de início");
      return;
    }

    const editable = {
      lectiveYear: form.lectiveYear,
      semester: Number(form.semester),
      title: form.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      active: form.active,
    };

    setIsSubmitting(true);
    try {
      if (mode === "edit" && editId !== null) {
        await updateRecruitment(editId, editable);
        setList((prev) =>
          upsertRecruitment(
            prev,
            toOptionFromEditable({ id: editId, ...editable }),
          ),
        );
        toast.success("Recrutamento atualizado");
        setMode("overview");
      } else {
        const created = await createRecruitment(editable);
        setList((prev) => upsertRecruitment(prev, toOption(created)));
        setSelectedRecruitment(created.id);
        toast.success("Recrutamento criado");
        setMode("overview");
      }
      resetForm();
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Ocorreu um erro na submissão",
      );
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (recruitment: RecruitmentOption) => {
    try {
      await updateRecruitment(recruitment.id, {
        lectiveYear: `${recruitment.year}/${recruitment.year + 1}`,
        semester: recruitment.semester,
        title: recruitment.title,
        start: recruitment.start,
        end: recruitment.end,
        active: !recruitment.active,
      });
      setList((prev) =>
        upsertRecruitment(prev, {
          ...recruitment,
          active: !recruitment.active,
        }),
      );
      toast.success(
        recruitment.active ? "Recrutamento desativado" : "Recrutamento ativado",
      );
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao alterar o estado");
    }
  };

  const handleDuplicatePhases = async (id: number) => {
    try {
      const count = await duplicateRecruitmentPhases(id);
      toast.success(
        count > 0
          ? "Fases copiadas do recrutamento anterior"
          : "Não há fases para duplicar",
      );
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao duplicar as fases");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeRecruitment(deleteTarget.id);
      setList((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Recrutamento apagado");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao apagar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "overview" && "Gerir Recrutamentos"}
              {mode === "create" && "Novo Recrutamento"}
              {mode === "edit" && "Editar Recrutamento"}
            </DialogTitle>
            <DialogDescription>
              {mode === "overview" &&
                "Cria, edita, ativa ou elimina os períodos de recrutamento."}
              {(mode === "create" || mode === "edit") &&
                "Configura o período de recrutamento e o seu estado."}
            </DialogDescription>
          </DialogHeader>

          {mode === "overview" ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {list.length} recrutamento{list.length === 1 ? "" : "s"}
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode("create");
                  }}
                >
                  <Plus className="size-4" />
                  Novo Recrutamento
                </Button>
              </div>

              <ScrollArea className="max-h-[55vh]">
                {list.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum recrutamento configurado.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {list.map((recruitment) => (
                      <div
                        key={recruitment.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border bg-muted/30 p-3",
                          recruitment.active && "border-primary/30",
                        )}
                      >
                        <div className="grid flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {recruitment.title}
                            </span>
                            <Badge
                              variant={
                                recruitment.active ? "default" : "secondary"
                              }
                            >
                              {recruitment.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {recruitment.year}/{recruitment.year + 1} ·{" "}
                            {recruitment.semester}º Semestre
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {new Date(recruitment.start).toLocaleString(
                              "pt-PT",
                            )}{" "}
                            —{" "}
                            {new Date(recruitment.end).toLocaleString("pt-PT")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(recruitment)}
                            title={recruitment.active ? "Desativar" : "Ativar"}
                          >
                            {recruitment.active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(recruitment)}
                            title="Editar"
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              handleDuplicatePhases(recruitment.id)
                            }
                            title="Duplicar fases do recrutamento anterior"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(recruitment)}
                            title="Eliminar"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager-lectiveYear" className="text-right">
                    Ano Letivo
                  </Label>
                  <Input
                    id="manager-lectiveYear"
                    type="text"
                    placeholder="2026/2027"
                    value={form.lectiveYear}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lectiveYear: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager-semester" className="text-right">
                    Semestre
                  </Label>
                  <Input
                    id="manager-semester"
                    type="number"
                    min={1}
                    max={2}
                    value={form.semester}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        semester: Number(e.target.value),
                      }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager-title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="manager-title"
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager-start" className="text-right">
                    Início
                  </Label>
                  <Input
                    id="manager-start"
                    type="datetime-local"
                    value={form.start}
                    onChange={(e) => {
                      if (mode === "create") {
                        applyDefaultsFromStart(e.target.value);
                      }
                      setForm((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }));
                    }}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager-end" className="text-right">
                    Fim
                  </Label>
                  <Input
                    id="manager-end"
                    type="datetime-local"
                    value={form.end}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager-active" className="text-right">
                    Ativo
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="manager-active"
                      checked={form.active}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, active: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setMode("overview");
                  }}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="size-4" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "A guardar..."
                    : mode === "create"
                      ? "Criar Recrutamento"
                      : "Guardar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null);
        }}
        entityName="Recrutamento"
        itemName={
          deleteTarget
            ? `${deleteTarget.title} (${deleteTarget.year}/${deleteTarget.year + 1})`
            : null
        }
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
