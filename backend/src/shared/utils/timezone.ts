/**
 * Utilitário de timezone para o Bartime.
 *
 * O sistema todo opera na convenção "hora local = UTC":
 *   - Os horários de funcionamento (businessHours) são salvos como strings "09:00", "18:00"
 *   - Os slots do AvailabilityService são gerados como UTC (toISOString().slice(11,16))
 *   - O frontend envia startTime com sufixo Z usando a hora local (ex: "T14:00:00.000Z")
 *
 * Isso funciona perfeitamente EXCETO quando comparamos com Date.now() ou new Date(),
 * que retornam o UTC real (3h à frente no Brasil). Esta função retorna o timestamp
 * "agora" na mesma convenção local-as-UTC que o resto do sistema usa, usando formatação 
 * de data do Intl para evitar bugs com o fuso do servidor em produção.
 */

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
});

/**
 * Retorna o timestamp "agora" na convenção local-as-UTC do sistema.
 * Ex: Se são 21:30 local (00:30 UTC), retorna o timestamp de 21:30 UTC.
 */
export function localNowAsUTC(): number {
    const parts = dateTimeFormatter.formatToParts(new Date());
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    
    const hour = map.hour === '24' ? '00' : map.hour;
    const isoString = `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}.000Z`;
    return new Date(isoString).getTime();
}

/**
 * Retorna a data atual local no formato "YYYY-MM-DD".
 */
export function localDateString(): string {
    const parts = dateTimeFormatter.formatToParts(new Date());
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    
    return `${map.year}-${map.month}-${map.day}`;
}
