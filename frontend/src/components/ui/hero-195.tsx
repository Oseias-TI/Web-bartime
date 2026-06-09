"use client";

import * as React from "react";
import { useState } from "react";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  CalendarDays,
  Users,
  Scissors,
  BarChart3,
  CheckCircle2,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "agenda",
    label: "Agenda",
    icon: CalendarDays,
    title: "Agendamento inteligente",
    description:
      "Seus clientes escolhem o horário, você só confirma. Sem ligação, sem WhatsApp.",
    highlights: [
      "Agenda online 24h",
      "Sem conflito de horários",
      "Lembretes automáticos",
      "Link exclusivo pra compartilhar",
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    title: "Conheça cada cliente",
    description:
      "Histórico completo, preferências salvas e alerta de quem sumiu faz tempo.",
    highlights: [
      "Ficha completa do cliente",
      "Histórico de serviços",
      "Alertas de inatividade",
      "Pontos de fidelidade",
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: BarChart3,
    title: "Dinheiro na ponta do lápis",
    description:
      "Saiba quanto cada barbeiro faturou, quanto saiu de comissão e qual o lucro real.",
    highlights: [
      "Fluxo de caixa diário",
      "Comissões automáticas",
      "Relatórios por período",
      "Exportar pra Excel",
    ],
  },
];

function Hero195({
  className,
}: {
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState("agenda");

  return (
    <section
      className={cn(
        "relative w-full px-4 py-20 md:py-28 overflow-hidden",
        className
      )}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Top section — headline + quick signup */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left — headline */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-neutral-300">
              <Scissors className="size-3.5" />
              Gestão completa pra barbearia
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] font-[family-name:var(--font-playfair)]">
              O sistema que sua{" "}
              <span className="bg-gradient-to-r from-white via-neutral-400 to-transparent bg-clip-text text-transparent">
                barbearia merece
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              Agenda, clientes, equipe e financeiro — tudo organizado num lugar
              só. Comece grátis, sem complicação.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="h-12 px-8 text-base gap-2 bg-white text-black hover:!bg-black hover:!text-white font-semibold shadow-lg shadow-white/10"
              >
                Testar Grátis
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                className="h-12 px-8 text-base gap-2 bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                <Play className="size-4" />
                Ver como funciona
              </Button>
            </div>
          </div>

          {/* Right — signup card with BorderBeam */}
          <div className="relative">
            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
              <BorderBeam
                size={200}
                duration={10}
                colorFrom="#ffffff"
                colorTo="#a3a3a3"
                delay={0}
              />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-white font-[family-name:var(--font-playfair)]">
                  Cadastro rápido
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Crie sua conta em 30 segundos. Sem cartão de crédito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-name" className="text-white">Nome da barbearia</Label>
                  <Input
                    id="hero-name"
                    placeholder="Ex: Barbearia do João"
                    className="h-11 bg-white/5 border-white/10 focus:border-white focus:ring-white/20 text-white placeholder:text-neutral-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-email" className="text-white">Seu email</Label>
                  <Input
                    id="hero-email"
                    type="email"
                    placeholder="joao@email.com"
                    className="h-11 bg-white/5 border-white/10 focus:border-white focus:ring-white/20 text-white placeholder:text-neutral-500"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full h-11 bg-white text-black hover:!bg-black hover:!text-white font-semibold shadow-md shadow-white/10">
                  Começar Grátis
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Bottom section — feature tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-center mb-8">
            <TabsList className="h-12 p-1 bg-white/5 backdrop-blur-md border border-white/10">
              {features.map((f) => (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  className="h-10 px-6 gap-2 data-[state=active]:shadow-md"
                >
                  <f.icon className="size-4" />
                  <span className="hidden sm:inline">{f.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {features.map((feature) => (
            <TabsContent
              key={feature.id}
              value={feature.id}
              className="mt-0"
            >
              <Card className="relative overflow-hidden bg-white/5 backdrop-blur-xl border-white/10">
                <BorderBeam
                  size={300}
                  duration={15}
                  colorFrom="#ffffff"
                  colorTo="#525252"
                  delay={2}
                  borderWidth={1}
                />
                <div className="grid md:grid-cols-2 gap-0">
                  <CardHeader className="p-8 md:p-10">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white mb-4">
                      <feature.icon className="size-6" />
                    </div>
                    <CardTitle className="text-2xl text-white font-[family-name:var(--font-playfair)] mb-2">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base text-neutral-400 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 md:p-10 flex items-center">
                    <ul className="space-y-3 w-full">
                      {feature.highlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-3 text-sm text-neutral-200"
                        >
                          <CheckCircle2 className="size-5 text-[#5cb97a] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

export { Hero195 };
