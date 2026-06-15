import { googleCalendarService } from './shared/services/GoogleCalendarService';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    console.log('Testing Google Calendar Integration...');
    console.log('GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID);
    
    try {
        const id = await googleCalendarService.createEvent({
            summary: 'Teste de Agendamento - Bartime',
            description: 'Se você está vendo isso, a integração com o Google Calendar funcionou!',
            startTime: new Date(new Date().getTime() + 10 * 60000), // 10 minutes from now
            endTime: new Date(new Date().getTime() + 40 * 60000),   // 40 minutes from now
        });
        
        if (id) {
            console.log('✅ Sucesso! Evento criado com ID:', id);
        } else {
            console.log('❌ Falha ao criar o evento. Nenhuma ID retornada.');
        }
    } catch (e) {
        console.error('❌ Exceção não tratada:', e);
    }
}

test();
