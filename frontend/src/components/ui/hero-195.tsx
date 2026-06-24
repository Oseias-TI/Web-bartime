"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
        {/* Top section — headline */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20 mt-4 md:mt-10">
          <div className="space-y-6 flex flex-col items-center">
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

            <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
              Agenda, clientes, equipe e financeiro — tudo organizado num lugar
              só. Comece grátis, sem complicação.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base gap-2 bg-white text-black hover:!bg-black hover:!text-white font-semibold shadow-lg shadow-white/10"
              >
                <Link href="/register">
                  Testar Grátis
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      size="lg"
                      className="h-12 px-8 text-base gap-2 bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white"
                    />
                  }
                >
                  <Play className="size-4" />
                  Ver como funciona
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] bg-neutral-900 border-white/10 text-white p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-white font-[family-name:var(--font-playfair)] text-2xl">
                      Como funciona o Bartime
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                      Veja uma prévia de como o sistema pode ajudar sua barbearia.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogPanel>
                    <div className="aspect-video w-full rounded-xl bg-black/50 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden">
                      {/* You can replace this with an actual iframe or <video> tag later */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                      <Play className="size-16 text-white/20 mb-4" />
                      <p className="text-neutral-400 font-medium">Pré-visualização do Sistema</p>
                      <p className="text-neutral-600 text-sm mt-2">O vídeo de demonstração será exibido aqui.</p>
                    </div>
                  </DialogPanel>
                </DialogContent>
              </Dialog>
            </div>
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
