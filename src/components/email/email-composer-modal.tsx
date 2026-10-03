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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { EmailRecipient } from "@/lib/email-recipients";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { cn, getInitials } from "@/lib/utils";

/** Short right-aligned summary of what is still missing for this recipient. */
function recipientStatus(recipient: EmailRecipient): string {
  if (!recipient.isCandidate) {
    return `conta de ${new Date(recipient.accountCreatedAt).getFullYear()}`;
  }

  return (
    [
      recipient.missingInterview ? "sem entrevista" : null,
      recipient.missingDynamic ? "sem dinâmica" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "sessões marcadas"
  );
}

interface EmailComposerDialogContentProps {
  recruitmentId?: number;
}

/**
 * The "Enviar emails" dialog body. It expects a `Dialog` root above it, which
 * the sidebar button owns so the same trigger can also host the tooltip.
 *
 * Two columns: the email itself on the left, the recipient picker on the right.
 */
export function EmailComposerDialogContent({
  recruitmentId,
}: EmailComposerDialogContentProps) {
  const [data, setData] = React.useState<EmailComposerData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

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
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Enviar email</DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />A carregar candidatos...
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="size-6 text-destructive" />
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* Left: the email itself */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email-subject">Assunto</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Assunto do email"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email-body">Corpo</Label>
              <Textarea
                id="email-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Corpo do email"
                rows={12}
                className="resize-y font-mono text-xs"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />

          {/* Right: who to send to */}
          <div className="flex flex-col gap-2">
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

            <div className="flex items-center gap-2">
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

            <div className="max-h-72 overflow-y-auto space-y-0.5">
              {visibleRecipients.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {search
                    ? "Nenhum utilizador encontrado"
                    : "Nenhum candidato neste recrutamento"}
                </div>
              ) : (
                visibleRecipients.map((recipient) => {
                  const isSelected = selectedIds.has(recipient.id);
                  const picture = getStableImageUrl(recipient.image);

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
                        className="size-4 pointer-events-none"
                      />
                      <Avatar className="h-6 w-6 rounded-sm shrink-0 after:rounded-sm">
                        {picture ? (
                          <AvatarImage src={picture} alt={recipient.name} />
                        ) : null}
                        <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                          {getInitials(recipient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs truncate">
                            {recipient.name || "Sem nome"}
                          </span>
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                            {recipientStatus(recipient)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {recipient.email}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedIds.size} de {recipients.length} selecionados
            </p>
          </div>
        </div>
      )}

      <DialogFooter className="sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3.5" />
          {selectedRecipients.length} em BCC
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={selectedRecipients.length === 0}
            onClick={() => void handleCopyUrl()}
          >
            <ClipboardCopy className="size-4" />
            Copiar URL
          </Button>
          <Button
            type="button"
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
