import { googleCalendarService } from './src/shared/services/GoogleCalendarService';

async function test() {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60000);
    
    console.log("Testing Google Calendar Creation...");
    const res = await googleCalendarService.createEvent({
        summary: 'Test Event',
        description: 'Testing 123',
        startTime: start,
        endTime: end,
        clientEmail: 'test@example.com'
    });
    
    console.log("Result:", res);
}

test();
