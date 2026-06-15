"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Store,
  Clock,
  CreditCard,
  Camera,
  Loader2,
  Lock,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/components/ui/toast";
import { tenantService, type Tenant, type BusinessHour } from "@/services/tenant.service";
import { billingService, type BillingStatus } from "@/services/billing.service";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/api";

const daysOfWeek = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado"
];

const profileSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  cnpj: z.string().refine((val) => val.replace(/\D/g, "").length === 14, {
    message: "CNPJ deve ter 14 números",
  }),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const defaultHours: BusinessHour[] = Array.from({ length: 7 }).map((_, i) => ({
  id: String(i),
  dayOfWeek: i,
  open: i > 0 && i < 6,
  openTime: i > 0 && i < 6 ? "09:00" : "",
  closeTime: i > 0 && i < 6 ? "18:00" : "",
}));

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Ativo", color: "bg-emerald-500/20 text-emerald-500" },
  TRIAL: { label: "Trial", color: "bg-blue-500/20 text-blue-500" },
  PAST_DUE: { label: "Pagamento Pendente", color: "bg-amber-500/20 text-amber-500" },
  CANCELED: { label: "Cancelado", color: "bg-red-500/20 text-red-500" },
  INACTIVE: { label: "Inativo", color: "bg-stone-500/20 text-stone-400" },
};

export default function ConfiguracoesPage() {
  const { tenant, updateTenant } = useAuth();
  const [activeTab, setActiveTab] = useState("perfil");
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);

  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Billing
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isBillingAction, setIsBillingAction] = useState(false);

  // Security
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { isSubmitting: isSubmittingProfile },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: tenant?.name || "",
      cnpj: tenant?.cnpj || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });



  const loadHours = useCallback(async () => {
    setIsLoadingHours(true);
    try {
      const hours = await tenantService.getBusinessHours();
      if (Array.isArray(hours) && hours.length > 0) {
        setBusinessHours(hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
      } else {
        setBusinessHours(defaultHours);
      }
    } catch {

      setBusinessHours(defaultHours);
      toastManager.add({ title: "Erro ao carregar horários, usando padrões", type: "warning" });
    } finally {
      setIsLoadingHours(false);
    }
  }, []);

  const loadBillingCb = useCallback(async () => {
    setIsLoadingBilling(true);
    try {
      const status = await billingService.getStatus();
      setBillingStatus(status);
    } catch {
      setBillingStatus({
        subscriptionStatus: tenant?.subscriptionStatus || "TRIAL",
        currentPeriodEnd: null,
        trialEndsAt: null,
        plan: null,
      });
    } finally {
      setIsLoadingBilling(false);
    }
  }, [tenant?.subscriptionStatus]);

  useEffect(() => {
    if (activeTab === "horarios" && businessHours.length === 0) {
      loadHours();
    }
    if (activeTab === "assinatura" && !billingStatus) {
      loadBillingCb();
    }
  }, [activeTab, businessHours.length, billingStatus, loadHours, loadBillingCb]);



  const onProfileSave = async (data: any) => {
    try {
      const payload = {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ""),
      };
      const updated = await tenantService.update(payload);
      updateTenant(updated);
      toastManager.add({ title: "Perfil atualizado!", type: "success" });
    } catch {
      toastManager.add({ title: "Erro ao atualizar", type: "error" });
    }
  };

  const saveHours = async () => {
    setIsSavingHours(true);
    try {
      await tenantService.updateBusinessHours(businessHours);
      toastManager.add({ title: "Horários salvos!", type: "success" });
    } catch {
      toastManager.add({ title: "Erro ao salvar horários", type: "error" });
    } finally {
      setIsSavingHours(false);
    }
  };

  const updateDay = (index: number, field: keyof BusinessHour, value: any) => {
    const newHours = [...businessHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setBusinessHours(newHours);
  };

  // ─── Logo Upload ───
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastManager.add({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB",
        type: "warning",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toastManager.add({
        title: "Formato inválido",
        description: "Envie apenas imagens (PNG, JPG, WEBP)",
        type: "warning",
      });
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const result = await tenantService.updateLogo(file);
      updateTenant({ logoUrl: result.logoUrl });
      toastManager.add({ title: "Logo atualizada!", type: "success" });
    } catch (err: any) {
      setLogoPreview(null);
      toastManager.add({ title: "Erro ao enviar logo", description: err.message || String(err), type: "error" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ─── Billing Actions ───
  const handleBillingAction = async (action: "checkout" | "portal") => {
    setIsBillingAction(true);
    try {
      const result =
        action === "checkout"
          ? await billingService.createCheckout()
          : await billingService.createPortal();
      window.location.href = result.url;
    } catch (error) {
      toastManager.add({
        title: "Erro",
        description: (error as ApiError)?.message || "Não foi possível processar",
        type: "error",
      });
    } finally {
      setIsBillingAction(false);
    }
  };

  // ─── Change Password ───
  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toastManager.add({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
        type: "success",
      });
      resetPasswordForm();
    } catch (error) {
      const apiError = error as ApiError;
      toastManager.add({
        title: "Erro ao alterar senha",
        description: apiError.message || "Verifique a senha atual",
        type: "error",
      });
    }
  };

  const displayLogoUrl = logoPreview || tenant?.logoUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as informações da sua barbearia e sua assinatura.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Menu lateral de configurações */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "perfil"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            <Store className="size-4" /> Dados da Barbearia
          </button>
          <button
            onClick={() => setActiveTab("horarios")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "horarios"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            <Clock className="size-4" /> Horários de Funcionamento
          </button>
          <button
            onClick={() => setActiveTab("assinatura")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "assinatura"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            <CreditCard className="size-4" /> Assinatura
          </button>
          <button
            onClick={() => setActiveTab("seguranca")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "seguranca"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            <Lock className="size-4" /> Segurança
          </button>
        </div>

        {/* Área de conteúdo */}
        <div className="flex-1">
          {activeTab === "perfil" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Perfil da Barbearia</CardTitle>
                <CardDescription>
                  Essas informações ficarão visíveis para seus clientes nos agendamentos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div
                      className="size-24 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="size-6 animate-spin text-primary" />
                      ) : displayLogoUrl ? (
                        <img src={displayLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="size-8 text-muted-foreground" />
                      )}
                      {!isUploadingLogo && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="size-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Logo da Barbearia</h3>
                      <p className="text-xs text-muted-foreground mb-3">Recomendado: 512x512px. Max 2MB.</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="size-3 animate-spin mr-2" />
                        ) : (
                          <Upload className="size-3 mr-2" />
                        )}
                        Trocar imagem
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Estabelecimento</label>
                      <Input {...registerProfile("name")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CNPJ</label>
                      <Input {...registerProfile("cnpj")} />
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <h3 className="text-sm font-medium mb-2">Página de Agendamento (Área do Cliente)</h3>
                    <p className="text-xs text-muted-foreground mb-3">Compartilhe este link com seus clientes para que eles possam agendar horários sozinhos.</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        readOnly 
                        value={tenant?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${tenant.slug}` : 'Gerando link...'} 
                        className="bg-muted/50 text-muted-foreground font-mono text-sm"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          const url = `${window.location.origin}/book/${tenant?.slug}`;
                          navigator.clipboard.writeText(url);
                          toastManager.add({ title: "Link copiado!", type: "success" });
                        }}
                      >
                        Copiar
                      </Button>
                      <Button 
                        type="button"
                        variant="default"
                        onClick={() => window.open(`/book/${tenant?.slug}`, "_blank")}
                        disabled={!tenant?.slug}
                      >
                        <ExternalLink className="size-4 mr-2" />
                        Abrir
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold"
                    >
                      {isSubmittingProfile ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "horarios" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <CardDescription>
                  Defina os dias e horários em que a barbearia está aberta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHours ? (
                   <div className="flex justify-center py-8"><Loader2 className="size-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-4">
                    {businessHours.map((day, index) => (
                      <div key={day.dayOfWeek} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3 w-40">
                           <Switch 
                             checked={day.open} 
                             onCheckedChange={(c) => updateDay(index, "open", c)} 
                           />
                           <span className={`text-sm font-medium ${!day.open && "text-muted-foreground"}`}>
                             {daysOfWeek[day.dayOfWeek]}
                           </span>
                        </div>
                        
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={day.openTime || ""}
                              onChange={(e) => updateDay(index, "openTime", e.target.value)}
                              disabled={!day.open}
                              className="w-24 h-9"
                            />
                            <span className="text-muted-foreground text-sm">até</span>
                            <Input
                              type="time"
                              value={day.closeTime || ""}
                              onChange={(e) => updateDay(index, "closeTime", e.target.value)}
                              disabled={!day.open}
                              className="w-24 h-9"
                            />
                            {day.open && !day.openTime2 && !day.closeTime2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setBusinessHours(prev => {
                                    const newHours = [...prev];
                                    newHours[index] = {
                                      ...newHours[index],
                                      openTime2: "13:00",
                                      closeTime2: "18:00",
                                      ...(day.closeTime === "18:00" ? { closeTime: "12:00" } : {}),
                                    };
                                    return newHours;
                                  });
                                }}
                                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                title="Adicionar turno"
                              >
                                <Plus className="size-4" />
                              </Button>
                            )}
                          </div>

                          {day.open && (day.openTime2 || day.closeTime2) && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={day.openTime2 || ""}
                                onChange={(e) => updateDay(index, "openTime2", e.target.value)}
                                disabled={!day.open}
                                className="w-24 h-9"
                              />
                              <span className="text-muted-foreground text-sm">até</span>
                              <Input
                                type="time"
                                value={day.closeTime2 || ""}
                                onChange={(e) => updateDay(index, "closeTime2", e.target.value)}
                                disabled={!day.open}
                                className="w-24 h-9"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newHours = [...businessHours];
                                  newHours[index] = { ...newHours[index], openTime2: null, closeTime2: null };
                                  setBusinessHours(newHours);
                                }}
                                className="h-9 px-2 text-destructive hover:bg-destructive/10"
                                title="Remover turno"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={saveHours}
                        disabled={isSavingHours}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold"
                      >
                        {isSavingHours ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                        Salvar Horários
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "assinatura" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Plano e Assinatura</CardTitle>
                <CardDescription>
                  Gerencie seu plano e método de pagamento (Stripe).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBilling ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : billingStatus ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {billingStatus.plan || "Plano Profissional"}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                statusLabels[billingStatus.subscriptionStatus]?.color ||
                                statusLabels.INACTIVE.color
                              }`}
                            >
                              {statusLabels[billingStatus.subscriptionStatus]?.label ||
                                billingStatus.subscriptionStatus}
                            </span>
                          </div>
                          {billingStatus.currentPeriodEnd && (
                            <p className="text-sm text-muted-foreground">
                              Próxima cobrança:{" "}
                              {new Date(billingStatus.currentPeriodEnd).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          {billingStatus.trialEndsAt && billingStatus.subscriptionStatus === "TRIAL" && (
                            <p className="text-sm text-muted-foreground">
                              Trial expira em:{" "}
                              {new Date(billingStatus.trialEndsAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {billingStatus.subscriptionStatus === "ACTIVE" ||
                          billingStatus.subscriptionStatus === "PAST_DUE" ? (
                            <Button
                              variant="outline"
                              onClick={() => handleBillingAction("portal")}
                              disabled={isBillingAction}
                              className="w-full sm:w-auto border-border"
                            >
                              {isBillingAction ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                              ) : (
                                <ExternalLink className="size-4 mr-2" />
                              )}
                              Gerenciar Assinatura
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleBillingAction("checkout")}
                              disabled={isBillingAction}
                              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold"
                            >
                              {isBillingAction ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                              ) : (
                                <CreditCard className="size-4 mr-2" />
                              )}
                              Assinar Plano
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {billingStatus.subscriptionStatus === "TRIAL" && (
                      <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                        <AlertCircle className="size-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-400">
                            Período de teste
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Você está no período gratuito. Assine um plano antes do término
                            para não perder acesso às funcionalidades.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {activeTab === "seguranca" && (
             <Card className="bg-card border-border">
               <CardHeader>
                 <CardTitle>Segurança</CardTitle>
                 <CardDescription>Alterar sua senha de acesso.</CardDescription>
               </CardHeader>
               <CardContent>
                 <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Senha Atual</label>
                     <div className="relative">
                       <Input
                         type={showCurrentPassword ? "text" : "password"}
                         placeholder="••••••••"
                         className="pr-11"
                         {...registerPassword("currentPassword")}
                       />
                       <button
                         type="button"
                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                       >
                         {showCurrentPassword ? (
                           <EyeOff className="size-4" />
                         ) : (
                           <Eye className="size-4" />
                         )}
                       </button>
                     </div>
                     {passwordErrors.currentPassword && (
                       <p className="text-xs text-red-400">
                         {passwordErrors.currentPassword.message}
                       </p>
                     )}
                   </div>

                   <div className="space-y-2">
                     <label className="text-sm font-medium">Nova Senha</label>
                     <div className="relative">
                       <Input
                         type={showNewPassword ? "text" : "password"}
                         placeholder="••••••••"
                         className="pr-11"
                         {...registerPassword("newPassword")}
                       />
                       <button
                         type="button"
                         onClick={() => setShowNewPassword(!showNewPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                       >
                         {showNewPassword ? (
                           <EyeOff className="size-4" />
                         ) : (
                           <Eye className="size-4" />
                         )}
                       </button>
                     </div>
                     {passwordErrors.newPassword && (
                       <p className="text-xs text-red-400">
                         {passwordErrors.newPassword.message}
                       </p>
                     )}
                   </div>

                   <div className="space-y-2">
                     <label className="text-sm font-medium">Confirmar Nova Senha</label>
                     <Input
                       type="password"
                       placeholder="••••••••"
                       {...registerPassword("confirmPassword")}
                     />
                     {passwordErrors.confirmPassword && (
                       <p className="text-xs text-red-400">
                         {passwordErrors.confirmPassword.message}
                       </p>
                     )}
                   </div>

                   <div className="pt-2">
                     <Button
                       type="submit"
                       disabled={isSubmittingPassword}
                       className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold"
                     >
                       {isSubmittingPassword ? (
                         <Loader2 className="size-4 animate-spin mr-2" />
                       ) : (
                         <CheckCircle2 className="size-4 mr-2" />
                       )}
                       Atualizar Senha
                     </Button>
                   </div>
                 </form>
               </CardContent>
             </Card>
          )}
        </div>
      </div>
    </div>
  );
}
