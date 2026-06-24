"use client";

import { useState } from "react";
import { ArrowLeft, Send, Shield, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const REQUEST_TYPES = [
  { value: "access", label: "Acesso aos meus dados", description: "Quero saber quais dados pessoais vocês possuem sobre mim" },
  { value: "correction", label: "Correção de dados", description: "Quero corrigir dados incompletos ou desatualizados" },
  { value: "deletion", label: "Exclusão de dados", description: "Quero que meus dados pessoais sejam removidos" },
  { value: "portability", label: "Portabilidade", description: "Quero receber meus dados em formato estruturado" },
  { value: "revoke", label: "Revogação de consentimento", description: "Quero retirar o consentimento dado anteriormente" },
  { value: "other", label: "Outra solicitação", description: "Tenho uma solicitação diferente sobre meus dados" },
];

export default function SolicitacaoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Gerar o mailto com os dados preenchidos
    const selectedType = REQUEST_TYPES.find(r => r.value === requestType);
    const subject = encodeURIComponent(`[LGPD] Solicitação de Direito do Titular - ${selectedType?.label || "Geral"}`);
    const body = encodeURIComponent(
      `Solicitação de Direito do Titular (LGPD Art. 18)\n` +
      `${"─".repeat(50)}\n\n` +
      `Nome: ${name}\n` +
      `E-mail: ${email}\n` +
      `Tipo: ${selectedType?.label || "Não especificado"}\n\n` +
      `Detalhes:\n${details}\n\n` +
      `${"─".repeat(50)}\n` +
      `Prazo de resposta: 15 dias úteis (Art. 18, §5)\n` +
      `Enviado em: ${new Date().toLocaleString("pt-BR")}`
    );

    window.location.href = `mailto:oseiasduraes133@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Solicitação Enviada</h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-2">
            Seu cliente de e-mail deve ter sido aberto com a solicitação preenchida.
            Envie o e-mail para que possamos processar seu pedido.
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed mb-6">
            O prazo de resposta é de até <strong className="text-zinc-700 dark:text-zinc-300">15 dias úteis</strong>, conforme Art. 18 §5 da LGPD.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Voltar à página anterior
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border shadow-sm rounded-3xl p-8 md:p-10">
        
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Solicitação de Direitos</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8 ml-16">
          Exerça seus direitos como titular de dados pessoais conforme a LGPD (Art. 18).
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Seu nome completo"
              className="w-full h-11 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">E-mail de contato</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full h-11 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>

          {/* Tipo de solicitação */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-3">Tipo de solicitação</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQUEST_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    requestType === type.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value={type.value}
                    checked={requestType === type.value}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="mt-1 accent-primary"
                    required
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{type.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Detalhes */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Detalhes adicionais</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              rows={4}
              placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 space-y-1">
            <p>• Ao enviar, seu cliente de e-mail será aberto com a solicitação preenchida.</p>
            <p>• Responderemos em até <strong>15 dias úteis</strong> conforme Art. 18, §5 da LGPD.</p>
            <p>• Podemos solicitar verificação de identidade para proteger seus dados.</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name || !email || !requestType || !details}
            className="w-full h-12 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <Send className="w-4 h-4" />
            Enviar solicitação
          </button>
        </form>

      </div>
    </div>
  );
}
