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
        "flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6",
        "border-b border-border bg-white shadow-sm"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img
          src={logoUrl}
          alt="BGC-Appsy Logo"
          className="h-9 w-9 sm:h-[60px] sm:w-[60px] rounded-lg shadow-md object-contain shrink-0"
        />
        <span className="text-sm sm:text-lg font-bold tracking-tight text-foreground truncate">
          BGC-Appsy
          <span className="hidden sm:inline ml-1.5 font-medium text-muted-foreground">
            Sistema Inteligente de Georreferenciación
          </span>
        </span>
      </div>

      <div className="shrink-0">
        <HelpDialog />
      </div>
    </motion.header>
  );
}
