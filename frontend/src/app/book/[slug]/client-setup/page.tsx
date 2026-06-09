"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Scissors } from "lucide-react";
import Link from "next/link";

export default function ClientSetupPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [tenant, setTenant] = useState<any>(null);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/public/tenant/${slug}`).then((data: any) => setTenant(data)).catch((err) => console.log(err.message));
  }, [slug]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await clientApi.post<any>(`/public/tenant/${slug}/client-auth/setup`, {
        emailOrPhone,
        password
      });

      localStorage.setItem(`@Bartime:clientToken_${slug}`, response.token);
      localStorage.setItem(`@Bartime:clientInfo_${slug}`, JSON.stringify(response.client));

      setSuccess(true);
      setTimeout(() => {
        router.push(`/book/${slug}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao configurar senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border mt-10">
        <button onClick={() => router.push(`/book/${slug}/client-login`)} className="text-sm text-zinc-500 flex items-center gap-1 mb-6 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar para o login
        </button>

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

        <h2 className="text-xl font-bold mb-2">Primeiro Acesso</h2>
        <p className="text-zinc-500 mb-6">Se você já cortou aqui antes, use seu e-mail ou telefone para criar uma senha.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-700 p-6 rounded-2xl text-center">
            <h2 className="font-bold text-lg mb-2">Senha criada com sucesso!</h2>
            <p className="text-sm">Você será redirecionado para o agendamento em instantes...</p>
          </div>
        ) : (
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Seu E-mail ou WhatsApp cadastrado</label>
              <Input 
                placeholder="seu@email.com ou (00) 00000-0000" 
                className="mt-1 h-12 rounded-xl"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Crie uma nova senha</label>
              <Input 
                type="password"
                placeholder="Mínimo 6 caracteres" 
                className="mt-1 h-12 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit"
              className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg mt-4"
              disabled={isLoading || !emailOrPhone || !password || password.length < 6}
              suppressHydrationWarning
            >
              {isLoading ? "Criando..." : "Criar Senha e Entrar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
