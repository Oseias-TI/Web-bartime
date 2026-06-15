"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Users,
  Wallet,
  BookOpen,
  Settings,
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

const navGroups = [
  {
    label: "Geral",
    items: [
      {
        title: "Dashboard",
        href: "/super-admin",
        icon: LayoutDashboard,
        exactMatch: true,
      },
    ]
  },
  {
    label: "Fluxos",
    items: [
      {
        title: "Barbearias",
        href: "/super-admin/barbearias",
        icon: Building2,
      },
      {
        title: "Usuários",
        href: "/super-admin/usuarios",
        icon: Users,
      },
    ]
  },
  {
    label: "Operacional",
    items: [
      {
        title: "Financeiro",
        href: "/super-admin/financeiro",
        icon: Wallet,
      },
      {
        title: "Documentação",
        href: "/super-admin/documentacao",
        icon: BookOpen,
      },
    ]
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Configurações",
        href: "/super-admin/configuracoes",
        icon: Settings,
      },
    ]
  }
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { professional, tenant, logout } = useAuth();

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
            <SidebarMenuButton size="lg" className="gap-3" tooltip="Bartime Admin">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                {tenant?.logoUrl ? (
                  <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ShieldAlert className="size-4" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sm">Bartime Plataforma</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  Super Admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, index) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        item.exactMatch
                          ? pathname === item.href
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
        ))}
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
                  {professional?.name ? getInitials(professional.name) : "SA"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {professional?.name}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  Plataforma
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
