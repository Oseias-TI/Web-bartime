import Link from "next/link";
import { Sparkles, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-md mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-b from-stone-600 to-stone-800 bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-2xl shadow-amber-500/20 animate-[bounce_2.5s_ease-in-out_infinite]">
              <Search className="size-10 text-stone-900" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Página não encontrada
        </h2>
        <p className="text-stone-400 mb-8 leading-relaxed">
          Parece que você se perdeu. A página que você procura não existe ou foi
          movida para outro lugar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-stone-900 shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            <Sparkles className="size-4" />
            Ir para o Início
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-stone-300 hover:bg-white/10 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </div>

        <p className="text-xs text-stone-600 mt-12">
          © 2026 BarberFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
