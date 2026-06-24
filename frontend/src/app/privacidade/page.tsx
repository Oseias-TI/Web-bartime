"use client";

import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
          
          <p>
            Esta Política de Privacidade descreve como a plataforma <strong>Bartime</strong> coleta, utiliza, 
            armazena e protege os dados pessoais dos usuários, em conformidade com a 
            <strong> Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">1. Controlador de Dados</h2>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="mb-1"><strong>Razão Social:</strong> Bartime Tecnologia Ltda.</p>
            <p className="mb-1"><strong>CNPJ:</strong> XX.XXX.XXX/0001-XX</p>
            <p className="mb-1"><strong>Endereço:</strong> [Endereço da empresa]</p>
            <p className="mb-1"><strong>Encarregado de Dados (DPO):</strong> [Nome do responsável]</p>
            <p><strong>Contato do DPO:</strong> <a href="mailto:privacidade@bartime.com.br" className="text-primary hover:underline">privacidade@bartime.com.br</a></p>
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">2. Dados Coletados</h2>
          <p>Coletamos as seguintes categorias de dados pessoais:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Proprietários de Barbearia (Tenants):</strong> Nome completo, e-mail, CNPJ, senha (criptografada), endereço IP.</li>
            <li><strong>Profissionais (Barbers):</strong> Nome completo, e-mail, senha (criptografada), foto de avatar (opcional), endereço IP.</li>
            <li><strong>Clientes Finais:</strong> Nome completo, telefone (WhatsApp), e-mail (opcional), senha (criptografada), preferências de serviço, endereço IP.</li>
          </ul>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">3. Base Legal para o Tratamento (Art. 7 da LGPD)</h2>
          <p>Os dados pessoais são tratados com base nas seguintes hipóteses legais:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 pr-4 font-semibold text-zinc-900 dark:text-white">Finalidade</th>
                  <th className="text-left py-2 font-semibold text-zinc-900 dark:text-white">Base Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr><td className="py-2 pr-4">Criação e manutenção da conta</td><td className="py-2">Execução de contrato (Art. 7, V)</td></tr>
                <tr><td className="py-2 pr-4">Processamento de agendamentos</td><td className="py-2">Execução de contrato (Art. 7, V)</td></tr>
                <tr><td className="py-2 pr-4">Processamento de pagamentos (Stripe)</td><td className="py-2">Execução de contrato (Art. 7, V)</td></tr>
                <tr><td className="py-2 pr-4">Envio de lembretes de agendamento</td><td className="py-2">Legítimo interesse (Art. 7, IX)</td></tr>
                <tr><td className="py-2 pr-4">Relatórios gerenciais (para o tenant)</td><td className="py-2">Legítimo interesse (Art. 7, IX)</td></tr>
                <tr><td className="py-2 pr-4">Comunicações promocionais</td><td className="py-2">Consentimento (Art. 7, I)</td></tr>
                <tr><td className="py-2 pr-4">Registro de auditoria e segurança</td><td className="py-2">Legítimo interesse (Art. 7, IX)</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">4. Compartilhamento de Dados</h2>
          <p>
            No caso de clientes finais, seus dados (como nome e contato) são compartilhados exclusivamente 
            com a barbearia onde você realizou o agendamento, para viabilizar a prestação do serviço. 
            Não vendemos suas informações pessoais para terceiros.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">5. Transferência Internacional de Dados</h2>
          <p>
            Para fornecer nossos serviços, utilizamos provedores que podem armazenar ou processar 
            dados fora do Brasil:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Amazon Web Services (AWS S3)</strong> — armazenamento de imagens de avatar (EUA)</li>
            <li><strong>Stripe</strong> — processamento de pagamentos (EUA)</li>
            <li><strong>Vercel</strong> — hospedagem do site e CDN global (EUA)</li>
          </ul>
          <p>
            Essas transferências são realizadas com base em cláusulas contratuais padrão e 
            garantias adequadas de proteção de dados, conforme Art. 33 da LGPD.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">6. Armazenamento Local (Cookies e LocalStorage)</h2>
          <p>
            Utilizamos o <strong>localStorage</strong> do navegador para armazenar dados de sessão, 
            como tokens de autenticação e preferências de interface. Não utilizamos cookies de rastreamento 
            de terceiros. Os dados armazenados localmente são essenciais para o funcionamento da plataforma 
            e podem ser removidos limpando os dados do navegador.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">7. Segurança</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais projetadas para proteger 
            suas informações contra acesso não autorizado e perda de dados:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Senhas armazenadas com criptografia <strong>bcrypt</strong> (hash + salt)</li>
            <li>Tokens de recuperação de senha protegidos com <strong>SHA-256</strong></li>
            <li>Comunicação via <strong>HTTPS</strong></li>
            <li>Headers de segurança via <strong>Helmet.js</strong></li>
            <li>Proteção contra ataques de força bruta via <strong>Rate Limiting</strong></li>
            <li>Isolamento de dados por tenant (multi-tenant architecture)</li>
            <li>Registro de auditoria (Audit Log) para todas as operações sensíveis</li>
          </ul>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">8. Retenção de Dados</h2>
          <p>
            Os dados pessoais são mantidos enquanto a conta do usuário estiver ativa. Após a exclusão 
            da conta ou solicitação de remoção, os dados pessoais são anonimizados, mantendo-se apenas 
            registros financeiros e de auditoria conforme obrigações legais e fiscais (até 5 anos após 
            o encerramento da relação contratual).
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">9. Seus Direitos (Art. 18 da LGPD)</h2>
          <p>Como titular dos dados, você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessar uma cópia deles</li>
            <li><strong>Correção:</strong> Solicitar a correção de dados incompletos ou desatualizados</li>
            <li><strong>Anonimização ou eliminação:</strong> Solicitar a remoção de dados pessoais desnecessários</li>
            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado (JSON)</li>
            <li><strong>Revogação do consentimento:</strong> Retirar o consentimento a qualquer momento</li>
            <li><strong>Informação sobre compartilhamento:</strong> Saber com quem seus dados foram compartilhados</li>
          </ul>
          <p>
            Para exercer qualquer desses direitos, entre em contato pelo e-mail{" "}
            <a href="mailto:privacidade@bartime.com.br" className="text-primary hover:underline">
              privacidade@bartime.com.br
            </a>{" "}
            ou utilize as funcionalidades disponíveis na sua área de cliente.
          </p>
          <Link
            href="/solicitacao-lgpd"
            className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm no-underline"
          >
            <Shield className="w-4 h-4" />
            Fazer uma solicitação
          </Link>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">10. Incidentes de Segurança</h2>
          <p>
            Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, 
            a Bartime comunicará a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados 
            em prazo razoável, conforme Art. 48 da LGPD, informando a natureza dos dados afetados, 
            os riscos envolvidos e as medidas adotadas.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">11. Alterações nesta Política</h2>
          <p>
            Reservamo-nos o direito de modificar esta Política de Privacidade a qualquer momento. 
            Alterações significativas serão comunicadas por e-mail ou por aviso na plataforma com 
            pelo menos 30 dias de antecedência. O uso continuado da plataforma após a alteração 
            constitui aceitação da política revisada.
          </p>
        </div>

      </div>
    </div>
  );
}
