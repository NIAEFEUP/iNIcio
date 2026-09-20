"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z
    .email({ error: "O email é inválido" })
    .min(1, { message: "O email é obrigatório" }),
  password: z.string().min(1, { message: "A palavra-passe é obrigatória" }),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignIn() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: FormValues) {
    const { email, password, rememberMe } = values;
    setErrorMessage(null);

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/",
        rememberMe: rememberMe,
      },
      {
        onSuccess: () => {
          setIsLoading(false);
          router.push("/");
          router.refresh();
        },
        onRequest: () => {
          setIsLoading(true);
        },
        onError: (ctx) => {
          setIsLoading(false);
          setErrorMessage(ctx.error.message);
        },
      },
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10 sm:py-12">
      <div className="grid w-full max-w-4xl items-center gap-12 sm:gap-16 md:grid-cols-2 lg:gap-24">
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Iniciar Sessão
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            Introduz os teus dados para acederes à tua conta.
          </p>
        </div>

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="utilizador@exemplo.com"
                          type="email"
                          className="h-11 pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavra-Passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="A tua palavra-passe"
                          type={showPassword ? "text" : "password"}
                          className="h-11 pl-9 pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Lembrar-me neste dispositivo
                    </FormLabel>
                  </FormItem>
                )}
              />

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? "A entrar..." : "Entrar"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tens conta?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
