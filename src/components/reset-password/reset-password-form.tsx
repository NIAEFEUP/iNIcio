"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound, Mail } from "lucide-react";

interface ResetPasswordFormProps {
  sendResetPassword: (email: string) => Promise<void>;
}

export function ResetPasswordForm({
  sendResetPassword,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    sendResetPassword(email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Verifique o seu email
          </CardTitle>
          <CardDescription className="text-base">
            Enviámos um link de redefinição de palavra-passe para{" "}
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Redefinir Palavra-Passe
        </CardTitle>
        <CardDescription className="text-base">
          Introduza o seu email para receber um link de redefinição
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" variant="secondary" className="w-full">
            Enviar Link de Redefinição
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
