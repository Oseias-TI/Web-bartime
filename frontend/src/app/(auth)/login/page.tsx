"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import type { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toastManager.add({
        title: "Bem-vindo de volta!",
        type: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      toastManager.add({
        title: "Erro ao entrar",
        description: apiError.message || "Verifique suas credenciais",
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
            <h1 className="text-2xl font-bold text-white">BarberFlow</h1>
            <p className="text-sm text-stone-400 mt-1">
              Acesse sua conta para continuar
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-300">
              Email
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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-stone-300"
            >
              Senha
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
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold shadow-lg shadow-amber-500/20 border-amber-400/20 transition-all duration-200"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-stone-400">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Cadastre sua barbearia
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-stone-500 mt-6">
        © 2026 BarberFlow. Todos os direitos reservados.
      </p>
    </div>
  );
}
