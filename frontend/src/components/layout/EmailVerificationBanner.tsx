"use client";

import { useState } from "react";
import { AlertTriangle, Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function EmailVerificationBanner() {
  const { professional, updateProfessional } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!professional || professional.emailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);
    try {
      await api.post("/auth/resend-verification");
      toastManager.add({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para confirmar seu email.",
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns minutos.",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative mx-4 md:mx-6 mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="size-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-200">
            Verifique seu email
          </p>
          <p className="text-xs text-amber-400/70 hidden sm:block">
            Confirme seu endereço de email ({professional.email}) para ter acesso
            completo à plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleResend}
            disabled={isSending}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium text-xs"
          >
            {isSending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <Mail className="size-3.5 mr-1" />
                <span className="hidden sm:inline">Reenviar</span>
              </>
            )}
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded hover:bg-amber-500/10 transition-colors text-amber-400/50 hover:text-amber-400"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
