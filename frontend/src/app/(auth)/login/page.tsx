"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Scissors, Eye, EyeOff, Loader2 } from "lucide-react";
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
      const prof = await login(data.email, data.password);
      toastManager.add({
        title: "Bem-vindo de volta!",
        type: "success",
      });

      if (prof.role === 'SUPER_ADMIN') {
        router.push("/super-admin");
      } else {
        router.push("/dashboard");
      }
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
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-white/5">
            <Scissors className="size-7 text-black" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-playfair)]">Bartime</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Acesse sua conta para continuar
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white focus:ring-white/20"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-neutral-300"
            >
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white focus:ring-white/20 pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
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
              className="text-xs text-white hover:text-neutral-300 underline-offset-4 hover:underline transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-white hover:!bg-black hover:!text-white text-black font-semibold shadow-lg shadow-black/15 transition-all duration-200"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-400">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-white hover:text-neutral-300 underline-offset-4 hover:underline font-medium transition-colors"
            >
              Cadastre sua barbearia
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-neutral-400">
              Sua conta foi bloqueada ou precisa de ajuda?{" "}
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-1"
              >
                Fale com o Suporte
              </a>
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500 mt-6">
        © 2026 Bartime. Todos os direitos reservados.
      </p>
    </div>
  );
}
