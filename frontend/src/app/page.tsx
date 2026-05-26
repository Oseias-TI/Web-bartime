import Link from "next/link";
import {
  CalendarDays,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Scissors,
  Clock,
  CreditCard,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Agendamento Inteligente",
    description:
      "Gerencie horários, disponibilidade e evite conflitos. Seus clientes podem ver slots livres em tempo real.",
  },
  {
    icon: Users,
    title: "CRM de Clientes",
    description:
      "Histórico completo, preferências, pontos de fidelidade e controle de clientes inativos.",
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description:
      "Fluxo de caixa, receitas e despesas, comissões automáticas e pagamento de profissionais.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Gerenciais",
    description:
      "Métricas de desempenho, ranking de serviços, receita por profissional. Exporte em PDF ou Excel.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description:
      "Autenticação JWT, rate limiting, logs de auditoria e criptografia. Seus dados protegidos.",
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    description:
      "Funciona perfeitamente em qualquer dispositivo — celular, tablet ou desktop.",
  },
];

const pricing = [
  {
    name: "Trial",
    price: "Grátis",
    period: "7 dias",
    description: "Teste todas as funcionalidades sem compromisso.",
    features: [
      "Agendamentos ilimitados",
      "Até 3 profissionais",
      "Relatórios básicos",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Profissional",
    price: "R$ 89",
    period: "/mês",
    description: "Tudo que sua barbearia precisa para crescer.",
    features: [
      "Profissionais ilimitados",
      "CRM completo de clientes",
      "Relatórios avançados",
      "Export PDF e Excel",
      "Comissões automáticas",
      "Lembretes por email",
      "Suporte prioritário",
    ],
    cta: "Assinar Agora",
    highlighted: true,
  },
];

const stats = [
  { value: "500+", label: "Barbearias" },
  { value: "50k+", label: "Agendamentos" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "Avaliação" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
              <Sparkles className="size-5 text-stone-900" />
            </div>
            <span className="font-bold text-lg">BarberFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-stone-400">
            <a href="#features" className="hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Planos
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-stone-300 hover:text-white transition-colors hidden sm:inline"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-stone-900 shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400 mb-8">
              <Zap className="size-3.5" />
              Plataforma #1 para Barbearias
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Gerencie sua barbearia{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                como um profissional
              </span>
            </h1>

            <p className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Agendamentos, clientes, financeiro, equipe e relatórios — tudo em um
              só lugar. Simplifique sua gestão e foque no que importa: seus clientes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-base font-bold text-stone-900 shadow-xl shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 hover:shadow-amber-500/35 transition-all duration-200 w-full sm:w-auto justify-center"
              >
                Cadastrar Grátis
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-stone-300 hover:bg-white/10 transition-all duration-200 w-full sm:w-auto justify-center"
              >
                Ver Funcionalidades
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-10 border-t border-white/5">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-amber-500">
                    {stat.value}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Tudo que você precisa,{" "}
              <span className="text-stone-500">nada que não precisa</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/5 bg-stone-900/50 p-6 hover:border-amber-500/20 hover:bg-stone-900/80 transition-all duration-300"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
              Simples e Rápido
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Comece em 3 passos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Scissors,
                title: "Cadastre sua Barbearia",
                description:
                  "Crie sua conta em menos de 2 minutos com CNPJ e dados básicos.",
              },
              {
                step: "02",
                icon: Clock,
                title: "Configure seus Horários",
                description:
                  "Defina dias e horários de funcionamento, serviços e preços.",
              },
              {
                step: "03",
                icon: CreditCard,
                title: "Comece a Gerenciar",
                description:
                  "Agende clientes, controle finanças e acompanhe relatórios.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-stone-900 border border-white/5 mb-5">
                  <item.icon className="size-7 text-amber-500" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:-left-2 flex size-8 items-center justify-center rounded-full bg-amber-500 text-stone-900 text-xs font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
              Planos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Preço justo,{" "}
              <span className="text-stone-500">sem surpresas</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 max-w-3xl mx-auto gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 relative ${
                  plan.highlighted
                    ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent shadow-xl shadow-amber-500/5"
                    : "border-white/5 bg-stone-900/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-stone-900">
                    <Star className="size-3" />
                    Mais Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-stone-400">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-stone-500 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-stone-300"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700"
                      : "border border-white/10 text-stone-300 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-950 p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para transformar sua barbearia?
              </h2>
              <p className="text-stone-400 mb-8 max-w-lg mx-auto">
                Junte-se a centenas de barbearias que já usam o BarberFlow para
                crescer. Comece grátis, sem cartão de crédito.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-base font-bold text-stone-900 shadow-xl shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all duration-200"
              >
                Começar Agora — É Grátis
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                <Sparkles className="size-4 text-stone-900" />
              </div>
              <span className="font-semibold">BarberFlow</span>
            </div>
            <p className="text-sm text-stone-500">
              © 2026 BarberFlow. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-stone-500">
              <Link href="/login" className="hover:text-stone-300 transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="hover:text-stone-300 transition-colors"
              >
                Cadastro
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
