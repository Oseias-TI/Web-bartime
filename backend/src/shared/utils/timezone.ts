

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
});

export function localNowAsUTC(): number {
    const parts = dateTimeFormatter.formatToParts(new Date());
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    
    const hour = map.hour === '24' ? '00' : map.hour;
    const isoString = `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}.000Z`;
    return new Date(isoString).getTime();
}

export function localDateString(): string {
    const parts = dateTimeFormatter.formatToParts(new Date());
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    
    return `${map.year}-${map.month}-${map.day}`;
}
