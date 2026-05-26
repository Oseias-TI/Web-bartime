"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toastManager } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token de verificação não encontrado no link.");
      return;
    }

    const verify = async () => {
      try {
        await api.get("/auth/verify-email", { token });
        setStatus("success");
        toastManager.add({
          title: "Email verificado!",
          description: "Sua conta foi verificada com sucesso.",
          type: "success",
        });
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(
          error?.message || "Token inválido ou expirado. Solicite um novo."
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl border border-white/5 bg-stone-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
            <Sparkles className="size-7 text-stone-900" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Verificação de Email</h1>
          </div>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="flex flex-col items-center text-center space-y-4 py-8">
            <div className="flex size-16 items-center justify-center">
              <Loader2 className="size-10 text-amber-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-stone-300 font-medium">
                Verificando seu email...
              </p>
              <p className="text-xs text-stone-500">
                Aguarde enquanto confirmamos seu endereço de email.
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">
                  Email Verificado!
                </p>
                <p className="text-sm text-stone-400 max-w-xs">
                  Seu endereço de email foi confirmado com sucesso. Agora você tem
                  acesso completo à plataforma.
                </p>
              </div>
            </div>

            <Link
              href={isAuthenticated ? "/" : "/login"}
              className="block"
            >
              <Button className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold shadow-lg shadow-amber-500/20">
                {isAuthenticated ? "Ir para o Dashboard" : "Ir para o Login"}
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <XCircle className="size-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">
                  Falha na Verificação
                </p>
                <p className="text-sm text-stone-400 max-w-xs">
                  {errorMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isAuthenticated && (
                <Button
                  onClick={async () => {
                    try {
                      await api.post("/auth/resend-verification");
                      toastManager.add({
                        title: "Email reenviado!",
                        description:
                          "Verifique sua caixa de entrada para o novo link.",
                        type: "success",
                      });
                    } catch {
                      toastManager.add({
                        title: "Erro ao reenviar",
                        type: "error",
                      });
                    }
                  }}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold"
                >
                  <RefreshCw className="size-4 mr-2" />
                  Reenviar Email de Verificação
                </Button>
              )}
              <Link href={isAuthenticated ? "/" : "/login"} className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/5 text-stone-300 hover:bg-stone-800"
                >
                  {isAuthenticated ? "Voltar ao Dashboard" : "Ir para o Login"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-stone-500 mt-6">
        © 2026 BarberFlow. Todos os direitos reservados.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-fade-in">
          <div className="rounded-2xl border border-white/5 bg-stone-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <Loader2 className="size-10 text-amber-500 animate-spin" />
              <p className="text-sm text-stone-400">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
