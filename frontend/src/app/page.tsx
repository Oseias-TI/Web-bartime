import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Scissors,
  Clock,
  CreditCard,
} from "lucide-react";

import { Hero195 } from "@/components/ui/hero-195";
import { Pricing } from "@/components/ui/pricing";
import { BackgroundSnippet } from "@/components/ui/background-snippets";

const barberPricing = [
  {
    name: "Teste Grátis",
    price: "0",
    yearlyPrice: "0",
    period: "mês",
    description: "Experimenta tudo sem compromisso. Sem pedir cartão.",
    features: [
      "Agendamentos ilimitados",
      "Até 3 profissionais",
      "Relatórios básicos",
      "Suporte por email",
    ],
    buttonText: "Começar Grátis",
    href: "/register",
    isPopular: false,
  },
  {
    name: "Profissional",
    price: "89",
    yearlyPrice: "71",
    period: "mês",
    description: "Tudo que sua barbearia precisa, sem limite.",
    features: [
      "Profissionais ilimitados",
      "Cadastro completo de clientes",
      "Relatórios detalhados",
      "Exportar pra PDF e Excel",
      "Comissões automáticas",
      "Lembretes por email",
      "Suporte rápido",
    ],
    buttonText: "Começar Grátis",
    href: "/register",
    isPopular: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen relative text-neutral-100">
      <BackgroundSnippet />
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-transparent/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white text-black">
              <Scissors className="size-5 text-black" />
            </div>
            <span className="font-bold text-lg font-[family-name:var(--font-playfair)]">Bartime</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#como-funciona" className="hover:text-neutral-100 transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-neutral-100 transition-colors">
              Planos
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-300 hover:text-neutral-100 transition-colors hidden sm:inline"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold shadow-lg shadow-white/10 hover:!bg-black hover:!text-white transition-all"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <Hero195 />

      {/* ─── How it works ─── */}
      <section id="como-funciona" className="py-20 md:py-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Sem burocracia
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-[family-name:var(--font-playfair)]">
              Começa a usar em minutos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Scissors,
                title: "Cadastra sua barbearia",
                description:
                  "Coloca os dados básicos e pronto. Não precisa de CNPJ pra testar.",
              },
              {
                step: "02",
                icon: Clock,
                title: "Monta sua agenda",
                description:
                  "Define os horários, os serviços, os preços. Cada barbeiro com sua agenda.",
              },
              {
                step: "03",
                icon: CreditCard,
                title: "Gerencia tudo",
                description:
                  "Agenda clientes, acompanha o caixa e vê como o negócio tá andando.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/5 border border-white/10 mb-5">
                  <item.icon className="size-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:-left-2 flex size-8 items-center justify-center rounded-full bg-white text-black text-xs font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="planos" className="border-t border-white/10">
        <Pricing
          title="Preço justo, sem pegadinha"
          description="Escolha o melhor plano para a sua barbearia crescer"
          plans={barberPricing}
        />
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-neutral-900 to-neutral-950 p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[family-name:var(--font-playfair)]">
                Bora organizar sua barbearia?
              </h2>
              <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
                Testa por 7 dias, sem compromisso e sem precisar de cartão.
                Se não gostar, cancela sem burocracia.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-10 py-4 text-base font-bold shadow-xl shadow-white/5 hover:!bg-black hover:!text-white transition-all duration-200"
              >
                Começar Agora
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white text-black">
                <Scissors className="size-4 text-black" />
              </div>
              <span className="font-semibold font-[family-name:var(--font-playfair)]">Bartime</span>
            </div>
            <p className="text-sm text-neutral-500">
              © 2026 Bartime. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <Link href="/login" className="hover:text-neutral-300 transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="hover:text-neutral-300 transition-colors"
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
