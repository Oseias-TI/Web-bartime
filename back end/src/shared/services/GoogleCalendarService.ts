import { google, calendar_v3 } from 'googleapis';
import path from 'path';

export class GoogleCalendarService {
    private calendar: calendar_v3.Calendar | null = null;
    private calendarId: string;

    constructor() {
        // Por padrão, usa o email da service account se nenhuma agenda específica for passada
        // ou pode-se usar uma variável de ambiente GOOGLE_CALENDAR_ID
        this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        this.initialize();
    }

    private initialize() {
        try {
            const keyFilePath = path.resolve(__dirname, '../../../google-credentials.json');
            
            const auth = new google.auth.GoogleAuth({
                keyFile: keyFilePath,
                scopes: ['https://www.googleapis.com/auth/calendar.events'],
            });

            this.calendar = google.calendar({ version: 'v3', auth });
        } catch (error) {
            console.error('[GoogleCalendarService] Erro ao inicializar a autenticação do Google Calendar:', error);
        }
    }

    async createEvent(data: {
        summary: string;
        description: string;
        startTime: Date;
        endTime: Date;
        professionalEmail?: string;
    }): Promise<string | null> {
        if (!this.calendar) {
            console.error('[GoogleCalendarService] Serviço não inicializado.');
            return null;
        }

        try {
            const event: calendar_v3.Schema$Event = {
                summary: data.summary,
                description: data.description,
                start: {
                    dateTime: data.startTime.toISOString(),
                },
                end: {
                    dateTime: data.endTime.toISOString(),
                },
            };

            // Se quisermos convidar o profissional, podemos adicionar como attendee
            if (data.professionalEmail) {
                event.attendees = [{ email: data.professionalEmail }];
            }

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                requestBody: event,
                sendUpdates: 'all', // Envia email para os attendees (se houver)
            });

            return response.data.id || null;
        } catch (error) {
            console.error('[GoogleCalendarService] Erro ao criar evento no Google Calendar:', error);
            return null;
        }
    }

    async deleteEvent(eventId: string): Promise<boolean> {
        if (!this.calendar) return false;

        try {
            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId,
            });
            return true;
        } catch (error) {
            console.error(`[GoogleCalendarService] Erro ao excluir evento ${eventId}:`, error);
            return false;
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();
