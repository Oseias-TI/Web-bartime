"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ShieldAlert,
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  UserPlus,
  UserX,
  CalendarPlus,
  CalendarX,
  DollarSign,
  Settings,
  Scissors,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { auditService, type AuditLog } from "@/services/audit.service";
import { useAuth } from "@/contexts/AuthContext";

const actionConfig: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  CLIENT_CREATED: { label: "Cliente Criado", icon: UserPlus, color: "text-emerald-500 bg-emerald-500/10" },
  CLIENT_UPDATED: { label: "Cliente Atualizado", icon: Settings, color: "text-blue-500 bg-blue-500/10" },
  PROFESSIONAL_CREATED: { label: "Profissional Criado", icon: UserPlus, color: "text-emerald-500 bg-emerald-500/10" },
  PROFESSIONAL_UPDATED: { label: "Profissional Atualizado", icon: Settings, color: "text-blue-500 bg-blue-500/10" },
  PROFESSIONAL_DEACTIVATED: { label: "Profissional Desativado", icon: UserX, color: "text-red-500 bg-red-500/10" },
  APPOINTMENT_CREATED: { label: "Agendamento Criado", icon: CalendarPlus, color: "text-emerald-500 bg-emerald-500/10" },
  APPOINTMENT_COMPLETED: { label: "Agendamento Concluído", icon: Activity, color: "text-amber-500 bg-amber-500/10" },
  APPOINTMENT_CANCELED: { label: "Agendamento Cancelado", icon: CalendarX, color: "text-red-500 bg-red-500/10" },
  SERVICE_CREATED: { label: "Serviço Criado", icon: Scissors, color: "text-emerald-500 bg-emerald-500/10" },
  SERVICE_UPDATED: { label: "Serviço Atualizado", icon: Settings, color: "text-blue-500 bg-blue-500/10" },
  SERVICE_DEACTIVATED: { label: "Serviço Desativado", icon: UserX, color: "text-red-500 bg-red-500/10" },
  TRANSACTION_CREATED: { label: "Transação Criada", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
  TRANSACTION_UPDATED: { label: "Transação Atualizada", icon: Settings, color: "text-blue-500 bg-blue-500/10" },
  TRANSACTION_DELETED: { label: "Transação Excluída", icon: UserX, color: "text-red-500 bg-red-500/10" },
  PAYOUT_EXECUTED: { label: "Pagamento Executado", icon: DollarSign, color: "text-amber-500 bg-amber-500/10" },
  BUSINESS_HOURS_UPDATED: { label: "Horários Atualizados", icon: Clock, color: "text-blue-500 bg-blue-500/10" },
  POINTS_REDEEMED: { label: "Pontos Resgatados", icon: Activity, color: "text-purple-500 bg-purple-500/10" },
};

const defaultAction = { label: "Ação", icon: Activity, color: "text-stone-400 bg-stone-500/10" };

export default function AuditoriaPage() {
  const { professional } = useAuth();
  const isAdmin = professional?.role === "ADMIN";
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterAction) params.action = filterAction;
      const data = await auditService.list(params);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterAction]);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [loadLogs, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
          <ShieldAlert className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-sm">
          Apenas administradores podem visualizar os logs de auditoria do sistema.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      (log.entityId && log.entityId.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / perPage);
  const paginatedLogs = filteredLogs.slice((page - 1) * perPage, page * perPage);

  const actionTypes = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground">
          Registro de todas as ações realizadas no sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação, entidade..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={filterAction}
          onValueChange={(v) => {
            setFilterAction(v || "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <Filter className="size-4 mr-2" />
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="">Todas as ações</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                {actionConfig[action]?.label || action}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Total de registros</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CalendarPlus className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {logs.filter((l) => l.action.includes("CREATED")).length}
              </p>
              <p className="text-xs text-muted-foreground">Criações</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <CalendarX className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {logs.filter((l) =>
                  l.action.includes("CANCELED") ||
                  l.action.includes("DELETED") ||
                  l.action.includes("DEACTIVATED")
                ).length}
              </p>
              <p className="text-xs text-muted-foreground">Cancelamentos / Exclusões</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registros</CardTitle>
          <CardDescription>
            {filteredLogs.length} {filteredLogs.length === 1 ? "registro encontrado" : "registros encontrados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShieldAlert className="size-12 opacity-40 mb-4" />
              <p className="text-lg font-medium">Nenhum registro encontrado</p>
              <p className="text-sm">Os logs de auditoria aparecerão aqui conforme as ações são realizadas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedLogs.map((log) => {
                const config = actionConfig[log.action] || defaultAction;
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{config.label}</p>
                        <Badge variant="secondary" className="text-xs">
                          {log.entity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.entityId && (
                          <span className="font-mono mr-2">
                            ID: {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                        {log.ipAddress && (
                          <span className="mr-2">IP: {log.ipAddress}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
