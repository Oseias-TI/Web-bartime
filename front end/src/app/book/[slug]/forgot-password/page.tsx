"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Scissors, CheckCircle2, Loader2, Mail } from "lucide-react";

export default function ClientForgotPasswordPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [tenant, setTenant] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    api.get(`/public/tenant/${slug}`).then((data: any) => setTenant(data)).catch((err) => console.log(err.message));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await clientApi.post<any>(`/public/tenant/${slug}/client-auth/forgot-password`, { email });
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar recuperação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border mt-10 overflow-hidden p-6">
        
        <button onClick={() => router.push(`/book/${slug}/client-login`)} className="text-sm text-zinc-500 flex items-center gap-1 mb-6 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar ao Login
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

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Recuperar Senha</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {isSent ? "Verifique seu e-mail" : "Informe seu e-mail para receber um link."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 p-3 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {isSent ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Enviamos um link de recuperação para
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {email}
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto pt-2">
                  Verifique sua caixa de entrada e spam. O link expira em 30 minutos.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsSent(false)}
              className="w-full h-12 rounded-xl text-zinc-600 dark:text-zinc-300"
            >
              <Mail className="size-4 mr-2" />
              Enviar para outro e-mail
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail cadastrado</label>
              <Input 
                type="email"
                placeholder="seu@email.com" 
                className="mt-1 h-12 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg mt-4"
              disabled={isLoading || !email}
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Enviar link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
