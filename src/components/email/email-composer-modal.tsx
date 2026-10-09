"use client";

import * as React from "react";
import {
  AlertTriangle,
  ClipboardCopy,
  Loader2,
  Mail,
  Search,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  getEmailComposerData,
  type EmailComposerData,
} from "@/lib/email-actions";
import {
  buildGmailComposeUrl,
  EMAIL_TEMPLATE_ITEMS,
  EMAIL_TEMPLATE_LABELS,
  EMAIL_TEMPLATE_TYPES,
  GMAIL_URL_LENGTH_WARNING,
  type EmailTemplateType,
} from "@/lib/email-composer";
import { cn } from "@/lib/utils";

interface EmailComposerDialogContentProps {
  recruitmentId?: number;
}

/**
 * The "Enviar emails" dialog body. It expects a `Dialog` root above it, which
 * the sidebar button owns so the same trigger can also host the tooltip.
 *
 * Two columns on desktop: the email itself on the left, the recipient picker on the right.
 * On mobile, tabbed between message and recipients for comfortable touch usage.
 */
export function EmailComposerDialogContent({
  recruitmentId,
}: EmailComposerDialogContentProps) {
  const [data, setData] = React.useState<EmailComposerData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [mobileTab, setMobileTab] = React.useState<"compose" | "recipients">(
    "compose",
  );
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeType, setActiveType] = React.useState<EmailTemplateType>("all");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

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

  const composeUrl = React.useMemo(() => {
    if (!data) return "";

    return buildGmailComposeUrl({
      recipients: selectedRecipients.map((recipient) => recipient.email),
      subject,
      body,
    });
  }, [body, data, selectedRecipients, subject]);

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

  return (
    <DialogContent className="flex flex-col w-[calc(100%-2rem)] sm:w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl h-[85vh] md:h-[620px] lg:h-[640px] max-h-[90vh]">
      <DialogHeader className="shrink-0">
        <DialogTitle>Enviar email</DialogTitle>
      </DialogHeader>

      {/* Mobile Tab Switcher */}
      {!isLoading && !loadError && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg shrink-0 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("compose")}
            className={cn(
              "py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center",
              mobileTab === "compose"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Mensagem
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("recipients")}
            className={cn(
              "py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center",
              mobileTab === "recipients"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Destinatários ({selectedIds.size})
          </button>
        </div>
      )}

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
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-6 flex-1 min-h-0">
          {/* Left: the email itself */}
          <div
            className={cn(
              "flex flex-col gap-4 min-h-0 flex-1",
              mobileTab !== "compose" && "hidden md:flex",
            )}
          >
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
              <Label htmlFor="email-body">Corpo</Label>
              <Textarea
                id="email-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Corpo do email"
                className="flex-1 min-h-0 resize-none font-mono text-xs field-sizing-fixed overflow-y-auto"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />

          {/* Right: who to send to */}
          <div
            className={cn(
              "flex flex-col gap-2 min-h-0 flex-1",
              mobileTab !== "recipients" && "hidden md:flex",
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
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-xs text-muted-foreground shrink-0 pt-0.5">
              {selectedIds.size} de {recipients.length} selecionados
            </p>
          </div>
        </div>
      )}

      <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          {selectedRecipients.length} em BCC
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            className="flex-1 sm:flex-initial"
            disabled={selectedRecipients.length === 0}
            onClick={() => {
              window.open(composeUrl, "_blank", "noopener,noreferrer");
              warnAboutLongUrl();
            }}
          >
            <Send className="size-4" />
            Abrir no Gmail
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
