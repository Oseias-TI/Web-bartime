"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { authService } from "@/services/auth.service";
import type { ApiError } from "@/lib/api";

const resetSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const passwordValue = watch("password", "");

  const passwordStrength = (() => {
    if (!passwordValue) return { level: 0, label: "", color: "" };
    let score = 0;
    if (passwordValue.length >= 6) score++;
    if (passwordValue.length >= 8) score++;
    if (/[A-Z]/.test(passwordValue)) score++;
    if (/[0-9]/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;

    if (score <= 2) return { level: score, label: "Fraca", color: "bg-red-500" };
    if (score <= 3) return { level: score, label: "Média", color: "bg-amber-500" };
    return { level: score, label: "Forte", color: "bg-emerald-500" };
  })();

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toastManager.add({
        title: "Token inválido",
        description: "Use o link do email para redefinir a senha",
        type: "error",
      });
      return;
    }

    try {
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (error) {
      const apiError = error as ApiError;
      toastManager.add({
        title: "Erro ao redefinir senha",
        description: apiError.message || "Token expirado ou inválido. Solicite um novo.",
        type: "error",
      });
    }
  };

  if (!token) {
    return (
      <div className="animate-fade-in">
        <div className="rounded-2xl border border-white/5 bg-stone-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="size-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Link Inválido</h1>
              <p className="text-sm text-stone-400 max-w-xs">
                O link de redefinição está incompleto ou expirou. Solicite um novo
                link de recuperação.
              </p>
            </div>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold">
                Solicitar novo link
              </Button>
            </Link>
            <Link
              href="/login"
              className="text-sm text-stone-400 hover:text-stone-300 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="size-3" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl border border-white/5 bg-stone-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
            <Sparkles className="size-7 text-stone-900" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              {isSuccess ? "Senha Redefinida!" : "Nova Senha"}
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              {isSuccess
                ? "Sua senha foi alterada com sucesso"
                : "Defina sua nova senha de acesso"}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <p className="text-sm text-stone-300">
                Agora você pode acessar sua conta com a nova senha.
              </p>
            </div>
            <Link href="/login" className="block">
              <Button className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold shadow-lg shadow-amber-500/20">
                Ir para o Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-stone-300">
                Nova Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50 focus:ring-amber-500/20 pr-11"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
              {/* Strength indicator */}
              {passwordValue && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : "bg-stone-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-stone-500">
                    Força: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-stone-300"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50 focus:ring-amber-500/20 pr-11"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">
                  {errors.confirmPassword.message}
                </p>
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
                <>
                  <ShieldCheck className="size-4 mr-2" />
                  Redefinir Senha
                </>
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

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
