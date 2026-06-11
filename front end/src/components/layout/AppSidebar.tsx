"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  Scissors,
  UserCog,
  DollarSign,
  BarChart3,
  Settings,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Agendamentos",
    href: "/dashboard/agendamentos",
    icon: CalendarDays,
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "Serviços",
    href: "/dashboard/servicos",
    icon: Scissors,
  },
  {
    title: "Equipe",
    href: "/dashboard/equipe",
    icon: UserCog,
  },
];

const managementNavItems = [
  {
    title: "Financeiro",
    href: "/dashboard/financeiro",
    icon: DollarSign,
    adminOnly: true,
  },
  {
    title: "Relatórios",
    href: "/dashboard/relatorios",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: "Auditoria",
    href: "/dashboard/auditoria",
    icon: ShieldAlert,
    adminOnly: true,
  },
  {
    title: "Planos & Assinatura",
    href: "/dashboard/planos",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    title: "Configurações",
    href: "/dashboard/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { professional, tenant, logout } = useAuth();

  const isAdmin = professional?.role === "ADMIN";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-3" tooltip="Bartime">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scissors className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sm">Bartime</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {tenant?.name || "Barbearia"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={professional?.name || "Perfil"}>
              <Avatar className="size-8">
                <AvatarImage
                  src={professional?.avatarUrl || undefined}
                  alt={professional?.name}
                />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                  {professional?.name ? getInitials(professional.name) : "BF"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {professional?.name}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {professional?.role === "ADMIN"
                    ? "Administrador"
                    : professional?.role === "BARBER"
                      ? "Barbeiro"
                      : "Recepcionista"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={() => logout()}
              className="text-destructive-foreground hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
