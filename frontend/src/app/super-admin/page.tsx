"use client";

import { useEffect, useState } from "react";
import { superAdminService, PlatformStats } from "@/services/super-admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, Users, DollarSign, Activity, ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("Mensal");

  useEffect(() => {
    loadStats();
  }, [timeFilter]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await superAdminService.getStats(timeFilter);
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const mrrValue = parseFloat(stats.revenue?.thisMonth || "0");
  const arrValue = mrrValue * 12;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const chartDataRecharts = stats.chartData || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Visão Global da Plataforma
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho de todas as barbearias e receitas.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
          {["Diário", "Semanal", "Mensal", "Anual"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                timeFilter === tf 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border hover:border-primary/20 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Receita MRR</p>
                <p className="text-2xl font-bold">{formatBRL(mrrValue)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="size-3 text-emerald-500" />
                  Mês atual
                </p>
              </div>
              <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-emerald-500">
                <DollarSign className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/20 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Projeção ARR</p>
                <p className="text-2xl font-bold">{formatBRL(arrValue)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="size-3 text-blue-500" />
                  Anualizado
                </p>
              </div>
              <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-blue-500">
                <TrendingUp className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/20 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                <p className="text-2xl font-bold">{stats.tenants?.active || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Barbearias na plataforma
                </p>
              </div>
              <div className="size-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-purple-500">
                <Users className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/20 transition-colors group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contas em Trial</p>
                <p className="text-2xl font-bold">{stats.tenants?.trial || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Aguardando conversão
                </p>
              </div>
              <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-amber-500">
                <Activity className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Volume da Plataforma ({timeFilter})
            </CardTitle>
            <CardDescription>Comparativo de Agendamentos e Novas Entradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartDataRecharts}>
                <defs>
                  <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#a8a29e" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#a8a29e" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Intl.NumberFormat("pt-BR").format(val)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar 
                  dataKey="agendamentos" 
                  name="Agendamentos Diários" 
                  fill="url(#colorAgendamentos)" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40} 
                />
                <Line 
                  type="monotone" 
                  dataKey="novasBarbearias" 
                  name="Novas Barbearias" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#10b981" }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Estatísticas Totais
            </CardTitle>
            <CardDescription>
              Dados históricos da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR").format(stats.totalAppointments)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profissionais Base</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR").format(stats.totalProfessionals || 0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Finais</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR").format(stats.totalClients || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
