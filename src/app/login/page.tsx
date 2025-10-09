"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, User, Mail, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = z.object({
    email: z
      .email({ error: "O email é inválido" })
      .min(1, { message: "O email é obrigatório" }),
    password: z.string().min(1, { message: "A palavra-passe é obrigatória" }),
    rememberMe: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { email, password, rememberMe } = values;

    const {} = await authClient.signIn.email(
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

  function onReset() {
    form.reset();
    form.clearErrors();
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Entra na tua conta
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onReset={onReset}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="email@email.com"
                          type="email"
                          className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-lg transition-all duration-200"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Palavra-Passe
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Mínimo 8 caracteres"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-lg transition-all duration-200"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({}) => (
                  <FormItem className="col-span-12 col-start-auto flex flex-row items-center justify-center align-middle">
                    <div className="w-full flex flex-row gap-x-2">
                      <FormControl>
                        <Checkbox
                          onCheckedChange={(value) => {
                            form.setValue(
                              "rememberMe",
                              Boolean(value.valueOf()),
                            );
                          }}
                          key="remember-me-input-0"
                          id="remember-me-input-0"
                          className=" "
                        />
                      </FormControl>

                      <FormLabel className="flex shrink-0">
                        Lembrar-me
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "A entrar..." : "Entrar"}
              </Button>

              <Link
                href="/request-reset-password"
                className="text-sm text-center"
              >
                Esqueci-me da palavra-passe
              </Link>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
