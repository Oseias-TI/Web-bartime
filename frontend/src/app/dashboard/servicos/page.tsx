"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Scissors,
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogHeader,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import {
  servicesService,
  type Service,
  type CreateServiceData,
} from "@/services/services.service";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/api";

export default function ServicosPage() {
  const { professional } = useAuth();
  const isAdmin = professional?.role === "ADMIN" || professional?.role === "SUPER_ADMIN";
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("");

  const loadServices = useCallback(async () => {
    try {
      const data = await servicesService.list();
      setServices(data);
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const openCreate = () => {
    setEditingService(null);
    setFormName("");
    setFormPrice("");
    setFormDuration("");
    setIsModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormName(service.name);
    setFormPrice(String(service.price));
    setFormDuration(String(service.durationMin));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPrice || !formDuration) {
      toastManager.add({ title: "Preencha todos os campos", type: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateServiceData = {
        name: formName,
        price: parseFloat(formPrice),
        durationMin: parseInt(formDuration),
      };

      if (editingService) {
        await servicesService.update(editingService.id, data);
        toastManager.add({ title: "Serviço atualizado!", type: "success" });
      } else {
        await servicesService.create(data);
        toastManager.add({ title: "Serviço criado!", type: "success" });
      }

      setIsModalOpen(false);
      loadServices();
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
      await servicesService.deactivate(id);
      toastManager.add({ title: "Serviço desativado", type: "info" });
      loadServices();
    } catch (error) {
      toastManager.add({
        title: "Erro",
        description: (error as ApiError).message,
        type: "error",
      });
    }
  };

  const activeServices = services.filter((s) => s.active);
  const inactiveServices = services.filter((s) => !s.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            {activeServices.length} serviços ativos
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
                  Novo Serviço
                </Button>
              }
            />
            <DialogPopup className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </DialogTitle>
                <DialogDescription>
                  {editingService
                    ? "Atualize as informações do serviço"
                    : "Adicione um novo serviço à sua barbearia"}
                </DialogDescription>
              </DialogHeader>
              <DialogPanel className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Serviço *</label>
                  <Input
                    placeholder="Ex: Corte Degradê"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preço (R$) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="45.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duração (min) *</label>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      placeholder="30"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                    />
                  </div>
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

      {/* Services Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))
          : activeServices.map((service) => (
              <Card
                key={service.id}
                className="bg-card border-border hover:border-primary/20 transition-all group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scissors className="size-5 text-primary" />
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(service)}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive-foreground hover:bg-destructive/10"
                          onClick={() => handleDeactivate(service.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{service.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="size-3.5 text-emerald-500" />
                      R$ {Number(service.price).toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-blue-500" />
                      {service.durationMin} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Serviços Inativos ({inactiveServices.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveServices.map((service) => (
              <Card
                key={service.id}
                className="bg-card/50 border-border opacity-60"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {Number(service.price).toFixed(2)} •{" "}
                        {service.durationMin}min
                      </p>
                    </div>
                    <Badge variant="secondary">Inativo</Badge>
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
