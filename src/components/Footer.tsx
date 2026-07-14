import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="w-full pt-8 pb-6">
      <Separator />
      <div className="flex flex-col items-center gap-1 pt-4">
        <p className="text-sm text-muted-foreground">
          BGC-Appsy Sistema Inteligente de Georreferenciación
        </p>
        <p className="text-xs text-muted-foreground">
          Versión 1.0 - © 2026
        </p>
      </div>
    </footer>
  );
}
