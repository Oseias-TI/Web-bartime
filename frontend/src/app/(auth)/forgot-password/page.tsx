"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { authService } from "@/services/auth.service";
import type { ApiError } from "@/lib/api";

const forgotSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await authService.forgotPassword(data.email);
      setSentEmail(data.email);
      setIsSent(true);
    } catch (error) {
      const apiError = error as ApiError;
      toastManager.add({
        title: "Erro ao enviar",
        description: apiError.message || "Tente novamente em alguns minutos",
        type: "error",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl border border-white/5 bg-stone-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
            <Sparkles className="size-7 text-stone-900" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
            <p className="text-sm text-stone-400 mt-1">
              {isSent
                ? "Verifique seu email"
                : "Informe seu email para receber o link de recuperação"}
            </p>
          </div>
        </div>

        {isSent ? (
          <div className="space-y-6">
            {/* Success state */}
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-stone-300">
                  Enviamos um link de recuperação para
                </p>
                <p className="text-sm font-semibold text-amber-500">
                  {sentEmail}
                </p>
                <p className="text-xs text-stone-500 max-w-xs">
                  Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSent(false);
                  setSentEmail("");
                }}
                className="w-full border-white/5 text-stone-300 hover:bg-stone-800"
              >
                <Mail className="size-4 mr-2" />
                Enviar para outro email
              </Button>
              <Link href="/login" className="w-full">
                <Button
                  variant="ghost"
                  className="w-full text-stone-400 hover:text-stone-300"
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-stone-300">
                Email cadastrado
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold shadow-lg shadow-amber-500/20 border-amber-400/20 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-stone-400 hover:text-stone-300 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="size-3" />
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-stone-500 mt-6">
        © 2026 BarberFlow. Todos os direitos reservados.
      </p>
    </div>
  );
}
