export interface ICreateAppointmentDTO {
    tenantId: string;
    clientId: string;
    professionalId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
}

export interface IAppointmentResponse {
    id: string;
    tenantId: string;
    clientId: string;
    professionalId: string;
    serviceId: string;
    status: string;
    startTime: Date;
    endTime: Date;
    googleEventId?: string | null;
    service: {
        id: string;
        name: string;
        durationMin: number;
        price?: number;
    };
    client: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
    };
    professional: {
        id: string;
        name: string;
        email?: string | null;
        commissionRate?: number;
    };
}

export interface IAppointmentRepository {
    create(data: ICreateAppointmentDTO): Promise<IAppointmentResponse>;
    findConflictingAppointment(tenantId: string, professionalId: string, startTime: Date, endTime: Date): Promise<boolean>;
    findById(id: string, tenantId: string): Promise<IAppointmentResponse | null>;
    updateGoogleEventId(id: string, googleEventId: string): Promise<void>;
    listByDay(tenantId: string, start: Date, end: Date, professionalId?: string, skip?: number, take?: number): Promise<any[]>;
    countByDay(tenantId: string, start: Date, end: Date, professionalId?: string): Promise<number>;
    
    cancelAppointmentWithCommissions(appointmentId: string): Promise<any>;
    completeAppointmentAndCreateFinancials(
        appointmentId: string, 
        paymentMethod: string, 
        servicePrice: number, 
        commissionAmount: number,
        tenantId: string,
        professionalId: string,
        clientId: string,
        serviceName: string,
        professionalName: string
    ): Promise<{ appointment: any, commission: any, revenue: number }>;
}
