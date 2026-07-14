export type Row = Record<string, unknown>;

export interface MasterRecord {
  key: string;
  lat: number;
  lon: number;
}

export interface MasterIndexResult {
  index: Map<string, MasterRecord>;
  keyField: string;
  latField: string;
  lonField: string;
}

export interface GeoProcessorResult {
  rows: Row[];
  latField: string;
  lonField: string;
  stats: {
    total: number;
    fromMaster: number;
    geocoded: number;
    notFound: number;
  };
  newMasterEntries: Array<{
    key: string;
    lat: number;
    lon: number;
    direccion: string;
    barrio: string;
    ciudad: string;
  }>;
}

export interface GeocodingRecord {
  documento: string;
  cliente: string;
  ciudad: string;
  barrio: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  estado: "encontrado" | "geocodificado" | "no_encontrado";
  _raw: Row;
}

export interface ProcessingConfig {
  buscar_en_base_maestra: boolean;
  buscar_coordenadas_auto: boolean;
  actualizar_base_maestra: boolean;
  sobrescribir_coordenadas: boolean;
  mostrar_sin_encontrar: boolean;
}

export interface ProcessingStatus {
  status: "idle" | "processing" | "completed" | "error";
  progress: number;
  total: number;
  procesados: number;
  encontrados: number;
  geocodificados: number;
  no_encontrados: number;
  mensaje?: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface ProcessingResult {
  registros: GeocodingRecord[];
  activity_log: ActivityLogEntry[];
  stats: GeoProcessorResult["stats"];
  updatedMasterRows: Row[];
  latField: string;
  lonField: string;
}
