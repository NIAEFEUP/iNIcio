"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Candidatura() {
  const formSchema = z.object({
    phone: z.string().min(1, { message: "This field is required" }),
    student_number: z.string().min(1, { message: "This field is required" }),
    degree: z.string().min(1, { message: "This field is required" }),
    curricular_year: z.string().min(1, { message: "This field is required" }),
    profile_picture: z.string().min(1, { message: "This field is required" }),
    curriculum: z.string().min(1, { message: "This field is required" }),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    website: z.string().url().optional(),
    interests: z
      .array(z.string())
      .refine((value) => value.some((item) => item), {
        message: "You have to select at least one item.",
      }),
    interest_justification: z
      .string()
      .min(1, { message: "This field is required" }),
    experience: z.string(),
    motivation: z.string().min(1, { message: "This field is required" }),
    self_promotion: z.string().min(1, { message: "This field is required" }),
    recruitment_first_interaction: z
      .array(z.string())
      .refine((value) => value.some((item) => item), {
        message: "You have to select at least one item.",
      }),
    suggestions: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      student_number: "",
      degree: "",
      curricular_year: "",
      profile_picture: "",
      curriculum: "",
      linkedin: "",
      github: "",
      website: "",
      interests: [],
      interest_justification: "",
      experience: "",
      motivation: "",
      self_promotion: "",
      recruitment_first_interaction: [],
      suggestions: "",
    },
    mode: "onSubmit",
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch("/api/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        router.push("/candidate/progress");
      }
    } catch (error) {
      console.error(error);
    }
  }

  function onReset() {
    form.reset();
    form.clearErrors();
  }

  return (
    <div className="h-full flex flex-col mx-128">
      <h1 className="text-2xl font-bold text-center">
        Formulário de candidatura
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 border shadow-md p-5 m-5 rounded-md"
        >
          {/* Form Section */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  Número de Telemóvel
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="tel-input-0"
                        placeholder="+351 900 000 000"
                        type="tel"
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
            name="student_number"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  Número Mecanográfico
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="text-input-2"
                        placeholder="202N0NNNN"
                        type="text"
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
            name="degree"
            render={({ field }) => (
              <FormItem className="col-span-6 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">Curso</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Select
                      key="select-0"
                      {...field}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full ">
                        <SelectValue placeholder="Escolhe o teu curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="leic" value="leic">
                          L.EIC - Licenciatura em Engenharia Informática e
                          Computação
                        </SelectItem>

                        <SelectItem key="meic" value="meic">
                          M.EIC - Mestrado em Engenharia Informática e
                          Computação
                        </SelectItem>

                        <SelectItem key="mesw" value="mesw">
                          MESW - Mestrado em Engenharia de Software
                        </SelectItem>

                        <SelectItem key="mm" value="mm">
                          MM - Mestrado em Multimédia
                        </SelectItem>

                        <SelectItem key="mia" value="mia">
                          M.IA - Mestrado em Inteligência Artifical
                        </SelectItem>

                        <SelectItem key="liacd" value="liacd">
                          l:IACD - Licenciatura em Inteligência Artificial e
                          Ciência de Dados
                        </SelectItem>

                        <SelectItem key="mecd" value="mecd">
                          MECD - Mestrado em Engenharia e Ciência de Dados
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="curricular_year"
            render={({ field }) => (
              <FormItem className="col-span-6 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">Ano Curricular</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Select
                      key="select-1"
                      {...field}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full ">
                        <SelectValue placeholder="Ano curricular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="1bsc" value="1bsc">
                          1.º da Licenciatura
                        </SelectItem>

                        <SelectItem key="2bsc" value="2bsc">
                          2.º da Licenciatura
                        </SelectItem>

                        <SelectItem key="3bsc" value="3bsc">
                          3.º da Licenciatura
                        </SelectItem>

                        <SelectItem key="1msc" value="1msc">
                          1.º do Mestrado
                        </SelectItem>

                        <SelectItem key="2msc" value="2msc">
                          2.º do Mestrado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profile_picture"
            render={({ field }) => (
              <FormItem className="col-span-6 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">Fotografia</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="file-input-0"
                        placeholder="Submete uma fotografia tua"
                        type="file"
                        className=" "
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Escolhe uma foto onde sejas facilmente identificável.
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="curriculum"
            render={({ field }) => (
              <FormItem className="col-span-6 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">CV</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="file-input-1"
                        placeholder="Submete o teu CV"
                        type="file"
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
            name="linkedin"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">LinkedIn</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="url-input-0"
                        placeholder="linkedin.com/company/niaefeup"
                        type="url"
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
            name="github"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">GitHub</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="url-input-1"
                        placeholder="github.com/NIAEFEUP"
                        type="url"
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
            name="website"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">Site Pessoal</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        key="url-input-2"
                        placeholder="niaefeup.pt"
                        type="url"
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
            name="interests"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  O que te vês a fazer no NIAEFEUP?
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="grid w-full gap-2 @3xl:grid-cols-2">
                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="projetos"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "projetos",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "projetos",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "projetos",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Projetos
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="imagem"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "imagem",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "imagem",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "imagem",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Imagem
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="comunicacao"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "comunicacao",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "comunicacao",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "comunicacao",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  ComuNIcação
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="sinf"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes("sinf")}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "sinf",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) => value !== "sinf",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Sinf
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="uni"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes("uni")}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "uni",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) => value !== "uni",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Uni
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="tts"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes("tts")}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "tts",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) => value !== "tts",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  TTS
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="eventos"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "eventos",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "eventos",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "eventos",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Eventos
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="nitsig"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "nitsig",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "nitsig",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "nitsig",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  NitSig
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="website"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "website",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "website",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "website",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Website do NI
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="interests"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="niployments"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "niployments",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "niployments",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "niployments",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  NIployments
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
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
            name="interest_justification"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  Qual o teu interesse na opção/opções que escolheste?
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Textarea
                      key="textarea-0"
                      placeholder="Escreve aqui."
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  Com que tecnologias/ferramentas já trabalhaste? (ex. React,
                  Photoshop, etc.)
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Textarea
                      key="textarea-1"
                      placeholder="Escreve aqui."
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motivation"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">Porquê o NI?</FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Textarea
                      key="textarea-2"
                      placeholder="Escreve aqui."
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="self_promotion"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  O que achas que o NIAEFEUP pode ganhar ao receber-te como
                  membro?
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Textarea
                      key="textarea-3"
                      placeholder="Escreve aqui."
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recruitment_first_interaction"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  Como descobriste o recrutamento do NIAEFEUP?
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <div className="grid w-full gap-2">
                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="instagram"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "instagram",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "instagram",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "instagram",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Instagram
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="amigos"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "amigos",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "amigos",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "amigos",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Amigos
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="professores"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "professores",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "professores",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "professores",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Professores
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="email"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes("email")}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "email",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "email",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Email
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="aefeup"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "aefeup",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "aefeup",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "aefeup",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  AEFEUP
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="banca"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes("banca")}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "banca",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "banca",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Banca no corredor da FEUP
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="open_day"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes(
                                    "open_day",
                                  )}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "open_day",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "open_day",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  NI Open Day
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        name="recruitment_first_interaction"
                        control={form.control}
                        render={({ field: OptionField }) => {
                          return (
                            <FormItem
                              key="outro"
                              className="rounded-md border p-4 space-x-2 flex items-start"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={OptionField.value?.includes("outro")}
                                  onCheckedChange={(checked: any) => {
                                    return checked
                                      ? OptionField.onChange([
                                          ...(OptionField.value || []),
                                          "outro",
                                        ])
                                      : OptionField.onChange(
                                          OptionField.value?.filter(
                                            (value: string) =>
                                              value !== "outro",
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-2 leading-none">
                                <FormLabel className="font-normal">
                                  Outro
                                </FormLabel>
                              </div>
                            </FormItem>
                          );
                        }}
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
            name="suggestions"
            render={({ field }) => (
              <FormItem className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start">
                <FormLabel className="flex shrink-0">
                  Tens alguma sugestão para o NIAEFEUP ou algum dos seus
                  projetos?
                </FormLabel>

                <div className="w-full">
                  <FormControl>
                    <Textarea key="textarea-4" placeholder="" {...field} />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}

          <Button type="submit">Submeter</Button>
        </form>
      </Form>
    </div>
  );
}
