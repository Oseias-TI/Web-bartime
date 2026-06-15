declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                tenantId: string;
                role: string;
            };
        }
    }
}
export { };