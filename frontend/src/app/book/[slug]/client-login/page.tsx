"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Scissors } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClientLoginPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [tenant, setTenant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login State
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register State
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/public/tenant/${slug}`).then((data: any) => setTenant(data)).catch((err) => console.log(err.message));
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const contact = params.get("contact");
      if (contact) {
        setEmailOrPhone(contact);
      }
    }
  }, [slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await clientApi.post<any>(`/public/tenant/${slug}/client-auth/login`, {
        emailOrPhone,
        password: loginPassword
      });

      localStorage.setItem(`@Bartime:clientToken_${slug}`, response.token);
      localStorage.setItem(`@Bartime:clientInfo_${slug}`, JSON.stringify(response.client));

      router.push(`/book/${slug}`);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await clientApi.post<any>(`/public/tenant/${slug}/client-auth/register`, {
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword
      });

      localStorage.setItem(`@Bartime:clientToken_${slug}`, response.token);
      localStorage.setItem(`@Bartime:clientInfo_${slug}`, JSON.stringify(response.client));

      router.push(`/book/${slug}`);
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border mt-10 overflow-hidden">
        
        <div className="p-6 pb-0">
          <button onClick={() => router.push(`/book/${slug}`)} className="text-sm text-zinc-500 flex items-center gap-1 mb-6 hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar
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
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={cn("flex-1 py-3 text-sm font-semibold transition-colors border-b-2", activeTab === 'login' ? "border-primary text-primary" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}
            onClick={() => { setActiveTab('login'); setError(""); }}
          >
            Entrar
          </button>
          <button 
            className={cn("flex-1 py-3 text-sm font-semibold transition-colors border-b-2", activeTab === 'register' ? "border-primary text-primary" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}
            onClick={() => { setActiveTab('register'); setError(""); }}
          >
            Cadastrar
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 p-3 rounded-xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <p className="text-zinc-500 text-sm mb-6 text-center">Acesse para agendar e ver seu histórico.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail ou WhatsApp</label>
                  <Input 
                    placeholder="seu@email.com ou (00) 00000-0000" 
                    className="mt-1 h-12 rounded-xl"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</label>
                  <Input 
                    type="password"
                    placeholder="Sua senha secreta" 
                    className="mt-1 h-12 rounded-xl"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <Link 
                      href={`/book/${slug}/forgot-password`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg mt-4"
                  disabled={isLoading || !emailOrPhone || !loginPassword}
                  suppressHydrationWarning
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>


            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-zinc-500 text-sm mb-6 text-center">Crie sua conta para começar a agendar.</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome Completo</label>
                  <Input 
                    placeholder="Como devemos te chamar?" 
                    className="mt-1 h-12 rounded-xl"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">WhatsApp</label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    className="mt-1 h-12 rounded-xl"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail</label>
                  <Input 
                    type="email"
                    placeholder="seu@email.com" 
                    className="mt-1 h-12 rounded-xl"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</label>
                  <Input 
                    type="password"
                    placeholder="Crie uma senha" 
                    className="mt-1 h-12 rounded-xl"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox 
                    id="terms-client"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms-client" className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                    Li e concordo com os <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                  </label>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg mt-4"
                  disabled={isLoading || !regName || !regPhone || !regEmail || !regPassword || !acceptTerms}
                  suppressHydrationWarning
                >
                  {isLoading ? "Cadastrando..." : "Cadastrar e Entrar"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
