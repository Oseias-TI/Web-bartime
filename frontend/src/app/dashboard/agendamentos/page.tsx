"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogClose, DialogTrigger, DialogHeader, DialogPanel, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { appointmentsService, type Appointment, type CreateAppointmentData, type TimeSlot } from "@/services/appointments.service";
import { clientsService, type Client } from "@/services/clients.service";
import { servicesService, type Service } from "@/services/services.service";
import { professionalsService } from "@/services/professionals.service";
import type { Professional } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/api";

export default function AgendamentosPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterProfessional, setFilterProfessional] = useState("");
  const [searchClient, setSearchClient] = useState("");

  const [formClientId, setFormClientId] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formProfessionalId, setFormProfessionalId] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      const data = await appointmentsService.listByDay(
        selectedDate,
        filterProfessional || undefined
      );
      setAppointments(data);
    } catch {
      setAppointments([]);
    }
  }, [selectedDate, filterProfessional]);

  const loadFormData = useCallback(async () => {
    try {
      const [c, s, p] = await Promise.all([
        clientsService.list(),
        servicesService.list(),
        professionalsService.list(),
      ]);
      setClients(c);
      setServices(s.filter((s) => s.active));
      setProfessionals(p.filter((p) => p.active));
    } catch {
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadAppointments(), loadFormData()]);
      setIsLoading(false);
    };
    init();
  }, [loadAppointments, loadFormData]);

  useEffect(() => {
    if (formProfessionalId && formServiceId && selectedDate) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        try {
          const slots = await appointmentsService.getAvailability(
            selectedDate,
            formProfessionalId,
            formServiceId
          );
          setAvailableSlots(slots);
        } catch {
          setAvailableSlots([]);
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [formProfessionalId, formServiceId, selectedDate]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  const handleCreate = async () => {
    if (!formClientId || !formServiceId || !formProfessionalId || !formStartTime) {
      toastManager.add({ title: "Preencha todos os campos", type: "warning" });
      return;
    }
    setIsCreating(true);
    try {
      const data: CreateAppointmentData = {
        clientId: formClientId,
        serviceId: formServiceId,
        professionalId: formProfessionalId,
        startTime: `${selectedDate}T${formStartTime}:00.000Z`,
      };
      await appointmentsService.create(data);
      toastManager.add({ title: "Agendamento criado!", type: "success" });
      setIsModalOpen(false);
      resetForm();
      loadAppointments();
    } catch (error) {
      toastManager.add({
        title: "Erro ao criar agendamento",
        description: (error as ApiError).message,
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");

  const openCompleteModal = (id: string) => {
    setCompletingId(id);
    setPaymentMethod("PIX");
    setIsCompleteModalOpen(true);
  };

  const handleComplete = async () => {
    if (!completingId || !paymentMethod) return;
    try {
      await appointmentsService.complete(completingId, paymentMethod);
      toastManager.add({ title: "Agendamento concluído!", type: "success" });
      setIsCompleteModalOpen(false);
      setCompletingId(null);
      loadAppointments();
    } catch (error) {
      toastManager.add({
        title: "Erro",
        description: (error as ApiError).message,
        type: "error",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointmentsService.cancel(id);
      toastManager.add({ title: "Agendamento cancelado", type: "info" });
      loadAppointments();
    } catch (error) {
      toastManager.add({
        title: "Erro",
        description: (error as ApiError).message,
        type: "error",
      });
    }
  };

  const resetForm = () => {
    setFormClientId("");
    setFormServiceId("");
    setFormProfessionalId("");
    setFormStartTime("");
    setAvailableSlots([]);
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchClient.toLowerCase())
  );

  const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" }> = {
    PENDING: { label: "Pendente", icon: Clock, variant: "secondary" },
    COMPLETED: { label: "Concluído", icon: CheckCircle2, variant: "default" },
    CANCELED: { label: "Cancelado", icon: XCircle, variant: "destructive" },
    SCHEDULED: { label: "Agendado", icon: Clock, variant: "secondary" },
  };

  const freeSlots = availableSlots.filter((s) => s.available);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os horários da sua barbearia
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger
            render={
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold border-amber-400/20">
                <Plus className="size-4" />
                Novo Agendamento
              </Button>
            }
          />
          <DialogPopup className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Agende um horário para o cliente
              </DialogDescription>
            </DialogHeader>
            <DialogPanel className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Input
                  placeholder="Buscar cliente..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="mb-2"
                />
                <Select value={formClientId} onValueChange={(v) => setFormClientId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectPopup>
                    {filteredClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

<div className="space-y-2">
                <label className="text-sm font-medium">Serviço</label>
                <Select value={formServiceId} onValueChange={(v) => setFormServiceId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectPopup>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — R$ {Number(s.price).toFixed(2)} ({s.durationMin}min)
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

<div className="space-y-2">
                <label className="text-sm font-medium">Profissional</label>
                <Select value={formProfessionalId} onValueChange={(v) => setFormProfessionalId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectPopup>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

<div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>

                {formProfessionalId && formServiceId ? (
                  isLoadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-5 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">Buscando horários...</span>
                    </div>
                  ) : freeSlots.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {freeSlots.length} horários disponíveis para {format(new Date(selectedDate + "T12:00:00"), "dd/MM")}
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setFormStartTime(slot.startTime)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                              formStartTime === slot.startTime
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                                : slot.available
                                  ? "border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                                  : "border border-border/50 text-muted-foreground/40 line-through cursor-not-allowed"
                            }`}
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <p className="text-sm text-red-400 py-2">
                      Nenhum horário disponível neste dia para este profissional.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Nenhuma disponibilidade retornada. Selecione manualmente:
                      </p>
                      <Input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                      />
                    </div>
                  )
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Selecione um serviço e profissional para ver horários disponíveis
                    </p>
                  </div>
                )}
              </div>
            </DialogPanel>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline">Cancelar</Button>}
              />
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold border-amber-400/20"
              >
                {isCreating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Agendar"
                )}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </div>

<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
          <Button variant="ghost" size="icon-sm" onClick={() => changeDate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 relative overflow-hidden group">
            <CalendarDays className="size-4 text-primary" />
            <span className="text-sm font-medium min-w-[180px] text-center group-hover:text-primary transition-colors">
              {format(new Date(selectedDate + "T12:00:00"), "EEEE, dd/MM/yyyy", {
                locale: ptBR,
              })}
            </span>
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={selectedDate}
              onClick={(e) => {
                try {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    e.currentTarget.showPicker();
                  }
                } catch (err) {}
              }}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
            />
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => changeDate(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Select value={filterProfessional} onValueChange={(v) => setFilterProfessional(v || "")}>
          <SelectTrigger className="w-[200px]">
            <Filter className="size-4 mr-2" />
            <SelectValue placeholder="Todos profissionais" />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="">Todos</SelectItem>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

{isLoading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="h-16 animate-pulse bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              Nenhum agendamento neste dia
            </p>
            <p className="text-muted-foreground text-sm">
              Clique em &quot;Novo Agendamento&quot; para criar um
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {appointments
            .sort(
              (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )
            .map((apt) => {
              const status = statusConfig[apt.status] || { label: apt.status, icon: Clock, variant: "secondary" };
              const StatusIcon = status.icon;

              return (
                <Card
                  key={apt.id}
                  className="bg-card border-border hover:border-primary/20 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      
                      <div className="flex items-center gap-3 min-w-[100px]">
                        <div className="text-center">
                          <p className="text-lg font-bold text-primary">
                            {apt.startTime.substring(11, 16)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.endTime.substring(11, 16)}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-border" />
                      </div>

<div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {apt.client.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.service.name} • {apt.professional.name} •{" "}
                          R$ {Number(apt.service.price).toFixed(2)}
                        </p>
                      </div>

<div className="flex items-center gap-2">
                        <Badge variant={status.variant}>
                          <StatusIcon className="size-3 mr-1" />
                          {status.label}
                        </Badge>
                        {apt.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openCompleteModal(apt.id)}
                              className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleCancel(apt.id)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

<Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir Agendamento</DialogTitle>
            <DialogDescription>
              Confirme como o cliente realizou o pagamento.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v || "PIX")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CASH">Dinheiro</SelectItem>
                  <SelectItem value="CARD_DEBIT">Cartão de Débito</SelectItem>
                  <SelectItem value="CARD_CREDIT">Cartão de Crédito</SelectItem>
                </SelectPopup>
              </Select>
            </div>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold border-emerald-400/20"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
