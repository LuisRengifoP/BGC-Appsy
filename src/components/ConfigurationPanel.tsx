import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProcessingConfig {
  buscar_en_base_maestra: boolean;
  buscar_coordenadas_auto: boolean;
  actualizar_base_maestra: boolean;
  sobrescribir_coordenadas: boolean;
  mostrar_sin_encontrar: boolean;
}

interface ConfigurationPanelProps {
  config: ProcessingConfig;
  onChange: (config: ProcessingConfig) => void;
  disabled?: boolean;
}

const switches: {
  key: keyof ProcessingConfig;
  label: string;
  description: string;
}[] = [
  {
    key: "buscar_en_base_maestra",
    label: "Buscar primero en la base maestra",
    description: "Consulta la base de datos maestra antes de geocodificar externamente",
  },
  {
    key: "buscar_coordenadas_auto",
    label: "Buscar coordenadas automáticamente",
    description: "Ejecuta la geocodificación automática para registros sin coordenadas",
  },
  {
    key: "actualizar_base_maestra",
    label: "Actualizar base maestra",
    description: "Guarda las nuevas coordenadas encontradas en la base maestra",
  },
  {
    key: "sobrescribir_coordenadas",
    label: "Sobrescribir coordenadas existentes",
    description: "Reemplaza coordenadas previas aunque ya existan valores",
  },
  {
    key: "mostrar_sin_encontrar",
    label: "Mostrar registros sin encontrar",
    description: "Incluye en el resultado los registros que no pudieron geocodificarse",
  },
];

export function ConfigurationPanel({ config, onChange, disabled }: ConfigurationPanelProps) {
  const handleChange = (key: keyof ProcessingConfig, value: boolean) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Procesamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {switches.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className={cn("text-sm font-medium", disabled && "opacity-50")}>
                  {label}
                </p>
                <p className={cn("text-xs text-muted-foreground", disabled && "opacity-50")}>
                  {description}
                </p>
              </div>
              <Switch
                checked={config[key]}
                onCheckedChange={(checked) => handleChange(key, checked)}
                disabled={disabled}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
