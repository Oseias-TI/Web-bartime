"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Professional {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  commissionRate: number;
  role: "ADMIN" | "BARBER" | "RECEPTIONIST" | "SUPER_ADMIN";
  active: boolean;
  emailVerified: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj: string;
  logoUrl: string | null;
  subscriptionStatus: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  professional: Professional;
  tenant: Tenant;
}

interface AuthContextData {
  professional: Professional | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Professional>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfessional: (data: Partial<Professional>) => void;
  updateTenant: (data: Partial<Tenant>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  cnpj: string;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!professional;

  const loadStoredAuth = useCallback(() => {
    try {
      const storedToken = localStorage.getItem("@Bartime:token");
      const storedProfessional = localStorage.getItem("@Bartime:professional");
      const storedTenant = localStorage.getItem("@Bartime:tenant");

      if (storedToken && storedProfessional && storedTenant) {
        api.setToken(storedToken);
        setProfessional(JSON.parse(storedProfessional));
        setTenant(JSON.parse(storedTenant));
      }
    } catch {
      localStorage.removeItem("@Bartime:token");
      localStorage.removeItem("@Bartime:refreshToken");
      localStorage.removeItem("@Bartime:professional");
      localStorage.removeItem("@Bartime:tenant");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/business", {
      email,
      password,
    });

    api.setToken(response.token);
    setProfessional(response.professional);
    setTenant(response.tenant);

    localStorage.setItem("@Bartime:token", response.token);
    localStorage.setItem("@Bartime:refreshToken", response.refreshToken);
    localStorage.setItem("@Bartime:professional", JSON.stringify(response.professional));
    localStorage.setItem("@Bartime:tenant", JSON.stringify(response.tenant));

    return response.professional;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    // BUG-05: Backend espera 'adminName', não 'name'
    const response = await api.post<AuthResponse>("/auth/register", {
      adminName: data.name,
      email: data.email,
      password: data.password,
      tenantName: data.tenantName,
      cnpj: data.cnpj,
    });

    api.setToken(response.token);
    setProfessional(response.professional);
    setTenant(response.tenant);

    localStorage.setItem("@Bartime:token", response.token);
    localStorage.setItem("@Bartime:refreshToken", response.refreshToken);
    localStorage.setItem("@Bartime:professional", JSON.stringify(response.professional));
    localStorage.setItem("@Bartime:tenant", JSON.stringify(response.tenant));
  }, []);

  const logout = useCallback(async () => {
    try {
      // BUG-07: Enviar refreshToken no body para que o backend possa revogá-lo
      const refreshToken = localStorage.getItem("@Bartime:refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // ignore errors on logout
    } finally {
      api.setToken(null);
      setProfessional(null);
      setTenant(null);
      localStorage.removeItem("@Bartime:token");
      localStorage.removeItem("@Bartime:refreshToken");
      localStorage.removeItem("@Bartime:professional");
      localStorage.removeItem("@Bartime:tenant");
    }
  }, []);

  const updateProfessional = useCallback((data: Partial<Professional>) => {
    setProfessional((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("@Bartime:professional", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateTenant = useCallback((data: Partial<Tenant>) => {
    setTenant((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("@Bartime:tenant", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        professional,
        tenant,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateProfessional,
        updateTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
