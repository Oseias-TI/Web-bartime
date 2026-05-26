"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Wallet,
  Clock,
  Filter,
  Loader2,
  Users,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toastManager } from "@/components/ui/toast";
import {
  financialService,
  type Transaction,
  type FinancialSummary,
  type CashFlow,
} from "@/services/financial.service";
import { professionalsService } from "@/services/professionals.service";
import type { Professional } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function FinanceiroPage() {
  const { professional } = useAuth();
  const isAdmin = professional?.role === "ADMIN";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));

  // Commission payout
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false);
  const [payingOutId, setPayingOutId] = useState<string | null>(null);

  // Form
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [trans, sum, flow] = await Promise.all([
        financialService.listTransactions({ month: monthFilter }),
        financialService.getSummary({ month: monthFilter }),
        financialService.getCashFlow({ month: monthFilter }),
      ]);
      setTransactions(trans);
      setSummary(sum);
      setCashFlow(flow);
    } catch {
      // Handle error or use empty state
    } finally {
      setIsLoading(false);
    }
  }, [monthFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadProfessionals = async () => {
    setIsLoadingProfessionals(true);
    try {
      const data = await professionalsService.list();
      setProfessionals(data.filter((p) => p.active));
    } catch {
      setProfessionals([]);
    } finally {
      setIsLoadingProfessionals(false);
    }
  };

  const handleOpenPayoutModal = () => {
    setIsPayoutModalOpen(true);
    if (professionals.length === 0) {
      loadProfessionals();
    }
  };

  const handlePayout = async (professionalId: string) => {
    setPayingOutId(professionalId);
    try {
      await financialService.payout(professionalId);
      toastManager.add({
        title: "Comissão paga!",
        description: "O pagamento foi registrado com sucesso.",
        type: "success",
      });
      loadData(); // Refresh summary
    } catch (error) {
      toastManager.add({
        title: "Erro ao pagar comissão",
        description: (error as ApiError)?.message || "Tente novamente",
        type: "error",
      });
    } finally {
      setPayingOutId(null);
    }
  };

  const handleSave = async () => {
    if (!formCategory || !formAmount) {
      toastManager.add({ title: "Categoria e valor são obrigatórios", type: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      await financialService.createTransaction({
        type: formType,
        category: formCategory,
        amount: parseFloat(formAmount),
        description: formDescription || undefined,
      });

      toastManager.add({ title: "Transação registrada!", type: "success" });
      setIsModalOpen(false);
      
      // Reset form
      setFormType("INCOME");
      setFormCategory("");
      setFormAmount("");
      setFormDescription("");
      
      loadData();
    } catch (error) {
      toastManager.add({
        title: "Erro",
        description: (error as ApiError).message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = cashFlow.map((item) => ({
    dia: format(new Date(item.date), "dd/MM"),
    entradas: item.income,
    saidas: item.expense,
  }));

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="size-16 bg-muted rounded-full flex items-center justify-center">
          <Wallet className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-sm">
          Você não tem permissão para acessar o módulo financeiro. Contate o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gestão de receitas, despesas e fluxo de caixa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40"
          />
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger
              render={
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold border-amber-400/20">
                  <Plus className="size-4 mr-2" />
                  Nova Lançamento
                </Button>
              }
            />
            <DialogPopup className="sm:max-w-md">
              <DialogTitle>Novo Lançamento Manual</DialogTitle>
              <DialogDescription>
                Registre uma entrada ou saída no caixa
              </DialogDescription>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={formType}
                    onValueChange={(v) => setFormType(v as "INCOME" | "EXPENSE" || "INCOME")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="INCOME">Entrada (Receita)</SelectItem>
                      <SelectItem value="EXPENSE">Saída (Despesa)</SelectItem>
                    </SelectPopup>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria *</label>
                  <Input
                    placeholder="Ex: Pagamento Fornecedor, Venda Produto"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor (R$) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    placeholder="Detalhes opcionais..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <DialogClose
                    render={<Button variant="outline">Cancelar</Button>}
                  />
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold border-amber-400/20"
                  >
                    Registrar
                  </Button>
                </div>
              </div>
            </DialogPopup>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total de Entradas</p>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">
              R$ {(summary?.totalIncome || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total de Saídas</p>
              <TrendingDown className="size-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold">
              R$ {(summary?.totalExpense || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-primary">Lucro Líquido</p>
              <DollarSign className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              R$ {(summary?.netProfit || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-purple-500/20 transition-colors cursor-pointer group" onClick={handleOpenPayoutModal}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Comissões a Pagar</p>
              <Banknote className="size-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">
              R$ {(summary?.pendingCommissions || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-3">
              <span className="text-xs text-purple-400 group-hover:text-purple-300 transition-colors flex items-center gap-1">
                <Users className="size-3" />
                Clique para gerenciar pagamentos
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="dia" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: "#1c1917", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {t.type === 'INCOME' ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.category}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <div className={`font-medium ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma transação neste período.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Commission Payout Modal ─── */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogPopup className="sm:max-w-lg">
          <DialogTitle>Comissões Pendentes</DialogTitle>
          <DialogDescription>
            Pague as comissões pendentes dos profissionais
          </DialogDescription>
          <div className="mt-4">
            {isLoadingProfessionals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : professionals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum profissional ativo encontrado.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 mb-4">
                  <p className="text-sm text-purple-400 flex items-center gap-2">
                    <Banknote className="size-4" />
                    Total pendente: R${" "}
                    {(summary?.pendingCommissions || 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {professionals.map((pro) => (
                  <div
                    key={pro.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={pro.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                        {getInitials(pro.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pro.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Comissão: {Number(pro.commissionRate)}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePayout(pro.id)}
                      disabled={payingOutId === pro.id}
                      className="shrink-0 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                    >
                      {payingOutId === pro.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <DollarSign className="size-3.5 mr-1" />
                          Pagar
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-border">
              <DialogClose
                render={<Button variant="outline">Fechar</Button>}
              />
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
