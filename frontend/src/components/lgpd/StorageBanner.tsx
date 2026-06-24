"use client";

import { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";
import Link from "next/link";

/**
 * LGPD — Banner informativo sobre uso de localStorage.
 * Exibido apenas uma vez na primeira visita. Ao aceitar, armazena
 * a preferência no próprio localStorage.
 */
export function StorageBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("@Bartime:storageConsent");
    if (!accepted) {
      // Pequeno delay para não bloquear a renderização inicial
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("@Bartime:storageConsent", new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-2xl shadow-black/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>
                Utilizamos <strong className="text-zinc-900 dark:text-zinc-200">armazenamento local</strong> (localStorage) 
                para manter sua sessão ativa e preferências de interface. Não utilizamos cookies de rastreamento.{" "}
                <Link href="/privacidade" className="text-primary hover:underline font-medium">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              Entendi
            </button>
            <button
              onClick={handleAccept}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
