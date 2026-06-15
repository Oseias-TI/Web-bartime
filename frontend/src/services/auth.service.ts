import { api } from "@/lib/api";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  cnpj: string;
}

export const authService = {
  login: (data: LoginData) => api.post("/auth/business", data),
  register: (data: RegisterData) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch("/auth/password", { currentPassword, newPassword }),
  resendVerification: () => api.post("/auth/resend-verification"),
};
