import { Router } from 'express';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';
import { ensureRole } from '../shared/middlewares/ensureRole';
import { ensureSuperAdmin } from '../shared/middlewares/ensureSuperAdmin';
import { checkSubscription } from '../shared/middlewares/checkSubscription';
import { auditLog } from '../shared/middlewares/auditLogger';
import { globalLimiter, authLimiter, registerLimiter } from '../shared/middlewares/rateLimiter';
import { uploadConfig } from '../config/upload';

import { AuthController } from '../modules/auth/controllers/AuthController';
import { ClientController } from '../modules/clients/controllers/ClientController';
import { AppointmentController } from '../modules/appointments/controllers/AppointmentController';
import { AvailabilityController } from '../modules/appointments/controllers/AvailabilityController';
import { FinancialController } from '../modules/financial/controllers/FinancialController';
import { ReportController } from '../modules/reports/controllers/ReportController';
import { ExportController } from '../modules/reports/controllers/ExportController';
import { AvatarController } from '../modules/professionals/controllers/AvatarController';
import { ProfessionalController } from '../modules/professionals/controllers/ProfessionalController';
import { ServiceController } from '../modules/services/controllers/ServiceController';
import { BusinessHourController } from '../modules/businessHours/controllers/BusinessHourController';
import { BillingController } from '../modules/billing/controllers/BillingController';
import { TenantController } from '../modules/auth/tenant/controllers/TenantController';
import { AuditController } from '../modules/audit/controllers/AuditController';
import { SuperAdminController } from '../modules/superAdmin/controllers/SuperAdminController';
import { PublicBookingController } from '../modules/appointments/controllers/PublicBookingController';

const routes = Router();

const auth = new AuthController();
const clients = new ClientController();
const appointments = new AppointmentController();
const availability = new AvailabilityController();
const financial = new FinancialController();
const reports = new ReportController();
const exports_ = new ExportController();
const avatar = new AvatarController();
const professionals = new ProfessionalController();
const services = new ServiceController();
const businessHours = new BusinessHourController();
const billing = new BillingController();
const tenant = new TenantController();
const audit = new AuditController();
const superAdmin = new SuperAdminController();

// Rate limiting global
routes.use(globalLimiter);

// ═══════════════════════════════════════════════
//  ROTAS PÚBLICAS
// ═══════════════════════════════════════════════
const publicBooking = new PublicBookingController();

routes.post('/auth/register', registerLimiter, auth.register);
routes.post('/auth/business', authLimiter, auth.loginBusiness);
routes.post('/auth/refresh', authLimiter, auth.refresh);
routes.post('/auth/forgot-password', authLimiter, auth.forgotPassword);
routes.post('/auth/reset-password', auth.resetPassword);
routes.get('/auth/verify-email', auth.verifyEmail);

// Agendamento Público
routes.get('/public/tenant/:slug', publicBooking.getTenant);
routes.get('/public/tenant/:slug/services', publicBooking.getServices);
routes.get('/public/tenant/:slug/professionals', publicBooking.getProfessionals);
routes.get('/public/tenant/:slug/availability', publicBooking.getAvailability);
routes.post('/public/tenant/:slug/appointments', publicBooking.createAppointment);

// ═══════════════════════════════════════════════
//  PROTEGIDAS — sem checkSubscription
// ═══════════════════════════════════════════════
routes.use(ensureAuthenticated);

routes.post('/auth/logout', auth.logout);
routes.patch('/auth/password', auth.changePassword);
routes.post('/auth/resend-verification', auth.resendVerification);

routes.get('/billing/status', billing.status);
routes.post('/billing/checkout', ensureRole(['ADMIN']), billing.checkout);
routes.post('/billing/portal', ensureRole(['ADMIN']), billing.portal);

// ── Super Admin ─────────────────────────────────
routes.get('/super-admin/stats', ensureSuperAdmin, superAdmin.stats);
routes.get('/super-admin/tenants', ensureSuperAdmin, superAdmin.listTenants);
routes.get('/super-admin/tenants/:id', ensureSuperAdmin, superAdmin.getTenant);
routes.patch('/super-admin/tenants/:id/status', ensureSuperAdmin, superAdmin.updateStatus);

// ═══════════════════════════════════════════════
//  PROTEGIDAS — requer assinatura válida
// ═══════════════════════════════════════════════
routes.use(checkSubscription);

// ── Tenant ──────────────────────────────────────
routes.get('/tenant', tenant.get);
routes.patch('/tenant', ensureRole(['ADMIN']), tenant.update);
routes.patch('/tenant/logo', ensureRole(['ADMIN']), uploadConfig.single('logo'), tenant.updateLogo);

// ── Auditoria (apenas ADMIN) ────────────────────
routes.get('/audit', ensureRole(['ADMIN']), audit.list);

// ── Equipe ──────────────────────────────────────
routes.post(
    '/professionals',
    ensureRole(['ADMIN']),
    auditLog({ action: 'PROFESSIONAL_CREATED', entity: 'Professional' }),
    auth.createProfessional
);
routes.get('/professionals', professionals.list);
// BUG-05: Rota /avatar deve vir ANTES de /:id para evitar que o Express capture "avatar" como id
routes.patch('/professionals/avatar', uploadConfig.single('avatar'), avatar.update);
routes.get('/professionals/:id', professionals.show);
routes.patch(
    '/professionals/:id',
    ensureRole(['ADMIN']),
    auditLog({ action: 'PROFESSIONAL_UPDATED', entity: 'Professional' }),
    professionals.update
);
routes.delete(
    '/professionals/:id',
    ensureRole(['ADMIN']),
    auditLog({ action: 'PROFESSIONAL_DEACTIVATED', entity: 'Professional' }),
    professionals.deactivate
);

// ── Serviços ────────────────────────────────────
routes.post('/services', ensureRole(['ADMIN']), auditLog({ action: 'SERVICE_CREATED', entity: 'Service' }), services.create);
routes.get('/services', services.list);
routes.patch('/services/:id', ensureRole(['ADMIN']), auditLog({ action: 'SERVICE_UPDATED', entity: 'Service' }), services.update);
routes.delete('/services/:id', ensureRole(['ADMIN']), auditLog({ action: 'SERVICE_DEACTIVATED', entity: 'Service' }), services.deactivate);

// ── Horário de Funcionamento ────────────────────
routes.get('/business-hours', businessHours.list);
routes.put('/business-hours', ensureRole(['ADMIN']), auditLog({ action: 'BUSINESS_HOURS_UPDATED', entity: 'BusinessHour' }), businessHours.upsert);

// ── Disponibilidade ─────────────────────────────
routes.get('/appointments/availability', availability.getSlots);

// ── Clientes (CRM) ──────────────────────────────
routes.post('/clients', auditLog({ action: 'CLIENT_CREATED', entity: 'Client' }), clients.create);
routes.get('/clients', clients.list);
routes.get('/clients/inactive', clients.listInactive);
routes.get('/clients/:id/profile', clients.showProfile);
routes.get('/clients/:id/spending', clients.showSpending);
routes.patch('/clients/:id', auditLog({ action: 'CLIENT_UPDATED', entity: 'Client' }), clients.update);
routes.post('/clients/:id/redeem', auditLog({ action: 'POINTS_REDEEMED', entity: 'Client' }), clients.redeemPoints);

// ── Agendamentos ────────────────────────────────
routes.post('/appointments', auditLog({ action: 'APPOINTMENT_CREATED', entity: 'Appointment' }), appointments.create);
routes.get('/appointments', appointments.listByDay);
routes.patch('/appointments/:id/complete', auditLog({ action: 'APPOINTMENT_COMPLETED', entity: 'Appointment' }), appointments.complete);
routes.patch('/appointments/:id/cancel', auditLog({ action: 'APPOINTMENT_CANCELED', entity: 'Appointment' }), appointments.cancel);

// ── Financeiro (apenas ADMIN) ───────────────────
routes.post('/financial/transactions', ensureRole(['ADMIN']), auditLog({ action: 'TRANSACTION_CREATED', entity: 'Transaction' }), financial.createTransaction);
routes.get('/financial/transactions', ensureRole(['ADMIN']), financial.listTransactions);
routes.get('/financial/transactions/:id', ensureRole(['ADMIN']), financial.getTransaction);
routes.patch('/financial/transactions/:id', ensureRole(['ADMIN']), auditLog({ action: 'TRANSACTION_UPDATED', entity: 'Transaction' }), financial.updateTransaction);
routes.delete('/financial/transactions/:id', ensureRole(['ADMIN']), auditLog({ action: 'TRANSACTION_DELETED', entity: 'Transaction' }), financial.deleteTransaction);
routes.get('/financial/cash-flow', ensureRole(['ADMIN']), financial.cashFlow);
routes.get('/financial/summary', ensureRole(['ADMIN']), financial.summary);
routes.post('/financial/payout', ensureRole(['ADMIN']), auditLog({ action: 'PAYOUT_EXECUTED', entity: 'Commission' }), financial.payout);

// ── Relatórios (apenas ADMIN) ───────────────────
routes.get('/reports', ensureRole(['ADMIN']), reports.generate);
routes.get('/reports/professional/:id', ensureRole(['ADMIN']), reports.generateByProfessional);
routes.get('/reports/export/excel', ensureRole(['ADMIN']), exports_.excel);
routes.get('/reports/export/pdf', ensureRole(['ADMIN']), exports_.pdf);

export { routes };