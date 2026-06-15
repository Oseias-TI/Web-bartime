"use client";

import { BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminDocumentacaoPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-500" />
            Documentação Interna
          </h1>
          <p className="text-zinc-400 mt-1">
            Manuais, arquitetura, e guias de uso da plataforma Bartime
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Novo Documento
        </Button>
      </div>

      <div className="p-12 text-center border border-zinc-800 rounded-lg bg-zinc-900/50">
        <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Repositório Vazio</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Adicione documentos internos sobre as regras de negócio ou manuais operacionais.
        </p>
      </div>
    </div>
  );
}
