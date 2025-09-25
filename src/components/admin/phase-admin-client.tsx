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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RecruitmentPhase } from "@/lib/db";

interface PhaseAdminClientProps {
  phases: RecruitmentPhase[];
  addPhase: (p: RecruitmentPhase) => Promise<void>;
  editPhase: (p: RecruitmentPhase) => Promise<void>;
  deletePhase: (id: number) => Promise<void>;
}

export default function PhaseAdminClient({
  phases,
  addPhase,
  editPhase,
  deletePhase,
}: PhaseAdminClientProps) {
  const [phasesState, setPhasesState] = useState<RecruitmentPhase[]>(phases);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<RecruitmentPhase | null>(null);
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    start: "",
    end: "",
    role: "candidate",
    recruitmentYear: new Date().getFullYear().toString(),
  });

  const resetForm = () =>
    setForm({
      id: "",
      title: "",
      description: "",
      start: "",
      end: "",
      role: "candidate",
      recruitmentYear: new Date().getFullYear().toString(),
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phase: any = {
      id: form.id ? Number.parseInt(form.id) : undefined,
      recruitmentYear: Number.parseInt(form.recruitmentYear),
      title: form.title,
      description: form.description,
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
        toast("Fase atualizada");
        setIsEditOpen(false);
      } catch (err) {
        console.error(err);
        try {
          (toast as any).error("Ocorreu um erro na submissão");
        } catch {
          toast("Ocorreu um erro na submissao");
        }
        return;
      }
    } else {
      try {
        await addPhase(phase);
        setPhasesState((prev) => [...prev, phase]);
        toast("Fase adicionada");
        setIsAddOpen(false);
      } catch (err) {
        console.error(err);
        try {
          (toast as any).error("Ocorreu um erro na submissão");
        } catch {
          toast("Ocorreu um erro na submissao");
        }
        return;
      }
    }

    setEditing(null);
    resetForm();
  };

  const handleEdit = (p: RecruitmentPhase) => {
    setEditing(p);
    setForm({
      id: p.id?.toString() ?? "",
      title: p.title ?? "",
      description: p.description ?? "",
      start: p.start ? new Date(p.start).toISOString().slice(0, 16) : "",
      end: p.end ? new Date(p.end).toISOString().slice(0, 16) : "",
      role: (p.role as string) ?? "candidate",
      recruitmentYear: (
        p.recruitmentYear ?? new Date().getFullYear()
      ).toString(),
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePhase(id);
      setPhasesState((prev) => prev.filter((p) => p.id !== id));
      toast("Fase apagada");
    } catch (err) {
      console.error(err);
      try {
        (toast as any).error("Ocorreu um erro na submissao");
      } catch {
        toast("Ocorreu um erro na submissao");
      }
      return;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Fases</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </DialogTrigger>
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
                      htmlFor="title"
                      className="text-right text-card-foreground"
                    >
                      Título
                    </Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      className="col-span-3 bg-input border-border text-foreground"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label
                      htmlFor="description"
                      className="text-right text-card-foreground"
                    >
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
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
                      htmlFor="start"
                      className="text-right text-card-foreground"
                    >
                      Início
                    </Label>
                    <Input
                      id="start"
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
                      htmlFor="end"
                      className="text-right text-card-foreground"
                    >
                      Fim
                    </Label>
                    <Input
                      id="end"
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
                      htmlFor="role"
                      className="text-right text-card-foreground"
                    >
                      Papel
                    </Label>
                    <div className="col-span-3">
                      <Select
                        onValueChange={(val) =>
                          setForm((f) => ({ ...f, role: val }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="candidate">Candidate</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Fases de Recrutamento
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Gerir todas as fases para o ano corrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">
                    Título
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Descrição
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Início
                  </TableHead>
                  <TableHead className="text-muted-foreground">Fim</TableHead>
                  <TableHead className="text-muted-foreground">Papel</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phasesState.map((p) => (
                  <TableRow key={p.id} className="border-border align-top">
                    <TableCell className="font-medium text-card-foreground">
                      {p.title}
                    </TableCell>
                    <TableCell className="text-card-foreground max-w-xl break-words whitespace-pre-wrap">
                      {p.description}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {p.start
                        ? new Date(p.start).toLocaleString("pt-PT")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {p.end ? new Date(p.end).toLocaleString("pt-PT") : "-"}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {p.role}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(p)}
                          className="text-muted-foreground hover:text-card-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id!)}
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

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
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
                    htmlFor="edit-title"
                    className="text-right text-card-foreground"
                  >
                    Título
                  </Label>
                  <Input
                    id="edit-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="col-span-3 bg-input border-border text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="edit-description"
                    className="text-right text-card-foreground"
                  >
                    Descrição
                  </Label>
                  <Textarea
                    id="edit-description"
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
                    htmlFor="edit-start"
                    className="text-right text-card-foreground"
                  >
                    Início
                  </Label>
                  <Input
                    id="edit-start"
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
                    htmlFor="edit-end"
                    className="text-right text-card-foreground"
                  >
                    Fim
                  </Label>
                  <Input
                    id="edit-end"
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
                    htmlFor="edit-role"
                    className="text-right text-card-foreground"
                  >
                    Papel
                  </Label>
                  <div className="col-span-3">
                    <Select
                      onValueChange={(val) =>
                        setForm((f) => ({ ...f, role: val }))
                      }
                      value={form.role}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candidate">Candidate</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  Atualizar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
