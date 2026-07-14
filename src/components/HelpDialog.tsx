import { HelpCircle, FileSpreadsheet, Database, Settings, BarChart3, Table, Map } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: FileSpreadsheet,
    title: "Carga de Archivos",
    color: "text-blue-600",
    items: [
      {
        label: "Archivo Base Maestra (.xlsx)",
        text: "Archivo Excel que contiene la base de datos de referencia con direcciones ya geolocalizadas. El sistema utiliza este archivo como primera fuente para buscar coordenadas conocidas.",
      },
      {
        label: "Archivo a Procesar (.xlsx)",
        text: "Archivo Excel con los registros que desea geolocalizar. Debe contener al menos las columnas de documento, cliente, ciudad, barrio y dirección.",
      },
    ],
  },
  {
    icon: Settings,
    title: "Configuración del Procesamiento",
    color: "text-violet-600",
    items: [
      {
        label: "Buscar primero en la base maestra",
        text: "Consulta la base de datos maestra antes de geocodificar externamente. Si una dirección ya fue geolocalizada previamente, reutiliza esas coordenadas sin hacer consultas adicionales.",
      },
      {
        label: "Buscar coordenadas automáticamente",
        text: "Ejecuta la geocodificación automática mediante Nominatim (OpenStreetMap) para registros sin coordenadas. Procesa cada registro de forma secuencial respetando las tasas de la API.",
      },
      {
        label: "Actualizar base maestra",
        text: "Guarda las nuevas coordenadas encontradas en la base maestra para que futuras consultas puedan reutilizarlas. Incrementa progresivamente la cobertura de la base.",
      },
      {
        label: "Sobrescribir coordenadas existentes",
        text: "Reemplaza coordenadas previas aunque ya existan valores útiles. Útil cuando se sospecha que las coordenadas anteriores están desactualizadas.",
      },
      {
        label: "Mostrar registros sin encontrar",
        text: "Incluye en el resultado los registros que no pudieron geocodificarse. Permite identificar direcciones que requieren revisión manual.",
      },
    ],
  },
  {
    icon: BarChart3,
    title: "Panel de Estadísticas",
    color: "text-green-600",
    items: [
      {
        label: "Total registros",
        text: "Cantidad total de registros procesados desde el archivo de entrada.",
      },
      {
        label: "Encontrados",
        text: "Registros cuyas coordenadas fueron localizadas exitosamente en la base maestra o geocodificadas automáticamente.",
      },
      {
        label: "Geocodificados",
        text: "Registros que obtuvieron coordenadas a través del geocodificador automático (Nominatim) durante el procesamiento actual.",
      },
      {
        label: "Sin coordenadas",
        text: "Registros que no pudieron ser geolocalizados. Pueden requerir verificación manual de la dirección.",
      },
    ],
  },
  {
    icon: Map,
    title: "Mapa Interactivo",
    color: "text-orange-600",
    items: [
      {
        label: "Marcadores de ciudades",
        text: "Puntos azules que representan las ciudades principales: Bogotá, Medellín, Cartagena, Barranquilla, Santa Marta, Valledupar, Montería, Sincelejo y Tadó.",
      },
      {
        label: "Puntos geocodificados",
        text: "Cada registro con coordenadas aparece como un punto en el mapa. Los puntos verdes corresponden a registros encontrados en la base maestra, y los naranjas a los geocodificados automáticamente.",
      },
      {
        label: "Agrupación por ciudad",
        text: "Los registros se agrupan visualmente por ciudad con etiquetas que muestran la cantidad de registros en cada zona.",
      },
      {
        label: "Popups informativos",
        text: "Al hacer clic en cualquier punto se muestra el nombre del cliente, dirección, estado de geocodificación y coordenadas exactas.",
      },
    ],
  },
  {
    icon: Table,
    title: "Tabla de Resultados",
    color: "text-cyan-600",
    items: [
      {
        label: "Columna Fuente",
        text: "Indica el origen de las coordenadas: \"Base maestra\" (verde) para registros encontrados en la base, o \"Automático (Nominatim)\" (naranja) para geocodificados en el procesamiento actual.",
      },
      {
        label: "Filtros por estado",
        text: "Botones en el encabezado de la tabla que permiten filtrar registros por categoría: Todos, Encontrados, Geocodificados o Sin coordenadas.",
      },
      {
        label: "Edición de coordenadas",
        text: "Las coordenadas son editables directamente en la tabla. Al hacer clic sobre un valor se abre un campo de texto para modificarlo manualmente.",
      },
      {
        label: "Exportación",
        text: "El botón \"Descargar Excel\" genera un archivo con todos los registros procesados incluyendo las coordenadas asignadas. \"Actualizar Base Maestra\" exporta la base maestra con los nuevos registros incorporados.",
      },
    ],
  },
];

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" />
        }
      >
        <HelpCircle className="h-4 w-4" />
        Ayuda
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Guía del Sistema
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema Inteligente de Georreferenciación BGC-Appsy
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="px-5 py-4 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta herramienta geolocaliza direcciones automáticamente, convirtiendo cada
              ubicación en coordenadas precisas de latitud y longitud. A continuación se
              describe cada módulo y las opciones disponibles.
            </p>

            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <Icon className={`h-4 w-4 ${section.color}`} />
                    {section.title}
                  </h3>
                  <div className="space-y-3 pl-6">
                    {section.items.map((item) => (
                      <div key={item.label} className="relative">
                        <div className="absolute -left-6 top-1.5 h-1.5 w-1.5 rounded-full bg-border" />
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg bg-muted/50 border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-600" />
                Flujo del Proceso
              </h3>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Cargue el archivo base maestra y el archivo a procesar.</li>
                <li>Configure las opciones de procesamiento según sus necesidades.</li>
                <li>Haga clic en <strong className="text-foreground">Iniciar Procesamiento</strong>.</li>
                <li>El sistema busca cada dirección primero en la base maestra.</li>
                <li>Las direcciones no encontradas se geocodifican vía Nominatim.</li>
                <li>Revise los resultados en el mapa, tabla y estadísticas.</li>
                <li>Descargue el archivo Excel con las coordenadas asignadas.</li>
              </ol>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
