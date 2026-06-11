"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCog,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Scissors as ScissorsIcon,
  Headphones,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
  DialogHeader,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import {
  professionalsService,
  type CreateProfessionalData,
} from "@/services/professionals.service";
import { useAuth, type Professional } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/api";

const roleConfig = {
  ADMIN: { label: "Administrador", icon: Shield, color: "text-amber-500" },
  BARBER: { label: "Barbeiro", icon: ScissorsIcon, color: "text-blue-500" },
  RECEPTIONIST: { label: "Recepcionista", icon: Headphones, color: "text-purple-500" },
};

export default function EquipePage() {
  const { professional: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"BARBER" | "RECEPTIONIST">("BARBER");
  const [formCommission, setFormCommission] = useState("50");

  const loadProfessionals = useCallback(async () => {
    try {
      const data = await professionalsService.list();
      setProfessionals(data);
    } catch {
      setProfessionals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  const openCreate = () => {
    setEditingPro(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("BARBER");
    setFormCommission("50");
    setIsModalOpen(true);
  };

  const openEdit = (pro: Professional) => {
    setEditingPro(pro);
    setFormName(pro.name);
    setFormEmail(pro.email);
    setFormPassword("");
    setFormRole(pro.role as "BARBER" | "RECEPTIONIST");
    setFormCommission(String(pro.commissionRate));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formEmail || (!editingPro && !formPassword)) {
      toastManager.add({ title: "Preencha todos os campos obrigatórios", type: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingPro) {
        await professionalsService.update(editingPro.id, {
          name: formName,
          commissionRate: parseFloat(formCommission),
        });
        toastManager.add({ title: "Profissional atualizado!", type: "success" });
      } else {
        const data: CreateProfessionalData = {
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          commissionRate: parseFloat(formCommission),
        };
        await professionalsService.create(data);
        toastManager.add({ title: "Profissional cadastrado!", type: "success" });
      }

      setIsModalOpen(false);
      loadProfessionals();
    } catch (error) {
      toastManager.add({
        title: "Erro ao salvar",
        description: (error as ApiError).message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await professionalsService.deactivate(id);
      toastManager.add({ title: "Profissional desativado", type: "info" });
      loadProfessionals();
    } catch (error) {
      toastManager.add({
        title: "Erro",
        description: (error as ApiError).message,
        type: "error",
      });
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const activePros = professionals.filter((p) => p.active);
  const inactivePros = professionals.filter((p) => !p.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            {activePros.length} profissionais ativos
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger
              render={
                <Button
                  onClick={openCreate}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold border-amber-400/20"
                >
                  <Plus className="size-4" />
                  Novo Profissional
                </Button>
              }
            />
            <DialogPopup className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPro ? "Editar Profissional" : "Novo Profissional"}
                </DialogTitle>
                <DialogDescription>
                  {editingPro
                    ? "Atualize os dados do profissional"
                    : "Cadastre um novo membro da equipe"}
                </DialogDescription>
              </DialogHeader>
              <DialogPanel className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    placeholder="Nome completo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                {!editingPro && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Senha *</label>
                      <Input
                        type="password"
                        placeholder="Senha de acesso"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Função *</label>
                      <Select
                        value={formRole}
                        onValueChange={(v) =>
                          setFormRole(v as "BARBER" | "RECEPTIONIST" || "BARBER")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          <SelectItem value="BARBER">Barbeiro</SelectItem>
                          <SelectItem value="RECEPTIONIST">
                            Recepcionista
                          </SelectItem>
                        </SelectPopup>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Taxa de Comissão (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                  />
                </div>
              </DialogPanel>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline">Cancelar</Button>}
                />
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold border-amber-400/20"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        )}
      </div>

      {/* Professionals Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="h-32 animate-pulse bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))
          : activePros.map((pro) => {
              const role = roleConfig[pro.role as keyof typeof roleConfig];
              const RoleIcon = role.icon;

              return (
                <Card
                  key={pro.id}
                  className="bg-card border-border hover:border-primary/20 transition-all group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="size-14">
                        <AvatarImage src={pro.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                          {getInitials(pro.name)}
                        </AvatarFallback>
                      </Avatar>
                      {isAdmin && pro.id !== currentUser?.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEdit(pro)}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive-foreground hover:bg-destructive/10"
                            onClick={() => handleDeactivate(pro.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-semibold text-base">{pro.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 truncate">
                      {pro.email}
                    </p>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <RoleIcon className={`size-3 ${role.color}`} />
                        {role.label}
                      </Badge>
                      <Badge variant="secondary">
                        {Number(pro.commissionRate)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {inactivePros.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Inativos ({inactivePros.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inactivePros.map((pro) => (
              <Card
                key={pro.id}
                className="bg-card/50 border-border opacity-60"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="text-xs">
                      {getInitials(pro.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{pro.name}</p>
                    <p className="text-xs text-muted-foreground">{pro.email}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
