"use client";

import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import type { AdminUserItem } from "@/lib/admin";

export interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
  onConfirm: (password: string) => Promise<boolean>;
  isDeleting: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}: DeleteUserDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor, introduz a tua palavra-passe.");
      return;
    }

    setError(null);
    const success = await onConfirm(password);
    if (!success) {
      setPassword("");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return;
    if (!nextOpen) {
      setPassword("");
      setShowPassword(false);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-lg font-semibold text-destructive">
            Eliminar Utilizador
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Esta ação é destrutiva e permanente. Por motivos de segurança, é
            obrigatória a confirmação com a tua palavra-passe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/40 p-3">
          {user.image ? (
            <Avatar className="size-11 border border-border shrink-0">
              <AvatarImage
                src={getStableImageUrl(user.image)}
                alt={user.name}
              />
              <AvatarFallback>
                <InitialsAvatar
                  initials={getInitials(user.name || user.email || user.id)}
                  size="md"
                />
              </AvatarFallback>
            </Avatar>
          ) : (
            <InitialsAvatar
              initials={getInitials(user.name || user.email || user.id)}
              size="md"
              className="size-11 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {user.name || "Sem nome"}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <Alert
          variant="destructive"
          className="border-destructive/30 bg-destructive/5 text-destructive py-3"
        >
          <AlertTriangle className="size-4 shrink-0 text-destructive mt-0.5" />
          <AlertDescription className="text-xs leading-relaxed text-destructive font-medium">
            Todos os registos associados a esta conta serão permanentemente
            eliminados incluindo candidaturas, entrevistas, dinâmicas,
            avaliações, comentários e ficheiros anexos.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label
              htmlFor="admin-confirm-password"
              className="text-xs font-semibold text-foreground"
            >
              Palavra-passe de Administrador
            </Label>
            <div className="relative">
              <Input
                id="admin-confirm-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Introduz a tua palavra-passe para confirmar"
                className="pr-10 text-sm h-9"
                disabled={isDeleting}
                autoFocus
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                disabled={isDeleting}
              >
                {showPassword ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                <span className="sr-only">
                  {showPassword
                    ? "Ocultar palavra-passe"
                    : "Mostrar palavra-passe"}
                </span>
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          <DialogFooter className="space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting || !password.trim()}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />A eliminar...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Eliminar Definitivamente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
