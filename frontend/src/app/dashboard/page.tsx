"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { appointmentsService, type Appointment } from "@/services/appointments.service";
import { financialService, type FinancialSummary } from "@/services/financial.service";
import { useAuth } from "@/contexts/AuthContext";

interface KpiCard {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  color: string;
}

export default function DashboardPage() {
  const { tenant } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const [chartData, setChartData] = useState<{ day: string; receita: number }[]>([
    { day: "Seg", receita: 0 },
    { day: "Ter", receita: 0 },
    { day: "Qua", receita: 0 },
    { day: "Qui", receita: 0 },
    { day: "Sex", receita: 0 },
    { day: "Sáb", receita: 0 },
    { day: "Dom", receita: 0 },
  ]);

  const loadData = useCallback(async () => {
    try {
      const [appts, fin, cashFlow] = await Promise.all([
        appointmentsService.listByDay(today),
        financialService.getSummary({ start: monthStart, end: today }),
        financialService.getCashFlow({ start: weekAgo, end: today })
      ]);
      setAppointments(appts);
      setSummary(fin);

      // Map cash flow to chart data
      const newChartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = format(d, "yyyy-MM-dd");
        const dayName = format(d, "EE", { locale: ptBR }); // "seg", "ter"
        
        const flow = cashFlow.find(c => c.date === dateStr);
        newChartData.push({
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          receita: flow ? flow.income : 0
        });
      }
      setChartData(newChartData);

    } catch (err) {
      console.error(err);
      setAppointments([]);
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        pendingCommissions: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [today, monthStart, weekAgo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedToday = appointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;
  const pendingToday = appointments.filter(
    (a) => a.status === "PENDING"
  ).length;
  const canceledToday = appointments.filter(
    (a) => a.status === "CANCELED"
  ).length;

  const kpiCards: KpiCard[] = [
    {
      title: "Agendamentos Hoje",
      value: String(appointments.length),
      change: `${pendingToday} pendentes`,
      icon: CalendarDays,
      color: "text-amber-500",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${(summary?.totalIncome || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${(summary?.netProfit || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "Comissões Pendentes",
      value: `R$ ${(summary?.pendingCommissions || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Users,
      color: "text-purple-500",
    },
  ];



  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, bem-vindo! 👋
        </h1>
        <p className="text-muted-foreground">
          {tenant?.name} —{" "}
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            className="bg-card border-border hover:border-primary/20 transition-colors group"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.change && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowUpRight className="size-3 text-emerald-500" />
                      {card.change}
                    </p>
                  )}
                </div>
                <div
                  className={`size-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}
                >
                  <card.icon className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Receita Semanal
            </CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  stroke="#a8a29e"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: any) => [
                    `R$ ${value.toLocaleString("pt-BR")}`,
                    "Receita",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's appointments */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Agenda de Hoje
            </CardTitle>
            <CardDescription>
              {completedToday} concluídos, {pendingToday} pendentes
              {canceledToday > 0 && `, ${canceledToday} cancelados`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarDays className="size-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum agendamento hoje</p>
              </div>
            ) : (
              appointments.slice(0, 6).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center text-center min-w-[50px]">
                    <span className="text-xs text-muted-foreground">
                      {apt.startTime.substring(11, 16)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {apt.client.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {apt.service.name} • {apt.professional.name}
                    </p>
                  </div>
                  <Badge
                    variant={
                      apt.status === "COMPLETED"
                        ? "default"
                        : apt.status === "CANCELED"
                          ? "destructive"
                          : "secondary"
                    }
                    className="shrink-0"
                  >
                    {apt.status === "COMPLETED" ? (
                      <CheckCircle2 className="size-3 mr-1" />
                    ) : apt.status === "CANCELED" ? (
                      <XCircle className="size-3 mr-1" />
                    ) : (
                      <Clock className="size-3 mr-1" />
                    )}
                    {apt.status === "COMPLETED"
                      ? "OK"
                      : apt.status === "CANCELED"
                        ? "Canc."
                        : "Pend."}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
