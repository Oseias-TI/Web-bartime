import { BackgroundSnippet } from "@/components/ui/background-snippets";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center relative text-neutral-100">
      <BackgroundSnippet />
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
