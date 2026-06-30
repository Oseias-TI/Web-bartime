import { google, calendar_v3 } from 'googleapis';
import path from 'path';

export class GoogleCalendarService {
    private calendar: calendar_v3.Calendar | null = null;
    private calendarId: string;

    constructor() {
        this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        this.initialize();
    }

    private initialize() {
        try {
            const fs = require('fs');
            const keyFilePath = path.resolve(__dirname, '../../../google-credentials.json');
            
            let auth;

            if (process.env.GOOGLE_CREDENTIALS) {
                const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
                
                if (credentials.private_key) {
                    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                }

                auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/calendar.events'],
                });
            } else if (fs.existsSync(keyFilePath)) {
                auth = new google.auth.GoogleAuth({
                    keyFile: keyFilePath,
                    scopes: ['https://www.googleapis.com/auth/calendar.events'],
                });
            } else {
                console.warn('[GoogleCalendarService] Nenhuma credencial encontrada. O serviço de calendário ficará inativo.');
                return;
            }

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
        clientEmail?: string;
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

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                requestBody: event,
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
