"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Scissors, Search, ChevronRight } from "lucide-react";

interface Tenant {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export default function GlobalClientLoginPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/public/tenants")
      .then((data: any) => {
        setTenants(data);
      })
      .catch((err: any) => {
        console.log(err.message);
        setError("Erro ao carregar barbearias. Tente novamente mais tarde.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSelectTenant = (slug: string) => {
    const token = localStorage.getItem(`@Bartime:clientToken_${slug}`);
    if (token) {
      router.push(`/book/${slug}`);
    } else {
      router.push(`/book/${slug}/client-login`);
    }
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">

<div className="p-8 text-center bg-zinc-900 dark:bg-black text-white relative shrink-0 overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Área do Cliente</h1>
            <p className="text-zinc-400 text-sm">
              Selecione a barbearia para acessar seus agendamentos
            </p>
          </div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>

<div className="p-6 flex flex-col flex-1 overflow-hidden">
          <div className="relative mb-6 shrink-0">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar barbearia..."
              className="h-14 pl-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:bg-white focus:ring-primary/20"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-zinc-500">Carregando barbearias...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm text-center">
                {error}
              </div>
            ) : filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <button
                  key={tenant.slug}
                  onClick={() => handleSelectTenant(tenant.slug)}
                  className="w-full bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between transition-all hover:shadow-sm text-left group"
                >
                  <div className="flex items-center gap-4">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt={tenant.name} className="h-12 w-12 rounded-full object-cover shadow-sm border border-zinc-100" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scissors className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{tenant.name}</h3>
                      <p className="text-xs text-zinc-500">Acessar perfil</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Nenhuma encontrada</h3>
                <p className="text-sm text-zinc-500">Não achamos nenhuma barbearia com esse nome.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
