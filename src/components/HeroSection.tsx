import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/logo.png";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-center px-4 py-16"
    >
      <Card className="relative w-full max-w-3xl overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 ring-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <CardContent className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <CardTitle className="text-3xl font-bold tracking-tight sm:text-4xl">
              Buscar Coordenadas Inteligentemente
            </CardTitle>
            <CardDescription className="max-w-md text-base text-muted-foreground">
              Nuestro sistema geolocaliza direcciones automáticamente,
              convirtiendo cada ubicación en coordenadas precisas de manera
              rápida y eficiente.
            </CardDescription>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="default" size="lg" onClick={onGetStarted}>
              Comenzar
            </Button>
            <a href="#docs" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Ver documentación
            </a>
          </div>

          <div className="relative h-48 w-full max-w-md">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-xl" />

            <div className="absolute left-1/2 top-0 -translate-x-1/2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                <MapPin className="size-7 text-primary" />
              </div>
            </div>

            <svg
              className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2"
              aria-hidden="true"
            >
              <line x1="0" y1="0" x2="100%" y2="0" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.2" />
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.img
                src={logoUrl}
                alt="BGC-Appsy Logo"
                className="h-20 w-20 rounded-xl shadow-lg object-contain ring-2 ring-primary/10"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            </div>

            <div className="absolute bottom-0 left-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                <MapPin className="size-5 text-green-600" />
              </div>
            </div>
            <div className="absolute bottom-0 right-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                <MapPin className="size-5 text-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
