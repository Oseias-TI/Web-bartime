"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Trash2, Shield, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ClientPrivacyPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const data = await clientApi.get<any>(`/public/tenant/${slug}/client/export`);

      // Baixar como arquivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-bartime-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Seus dados foram baixados com sucesso!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erro ao exportar dados." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "EXCLUIR") return;

    setIsDeleting(true);
    setMessage(null);

    try {
      await clientApi.delete(`/public/tenant/${slug}/client/data`);

      // Limpar dados locais
      localStorage.removeItem(`@Bartime:clientToken_${slug}`);
      localStorage.removeItem(`@Bartime:clientInfo_${slug}`);

      setMessage({ type: "success", text: "Seus dados foram removidos com sucesso." });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push(`/book/${slug}`);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erro ao excluir dados." });
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <button
          onClick={() => router.push(`/book/${slug}/client-dashboard`)}
          className="text-sm text-zinc-500 flex items-center gap-1 mb-6 mt-6 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar ao painel
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Minha Privacidade</h1>
            <p className="text-xs text-zinc-500">Gerencie seus dados pessoais (LGPD)</p>
          </div>
        </div>

        {/* Mensagem */}
        {message && (
          <div
            className={`p-3 rounded-xl text-sm mb-6 text-center ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-950/30 text-green-600"
                : "bg-red-50 dark:bg-red-950/30 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Portabilidade */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <Download className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Exportar meus dados</h2>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                Baixe uma cópia de todos os seus dados pessoais em formato JSON, 
                incluindo informações de perfil, agendamentos e histórico de consentimento.
              </p>
              <p className="text-xs text-zinc-400 mt-2">LGPD Art. 18, V — Direito à portabilidade</p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="w-full h-11 rounded-xl"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Baixar meus dados
              </>
            )}
          </Button>
        </div>

        {/* Exclusão */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm p-5 mb-4 border-red-200 dark:border-red-900/30">
          <div className="flex items-start gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Excluir meus dados</h2>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                Solicite a remoção permanente dos seus dados pessoais. Seus agendamentos 
                pendentes serão cancelados e suas informações serão anonimizadas.
              </p>
              <p className="text-xs text-zinc-400 mt-2">LGPD Art. 18, VI — Direito à eliminação</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full h-11 rounded-xl border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Solicitar exclusão
            </Button>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                  <strong>Esta ação é irreversível.</strong> Todos os seus dados pessoais serão removidos 
                  e você não poderá mais acessar esta conta.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== "EXCLUIR" || isDeleting}
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirmar exclusão"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm p-5 space-y-3">
          <Link
            href="/privacidade"
            className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors"
          >
            <span>Política de Privacidade</span>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </Link>
          <div className="border-t dark:border-zinc-800" />
          <Link
            href="/termos"
            className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors"
          >
            <span>Termos de Uso</span>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </Link>
          <div className="border-t dark:border-zinc-800" />
          <a
            href="mailto:privacidade@bartime.com.br"
            className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors"
          >
            <span>Contato do DPO</span>
            <span className="text-xs text-zinc-400">privacidade@bartime.com.br</span>
          </a>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6 mb-10">
          Seus direitos são garantidos pela LGPD (Lei nº 13.709/2018)
        </p>

      </div>
    </div>
  );
}
