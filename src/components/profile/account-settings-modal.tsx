"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { User as UserIcon, KeyRound, Image as ImageIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileImageUpload } from "@/components/ui/profile-image-upload";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/use-session";
import { getInitials } from "@/lib/utils";
import { getSignedProfilePictureUrl } from "@/app/actions";

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsModal({
  open,
  onOpenChange,
}: AccountSettingsModalProps) {
  const { data: session } = useSession();
  const [customName, setCustomName] = React.useState<string | null>(null);
  const name = customName ?? session?.user?.name ?? "";
  const [isUpdatingName, setIsUpdatingName] = React.useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  // Profile image signed url state
  const [signedImageUrl, setSignedImageUrl] = React.useState<string | null>(
    null,
  );

  const userImage = session?.user?.image;
  React.useEffect(() => {
    let cancelled = false;
    if (userImage) {
      getSignedProfilePictureUrl(userImage)
        .then((url) => {
          if (!cancelled && url) setSignedImageUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [userImage]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.add({ type: "error", title: "O nome não pode estar vazio." });
      return;
    }
    if (name === session?.user?.name) {
      toast.add({ type: "info", title: "O nome inserido é igual ao atual." });
      return;
    }

    setIsUpdatingName(true);
    try {
      const res = await authClient.updateUser({
        name: name.trim(),
      });
      if (res.error) {
        toast.add({
          type: "error",
          title: res.error.message || "Erro ao atualizar nome.",
        });
      } else {
        toast.add({ type: "success", title: "Nome atualizado com sucesso!" });
      }
    } catch {
      toast.add({
        type: "error",
        title: "Ocorreu um erro ao atualizar os dados.",
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.add({
        type: "error",
        title: "Introduz a tua palavra-passe atual.",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast.add({
        type: "error",
        title: "A nova palavra-passe deve ter pelo menos 8 caracteres.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.add({ type: "error", title: "As palavras-passe não coincidem." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        toast.add({
          type: "error",
          title: res.error.message || "Erro ao alterar palavra-passe.",
        });
      } else {
        toast.add({
          type: "success",
          title: "Palavra-passe alterada com sucesso!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.add({
        type: "error",
        title: "Ocorreu um erro ao tentar alterar a palavra-passe.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const userInitials = getInitials(session?.user?.name, "U");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">
            Definições de Perfil
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Gere as tuas informações de conta, fotografia e credenciais de
            acesso
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="account" className="text-xs gap-1.5">
              <UserIcon className="size-3.5" />
              Conta
            </TabsTrigger>
            <TabsTrigger value="photo" className="text-xs gap-1.5">
              <ImageIcon className="size-3.5" />
              Foto
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5">
              <KeyRound className="size-3.5" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Avatar className="size-12 border border-border">
                <AvatarImage
                  src={signedImageUrl || session?.user?.image || undefined}
                  alt={session?.user?.name || "Avatar"}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {session?.user?.name || "Utilizador"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="account-name" className="text-xs">
                  Nome Completo
                </Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="O teu nome"
                  disabled={isUpdatingName}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account-email" className="text-xs">
                  Endereço de Email
                </Label>
                <Input
                  id="account-email"
                  value={session?.user?.email || ""}
                  disabled
                  className="h-9 text-sm bg-muted/40 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingName || name === session?.user?.name}
                >
                  {isUpdatingName ? "A guardar..." : "Guardar Alterações"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="photo" className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-4 py-2">
              <Avatar className="size-20 border border-border">
                <AvatarImage
                  src={signedImageUrl || session?.user?.image || undefined}
                  alt={session?.user?.name || "Avatar"}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="w-full max-w-xs">
                <ProfileImageUpload
                  onSuccess={async (result) => {
                    try {
                      await authClient.updateUser({
                        image: result.fileName,
                      });
                      setSignedImageUrl(result.url);
                      toast.add({
                        type: "success",
                        title: "Foto de perfil atualizada!",
                      });
                    } catch {
                      toast.add({
                        type: "error",
                        title: "Erro ao associar foto ao perfil.",
                      });
                    }
                  }}
                  onError={(err) => toast.add({ type: "error", title: err })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 pt-1">
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-pwd" className="text-xs">
                  Palavra-passe Atual
                </Label>
                <Input
                  id="current-pwd"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isUpdatingPassword}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-pwd" className="text-xs">
                  Nova Palavra-passe
                </Label>
                <Input
                  id="new-pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  disabled={isUpdatingPassword}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pwd" className="text-xs">
                  Confirmar Nova Palavra-passe
                </Label>
                <Input
                  id="confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repete a nova palavra-passe"
                  disabled={isUpdatingPassword}
                  className="h-9 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isUpdatingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {isUpdatingPassword
                    ? "A alterar..."
                    : "Alterar Palavra-passe"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
