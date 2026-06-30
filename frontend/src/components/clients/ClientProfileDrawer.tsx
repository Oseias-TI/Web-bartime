"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Phone,
  Mail,
  Star,
  Gift,
  Calendar,
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toastManager } from "@/components/ui/toast";
import {
  clientsService,
  type Client,
  type ClientProfile,
  type ClientSpending,
} from "@/services/clients.service";
import type { ApiError } from "@/lib/api";

interface ClientProfileDrawerProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const statusConfig = {
  PENDING: { label: "Pendente", icon: Clock, color: "text-amber-500" },
  COMPLETED: { label: "Concluído", icon: CheckCircle2, color: "text-emerald-500" },
  CANCELED: { label: "Cancelado", icon: XCircle, color: "text-red-400" },
};

export function ClientProfileDrawer({
  client,
  open,
  onOpenChange,
  onUpdated,
}: ClientProfileDrawerProps) {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [spending, setSpending] = useState<ClientSpending | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const [profileData, spendingData] = await Promise.all([
        clientsService.getProfile(client.id),
        clientsService.getSpending(client.id),
      ]);
      setProfile(profileData);
      setSpending(spendingData);
    } catch {
      setProfile({
        ...client,
        totalAppointments: 0,
        lastVisit: null,
        appointments: [],
      });
      setSpending(null);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (open && client) {
      loadProfile();
    } else {
      setProfile(null);
      setSpending(null);
      setRedeemPoints("");
    }
  }, [open, client, loadProfile]);

  const handleRedeem = async () => {
    if (!client || !redeemPoints) return;
    const points = parseInt(redeemPoints);
    if (isNaN(points) || points <= 0) {
      toastManager.add({ title: "Informe uma quantidade válida", type: "warning" });
      return;
    }
    if (points > (profile?.loyaltyPoints || 0)) {
      toastManager.add({ title: "Pontos insuficientes", type: "warning" });
      return;
    }

    setIsRedeeming(true);
    try {
      await clientsService.redeemPoints(client.id, points);
      toastManager.add({
        title: "Pontos resgatados!",
        description: `${points} pontos foram resgatados com sucesso.`,
        type: "success",
      });
      setRedeemPoints("");
      loadProfile();
      onUpdated?.();
    } catch (error) {
      toastManager.add({
        title: "Erro ao resgatar",
        description: (error as ApiError).message,
        type: "error",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const chartData =
    spending?.monthlySpending?.map((m) => ({
      month: m.month,
      total: m.total,
    })) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="w-full max-w-lg">
        <SheetHeader>
          <SheetTitle>Perfil do Cliente</SheetTitle>
          <SheetDescription>
            Detalhes, histórico e fidelidade
          </SheetDescription>
        </SheetHeader>

        <SheetPanel>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : profile ? (
            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="size-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold truncate">
                    {profile.name}
                  </h3>
                  <div className="space-y-1 mt-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {profile.phone}
                    </p>
                    {profile.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="size-3.5" />
                        {profile.email}
                      </p>
                    )}
                  </div>
                  {profile.preferences && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
                      Preferências: {profile.preferences}
                    </p>
                  )}
                </div>
              </div>

<div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xl font-bold text-primary">
                    {profile.totalAppointments}
                  </p>
                  <p className="text-xs text-muted-foreground">Visitas</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xl font-bold text-emerald-500">
                    R${" "}
                    {(spending?.totalSpent || 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xl font-bold text-blue-500">
                    R${" "}
                    {(spending?.averageTicket || 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
              </div>

              <Separator />

<div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Star className="size-4 text-amber-500" />
                  Programa de Fidelidade
                </h4>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-amber-500">
                        {profile.loyaltyPoints}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        pontos acumulados
                      </p>
                    </div>
                    <Gift className="size-8 text-amber-500/30" />
                  </div>
                  {profile.loyaltyPoints > 0 && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        max={profile.loyaltyPoints}
                        placeholder="Qtd. pontos"
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleRedeem}
                        disabled={isRedeeming || !redeemPoints}
                        className="h-9 bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium shrink-0"
                      >
                        {isRedeeming ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <>
                            <Gift className="size-3.5 mr-1" />
                            Resgatar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

{chartData.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <TrendingUp className="size-4 text-emerald-500" />
                    Gastos Mensais
                  </h4>
                  <div className="rounded-lg border border-border p-3">
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorTotal"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="month"
                          stroke="#a8a29e"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#a8a29e"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `R$${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1c1917",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: any) => [
                            `R$ ${Number(value).toLocaleString("pt-BR")}`,
                            "Total",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorTotal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <Separator />

<div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Calendar className="size-4 text-blue-500" />
                  Histórico de Agendamentos
                </h4>
                {profile.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum agendamento registrado.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {profile.appointments.map((apt) => {
                      const status =
                        statusConfig[apt.status as keyof typeof statusConfig];
                      const StatusIcon = status?.icon || Clock;

                      return (
                        <div
                          key={apt.id}
                          className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-center min-w-[50px]">
                            <p className="text-xs font-medium">
                              {format(
                                new Date(apt.startTime),
                                "dd/MM",
                                { locale: ptBR }
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(apt.startTime), "HH:mm")}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {apt.service.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {apt.professional.name} • R${" "}
                              {Number(apt.service.price).toFixed(2)}
                            </p>
                          </div>
                          <StatusIcon
                            className={`size-4 shrink-0 ${status?.color || "text-muted-foreground"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

{profile.lastVisit && (
                <p className="text-xs text-muted-foreground text-center">
                  Última visita:{" "}
                  {format(new Date(profile.lastVisit), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          ) : null}
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
}
