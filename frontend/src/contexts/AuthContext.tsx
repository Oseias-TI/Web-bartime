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
  role: "ADMIN" | "BARBER" | "RECEPTIONIST";
  active: boolean;
  emailVerified: boolean;
}

interface Tenant {
  id: string;
  name: string;
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
  login: (email: string, password: string) => Promise<void>;
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
      const storedToken = localStorage.getItem("@barberflow:token");
      const storedProfessional = localStorage.getItem("@barberflow:professional");
      const storedTenant = localStorage.getItem("@barberflow:tenant");

      if (storedToken && storedProfessional && storedTenant) {
        api.setToken(storedToken);
        setProfessional(JSON.parse(storedProfessional));
        setTenant(JSON.parse(storedTenant));
      }
    } catch {
      localStorage.removeItem("@barberflow:token");
      localStorage.removeItem("@barberflow:refreshToken");
      localStorage.removeItem("@barberflow:professional");
      localStorage.removeItem("@barberflow:tenant");
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

    localStorage.setItem("@barberflow:token", response.token);
    localStorage.setItem("@barberflow:refreshToken", response.refreshToken);
    localStorage.setItem("@barberflow:professional", JSON.stringify(response.professional));
    localStorage.setItem("@barberflow:tenant", JSON.stringify(response.tenant));
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post<AuthResponse>("/auth/register", data);

    api.setToken(response.token);
    setProfessional(response.professional);
    setTenant(response.tenant);

    localStorage.setItem("@barberflow:token", response.token);
    localStorage.setItem("@barberflow:refreshToken", response.refreshToken);
    localStorage.setItem("@barberflow:professional", JSON.stringify(response.professional));
    localStorage.setItem("@barberflow:tenant", JSON.stringify(response.tenant));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore errors on logout
    } finally {
      api.setToken(null);
      setProfessional(null);
      setTenant(null);
      localStorage.removeItem("@barberflow:token");
      localStorage.removeItem("@barberflow:refreshToken");
      localStorage.removeItem("@barberflow:professional");
      localStorage.removeItem("@barberflow:tenant");
    }
  }, []);

  const updateProfessional = useCallback((data: Partial<Professional>) => {
    setProfessional((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("@barberflow:professional", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateTenant = useCallback((data: Partial<Tenant>) => {
    setTenant((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("@barberflow:tenant", JSON.stringify(updated));
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
