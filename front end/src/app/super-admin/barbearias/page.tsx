"use client";

import { useEffect, useState } from "react";
import { superAdminService, TenantListResult } from "@/services/super-admin.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Search, Users, Scissors, CalendarDays, Plus, Copy, Edit2, ShieldAlert, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { toastManager } from "@/components/ui/toast";

// Avatar helper
const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

const getAvatarGradient = (name: string) => {
  const gradients = [
    "from-blue-500 to-indigo-500",
    "from-emerald-400 to-cyan-500",
    "from-violet-500 to-fuchsia-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-500",
    "from-cyan-500 to-blue-500"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function SuperAdminTenantsPage() {
  const [data, setData] = useState<TenantListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadTenants = async (search = "") => {
    setIsLoading(true);
    try {
      const result = await superAdminService.listTenants({ search });
      setData(result);
    } catch (error) {
      toastManager.add({ title: "Erro ao carregar barbearias", type: "error" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadTenants(searchTerm);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      await superAdminService.updateTenantStatus(tenantId, newStatus);
      toastManager.add({ title: `Status atualizado para ${newStatus}`, type: "success" });
      loadTenants(searchTerm);
    } catch (error: any) {
      toastManager.add({ title: error.response?.data?.error || "Erro ao atualizar status", type: "error" });
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!window.confirm("ATENÇÃO: Você tem certeza que deseja excluir esta barbearia? Esta ação apagará todos os dados, profissionais, agendamentos e faturamentos dela para sempre e NÃO pode ser desfeita!")) {
      return;
    }
    try {
      await superAdminService.deleteTenant(tenantId);
      toastManager.add({ title: "Barbearia excluída definitivamente com sucesso.", type: "success" });
      loadTenants(searchTerm);
    } catch (error: any) {
      toastManager.add({ title: error.response?.data?.error || "Erro ao excluir barbearia", type: "error" });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ativo
          </span>
        );
      case "TRIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Em Teste
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 ring-1 ring-inset ring-orange-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Atrasado
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Inadimplente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header & Command Bar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Barbearias</h1>
          <p className="text-zinc-400 text-sm mt-2">Gerencie locatários, faturamentos e status operacionais da rede.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Command K Vibe Search */}
          <div className="relative w-full sm:w-[320px] group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar (Nome, CNPJ)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 text-white placeholder:text-zinc-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
          
          <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] rounded-xl px-5 h-[42px] transition-all" render={<a href="/super-admin/barbearias/nova" />}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Ghost Table */}
      <div className="w-full relative z-10">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 w-[35%]">Empresa</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 hidden md:table-cell">Métricas</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 hidden lg:table-cell">Integração</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 text-right w-[80px]"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Nenhum locatário localizado na base de dados.
                  </td>
                </tr>
              ) : (
                data?.data.map((tenant) => (
                  <tr key={tenant.id} className="group hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="py-4 px-4 align-top sm:align-middle">
                      <div className="flex items-center gap-4">
                        {/* Virtual Avatar */}
                        <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(tenant.name)} flex items-center justify-center text-white font-medium text-sm shadow-sm ring-1 ring-white/10`}>
                          {getInitials(tenant.name)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-100 group-hover:text-white transition-colors">{tenant.name}</div>
                          <div className="text-xs text-zinc-500 mt-0.5 font-mono tracking-tight">
                            {tenant.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 align-middle">
                      <StatusBadge status={tenant.subscriptionStatus} />
                    </td>
                    
                    <td className="py-4 px-4 align-middle hidden md:table-cell">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center text-xs text-zinc-400">
                          <Users className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                          <span className="font-medium text-zinc-300 mr-1">{tenant.professionalsCount}</span> profis.
                        </div>
                        <div className="flex items-center text-xs text-zinc-400">
                          <Scissors className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                          <span className="font-medium text-zinc-300 mr-1">{tenant.appointmentsCount}</span> agend.
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 align-middle hidden lg:table-cell">
                      <div className="flex items-center text-xs text-zinc-400 mb-1.5">
                        <CalendarDays className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                        Ativo desde {format(new Date(tenant.createdAt), "MMM yyyy", { locale: ptBR })}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-300 rounded-xl shadow-2xl p-1">
                          
                          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Gestão</div>
                          
                          <DropdownMenuItem className="hover:bg-white/5 rounded-md cursor-pointer mb-1" render={<a href={`/super-admin/barbearias/${tenant.id}`} />}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" />
                            Editar Dados
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="hover:bg-white/5 rounded-md cursor-pointer mb-1"
                            onClick={() => {
                              navigator.clipboard.writeText(tenant.id);
                              toastManager.add({ title: "ID copiado!", type: "success" });
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 mr-2" />
                            Copiar ID
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-white/5 my-1" />
                          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Status</div>
                          
                          <DropdownMenuItem className="hover:bg-white/5 rounded-md cursor-pointer mb-1" onClick={() => handleStatusChange(tenant.id, "ACTIVE")}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                            Marcar como Ativo
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/5 rounded-md cursor-pointer mb-1" onClick={() => handleStatusChange(tenant.id, "TRIAL")}>
                            <Clock className="w-3.5 h-3.5 mr-2 text-amber-500" />
                            Mudar para Teste
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-white/5 my-1" />
                          <DropdownMenuItem 
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-md cursor-pointer mb-1"
                            onClick={() => handleStatusChange(tenant.id, "CANCELED")}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-2" />
                            Cancelar Assinatura
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer font-bold"
                            onClick={() => handleDelete(tenant.id)}
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-2" />
                            Excluir Definitivamente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
