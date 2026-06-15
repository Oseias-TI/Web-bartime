"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, professional } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (professional?.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, professional, router]);

  if (isLoading || !isAuthenticated || professional?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SuperAdminSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
