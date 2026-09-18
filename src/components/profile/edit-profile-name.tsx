"use client";

import type React from "react";
import { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

import ClipLoader from "react-spinners/ClipLoader";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useSession } from "@/lib/use-session";

const nameSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório"),
});

type NameFormData = z.infer<typeof nameSchema>;

export function EditProfileName() {
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (session?.user?.name) {
      reset({ name: session.user.name });
    }
  }, [session, reset]);

  const onSubmit = async (data: NameFormData) => {
    if (data.name === session?.user?.name) {
      toast("O nome inserido é igual ao atual");
      return;
    }

    const { error } = await authClient.updateUser({
      name: data.name,
    });

    if (!error) {
      toast.success("Nome alterado com sucesso");
    } else {
      toast.error("Ocorreu um erro ao alterar o nome", {
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-card-foreground">
              Mudar Nome
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="new-name"
                className="text-sm font-medium text-card-foreground"
              >
                Nome Completo*
              </Label>
              <Input
                id="new-name"
                type="text"
                placeholder="Introduza o seu nome completo"
                {...register("name")}
                className="bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 font-medium transition-all duration-200 hover:shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ClipLoader color="white" size={20} />
                ) : (
                  "Alterar Nome"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
