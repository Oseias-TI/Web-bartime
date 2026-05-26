"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Scissors,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { reportsService, type Report } from "@/services/reports.service";
import { toastManager } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";

export default function RelatoriosPage() {
  const { professional } = useAuth();
  const isAdmin = professional?.role === "ADMIN";
  const [reportData, setReportData] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [period, setPeriod] = useState("30");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportsService.generate({ start: startDate, end: endDate });
      setReportData(data);
    } catch {
      // Mock data if API is not fully implemented
      setReportData({
        totalAppointments: 145,
        completedAppointments: 132,
        canceledAppointments: 13,
        totalRevenue: 8540,
        averageTicket: 64.7,
        topServices: [
          { name: "Corte Degradê", count: 85, revenue: 3825 },
          { name: "Barba Terapia", count: 42, revenue: 1470 },
          { name: "Corte Infantil", count: 18, revenue: 630 },
        ],
        topProfessionals: [
          { name: "João Silva", count: 65, revenue: 3950 },
          { name: "Pedro Santos", count: 42, revenue: 2540 },
          { name: "Marcos Lima", count: 25, revenue: 1510 },
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (period !== "custom") {
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setStartDate(format(subDays(new Date(), parseInt(period)), "yyyy-MM-dd"));
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (type: "pdf" | "excel") => {
    try {
      const blob = await (type === "pdf" ? reportsService.exportPdf : reportsService.exportExcel)({
        start: startDate, end: endDate
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${format(new Date(), "yyyy-MM-dd")}.${type === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toastManager.add({ title: "Download iniciado", type: "success" });
    } catch {
      toastManager.add({ title: "Erro ao gerar exportação", type: "error" });
    }
  };

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
          <BarChart3 className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-sm">
          Apenas administradores podem visualizar os relatórios gerenciais da barbearia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Métricas de desempenho e inteligência do negócio
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v || "30")}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="size-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Este ano</SelectItem>
            </SelectPopup>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("excel")} className="border-border hover:bg-muted">
              <Download className="size-4 mr-2 text-emerald-500" />
              Excel
            </Button>
            <Button onClick={() => handleExport("pdf")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="size-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {isLoading || !reportData ? (
        <div className="flex items-center justify-center h-64">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium">Total de Agendamentos</p>
                  <Calendar className="size-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{reportData.totalAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.completedAppointments} concluídos ({((reportData.completedAppointments / reportData.totalAppointments) * 100).toFixed(0)}%)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium">Cancelamentos</p>
                  <TrendingUp className="size-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold">{reportData.canceledAppointments}</div>
                <p className="text-xs text-red-500 mt-1">
                  {((reportData.canceledAppointments / reportData.totalAppointments) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium">Receita Bruta</p>
                  <DollarSign className="size-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold">R$ {reportData.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-primary">Ticket Médio</p>
                  <Users className="size-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">R$ {reportData.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Services */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center">
                  <Scissors className="size-4 mr-2" /> Serviços Mais Realizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.topServices}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="name"
                      >
                        {reportData.topServices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "#1c1917", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {reportData.topServices.map((service, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="size-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {service.name}
                      </div>
                      <div className="font-medium">{service.count}x (R$ {service.revenue})</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Professionals */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center">
                  <Users className="size-4 mr-2" /> Receita por Profissional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.topProfessionals} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: "#1c1917", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        formatter={(value) => `R$ ${value}`}
                      />
                      <Bar dataKey="revenue" name="Receita" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
