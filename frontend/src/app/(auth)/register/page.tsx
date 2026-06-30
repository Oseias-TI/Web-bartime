"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Scissors, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth, CURRENT_PRIVACY_VERSION } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toastManager } from "@/components/ui/toast";
import type { ApiError } from "@/lib/api";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Senha deve ter ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Senha deve ter ao menos um número"),
    confirmPassword: z.string(),
    tenantName: z.string().min(2, "Nome da barbearia é obrigatório"),
    cnpj: z
      .string()
      .refine((val) => val.replace(/\D/g, "").length === 14, {
        message: "CNPJ deve ter 14 números",
      }),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: "Você deve aceitar os termos de uso e política de privacidade",
    }),
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    }
  });

  const acceptTerms = watch("acceptTerms");

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
        consentVersion: CURRENT_PRIVACY_VERSION,
      });
      setStep(3);
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
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
        
        {step !== 3 && (
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-white/5">
              <Scissors className="size-7 text-black" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-playfair)]">Criar Conta</h1>
              <p className="text-sm text-neutral-400 mt-1">
                {step === 1 ? "Seus dados pessoais" : "Dados da barbearia"}
              </p>
            </div>
          </div>
        )}

{step !== 3 && (
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 1 ? "bg-white" : "bg-white/20"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 2 ? "bg-white" : "bg-white/20"
              }`}
            />
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="flex size-20 items-center justify-center rounded-full bg-green-500/20 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="size-10" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-playfair)] mb-3">
              Cadastro Finalizado!
            </h1>
            <p className="text-neutral-300 mb-8 leading-relaxed text-sm">
              Sua barbearia foi registrada com sucesso e você já está autenticado. 
              Agora você pode acessar o painel para configurar seus serviços.
            </p>

            <Button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 bg-white hover:!bg-black hover:!text-white text-black font-semibold shadow-lg shadow-black/15 group text-base"
            >
              Acessar Painel
              <ArrowRight className="size-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Nome completo
                </label>
                <Input
                  placeholder="Seu nome"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white pr-11"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
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
                <label className="text-sm font-medium text-neutral-300">
                  Confirmar senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white"
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
                className="w-full h-11 bg-white hover:!bg-black hover:!text-white text-black font-semibold shadow-lg shadow-black/15"
              >
                Próximo
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Nome da Barbearia
                </label>
                <Input
                  placeholder="Ex: Barbearia do João"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white"
                  {...register("tenantName")}
                />
                {errors.tenantName && (
                  <p className="text-xs text-red-400">{errors.tenantName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  CNPJ
                </label>
                <Input
                  placeholder="00.000.000/0001-00"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white"
                  {...register("cnpj")}
                />
                {errors.cnpj && (
                  <p className="text-xs text-red-400">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="flex items-start space-x-3 mt-4 bg-white/5 p-3 rounded-xl border border-white/10">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => {
                    setValue("acceptTerms", checked === true, { shouldValidate: true });
                  }} 
                  className="mt-0.5"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none text-neutral-300"
                  >
                    Li e concordo com os <Link href="/termos" className="text-white hover:text-neutral-300 underline underline-offset-4 transition-colors">Termos de Uso</Link> e a <Link href="/privacidade" className="text-white hover:text-neutral-300 underline underline-offset-4 transition-colors">Política de Privacidade</Link>.
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-xs text-red-400">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white"
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-white hover:!bg-black hover:!text-white text-black font-semibold shadow-lg shadow-black/15"
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

        {step !== 3 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-white hover:text-neutral-300 underline-offset-4 hover:underline font-medium transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
