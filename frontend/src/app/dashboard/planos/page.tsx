"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CreditCard, Sparkles, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toastManager } from "@/components/ui/toast";

export default function PlanosPage() {
  const { tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const isPro = tenant?.subscriptionStatus === "ACTIVE";
  const isTrial = tenant?.subscriptionStatus === "TRIAL";
  const isPastDue = tenant?.subscriptionStatus === "PAST_DUE" || tenant?.subscriptionStatus === "CANCELED";

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await api.post<{ url: string }>("/billing/checkout");
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toastManager.add({
        title: "Erro ao processar assinatura",
        description: error.message || "Tente novamente mais tarde.",
        type: "error"
      });
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await api.post<{ url: string }>("/billing/portal");
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toastManager.add({
        title: "Erro ao acessar o portal",
        description: error.message || "Tente novamente mais tarde.",
        type: "error"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinatura & Planos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie o acesso da sua barbearia ao BarberFlow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Status Atual */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Status da Conta</CardTitle>
            <CardDescription>Informações atuais da sua barbearia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {isPro ? (
                  <Sparkles className="w-6 h-6 text-primary" />
                ) : isTrial ? (
                  <ClockIcon className="w-6 h-6 text-yellow-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                <p className="text-lg font-bold">
                  {isPro ? "BarberFlow PRO" : isTrial ? "Período de Teste" : "Conta Suspensa"}
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border text-sm">
              <p><strong>Barbearia:</strong> {tenant?.name}</p>
              <p><strong>CNPJ:</strong> {tenant?.cnpj}</p>
            </div>
          </CardContent>
          <CardFooter>
            {isPro ? (
              <Button onClick={handleManageSubscription} disabled={isLoading} variant="outline" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" /> Gerenciar Assinatura
              </Button>
            ) : (
              <Button onClick={handleSubscribe} disabled={isLoading} className="w-full text-lg h-12 shadow-md">
                {isTrial ? "Fazer Upgrade Agora" : "Reativar Conta"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Detalhes do Plano */}
        <Card>
          <CardHeader>
            <CardTitle>O que está incluso</CardTitle>
            <CardDescription>Tudo que você precisa para crescer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-primary mb-4">
              R$ 99<span className="text-lg text-muted-foreground font-normal">/mês</span>
            </div>
            
            <ul className="space-y-3">
              {[
                "Agendamentos online ilimitados",
                "Link exclusivo para seus clientes",
                "Gestão financeira completa (Fluxo de Caixa)",
                "Cálculo automático de comissões",
                "Relatórios detalhados de desempenho",
                "Gestão de equipe e perfis de acesso",
                "Lembretes automáticos via E-mail/WhatsApp"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
