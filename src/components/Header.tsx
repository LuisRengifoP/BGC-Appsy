import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/logo.png";
import { HelpDialog } from "@/components/HelpDialog";

export function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "flex h-16 items-center justify-between px-6",
        "border-b border-border bg-white shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <img
          src={logoUrl}
          alt="BGC-Appsy Logo"
          className="h-[60px] w-[60px] rounded-lg shadow-md object-contain"
        />
        <span className="text-lg font-bold tracking-tight text-foreground">
          BGC-Appsy
          <span className="ml-1.5 font-medium text-muted-foreground">
            Sistema Inteligente de Georreferenciación
          </span>
        </span>
      </div>

      <HelpDialog />
    </motion.header>
  );
}
