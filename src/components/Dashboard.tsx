import { motion } from "framer-motion";
import { MapPin, CheckCircle, Search, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DashboardProps {
  total: number;
  encontrados: number;
  geocodificados: number;
  noEncontrados: number;
}

const stats = [
  {
    key: "total" as const,
    label: "Total registros",
    icon: MapPin,
    color: "#2563EB",
    bgClass: "bg-blue-50",
    textClass: "text-blue-600",
  },
  {
    key: "encontrados" as const,
    label: "Encontrados",
    icon: CheckCircle,
    color: "#16A34A",
    bgClass: "bg-green-50",
    textClass: "text-green-600",
  },
  {
    key: "geocodificados" as const,
    label: "Buscados automáticamente",
    icon: Search,
    color: "#F97316",
    bgClass: "bg-orange-50",
    textClass: "text-orange-600",
  },
  {
    key: "noEncontrados" as const,
    label: "Sin encontrar",
    icon: XCircle,
    color: "#EF4444",
    bgClass: "bg-red-50",
    textClass: "text-red-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const CHART_COLORS = ["#2563EB", "#16A34A", "#F97316", "#EF4444"];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">{payload[0].value.toLocaleString()} registros</p>
      </div>
    );
  }
  return null;
}

export default function Dashboard({
  total,
  encontrados,
  geocodificados,
  noEncontrados,
}: DashboardProps) {
  const values = { total, encontrados, geocodificados, noEncontrados };

  const getPercentage = (key: string): string => {
    if (total === 0) return "0%";
    const value = values[key as keyof typeof values];
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const chartData = [
    { name: "Encontrados", value: encontrados },
    { name: "Buscados automáticamente", value: geocodificados },
    { name: "Sin encontrar", value: noEncontrados },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          const count = values[stat.key];

          return (
            <motion.div key={stat.key} variants={item}>
              <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p
                        className="mt-2 text-3xl font-bold tracking-tight"
                        style={{ color: stat.color }}
                      >
                        {count.toLocaleString("es-VE")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getPercentage(stat.key)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        stat.bgClass
                      )}
                    >
                      <Icon className={cn("h-5 w-5", stat.textClass)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Distribución de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {chartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}
                      </span>
                      <span className="text-sm font-medium">
                        {entry.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
