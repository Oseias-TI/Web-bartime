"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { superAdminService } from "@/services/super-admin.service";
import { toastManager } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NovaBarbeariaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    slug: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({
      ...formData,
      name: newName,
      slug: generateSlug(newName),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await superAdminService.createTenant(formData);
      toastManager.add({ title: "Barbearia criada com sucesso!", type: "success" });
      router.push("/super-admin/barbearias");
    } catch (error: any) {
      toastManager.add({ title: "Erro ao criar barbearia", type: "error" });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" render={<Link href="/super-admin/barbearias" />} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-normal text-white">Nova Barbearia</h1>
          <p className="text-zinc-400 text-sm mt-1">Crie um novo tenant na plataforma.</p>
        </div>
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
            <p className="text-xs text-zinc-500">Este será o link público da barbearia.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" render={<Link href="/super-admin/barbearias" />} className="text-zinc-400 hover:text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Salvando..." : "Salvar Barbearia"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
