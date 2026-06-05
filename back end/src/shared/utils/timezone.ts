/**
 * Utilitário de timezone para o BarberFlow.
 *
 * O sistema todo opera na convenção "hora local = UTC":
 *   - Os horários de funcionamento (businessHours) são salvos como strings "09:00", "18:00"
 *   - Os slots do AvailabilityService são gerados como UTC (toISOString().slice(11,16))
 *   - O frontend envia startTime com sufixo Z usando a hora local (ex: "T14:00:00.000Z")
 *
 * Isso funciona perfeitamente EXCETO quando comparamos com Date.now() ou new Date(),
 * que retornam o UTC real (3h à frente no Brasil). Esta função retorna o timestamp
 * "agora" na mesma convenção local-as-UTC que o resto do sistema usa.
 */

/**
 * Retorna o timestamp "agora" na convenção local-as-UTC do sistema.
 * Ex: Se são 21:30 local (00:30 UTC), retorna o timestamp de 21:30 UTC.
 */
export function localNowAsUTC(): number {
    const now = new Date();
    return now.getTime() - now.getTimezoneOffset() * 60_000;
}

/**
 * Retorna a data atual local no formato "YYYY-MM-DD".
 */
export function localDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
