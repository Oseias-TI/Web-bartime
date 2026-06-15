"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermosDeUsoPage() {
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
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-playfair)]">Termos de Uso</h1>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-6 text-zinc-600 dark:text-zinc-400">
          <p>Última atualização: 11 de Junho de 2026</p>
          
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar a plataforma Bartime, você concorda em cumprir e ser regido por estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, você não tem permissão para acessar o serviço.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">2. Uso da Plataforma</h2>
          <p>
            A plataforma é fornecida &quot;no estado em que se encontra&quot;, destinada a facilitar o agendamento e a gestão 
            de serviços em barbearias. O uso indevido, incluindo tentativas de fraude, sobrecarga de sistemas ou o 
            fornecimento de informações falsas, resultará no encerramento imediato da sua conta.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">3. Contas e Segurança</h2>
          <p>
            Ao criar uma conta, você é responsável por manter a confidencialidade de sua senha e por todas as 
            atividades que ocorram em sua conta. A Bartime não se responsabiliza por perdas e danos decorrentes 
            do não cumprimento desta obrigação de segurança.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">4. Assinaturas e Pagamentos</h2>
          <p>
            A Bartime oferece um período de teste gratuito conforme especificado no momento do cadastro. 
            Após o período de teste, o acesso contínuo aos recursos da plataforma requer uma assinatura paga válida. 
            O não pagamento resultará no bloqueio e posterior encerramento da conta.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">5. Limitação de Responsabilidade</h2>
          <p>
            A Bartime atua exclusivamente como uma plataforma de facilitação tecnológica. Nós não somos 
            responsáveis pela qualidade dos serviços prestados pelas barbearias parceiras ou por qualquer conflito 
            direto entre o cliente final e o estabelecimento.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">6. Alterações nos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão 
            for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência.
          </p>
        </div>

      </div>
    </div>
  );
}
