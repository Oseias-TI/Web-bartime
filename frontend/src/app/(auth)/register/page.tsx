"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import type { ApiError } from "@/lib/api";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
    tenantName: z.string().min(2, "Nome da barbearia é obrigatório"),
    cnpj: z
      .string()
      .min(14, "CNPJ deve ter 14 dígitos")
      .max(18, "CNPJ inválido"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleNextStep = async () => {
    const valid = await trigger(["name", "email", "password", "confirmPassword"]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        tenantName: data.tenantName,
        cnpj: data.cnpj.replace(/\D/g, ""),
      });
      toastManager.add({
        title: "Cadastro realizado!",
        description: "Sua barbearia foi registrada com sucesso.",
        type: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      toastManager.add({
        title: "Erro no cadastro",
        description: apiError.message || "Tente novamente",
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
            <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
            <p className="text-sm text-stone-400 mt-1">
              {step === 1 ? "Seus dados pessoais" : "Dados da barbearia"}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= 1 ? "bg-amber-500" : "bg-stone-700"
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= 2 ? "bg-amber-500" : "bg-stone-700"
            }`}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">
                  Nome completo
                </label>
                <Input
                  placeholder="Seu nome"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50 pr-11"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">
                  Confirmar senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold shadow-lg shadow-amber-500/20 border-amber-400/20"
              >
                Próximo
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">
                  Nome da Barbearia
                </label>
                <Input
                  placeholder="Ex: Barbearia Premium"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50"
                  {...register("tenantName")}
                />
                {errors.tenantName && (
                  <p className="text-xs text-red-400">
                    {errors.tenantName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">
                  CNPJ
                </label>
                <Input
                  placeholder="00.000.000/0001-00"
                  className="h-11 bg-stone-800/50 border-white/5 text-white placeholder:text-stone-500 focus:border-amber-500/50"
                  {...register("cnpj")}
                />
                {errors.cnpj && (
                  <p className="text-xs text-red-400">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 border-stone-700 text-stone-300 hover:bg-stone-800"
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold shadow-lg shadow-amber-500/20 border-amber-400/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-stone-400">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
