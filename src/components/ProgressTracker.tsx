import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressTrackerProps {
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  procesados: number
  total: number
  mensaje?: string
}

export function ProgressTracker({
  status,
  progress,
  procesados,
  total,
  mensaje,
}: ProgressTrackerProps) {
  const isActive = status === "processing"

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isActive && "ring-2 ring-primary/30",
        status === "completed" && "ring-2 ring-green-500/30",
        status === "error" && "ring-2 ring-destructive/30"
      )}
    >
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    rotate: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    opacity: { duration: 0.2 },
                  }}
                >
                  <Loader2 className="h-5 w-5 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>

            <span className="text-sm font-medium">
              {status === "idle" && "Listo"}
              {status === "processing" && "Procesando..."}
              {status === "completed" && "Completado"}
              {status === "error" && "Error"}
            </span>
          </div>

          <span className="text-sm tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>

        <Progress value={progress} />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {procesados.toLocaleString()} / {total.toLocaleString()} registros
          </span>

          <AnimatePresence>
            {isActive && (
              <motion.span
                key="pulse"
                className="inline-block h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {mensaje && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "text-sm",
                status === "error" ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {mensaje}
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
