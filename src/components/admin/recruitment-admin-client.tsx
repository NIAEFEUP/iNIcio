"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Recruitment } from "@/lib/db";

interface RecruitmentAdminClientProps {
  recruitments: Recruitment[];
  addRecruitment: (recruitment: Recruitment) => Promise<void>;
  editRecruitment: (recruitment: Recruitment) => Promise<void>;
  deleteRecruitment: (year: number) => Promise<void>;
}

export default function RecruitmentAdminClient({
  recruitments,
  addRecruitment,
  editRecruitment,
  deleteRecruitment,
}: RecruitmentAdminClientProps) {
  const [recruitmentsState, setRecruitmentsState] =
    useState<Recruitment[]>(recruitments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecruitment, setEditingRecruitment] =
    useState<Recruitment | null>(null);
  const [formData, setFormData] = useState({
    year: "",
    start: "",
    end: "",
    active: "true",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newRecruitment: Recruitment = {
      year: Number.parseInt(formData.year),
      start: new Date(formData.start),
      end: new Date(formData.end),
      active: formData.active,
    };

    if (editingRecruitment) {
      await editRecruitment(newRecruitment);
      setRecruitmentsState((prev) =>
        prev.map((r) =>
          r.year === editingRecruitment.year ? newRecruitment : r,
        ),
      );
      toast("Recrutamento atualizado");
      setIsEditDialogOpen(false);
    } else {
      await addRecruitment(newRecruitment);
      setRecruitmentsState((prev) => [...prev, newRecruitment]);
      toast("Recrutamento adicionado");
      setIsAddDialogOpen(false);
    }

    setFormData({ year: "", start: "", end: "", active: "true" });
    setEditingRecruitment(null);
  };

  const handleEdit = (recruitment: Recruitment) => {
    setEditingRecruitment(recruitment);
    setFormData({
      year: recruitment.year.toString(),
      start: new Date(recruitment.start).toISOString().slice(0, 16),
      end: new Date(recruitment.end).toISOString().slice(0, 16),
      active: recruitment.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (year: number) => {
    deleteRecruitment(year);
    setRecruitmentsState((prev) => prev.filter((r) => r.year !== year));
    toast("Recrutamento apagado");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {" "}
              Recrutamentos{" "}
            </h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  {" "}
                  Adicionar recrutamento{" "}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Criar um novo período de recrutamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="year"
                      className="text-right text-card-foreground"
                    >
                      Ano
                    </Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          year: e.target.value,
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
                      Inicio
                    </Label>
                    <Input
                      id="start"
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

        {/* Recruitments Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              {" "}
              Períodos de recrutamento{" "}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Gerir todos os períodos de recrutamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground"> Ano </TableHead>
                  <TableHead className="text-muted-foreground">
                    {" "}
                    Início{" "}
                  </TableHead>
                  <TableHead className="text-muted-foreground"> Fim </TableHead>
                  <TableHead className="text-muted-foreground">
                    {" "}
                    Estado{" "}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {" "}
                    Ações{" "}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recruitmentsState.map((recruitment) => (
                  <TableRow key={recruitment.year} className="border-border">
                    <TableCell className="font-medium text-card-foreground">
                      {" "}
                      {recruitment.year}{" "}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {" "}
                      {recruitment.start.toLocaleString("pt-PT")}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {" "}
                      {recruitment.end.toLocaleString("pt-PT")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          recruitment.active === "true"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          recruitment.active === "true"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {recruitment.active === "true" ? "Active" : "Inactive"}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recruitment.year)}
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
                {" "}
                Edit Recruitment{" "}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update the recruitment period details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-year"
                    className="text-right text-card-foreground"
                  >
                    Year
                  </Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, year: e.target.value }))
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
                    Start Date
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
                    End Date
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
                    Active
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="edit-active"
                      checked={formData.active === "true"}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          active: checked ? "true" : "false",
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  Update Recruitment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
