"use client";

import { Settings, Server, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminConfiguracoesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-zinc-400" />
            Configurações da Plataforma
          </h1>
          <p className="text-zinc-400 mt-1">
            Parâmetros globais, integrações e limites do sistema
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-medium text-white">Geral</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nome da Plataforma</label>
            <input 
              type="text" 
              defaultValue="Bartime"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">URL Base (Domínio principal)</label>
            <input 
              type="text" 
              defaultValue="https://bartime.com.br"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-medium text-white">Integrações Globais</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Stripe Secret Key</label>
            <input 
              type="password" 
              defaultValue="sk_test_..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Stripe Webhook Secret</label>
            <input 
              type="password" 
              defaultValue="whsec_..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
