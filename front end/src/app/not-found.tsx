"use client";

import Link from "next/link";
import { Scissors, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-black/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-black/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-md mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-b from-[#4a3d2e] to-[#2a1f12] bg-clip-text text-transparent select-none font-[family-name:var(--font-playfair)]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-black shadow-2xl shadow-black/15 animate-[bounce_2.5s_ease-in-out_infinite]">
              <Search className="size-10 text-black" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3 font-[family-name:var(--font-playfair)]">
          Eita, essa página não existe
        </h2>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Parece que você se perdeu. Essa página foi cortada fora — mas a gente te ajuda a voltar pro lugar certo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-black shadow-lg shadow-black/15 hover:bg-neutral-900 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            <Scissors className="size-4" />
            Ir para o Início
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#f5efe6]/5 px-6 py-3 text-sm font-medium text-neutral-300 hover:bg-[#f5efe6]/10 transition-all duration-200 w-full sm:w-auto justify-center cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>
        </div>

        <p className="text-xs text-neutral-600 mt-12">
          © 2026 Bartime. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
