"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, DollarSign, Activity, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { superAdminService, PlatformStats } from "@/services/super-admin.service";
import { toastManager } from "@/components/ui/toast";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SuperAdminFinanceiroPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("Mensal");

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const response = await superAdminService.getStats(filter);
        setStats(response.data);
      } catch (error: any) {
        toastManager.add({
          title: "Erro ao carregar os dados financeiros",
          description: error.response?.data?.error || "Tente novamente mais tarde.",
          type: "error"
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [filter]);

  const defaultStats = stats || {
    tenants: { total: 0, active: 0, trial: 0, pastDue: 0, canceled: 0 },
    revenue: { total: "0", thisMonth: "0", mrr: "0" },
    newTenantsThisMonth: 0,
    totalAppointments: 0,
    totalProfessionals: 0,
    totalClients: 0,
    chartData: [],
    topTenants: []
  };

  const defaultToZero = (val: string | undefined | null) => val ? parseFloat(val) : 0;
  
  const mrrValue = defaultToZero(defaultStats.revenue.mrr);
  const totalInadimplentes = defaultStats.tenants.pastDue;
  const totalTenants = defaultStats.tenants.total;
  const inadimplenciaPercent = totalTenants > 0 ? (totalInadimplentes / totalTenants) * 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-500" />
            Relatório Financeiro
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Receita Mensal Recorrente (MRR), assinaturas e fluxo de caixa (GMV)
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex">
            {['Semanal', 'Mensal', 'Anual'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300">
            Exportar CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-zinc-400 font-medium text-sm">MRR Simulada</h3>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mt-4 relative z-10">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrrValue)}
              </p>
              <p className="text-xs text-emerald-500 mt-2 flex items-center relative z-10">
                <TrendingUp className="w-3 h-3 mr-1" />
                Baseado em {defaultStats.tenants.active} assinaturas ativas
              </p>
            </div>
            
            <div className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-zinc-400 font-medium text-sm">Volume Transacionado (GMV)</h3>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mt-4 relative z-10">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(defaultToZero(defaultStats.revenue.total))}
              </p>
              <p className="text-xs text-zinc-500 mt-2 relative z-10">
                No período: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(defaultToZero(defaultStats.revenue.thisMonth))}
              </p>
            </div>
            
            <div className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-zinc-400 font-medium text-sm">Taxa de Inadimplência</h3>
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mt-4 relative z-10">
                {inadimplenciaPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-zinc-500 mt-2 relative z-10">
                {totalInadimplentes} barbearias em atraso
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl">
              <h3 className="text-white font-medium mb-6">Crescimento de Volume Financeiro (GMV)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={defaultStats.chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#52525b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10} 
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="gmv" 
                      name="Volume (R$)"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorGmv)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl flex flex-col">
              <h3 className="text-white font-medium mb-6">Top Barbearias (GMV)</h3>
              
              <div className="flex-1 flex flex-col gap-4">
                {defaultStats.topTenants && defaultStats.topTenants.length > 0 ? (
                  defaultStats.topTenants.map((tenant, index) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-500' : 
                          index === 1 ? 'bg-zinc-300/20 text-zinc-300' : 
                          index === 2 ? 'bg-orange-700/20 text-orange-500' : 
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white line-clamp-1">{tenant.name}</p>
                          <p className="text-[10px] text-zinc-500">{tenant.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(tenant.totalAmount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm">
                    <Activity className="h-8 w-8 opacity-20 mb-2" />
                    Nenhuma transação no período
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
