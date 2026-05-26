"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scissors, User, Calendar as CalendarIcon, CheckCircle2, Clock, MapPin, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

interface Professional {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export default function BookingPage() {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [tenantData, servicesData, professionalsData] = await Promise.all([
          api.get<Tenant>(`/public/tenant/${slug}`),
          api.get<Service[]>(`/public/tenant/${slug}/services`),
          api.get<Professional[]>(`/public/tenant/${slug}/professionals`),
        ]);
        setTenant(tenantData);
        setServices(servicesData);
        setProfessionals(professionalsData);
      } catch (err) {
        setError("Barbearia não encontrada ou indisponível.");
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [slug]);

  useEffect(() => {
    async function loadAvailability() {
      if (step === 3) {
        try {
          const dateStr = format(selectedDate, "yyyy-MM-dd");
          const profId = selectedProfessional ? `&professionalId=${selectedProfessional.id}` : "";
          const slots = await api.get<string[]>(`/public/tenant/${slug}/availability?date=${dateStr}${profId}`);
          setAvailableSlots(slots);
        } catch {
          setAvailableSlots([]);
        }
      }
    }
    loadAvailability();
  }, [step, selectedDate, selectedProfessional, slug]);

  const handleBook = async () => {
    if (!clientName || !clientPhone) {
      setError("Preencha todos os campos.");
      return;
    }
    setIsBooking(true);
    setError("");
    try {
      // Combina a data selecionada com o horário selecionado
      const [hours, minutes] = selectedTime!.split(":").map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      await api.post(`/public/tenant/${slug}/appointments`, {
        serviceId: selectedService!.id,
        professionalId: selectedProfessional?.id,
        clientName,
        clientPhone,
        startTime: appointmentDate.toISOString()
      });
      setStep(5); // Success step
    } catch (err: any) {
      setError(err.message || "Erro ao agendar horário. Tente novamente.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tenant || error === "Barbearia não encontrada ou indisponível.") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Ops!</h1>
          <p className="text-zinc-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Generate 7 days for the date selector
  const nextDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md bg-white dark:bg-zinc-900 border-b p-6 shadow-sm flex flex-col items-center">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-16 rounded-full object-cover shadow-md mb-3" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
        )}
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{tenant.name}</h1>
        {step < 5 && (
          <div className="w-full flex items-center justify-between mt-6">
            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-zinc-500 ml-4">Passo {step} de 4</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 p-4 pb-24">
        
        {/* STEP 1: SERVICE */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-lg font-semibold mb-4">O que você deseja fazer?</h2>
            <div className="space-y-3">
              {services.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum serviço disponível no momento.</p>
              ) : (
                services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex items-center justify-between hover:border-primary hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="text-left">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{service.name}</p>
                      <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {service.durationMin} min
                      </p>
                    </div>
                    <p className="font-semibold text-primary">R$ {Number(service.price).toFixed(2)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: PROFESSIONAL */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(1)} className="text-sm text-zinc-500 flex items-center gap-1 mb-4 hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-4">Escolha o Profissional</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setSelectedProfessional(null); setStep(3); }}
                className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-3 hover:border-primary transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-sm">Qualquer um</span>
              </button>
              {professionals.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => { setSelectedProfessional(prof); setStep(3); }}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-3 hover:border-primary transition-all active:scale-[0.98]"
                >
                  {prof.avatarUrl ? (
                    <img src={prof.avatarUrl} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="font-bold text-zinc-500">{prof.name.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-medium text-sm text-center line-clamp-1">{prof.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DATE AND TIME */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(2)} className="text-sm text-zinc-500 flex items-center gap-1 mb-4 hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-4">Quando?</h2>
            
            {/* Horizontal Date Scroller */}
            <div className="flex gap-2 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {nextDays.map(date => {
                const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                    className={cn(
                      "snap-start shrink-0 w-20 py-3 rounded-2xl flex flex-col items-center justify-center border transition-all",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-md" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <span className="text-xs uppercase font-medium opacity-80">{format(date, "EEE", { locale: ptBR })}</span>
                    <span className="text-xl font-bold mt-1">{format(date, "dd")}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="text-sm font-medium text-zinc-500 mt-2 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Horários Disponíveis
            </h3>
            
            {availableSlots.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border text-center text-zinc-500">
                <p>Nenhum horário disponível para este dia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-3 rounded-xl font-medium text-sm transition-all border",
                      selectedTime === time
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                        : "bg-white dark:bg-zinc-900 hover:border-primary active:scale-95"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}

            <Button 
              className="w-full mt-8 h-14 rounded-2xl text-lg font-medium shadow-lg"
              disabled={!selectedTime}
              onClick={() => setStep(4)}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* STEP 4: CLIENT INFO */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(3)} className="text-sm text-zinc-500 flex items-center gap-1 mb-4 hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-6">Para finalizar...</h2>
            
            {/* Resumo do agendamento */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl mb-6">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedService?.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> 
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <User className="w-4 h-4" /> 
                Com {selectedProfessional ? selectedProfessional.name : "Qualquer profissional"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Seu Nome</label>
                <Input 
                  placeholder="Como devemos te chamar?" 
                  className="mt-1 h-12 rounded-xl"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">WhatsApp</label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  type="tel"
                  className="mt-1 h-12 rounded-xl"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

            <Button 
              className="w-full mt-8 h-14 rounded-2xl text-lg font-medium shadow-lg"
              disabled={isBooking || !clientName || !clientPhone}
              onClick={handleBook}
            >
              {isBooking ? "Confirmando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        )}

        {/* STEP 5: SUCCESS */}
        {step === 5 && (
          <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center text-center pt-10">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Tudo Certo!</h2>
            <p className="text-zinc-500 mb-8">
              Seu horário para <strong>{selectedService?.name}</strong> foi confirmado com sucesso.
            </p>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border w-full text-left shadow-sm">
              <h3 className="font-semibold border-b pb-3 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Detalhes
              </h3>
              <p className="text-sm font-medium mb-1">{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p className="text-xl font-bold text-primary mb-4">{selectedTime}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {tenant.name}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Estilos Globais Auxiliares */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
