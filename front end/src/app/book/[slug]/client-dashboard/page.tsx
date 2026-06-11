"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, clientApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Scissors, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  service: { name: string; price: number; durationMin: number };
  professional: { name: string };
}

export default function ClientDashboardPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(`@Bartime:clientToken_${slug}`);
    const info = localStorage.getItem(`@Bartime:clientInfo_${slug}`);

    if (!token || !info) {
      router.push(`/book/${slug}/client-login`);
      return;
    }

    setClientInfo(JSON.parse(info));

    async function loadAppointments() {
      try {
        const [data, tenantData] = await Promise.all([
          clientApi.get<Appointment[]>(`/public/tenant/${slug}/client/appointments`),
          api.get(`/public/tenant/${slug}`)
        ]);
        setAppointments(data);
        setTenant(tenantData);
      } catch (err) {
        console.log(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, [slug, router]);

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

  const upcoming = appointments.filter(a => new Date(a.startTime) >= new Date() && a.status !== 'CANCELED' && a.status !== 'COMPLETED');
  const past = appointments.filter(a => new Date(a.startTime) < new Date() || a.status === 'CANCELED' || a.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md bg-white dark:bg-zinc-900 border-b p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-start w-full mb-4">
          {tenant && (
            <div className="flex items-center gap-3">
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-10 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
              )}
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{tenant.name}</h2>
            </div>
          )}
          <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center w-full mt-2">
          <div>
            <h1 className="text-xl font-bold">Olá, {clientInfo.name.split(' ')[0]}!</h1>
            <p className="text-sm text-zinc-500">{clientInfo.email}</p>
          </div>
        </div>
        
        <Button 
          className="w-full mt-6 h-12 rounded-xl font-medium shadow-md"
          onClick={() => router.push(`/book/${slug}`)}
        >
          <CalendarIcon className="w-4 h-4 mr-2" /> Novo Agendamento
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 p-4 pb-10 space-y-8">
        
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
                      <CalendarIcon className="w-4 h-4" /> {format(new Date(app.startTime.replace('Z', '')), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
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
                    <p className="text-xs text-zinc-500">{format(new Date(app.startTime.replace('Z', '')), "dd/MM/yyyy", { locale: ptBR })} com {app.professional.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {app.status === 'CANCELED' ? 'Cancelado' : 'Concluído'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
