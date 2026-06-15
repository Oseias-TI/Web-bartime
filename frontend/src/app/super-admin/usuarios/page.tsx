"use client";

import { useEffect, useState } from "react";
import { superAdminService } from "@/services/super-admin.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Search, Users, ShieldAlert, CheckCircle2, Clock, XCircle, Shield, Store, User, Lock, Unlock, KeyRound, Mail } from "lucide-react";
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

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  tenant: { id: string; name: string } | null;
};

export default function SuperAdminUsuariosPage() {
  const [data, setData] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = async (search = "") => {
    setIsLoading(true);
    try {
      const result = await superAdminService.listUsers({ search });
      setData(result.data);
    } catch (error) {
      toastManager.add({ title: "Erro ao carregar usuários", type: "error" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers(searchTerm);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean, role: string) => {
    if (role === 'SUPER_ADMIN') {
      toastManager.add({ title: "Não é possível bloquear um Super Admin", type: "error" });
      return;
    }

    try {
      await superAdminService.updateUserStatus(userId, !currentStatus);
      toastManager.add({ title: `Acesso do usuário ${!currentStatus ? 'ativado' : 'bloqueado'} com sucesso`, type: "success" });
      loadUsers(searchTerm);
    } catch (error: any) {
      toastManager.add({ title: error.response?.data?.error || "Erro ao atualizar status", type: "error" });
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = window.prompt("Digite a nova senha para o usuário (mínimo 6 caracteres):");
    if (newPassword === null) return; // cancelou
    if (newPassword.length < 6) {
      toastManager.add({ title: "A senha deve ter no mínimo 6 caracteres.", type: "error" });
      return;
    }

    try {
      await superAdminService.updateUserPassword(userId, newPassword);
      toastManager.add({ title: "Senha alterada com sucesso!", type: "success" });
    } catch (error: any) {
      toastManager.add({ title: error.response?.data?.error || "Erro ao alterar senha", type: "error" });
    }
  };

  const handleUpdateEmail = async (userId: string) => {
    const newEmail = window.prompt("Digite o novo e-mail para o usuário:");
    if (newEmail === null) return; // cancelou
    if (!newEmail || !newEmail.includes('@')) {
      toastManager.add({ title: "Digite um e-mail válido.", type: "error" });
      return;
    }

    try {
      await superAdminService.updateUserEmail(userId, newEmail);
      toastManager.add({ title: "E-mail alterado com sucesso!", type: "success" });
      loadUsers(searchTerm);
    } catch (error: any) {
      toastManager.add({ title: error.response?.data?.error || "Erro ao alterar e-mail", type: "error" });
    }
  };

  const RoleBadge = ({ role }: { role: string }) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-inset ring-fuchsia-500/20">
            <Shield className="w-3 h-3" />
            Super Admin
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
            <Store className="w-3 h-3" />
            Dono / Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20">
            <User className="w-3 h-3" />
            Profissional
          </span>
        );
    }
  };

  const StatusBadge = ({ active }: { active: boolean }) => {
    if (active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Acesso Liberado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20">
        <XCircle className="w-3.5 h-3.5" />
        Acesso Bloqueado
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header & Command Bar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Usuários</h1>
          <p className="text-zinc-400 text-sm mt-2">Visão global e controle de acesso de todos os profissionais e donos da rede.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Command K Vibe Search */}
          <div className="relative w-full sm:w-[320px] group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar (Nome, Email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-white/10 text-white placeholder:text-zinc-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Ghost Table */}
      <div className="w-full relative z-10">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 w-[35%]">Usuário</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 hidden md:table-cell">Permissão</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 hidden lg:table-cell">Barbearia</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">Status</th>
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
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Nenhum usuário localizado.
                  </td>
                </tr>
              ) : (
                data.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="py-4 px-4 align-top sm:align-middle">
                      <div className="flex items-center gap-4">
                        {/* Virtual Avatar */}
                        <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(user.name)} flex items-center justify-center text-white font-medium text-sm shadow-sm ring-1 ring-white/10`}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-100 group-hover:text-white transition-colors">{user.name}</div>
                          <div className="text-xs text-zinc-500 mt-0.5 font-mono tracking-tight">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 align-middle hidden md:table-cell">
                      <RoleBadge role={user.role} />
                    </td>
                    
                    <td className="py-4 px-4 align-middle hidden lg:table-cell">
                      {user.tenant ? (
                        <div className="flex items-center text-sm text-zinc-300">
                          <Store className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                          {user.tenant.name}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm italic">Sistema Principal</span>
                      )}
                    </td>
                    
                    <td className="py-4 px-4 align-middle">
                      <StatusBadge active={user.active} />
                    </td>
                    
                    <td className="py-4 px-4 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-300 rounded-xl shadow-2xl p-1">
                          
                          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Ações de Segurança</div>
                          
                          {user.role !== 'SUPER_ADMIN' && (
                            <>
                              <DropdownMenuItem 
                                className={`rounded-md cursor-pointer mb-1 text-zinc-300 hover:text-white hover:bg-white/10`}
                                onClick={() => handleUpdateEmail(user.id)}
                              >
                                <Mail className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                                Alterar E-mail
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                className={`rounded-md cursor-pointer mb-1 text-zinc-300 hover:text-white hover:bg-white/10`}
                                onClick={() => handleResetPassword(user.id)}
                              >
                                <KeyRound className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                                Alterar Senha
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                className={`rounded-md cursor-pointer mb-1 ${user.active ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}
                                onClick={() => handleToggleStatus(user.id, user.active, user.role)}
                              >
                                {user.active ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5 mr-2" />
                                    Bloquear Acesso
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 mr-2" />
                                    Desbloquear Acesso
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
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
