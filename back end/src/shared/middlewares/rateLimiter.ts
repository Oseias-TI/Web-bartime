import rateLimit from 'express-rate-limit';

// Limiter geral — aplicado em todas as rotas
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 2000, // Aumentado para 2000 em ambiente de desenvolvimento
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});

// Limiter restrito — login e forgot-password
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 tentativas por IP a cada 15 minutos
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
    skipSuccessfulRequests: true, // não conta requisições bem-sucedidas
});

// Limiter para register — evita spam de contas
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // BUG-12: Restaurado para 5 (estava temporariamente em 50 para testes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitos cadastros realizados. Tente novamente em 1 hora.' },
});

// Limiter para agendamento público — previne bots de ocuparem toda a agenda (API4: Rate Limiting)
export const publicBookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // máximo 5 agendamentos por IP por hora
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Limite de agendamentos atingido. Tente novamente em 1 hora.' },
});