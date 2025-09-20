"use client";

import type React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

import ClipLoader from "react-spinners/ClipLoader";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    current: z.string().min(1, "Password atual é obrigatória"),
    new: z.string().min(8, "A nova password deve ter pelo menos 8 caracteres"),
    confirm: z.string().min(1, "Confirmação de password é obrigatória"),
  })
  .refine((data) => data.new === data.confirm, {
    message: "As passwords não coincidem",
    path: ["confirm"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ResetPassword() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current: "",
      new: "",
      confirm: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    const { error } = await authClient.changePassword({
      newPassword: data.new,
      currentPassword: data.current,
      revokeOtherSessions: true,
    });

    if (!error) {
      toast("Palavra-passe alterada com sucesso");
      reset();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-card-foreground">
              Mudar Password
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="current-password"
                className="text-sm font-medium text-card-foreground"
              >
                Password Antiga*
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Introduza a password atual"
                {...register("current")}
                className="bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="text-sm font-medium text-card-foreground"
              >
                Password Nova*
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Introduza a nova password"
                {...register("new")}
                className="bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-sm font-medium text-card-foreground"
              >
                Confirmar Password Nova*
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirme a nova password"
                {...register("confirm")}
                className="bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 font-medium transition-all duration-200 hover:shadow-md"
              >
                {isSubmitting ? (
                  <ClipLoader color="white" />
                ) : (
                  "Alterar Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
