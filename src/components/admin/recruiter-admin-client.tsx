"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Props {
  recruiters: Array<{ userId: string; name?: string; email?: string }>;
  users: Array<{ id: string; name: string; email: string }>;
  addRecruiter: (userId: string) => Promise<void>;
  removeRecruiter: (userId: string) => Promise<void>;
}

export default function RecruiterAdminClient({
  recruiters,
  users,
  addRecruiter,
  removeRecruiter,
}: Props) {
  const [list, setList] = useState<
    Array<{ userId: string; name?: string; email?: string }>
  >(recruiters || []);

  const [isOpen, setIsOpen] = useState(false);

  const [userId, setUserId] = useState("");

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);

  const [allUsers, setAllUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >(users || []);

  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const debounceRef = useRef<number | null>(null);

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    const idToAdd = selected ? selected.id : userId;
    if (!idToAdd) return toast.error("Escolhe um utilizador");

    try {
      await addRecruiter(idToAdd);

      if (selected) {
        setList((s) => [
          ...s,
          { userId: idToAdd, name: selected.name, email: selected.email },
        ]);
      } else {
        const u = allUsers.find(
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
      setIsOpen(false);
      toast.success("Recrutador adicionado");
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro na submissao");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeRecruiter(id);
      setList((s) => s.filter((r) => r.userId !== id));
      toast.success("Recrutador removido");
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro na submissao");
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    setAllUsers(users || []);
  }, [isOpen, users]);

  useEffect(() => {
    if (!query) return setResults([]);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = allUsers.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
      setResults(filtered.slice(0, 50));
    }, 150);
  }, [query, allUsers]);

  return (
    <div className="mx-16 md:mx-64">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Recrutadores</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar Recrutador</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Recrutador</DialogTitle>
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
                      className="cursor-pointer p-2 hover:bg-muted rounded"
                    >
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => (
              <TableRow key={r.userId}>
                <TableCell>{r.name ?? "-"}</TableCell>
                <TableCell>{r.email ?? "-"}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Remover</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Tens a certeza que queres remover?
                        </DialogTitle>
                        <DialogDescription>
                          <Button onClick={() => handleRemove(r.userId)}>
                            Confirmar
                          </Button>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
