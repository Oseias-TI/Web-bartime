"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Star,
  Edit,
  Loader2,
  Eye,
  UserX,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toastManager } from "@/components/ui/toast";
import {
  clientsService,
  type Client,
  type CreateClientData,
} from "@/services/clients.service";
import { ClientProfileDrawer } from "@/components/clients/ClientProfileDrawer";
import type { ApiError } from "@/lib/api";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [inactiveClients, setInactiveClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInactive, setIsLoadingInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("ativos");

  // Profile drawer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPreferences, setFormPreferences] = useState("");

  const loadClients = useCallback(async () => {
    try {
      const data = await clientsService.list(searchTerm || undefined);
      setClients(data);
    } catch {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const loadInactiveClients = useCallback(async () => {
    setIsLoadingInactive(true);
    try {
      const data = await clientsService.listInactive();
      setInactiveClients(data);
    } catch {
      setInactiveClients([]);
    } finally {
      setIsLoadingInactive(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (activeTab === "inativos" && inactiveClients.length === 0) {
      loadInactiveClients();
    }
  }, [activeTab, inactiveClients.length, loadInactiveClients]);

  const openCreate = () => {
    setEditingClient(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormPreferences("");
    setIsModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormEmail(client.email || "");
    setFormPreferences(client.preferences || "");
    setIsModalOpen(true);
  };

  const openProfile = (client: Client) => {
    setSelectedClient(client);
    setIsProfileOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPhone) {
      toastManager.add({ title: "Nome e telefone são obrigatórios", type: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateClientData = {
        name: formName,
        phone: formPhone,
        email: formEmail || undefined,
        preferences: formPreferences || undefined,
      };

      if (editingClient) {
        await clientsService.update(editingClient.id, data);
        toastManager.add({ title: "Cliente atualizado!", type: "success" });
      } else {
        await clientsService.create(data);
        toastManager.add({ title: "Cliente cadastrado!", type: "success" });
      }

      setIsModalOpen(false);
      loadClients();
    } catch (error) {
      toastManager.add({
        title: "Erro ao salvar",
        description: (error as ApiError).message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderClientTable = (clientList: Client[], showActions = true) => (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        {clientList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              Nenhum cliente encontrado
            </p>
            <p className="text-muted-foreground text-sm">
              {activeTab === "inativos"
                ? "Nenhum cliente inativo no período"
                : "Cadastre seu primeiro cliente"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Pontos</TableHead>
                <TableHead className="hidden lg:table-cell">Desde</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientList.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Phone className="size-3 text-muted-foreground" />
                      {client.phone}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.email ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Mail className="size-3 text-muted-foreground" />
                        {client.email}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" className="gap-1">
                      <Star className="size-3 text-amber-500" />
                      {client.loyaltyPoints}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {format(new Date(client.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openProfile(client)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Eye className="size-4" />
                      </Button>
                      {showActions && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(client)}
                        >
                          <Edit className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes e programa de fidelidade
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger
            render={
              <Button
                onClick={openCreate}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-900 font-semibold border-amber-400/20"
              >
                <Plus className="size-4" />
                Novo Cliente
              </Button>
            }
          />
          <DialogPopup className="sm:max-w-lg">
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Atualize os dados do cliente"
                : "Cadastre um novo cliente"}
            </DialogDescription>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  placeholder="Nome completo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferências</label>
                <Input
                  placeholder="Ex: Corte navalhado, barba..."
                  value={formPreferences}
                  onChange={(e) => setFormPreferences(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose
                  render={<Button variant="outline">Cancelar</Button>}
                />
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-semibold border-amber-400/20"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : editingClient ? (
                    "Salvar"
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </div>
            </div>
          </DialogPopup>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="ativos">
              <Users className="size-4 mr-1.5" />
              Ativos ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="inativos">
              <UserX className="size-4 mr-1.5" />
              Inativos
            </TabsTrigger>
          </TabsList>

          {activeTab === "ativos" && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        <TabsContent value="ativos" className="mt-4">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            renderClientTable(clients)
          )}
        </TabsContent>

        <TabsContent value="inativos" className="mt-4">
          {isLoadingInactive ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 mb-4">
                <p className="text-sm text-blue-400">
                  <UserX className="size-4 inline-block mr-1.5 -mt-0.5" />
                  Clientes que não visitaram a barbearia nos últimos 30 dias.
                </p>
              </div>
              {renderClientTable(inactiveClients, false)}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Profile Drawer */}
      <ClientProfileDrawer
        client={selectedClient}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onUpdated={loadClients}
      />
    </div>
  );
}
