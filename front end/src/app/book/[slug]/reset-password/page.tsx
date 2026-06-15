"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function ClientResetPasswordPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  
  const [tenant, setTenant] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    api.get(`/public/tenant/${slug}`).then((data: any) => setTenant(data)).catch((err) => console.log(err.message));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      await clientApi.post<any>(`/public/tenant/${slug}/client-auth/reset-password`, { 
        token,
        password 
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir a senha. O token pode ser inválido ou já ter expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Link Inválido</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            O link de recuperação de senha está ausente ou incompleto. Por favor, solicite a recuperação novamente.
          </p>
          <Button onClick={() => router.push(`/book/${slug}/forgot-password`)} className="w-full">
            Solicitar nova recuperação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border mt-10 overflow-hidden p-6">
        
        {tenant && (
          <div className="flex flex-col items-center mb-6">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-16 rounded-full object-cover shadow-md mb-3" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Scissors className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{tenant.name}</h1>
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Criar Nova Senha</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {isSuccess ? "Senha alterada com sucesso!" : "Digite sua nova senha abaixo."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 p-3 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
                Sua senha foi atualizada. Agora você já pode acessar a plataforma com sua nova senha.
              </p>
            </div>

            <Button
              onClick={() => router.push(`/book/${slug}/client-login`)}
              className="w-full h-12 rounded-xl text-white font-medium"
            >
              Fazer Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nova Senha</label>
              <Input 
                type="password"
                placeholder="No mínimo 6 caracteres" 
                className="mt-1 h-12 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirmar Nova Senha</label>
              <Input 
                type="password"
                placeholder="Repita a senha" 
                className="mt-1 h-12 rounded-xl"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg mt-4"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
