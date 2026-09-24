"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { Recruitment } from "@/lib/db";

interface RecruitmentAdminClientProps {
  recruitments: Recruitment[];
  addRecruitment: (recruitment: Recruitment) => Promise<{ id: number }>;
  editRecruitment: (recruitment: Recruitment) => Promise<void>;
  deleteRecruitment: (id: number) => Promise<void>;
  duplicatePhases: (id: number) => Promise<number>;
}

/**
 * Replaces (or appends) a recruitment and mirrors the server-side invariant:
 * an active recruitment deactivates every other one.
 */
function upsertRecruitment(
  rows: Recruitment[],
  updated: Recruitment,
): Recruitment[] {
  const exists = rows.some((r) => r.id === updated.id);
  const next = exists
    ? rows.map((r) => (r.id === updated.id ? updated : r))
    : [...rows, updated];

  return updated.active
    ? next.map((r) => (r.id === updated.id ? r : { ...r, active: false }))
    : next;
}

export default function RecruitmentAdminClient({
  recruitments,
  addRecruitment,
  editRecruitment,
  deleteRecruitment,
  duplicatePhases,
}: RecruitmentAdminClientProps) {
  const [recruitmentsState, setRecruitmentsState] =
    useState<Recruitment[]>(recruitments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecruitment, setEditingRecruitment] =
    useState<Recruitment | null>(null);

  const defaultLectiveYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const [formData, setFormData] = useState({
    id: 0,
    lectiveYear: defaultLectiveYear,
    semester: 1,
    title: "Recrutamento 1º Semestre",
    start: "",
    end: "",
    active: true,
    openDayEnabled: false,
    openDayDate: "",
    openDayStartTime: "10:00",
    openDayEndTime: "18:00",
    openDayRoom: "B315",
    openDayImage: "/images/ni.jpg",
  });

  const applyDefaultsFromStart = (start: string) => {
    const date = new Date(start);
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const isFirstSemester = date.getMonth() >= 6;
    const semester = isFirstSemester ? 1 : 2;
    const lectiveYear = isFirstSemester
      ? `${year}/${year + 1}`
      : `${year - 1}/${year}`;

    setFormData((prev) => ({
      ...prev,
      lectiveYear,
      semester,
      title: `Recrutamento ${semester}º Semestre`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate >= endDate
    ) {
      toast.add({
        title: "A data de fim tem de ser posterior à data de início",
      });
      return;
    }

    const newRecruitment: Recruitment = {
      id: editingRecruitment ? editingRecruitment.id : 0,
      lectiveYear: formData.lectiveYear,
      semester: Number(formData.semester),
      title: formData.title,
      start: startDate,
      end: endDate,
      active: formData.active,
      openDayEnabled: formData.openDayEnabled,
      openDayDate: formData.openDayDate ? new Date(formData.openDayDate) : null,
      openDayStartTime: formData.openDayStartTime,
      openDayEndTime: formData.openDayEndTime,
      openDayRoom: formData.openDayRoom,
      openDayImage: formData.openDayImage,
    };

    try {
      if (editingRecruitment) {
        await editRecruitment(newRecruitment);
        setRecruitmentsState((prev) => upsertRecruitment(prev, newRecruitment));
        toast.add({ title: "Recrutamento atualizado" });
        setIsEditDialogOpen(false);
      } else {
        const created = await addRecruitment(newRecruitment);
        setRecruitmentsState((prev) =>
          upsertRecruitment(prev, { ...newRecruitment, id: created.id }),
        );
        toast.add({ title: "Recrutamento adicionado" });
        setIsAddDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.add({ title: "Ocorreu um erro na submissão" });
      return;
    }

    setFormData({
      id: 0,
      lectiveYear: defaultLectiveYear,
      semester: 1,
      title: "Recrutamento 1º Semestre",
      start: "",
      end: "",
      active: true,
      openDayEnabled: false,
      openDayDate: "",
      openDayStartTime: "10:00",
      openDayEndTime: "18:00",
      openDayRoom: "B315",
      openDayImage: "/images/ni.jpg",
    });
    setEditingRecruitment(null);
  };

  const handleEdit = (recruitment: Recruitment) => {
    setEditingRecruitment(recruitment);
    setFormData({
      id: recruitment.id,
      lectiveYear: recruitment.lectiveYear,
      semester: recruitment.semester,
      title: recruitment.title,
      start: new Date(recruitment.start).toISOString().slice(0, 16),
      end: new Date(recruitment.end).toISOString().slice(0, 16),
      active: recruitment.active,
      openDayEnabled: recruitment.openDayEnabled,
      openDayDate: recruitment.openDayDate
        ? new Date(recruitment.openDayDate).toISOString().slice(0, 10)
        : "",
      openDayStartTime: recruitment.openDayStartTime || "10:00",
      openDayEndTime: recruitment.openDayEndTime || "18:00",
      openDayRoom: recruitment.openDayRoom || "B315",
      openDayImage: recruitment.openDayImage || "/images/ni.jpg",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRecruitment(id);
      setRecruitmentsState((prev) => prev.filter((r) => r.id !== id));
      toast.add({ title: "Recrutamento apagado" });
    } catch (err) {
      console.error(err);
      toast.add({ title: "Ocorreu um erro ao apagar" });
    }
  };

  const handleDuplicatePhases = async (id: number) => {
    try {
      const count = await duplicatePhases(id);
      toast.add({
        title: count > 0 ? "Fases copiadas" : "Não há fases para duplicar",
      });
    } catch (err) {
      console.error(err);
      toast.add({ title: "Ocorreu um erro ao duplicar as fases" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recrutamentos"
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              }
            />
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  Adicionar recrutamento
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Criar um novo período de recrutamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="lectiveYear"
                      className="text-right text-card-foreground"
                    >
                      Ano Letivo
                    </Label>
                    <Input
                      id="lectiveYear"
                      type="text"
                      placeholder="2026/2027"
                      value={formData.lectiveYear}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lectiveYear: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="semester"
                      className="text-right text-card-foreground"
                    >
                      Semestre
                    </Label>
                    <Input
                      id="semester"
                      type="number"
                      min={1}
                      max={2}
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          semester: Number(e.target.value),
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="title"
                      className="text-right text-card-foreground"
                    >
                      Título
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="start"
                      className="text-right text-card-foreground"
                    >
                      Início
                    </Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={formData.start}
                      onChange={(e) => {
                        applyDefaultsFromStart(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }));
                      }}
                      className="col-span-3 bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="end"
                      className="text-right text-card-foreground"
                    >
                      Fim
                    </Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={formData.end}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="add-active"
                      className="text-right text-card-foreground"
                    >
                      Ativo
                    </Label>
                    <div className="col-span-3">
                      <Switch
                        id="add-active"
                        checked={formData.active}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            active: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4 pt-2">
                    <Label
                      htmlFor="add-open-day-enabled"
                      className="text-right text-card-foreground"
                    >
                      NI Open Day
                    </Label>
                    <div className="col-span-3">
                      <Switch
                        id="add-open-day-enabled"
                        checked={formData.openDayEnabled}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            openDayEnabled: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {formData.openDayEnabled && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="add-open-day-date"
                          className="text-right text-card-foreground"
                        >
                          Data
                        </Label>
                        <Input
                          id="add-open-day-date"
                          type="date"
                          value={formData.openDayDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              openDayDate: e.target.value,
                            }))
                          }
                          className="col-span-3 bg-input border-border text-foreground"
                          required={formData.openDayEnabled}
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="add-open-day-start"
                          className="text-right text-card-foreground"
                        >
                          Hora início
                        </Label>
                        <Input
                          id="add-open-day-start"
                          type="time"
                          value={formData.openDayStartTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              openDayStartTime: e.target.value,
                            }))
                          }
                          className="col-span-3 bg-input border-border text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="add-open-day-end"
                          className="text-right text-card-foreground"
                        >
                          Hora fim
                        </Label>
                        <Input
                          id="add-open-day-end"
                          type="time"
                          value={formData.openDayEndTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              openDayEndTime: e.target.value,
                            }))
                          }
                          className="col-span-3 bg-input border-border text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="add-open-day-room"
                          className="text-right text-card-foreground"
                        >
                          Sala
                        </Label>
                        <Input
                          id="add-open-day-room"
                          type="text"
                          value={formData.openDayRoom}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              openDayRoom: e.target.value,
                            }))
                          }
                          className="col-span-3 bg-input border-border text-foreground"
                          placeholder="B315"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Adicionar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        {/* Recruitments Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Períodos de recrutamento
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Gerir todos os períodos de recrutamento por ano letivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">
                    Ano Letivo
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Semestre
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Título
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Início
                  </TableHead>
                  <TableHead className="text-muted-foreground">Fim</TableHead>
                  <TableHead className="text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recruitmentsState.map((recruitment) => (
                  <TableRow key={recruitment.id} className="border-border">
                    <TableCell className="font-medium text-card-foreground">
                      {recruitment.lectiveYear}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {recruitment.semester}º
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {recruitment.title}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {new Date(recruitment.start).toLocaleString("pt-PT")}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {new Date(recruitment.end).toLocaleString("pt-PT")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={recruitment.active ? "default" : "secondary"}
                        className={
                          recruitment.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {recruitment.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recruitment)}
                          className="text-muted-foreground hover:text-card-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Link
                          href={`/admin/phases?recruitmentId=${recruitment.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-card-foreground"
                          >
                            Fases
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicatePhases(recruitment.id)}
                          className="text-muted-foreground hover:text-card-foreground"
                        >
                          Duplicar fases
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recruitment.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Editar Recrutamento
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Atualizar os detalhes do período de recrutamento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-lectiveYear"
                    className="text-right text-card-foreground"
                  >
                    Ano Letivo
                  </Label>
                  <Input
                    id="edit-lectiveYear"
                    type="text"
                    value={formData.lectiveYear}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lectiveYear: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-input border-border text-foreground"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-semester"
                    className="text-right text-card-foreground"
                  >
                    Semestre
                  </Label>
                  <Input
                    id="edit-semester"
                    type="number"
                    min={1}
                    max={2}
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        semester: Number(e.target.value),
                      }))
                    }
                    className="col-span-3 bg-input border-border text-foreground"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-title"
                    className="text-right text-card-foreground"
                  >
                    Título
                  </Label>
                  <Input
                    id="edit-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-input border-border text-foreground"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-start"
                    className="text-right text-card-foreground"
                  >
                    Início
                  </Label>
                  <Input
                    id="edit-start"
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-input border-border text-foreground"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-end"
                    className="text-right text-card-foreground"
                  >
                    Fim
                  </Label>
                  <Input
                    id="edit-end"
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="col-span-3 bg-input border-border text-foreground"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-active"
                    className="text-right text-card-foreground"
                  >
                    Ativo
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="edit-active"
                      checked={formData.active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          active: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4 pt-2">
                  <Label
                    htmlFor="edit-open-day-enabled"
                    className="text-right text-card-foreground"
                  >
                    NI Open Day
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="edit-open-day-enabled"
                      checked={formData.openDayEnabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          openDayEnabled: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {formData.openDayEnabled && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="edit-open-day-date"
                        className="text-right text-card-foreground"
                      >
                        Data
                      </Label>
                      <Input
                        id="edit-open-day-date"
                        type="date"
                        value={formData.openDayDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            openDayDate: e.target.value,
                          }))
                        }
                        className="col-span-3 bg-input border-border text-foreground"
                        required={formData.openDayEnabled}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="edit-open-day-start"
                        className="text-right text-card-foreground"
                      >
                        Hora início
                      </Label>
                      <Input
                        id="edit-open-day-start"
                        type="time"
                        value={formData.openDayStartTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            openDayStartTime: e.target.value,
                          }))
                        }
                        className="col-span-3 bg-input border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="edit-open-day-end"
                        className="text-right text-card-foreground"
                      >
                        Hora fim
                      </Label>
                      <Input
                        id="edit-open-day-end"
                        type="time"
                        value={formData.openDayEndTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            openDayEndTime: e.target.value,
                          }))
                        }
                        className="col-span-3 bg-input border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="edit-open-day-room"
                        className="text-right text-card-foreground"
                      >
                        Sala
                      </Label>
                      <Input
                        id="edit-open-day-room"
                        type="text"
                        value={formData.openDayRoom}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            openDayRoom: e.target.value,
                          }))
                        }
                        className="col-span-3 bg-input border-border text-foreground"
                        placeholder="B315"
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  Atualizar Recrutamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
    </div>
  );
}
