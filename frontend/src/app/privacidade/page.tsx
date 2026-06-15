"use client";

import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacidadePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border shadow-sm rounded-3xl p-8 md:p-12">
        
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-playfair)]">Política de Privacidade</h1>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-6 text-zinc-600 dark:text-zinc-400">
          <p>Última atualização: 11 de Junho de 2026</p>
          
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">1. Coleta de Informações</h2>
          <p>
            Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, 
            número de telefone e dados da barbearia quando você cria uma conta. Para clientes finais, 
            coletamos nome, telefone e e-mail para processar os agendamentos.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">2. Uso das Informações</h2>
          <p>
            Utilizamos as informações coletadas para fornecer, manter e melhorar nossos serviços. 
            Isso inclui processar agendamentos, enviar confirmações, fornecer suporte ao cliente 
            e comunicar avisos administrativos ou ofertas promocionais relevantes ao uso da plataforma.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">3. Compartilhamento de Dados</h2>
          <p>
            No caso de clientes finais, seus dados (como nome e contato) são compartilhados exclusivamente 
            com a barbearia onde você realizou o agendamento, para viabilizar a prestação do serviço. 
            Não vendemos suas informações pessoais para terceiros.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">4. Segurança</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais projetadas para proteger 
            suas informações contra acesso não autorizado e perda de dados. Nossas senhas são 
            armazenadas usando criptografia e hashes fortes.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">5. Seus Direitos</h2>
          <p>
            Você tem o direito de solicitar acesso, correção ou exclusão de suas informações pessoais. 
            Caso deseje excluir sua conta e seus dados, você pode fazer isso nas configurações de 
            perfil ou entrando em contato com nosso suporte.
          </p>
        </div>

      </div>
    </div>
  );
}
