"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardCopy,
  FileText,
  Loader2,
  Mail,
  Search,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailBodyEditor } from "@/components/email/email-body-editor-dynamic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  getEmailComposerData,
  getFinalMessageTemplateContent,
  sendEmailViaApi,
  type EmailComposerData,
} from "@/lib/email-actions";
import {
  blocksToPlainText,
  buildGmailComposeUrl,
  EMAIL_TEMPLATE_ITEMS,
  EMAIL_TEMPLATE_LABELS,
  EMAIL_TEMPLATE_TYPES,
  GMAIL_URL_LENGTH_WARNING,
  normalizeEmailBlocks,
  type EmailTemplateType,
} from "@/lib/email-composer";
import { isDocumentEmpty } from "@/lib/text-editor";
import { cn } from "@/lib/utils";

interface EmailComposerDialogContentProps {
  recruitmentId?: number;
}

type ComposerStep = "recipients" | "compose";

type TemplateKey = "accepted" | "rejected";

/**
 * The "Enviar emails" dialog body. It expects a `Dialog` root above it, which
 * the sidebar button owns so the same trigger can also host the tooltip.
 *
 * Two steps:
 *   1. "recipients" — pick who receives the email (quick-send + search + list).
 *   2. "compose" — email-friendly layout with BCC count, subject and a
 *      rich-text body. Any typed body is preserved when going back a step.
 */
export function EmailComposerDialogContent({
  recruitmentId,
}: EmailComposerDialogContentProps) {
  const [data, setData] = React.useState<EmailComposerData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [step, setStep] = React.useState<ComposerStep>("recipients");
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeType, setActiveType] = React.useState<EmailTemplateType>("all");
  const [subject, setSubject] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");

  const [isSending, setIsSending] = React.useState(false);
  const bodyEditorRef = React.useRef<any | null>(null);

  const [templates, setTemplates] = React.useState<{
    accepted: unknown[];
    rejected: unknown[];
  } | null>(null);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getEmailComposerData(recruitmentId);

      if (!result) {
        setData(null);
        setLoadError(
          "Não há nenhum recrutamento ativo ou selecionado para enviar emails.",
        );
        return;
      }

      setData(result);
      setSelectedIds(new Set(result.audiences.all));
      setActiveType("all");
    } catch (error) {
      console.error(error);
      setData(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao carregar os candidatos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [recruitmentId]);

  // The dialog body is mounted only while open, so the first load happens here
  // instead of behind a button click.
  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (cancelled) return;
      await load();
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const recipients = React.useMemo(() => data?.recipients ?? [], [data]);

  const visibleRecipients = React.useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return recipients;

    return recipients.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(query) ||
        recipient.email.toLowerCase().includes(query),
    );
  }, [recipients, search]);

  const selectedRecipients = React.useMemo(
    () => recipients.filter((recipient) => selectedIds.has(recipient.id)),
    [recipients, selectedIds],
  );

  const applyQuickSend = React.useCallback(
    (type: EmailTemplateType) => {
      setActiveType(type);
      setSelectedIds(new Set(data?.audiences[type] ?? []));
    },
    [data],
  );

  const toggle = React.useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEditorChange = React.useCallback((editor: any) => {
    const text = blocksToPlainText(editor.document);
    setBodyText((previous) => (previous === text ? previous : text));
  }, []);

  const composeUrl = React.useMemo(() => {
    if (!data) return "";

    return buildGmailComposeUrl({
      recipients: selectedRecipients.map((recipient) => recipient.email),
      subject,
      body: bodyText,
    });
  }, [bodyText, data, selectedRecipients, subject]);

  const warnAboutLongUrl = () => {
    if (composeUrl.length <= GMAIL_URL_LENGTH_WARNING) return;

    toast.add({
      type: "warning",
      title: "URL muito longa",
      description:
        "O Gmail pode truncar destinatários em emails com muitos contactos. Considera reduzir a seleção.",
    });
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(composeUrl);
      toast.add({
        type: "success",
        title: "URL copiada",
        description: "Podes abrir a num outro navegador ou sessão do Gmail.",
      });
    } catch (error) {
      console.error(error);
      toast.add({
        type: "error",
        title: "Não foi possível copiar a URL",
      });
    }

    warnAboutLongUrl();
  };

  const openGmail = () => {
    window.open(composeUrl, "_blank", "noopener,noreferrer");
    warnAboutLongUrl();
  };

  const canSendViaApi =
    Boolean(data?.isAdmin) &&
    selectedRecipients.length > 0 &&
    subject.trim().length > 0 &&
    bodyText.trim().length > 0 &&
    !isSending;

  const handleSendViaApi = async () => {
    if (!canSendViaApi) return;

    const editor = bodyEditorRef.current;
    if (!editor) {
      toast.add({
        type: "error",
        title: "Editor não pronto",
        description: "Tenta novamente daqui a uns segundos.",
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendEmailViaApi({
        recruitmentId: data?.recruitmentId,
        recipientIds: selectedRecipients.map((recipient) => recipient.id),
        subject,
        html: editor.blocksToHTMLLossy(editor.document),
        text: blocksToPlainText(editor.document),
      });

      const suffix = result.sent === 1 ? "" : "s";
      toast.add({
        type: "success",
        title: "Emails enviados",
        description: `${result.sent} email${suffix} enviado${suffix} via API.`,
      });
    } catch (error) {
      console.error(error);
      toast.add({
        type: "error",
        title: "Não foi possível enviar os emails",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSending(false);
    }
  };

  const insertTemplate = async (key: TemplateKey) => {
    const editor = bodyEditorRef.current;
    if (!editor) return;

    let content = templates?.[key];
    if (!content) {
      setTemplatesLoading(true);
      try {
        const result = await getFinalMessageTemplateContent(
          data?.recruitmentId,
        );
        if (!result) {
          toast.add({
            type: "error",
            title: "Não foi possível carregar os templates",
          });
          return;
        }
        setTemplates(result);
        content = result[key];
      } catch (error) {
        console.error(error);
        toast.add({
          type: "error",
          title: "Não foi possível carregar os templates",
        });
        return;
      } finally {
        setTemplatesLoading(false);
      }
    }

    const blocks = normalizeEmailBlocks(content ?? []);
    if (blocks.length === 0) {
      toast.add({
        type: "info",
        title: "Template vazio",
        description: "Ainda não há conteúdo neste template.",
      });
      return;
    }

    if (isDocumentEmpty(editor.document)) {
      editor.replaceBlocks(editor.document, blocks);
    } else {
      const reference = editor.document[editor.document.length - 1] ?? null;
      if (reference) editor.insertBlocks(blocks, reference, "after");
      else editor.replaceBlocks(editor.document, blocks);
    }

    setBodyText(blocksToPlainText(editor.document));
    toast.add({
      type: "success",
      title: "Template inserido",
      description:
        key === "accepted"
          ? "Mensagem de aceite adicionada ao corpo do email."
          : "Mensagem de rejeição adicionada ao corpo do email.",
    });
  };

  const bccCountLabel =
    selectedRecipients.length === 1
      ? "1 destinatário em BCC"
      : `${selectedRecipients.length} destinatários em BCC`;

  return (
    <DialogContent className="flex flex-col w-[calc(100%-2rem)] sm:w-full sm:max-w-2xl md:max-w-4xl h-[85vh] md:h-[620px] max-h-[90vh]">
      <DialogHeader className="shrink-0">
        <DialogTitle>Enviar email</DialogTitle>
        <DialogDescription>
          {step === "recipients"
            ? "Escolhe quem vai receber o email."
            : "Escreve o assunto e o corpo do email."}
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground flex-1 min-h-0">
          <Loader2 className="size-4 animate-spin" />
          <span>A carregar candidatos...</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 text-center flex-1 min-h-0">
          <AlertTriangle className="size-6 text-destructive" />
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Step 1 — candidate selection */}
          <div
            className={cn(
              "flex flex-col gap-3 flex-1 min-h-0",
              step !== "recipients" && "hidden",
            )}
          >
            <div className="shrink-0">
              <Select
                items={EMAIL_TEMPLATE_ITEMS}
                value={activeType}
                onValueChange={(value) =>
                  applyQuickSend(value as EmailTemplateType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EMAIL_TEMPLATE_LABELS[type]} (
                      {data?.audiences[type].length ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Pesquisar por nome ou email..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-8 pl-8 pr-2 text-xs"
                />
              </div>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer shrink-0 transition-colors"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar ({selectedIds.size})
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 rounded-md border border-border/40 p-1">
              {visibleRecipients.length === 0 ? (
                <div className="flex h-full min-h-36 items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  {search
                    ? "Nenhum utilizador encontrado"
                    : "Nenhum candidato neste recrutamento"}
                </div>
              ) : (
                visibleRecipients.map((recipient) => {
                  const isSelected = selectedIds.has(recipient.id);

                  return (
                    <div
                      key={recipient.id}
                      onClick={() => toggle(recipient.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md p-2 transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/80",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="size-4 shrink-0 pointer-events-none"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium text-xs truncate">
                          {recipient.name || "Sem nome"}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {recipient.email}
                        </span>
                      </div>
                      {recipient.decision === "approve" && (
                        <Badge className="shrink-0 border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          Aceite
                        </Badge>
                      )}
                      {recipient.decision === "reject" && (
                        <Badge variant="destructive" className="shrink-0">
                          Rejeitado
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2 — email layout */}
          <div
            className={cn(
              "flex flex-col gap-3 flex-1 min-h-0",
              step !== "compose" && "hidden",
            )}
          >
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/40 px-3 py-2 shrink-0">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                {bccCountLabel}
              </span>
              <button
                type="button"
                onClick={() => setStep("recipients")}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors"
              >
                Alterar destinatários
              </button>
            </div>

            <div className="grid gap-1.5 shrink-0">
              <Label htmlFor="email-subject">Assunto</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Assunto do email"
              />
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              <div className="flex items-center justify-between gap-2 shrink-0">
                <Label>Corpo</Label>
                {data?.isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={templatesLoading}
                        >
                          <FileText className="size-3.5" />
                          Inserir template
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        disabled={templatesLoading}
                        onClick={() => void insertTemplate("accepted")}
                      >
                        Mensagem de aceite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={templatesLoading}
                        onClick={() => void insertTemplate("rejected")}
                      >
                        Mensagem de rejeição
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex-1 min-h-0">
                <EmailBodyEditor
                  editorRef={bodyEditorRef}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !loadError && (
        <DialogFooter
          className={cn(
            "flex-col sm:flex-row sm:items-center gap-3 mt-auto",
            step === "recipients" && "sm:justify-between",
          )}
        >
          {step === "recipients" ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                {selectedIds.size} de {recipients.length} selecionados
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-initial"
                    />
                  }
                >
                  Cancelar
                </DialogClose>
                <Button
                  type="button"
                  className="flex-1 sm:flex-initial"
                  disabled={selectedIds.size === 0}
                  onClick={() => setStep("compose")}
                >
                  <ArrowRight className="size-4" />
                  Seguinte
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                  onClick={() => setStep("recipients")}
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                  disabled={selectedRecipients.length === 0}
                  onClick={() => void handleCopyUrl()}
                >
                  <ClipboardCopy className="size-4" />
                  Copiar URL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                  disabled={selectedRecipients.length === 0}
                  onClick={openGmail}
                >
                  <Send className="size-4" />
                  Abrir no Gmail
                </Button>
                {data?.isAdmin && (
                  <Button
                    type="button"
                    className="flex-1 sm:flex-initial"
                    disabled={!canSendViaApi}
                    onClick={() => void handleSendViaApi()}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Enviar via API
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogFooter>
      )}
    </DialogContent>
  );
}
