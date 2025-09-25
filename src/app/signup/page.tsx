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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "O nome é obrigatório" }),
    surname: z.string().min(1, { message: "O apelido é obrigatório" }),
    email: z
      .email({ message: "O email é inválido" })
      .min(1, { message: "O email é obrigatório" }),
    password: z
      .string()
      .min(8, { message: "A palavra-passe deve ter no mínimo 8 caracteres" }),
    "confirm-password": z.string(),
  })
  .refine((data) => data.password === data["confirm-password"], {
    message: "As palavras-passe não coincidem",
    path: ["confirm-password"],
  });

type FormData = z.infer<typeof formSchema>;

export default function SignUp() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      "confirm-password": "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const {} = await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onRequest: () => {
          //show loading
        },
        onSuccess: () => {
          router.push("/application");
        },
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
        },
      },
    );
  }

  const handleReset = () => {
    form.reset();
    form.clearErrors();
    setErrorMessage(null);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registo</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Após o registo, serás redirecionado para o formulário de candidatura
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onReset={handleReset}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nome
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Nome"
                            type="text"
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
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Apelido
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Apelido"
                            type="text"
                            className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-lg transition-all duration-200"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

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
                name="confirm-password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Confirmar Palavra-Passe
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Confirme a palavra-passe"
                          type={showConfirmPassword ? "text" : "password"}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-lg transition-all duration-200"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? (
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

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "Registando..." : "Registar"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Ao registares-te, concordas com os nossos termos de serviço e política
          de privacidade.
        </p>
      </div>
    </div>
  );
}
