"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
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
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-white/5">
            <Scissors className="size-7 text-black" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-playfair)]">Verificação de Email</h1>
          </div>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="flex flex-col items-center text-center space-y-4 py-8">
            <div className="flex size-16 items-center justify-center">
              <Loader2 className="size-10 text-black animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-neutral-300 font-medium">
                Verificando seu email...
              </p>
              <p className="text-xs text-neutral-500">
                Aguarde enquanto confirmamos seu endereço de email.
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#5cb97a]/10 border border-[#5cb97a]/20">
                <CheckCircle2 className="size-8 text-[#5cb97a]" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">
                  Email Verificado!
                </p>
                <p className="text-sm text-neutral-400 max-w-xs">
                  Seu endereço de email foi confirmado com sucesso. Agora você tem
                  acesso completo à plataforma.
                </p>
              </div>
            </div>

            <Link
              href={isAuthenticated ? "/" : "/login"}
              className="block"
            >
              <Button className="w-full h-11 bg-white hover:!bg-black hover:!text-white text-black font-semibold shadow-lg shadow-black/15">
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
                <p className="text-sm text-neutral-400 max-w-xs">
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
                  className="w-full h-11 bg-white hover:!bg-black hover:!text-white text-black font-semibold"
                >
                  <RefreshCw className="size-4 mr-2" />
                  Reenviar Email de Verificação
                </Button>
              )}
              <Link href={isAuthenticated ? "/" : "/login"} className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-neutral-300 hover:bg-[#2a1f12]"
                >
                  {isAuthenticated ? "Voltar ao Dashboard" : "Ir para o Login"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-500 mt-6">
        © 2026 Bartime. Todos os direitos reservados.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-fade-in">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <Loader2 className="size-10 text-black animate-spin" />
              <p className="text-sm text-neutral-400">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
