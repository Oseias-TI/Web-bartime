"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scissors, User, Calendar as CalendarIcon, CheckCircle2, Clock, MapPin, ChevronLeft, LogOut } from "lucide-react";
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

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  service: { name: string; price: number; durationMin: number };
  professional: { name: string };
}

export default function AuthenticatedClientPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  // Dashboard State
  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Booking State
  const [isBookingFlow, setIsBookingFlow] = useState(false);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAppointments = async () => {
    try {
      const data = await clientApi.get<Appointment[]>(`/public/tenant/${slug}/client/appointments`);
      setAppointments(data);
    } catch (err: any) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(`@Bartime:clientToken_${slug}`);
    const infoStr = localStorage.getItem(`@Bartime:clientInfo_${slug}`);

    if (!token || !infoStr) {
      router.push(`/book/${slug}/client-login`);
      return;
    }

    setClientInfo(JSON.parse(infoStr));

    async function loadInitialData() {
      try {
        const [tenantData, servicesData, professionalsData, appts] = await Promise.all([
          api.get<Tenant>(`/public/tenant/${slug}`),
          api.get<Service[]>(`/public/tenant/${slug}/services`),
          api.get<Professional[]>(`/public/tenant/${slug}/professionals`),
          clientApi.get<Appointment[]>(`/public/tenant/${slug}/client/appointments`),
        ]);
        setTenant(tenantData);
        setServices(servicesData);
        setProfessionals(professionalsData);
        setAppointments(appts);
      } catch (err: any) {
        console.log("ERRO AO CARREGAR:", err.message);
        setError(`Erro: ${err?.message || "Erro ao carregar dados."}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [slug, router]);

  useEffect(() => {
    async function loadAvailability() {
      if (isBookingFlow && step === 3) {
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
  }, [step, selectedDate, selectedProfessional, slug, isBookingFlow]);

  const handleBook = async () => {
    setIsSaving(true);
    setError("");
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      await clientApi.post(`/public/tenant/${slug}/appointments`, {
        serviceId: selectedService!.id,
        professionalId: selectedProfessional?.id,
        clientName: clientInfo.name,
        clientPhone: clientInfo.phone,
        clientEmail: clientInfo.email,
        startTime: `${dateStr}T${selectedTime}:00.000Z`
      });
      
      setStep(5); // Success step
      loadAppointments();
    } catch (err: any) {
      setError(err.message || "Erro ao agendar horário. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`@Bartime:clientToken_${slug}`);
    localStorage.removeItem(`@Bartime:clientInfo_${slug}`);
    router.push(`/book/${slug}/client-login`);
  };

  if (isLoading || !clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tenant || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Ops!</h1>
          <p className="text-zinc-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const upcoming = appointments.filter(a => new Date(a.startTime) >= new Date() && a.status !== 'CANCELED' && a.status !== 'COMPLETED');
  const past = appointments.filter(a => new Date(a.startTime) < new Date() || a.status === 'CANCELED' || a.status === 'COMPLETED');
  const nextDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md bg-white dark:bg-zinc-900 border-b p-6 shadow-sm flex flex-col relative">
        {!isBookingFlow ? (
          <>
            <div className="flex justify-between items-start w-full mb-4">
              <div className="flex items-center gap-3">
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-10 rounded-full object-cover shadow-sm border border-zinc-100" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                )}
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{tenant.name}</h2>
              </div>
              <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            <div>
              <h1 className="text-xl font-bold">Olá, {clientInfo.name.split(' ')[0]}!</h1>
              <p className="text-sm text-zinc-500">{clientInfo.email}</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-16 rounded-full object-cover shadow-md mb-3 border border-zinc-100" />
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
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 p-4 pb-24">
        
        {!isBookingFlow ? (
          <div className="space-y-8 animate-in fade-in">
            <Button 
              className="w-full h-14 rounded-2xl font-medium shadow-md text-lg"
              onClick={() => {
                setSelectedService(null);
                setSelectedProfessional(null);
                setSelectedTime(null);
                setStep(1);
                setIsBookingFlow(true);
              }}
            >
              <CalendarIcon className="w-5 h-5 mr-2" /> Novo Agendamento
            </Button>

            {/* Próximos Agendamentos */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Próximos Cortes</h2>
              
              {upcoming.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border text-center text-zinc-500 border-dashed">
                  <Scissors className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum agendamento futuro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(app => (
                    <div key={app.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                      <div className="flex justify-between items-start pl-2">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{app.service.name}</p>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {app.status === 'PENDING' ? 'Confirmado' : app.status}
                        </span>
                      </div>
                      <div className="pl-2 space-y-1 mt-1">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" /> {format(new Date(app.startTime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Com {app.professional.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Histórico */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Histórico</h2>
              
              {past.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center">Nenhum histórico encontrado.</p>
              ) : (
                <div className="space-y-3 opacity-70">
                  {past.map(app => (
                    <div key={app.id} className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl border flex justify-between items-center">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-300">{app.service.name}</p>
                        <p className="text-xs text-zinc-500">{format(new Date(app.startTime), "dd/MM/yyyy", { locale: ptBR })} com {app.professional.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {app.status === 'CANCELED' ? 'Cancelado' : 'Concluído'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="w-full">
            {/* STEP 1: SERVICE */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <button onClick={() => setIsBookingFlow(false)} className="text-sm text-zinc-500 flex items-center gap-1 mb-4 hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Voltar ao Painel
                </button>
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
                  
                  <div className={cn(
                    "relative snap-start shrink-0 w-24 py-3 rounded-2xl flex flex-col items-center justify-center border transition-all overflow-hidden group cursor-pointer",
                    !nextDays.some(d => format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-white dark:bg-zinc-900 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary text-zinc-500 hover:text-primary"
                  )}>
                    {!nextDays.some(d => format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")) ? (
                      <>
                        <span className="text-xs uppercase font-medium opacity-80">{format(selectedDate, "MMM", { locale: ptBR })}</span>
                        <span className="text-xl font-bold mt-1">{format(selectedDate, "dd")}</span>
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] uppercase font-bold text-center leading-tight">Outras<br/>Datas</span>
                      </>
                    )}
                    <input
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onClick={(e) => {
                        try {
                          if ('showPicker' in HTMLInputElement.prototype) {
                            e.currentTarget.showPicker();
                          }
                        } catch (err) {}
                      }}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDate(new Date(e.target.value + "T12:00:00"));
                          setSelectedTime(null);
                        }
                      }}
                    />
                  </div>
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
                    {availableSlots.map(time => {
                      const [h, m] = time.split(':').map(Number);
                      const slotTime = new Date(selectedDate);
                      slotTime.setHours(h, m, 0, 0);
                      const isPast = slotTime < new Date();

                      return (
                        <button
                          key={time}
                          disabled={isPast}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-3 rounded-xl font-medium text-sm transition-all border",
                            isPast
                              ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60 dark:bg-zinc-800/50 dark:text-zinc-600 dark:border-zinc-800"
                              : selectedTime === time
                                ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                                : "bg-white dark:bg-zinc-900 hover:border-primary active:scale-95"
                          )}
                        >
                          {time}
                        </button>
                      );
                    })}
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

            {/* STEP 4: CONFIRMATION (CLIENT INFO SKIP) */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <button onClick={() => setStep(3)} className="text-sm text-zinc-500 flex items-center gap-1 mb-4 hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <h2 className="text-lg font-semibold mb-6">Para finalizar...</h2>
                
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

                <div className="bg-white dark:bg-zinc-900 border p-4 rounded-xl">
                  <p className="text-sm text-zinc-500 mb-1">Agendando no nome de:</p>
                  <p className="font-semibold text-lg">{clientInfo.name}</p>
                  <p className="text-sm text-zinc-500">{clientInfo.email} • {clientInfo.phone}</p>
                </div>

                <Button 
                  className="w-full mt-8 h-14 rounded-2xl text-lg font-medium shadow-lg"
                  disabled={isSaving}
                  onClick={handleBook}
                >
                  {isSaving ? "Confirmando..." : "Confirmar Agendamento"}
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
                  Seu horário para <strong>{selectedService?.name}</strong> foi confirmado.
                </p>
                
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-medium shadow-sm"
                  variant="outline"
                  onClick={() => {
                    setIsBookingFlow(false);
                    setStep(1);
                  }}
                >
                  Voltar ao Painel
                </Button>
              </div>
            )}
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
