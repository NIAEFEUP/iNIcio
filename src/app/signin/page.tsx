"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        onSuccess: (ctx) => {
          router.push("/");
        },
        onError: (ctx) => {
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
    <div className="flex flex-col w-1/2 mx-auto gap-y-4">
      <h1 className="text-center text-3xl font-bold">Login</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onReset={onReset}
          className="space-y-8 @container"
        >
          <div className="grid grid-cols-12 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                  <FormLabel className="flex shrink-0">Email</FormLabel>

                  <div className="w-full">
                    <FormControl>
                      <div className="relative w-full">
                        <Input
                          key="email-input-0"
                          placeholder=""
                          type="email"
                          id="email-input-0"
                          className=" "
                          {...field}
                        />
                      </div>
                    </FormControl>

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                  <FormLabel className="flex shrink-0">Palavra-Passe</FormLabel>

                  <div className="w-full">
                    <FormControl>
                      <div className="relative w-full">
                        <Input
                          key="password-input-0"
                          placeholder=""
                          type="password"
                          id="password-input-0"
                          className=" "
                          {...field}
                        />
                      </div>
                    </FormControl>

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="col-span-12 col-start-auto flex flex-row items-center justify-center align-middle">
                  <div className="w-full flex flex-row gap-x-2">
                    <FormControl>
                      <Checkbox
                        onCheckedChange={(value) => {
                          form.setValue("rememberMe", Boolean(value.valueOf()));
                        }}
                        key="remember-me-input-0"
                        id="remember-me-input-0"
                        className=" "
                        {...field}
                      />
                    </FormControl>

                    <FormLabel className="flex shrink-0">Lembrar-me</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {errorMessage && (
              <p className="text-sm col-span-12">{errorMessage}</p>
            )}
            <FormField
              control={form.control}
              name="submit-button-0"
              render={({ field }) => (
                <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                  <FormLabel className="hidden shrink-0">Submit</FormLabel>

                  <div className="w-full">
                    <FormControl>
                      <Button
                        key="submit-button-0"
                        id="submit-button-0"
                        name=""
                        className="w-full"
                        type="submit"
                        variant="default"
                      >
                        Login
                      </Button>
                    </FormControl>

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
