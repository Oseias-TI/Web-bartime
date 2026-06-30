"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { superAdminService } from "@/services/super-admin.service";
import { toastManager } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function EditarBarbeariaPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    slug: "",
  });

  const loadTenantData = useCallback(async () => {
    try {
      // Reusing the getTenant API route we created
      const data = await api.get<any>(`/super-admin/tenants/${tenantId}`);
      setFormData({
        name: data.name || "",
        cnpj: data.cnpj || "",
        slug: data.slug || "",
      });
    } catch (error: any) {
      toastManager.add({ title: "Erro ao carregar dados", type: "error" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadTenantData();
    }
  }, [tenantId, loadTenantData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      name: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await superAdminService.updateTenant(tenantId, formData);
      toastManager.add({ title: "Barbearia atualizada com sucesso!", type: "success" });
      router.push("/super-admin/barbearias");
    } catch (error: any) {
      toastManager.add({ title: "Erro ao atualizar barbearia", type: "error" });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja inativar esta barbearia? Esta ação mudará o status para CANCELADO.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await superAdminService.deleteTenant(tenantId);
      toastManager.add({ title: "Barbearia inativada com sucesso!", type: "success" });
      router.push("/super-admin/barbearias");
    } catch (error: any) {
      toastManager.add({ title: "Erro ao inativar barbearia", type: "error" });
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" render={<Link href="/super-admin/barbearias" />} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-normal text-white">Editar Barbearia</h1>
            <p className="text-zinc-400 text-sm mt-1">Atualize as informações de cadastro.</p>
          </div>
        </div>

        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-950/50 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? "Inativando..." : "Inativar"}
        </Button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">Nome da Barbearia</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Ex: Barbearia do Zé"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="text-zinc-300">CNPJ</Label>
            <Input
              id="cnpj"
              required
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-zinc-300">Slug (URL)</Label>
            <Input
              id="slug"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="barbearia-do-ze"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
            />
            <p className="text-xs text-zinc-500">Este é o link público da barbearia. Cuidado ao alterar.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" render={<Link href="/super-admin/barbearias" />} className="text-zinc-400 hover:text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
