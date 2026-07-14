import type {
  ProcessingConfig,
  ProcessingStatus,
  ActivityLogEntry,
  ProcessingResult,
  MasterIndexResult,
  GeocodingRecord,
  Row,
} from "@/types";
import {
  parseWorkbook,
  buildMasterIndex,
  processInput,
  exportToXlsx,
} from "@/lib/geo-processor";

function addLog(
  setActivityLog: (fn: (prev: ActivityLogEntry[]) => ActivityLogEntry[]) => void,
  type: ActivityLogEntry["type"],
  message: string
) {
  setActivityLog((prev) => [
    ...prev,
    { timestamp: new Date().toISOString(), message, type },
  ]);
}

function mapResultToRecords(
  rows: Row[],
  latField: string,
  lonField: string,
  _stats: { fromMaster: number; geocoded: number; notFound: number },
  mostrarSinEncontrar: boolean
): GeocodingRecord[] {
  const find = (row: Row, candidates: string[]): string | null => {
    const clean = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const keys = Object.keys(row);
    for (const c of candidates) {
      const t = clean(c);
      const found = keys.find((k) => clean(k) === t);
      if (found) return found;
    }
    return null;
  };

  return rows
    .map((row) => {
      const docField = find(row, ["numero de documento", "documento", "nit"]);
      const clienteField = find(row, ["cliente", "nombre", "razon social", "razonsocial"]);
      const ciudadField = find(row, ["ciudad", "ciudad cliente"]);
      const barrioField = find(row, ["barrio"]);
      const dirField = find(row, ["direccion cliente", "direccion", "direccion del servicio"]);

      const lat = row[latField] as number | null;
      const lon = row[lonField] as number | null;
      let estado: GeocodingRecord["estado"] = "no_encontrado";
      if (lat != null && lon != null) {
        estado = "encontrado";
      }

      return {
        documento: docField ? String(row[docField] ?? "") : "",
        cliente: clienteField ? String(row[clienteField] ?? "") : "",
        ciudad: ciudadField ? String(row[ciudadField] ?? "") : "",
        barrio: barrioField ? String(row[barrioField] ?? "") : "",
        direccion: dirField ? String(row[dirField] ?? "") : "",
        latitud: lat,
        longitud: lon,
        estado,
        _raw: row,
      };
    })
    .filter((r) => mostrarSinEncontrar || r.estado !== "no_encontrado");
}

export async function processFilesClientSide(
  baseFile: File,
  processFile: File,
  config: ProcessingConfig,
  onProgress: (status: ProcessingStatus) => void,
  setActivityLog: (fn: (prev: ActivityLogEntry[]) => ActivityLogEntry[]) => void
): Promise<ProcessingResult> {
  let masterIndex: MasterIndexResult;
  let masterRows: Row[];
  let inputRows: Row[];

  addLog(setActivityLog, "info", "Leyendo base maestra...");
  onProgress({
    status: "processing",
    progress: 0,
    total: 0,
    procesados: 0,
    encontrados: 0,
    geocodificados: 0,
    no_encontrados: 0,
    mensaje: "Leyendo base maestra...",
  });

  try {
    const buf = await baseFile.arrayBuffer();
    const { rows } = parseWorkbook(buf);
    masterRows = rows;
    masterIndex = buildMasterIndex(rows);
    addLog(
      setActivityLog,
      "success",
      `Base maestra cargada: ${rows.length} filas, ${masterIndex.index.size} con coordenadas.`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error leyendo la base maestra";
    addLog(setActivityLog, "error", msg);
    throw new Error(msg);
  }

  addLog(setActivityLog, "info", "Leyendo archivo a procesar...");
  try {
    const buf = await processFile.arrayBuffer();
    const { rows } = parseWorkbook(buf);
    inputRows = rows;
    addLog(setActivityLog, "info", `Archivo de entrada cargado: ${rows.length} filas.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error leyendo el archivo de entrada";
    addLog(setActivityLog, "error", msg);
    throw new Error(msg);
  }

  addLog(setActivityLog, "info", "Iniciando cruce de información...");
  onProgress({
    status: "processing",
    progress: 0,
    total: inputRows.length,
    procesados: 0,
    encontrados: 0,
    geocodificados: 0,
    no_encontrados: 0,
    mensaje: "Iniciando cruce...",
  });

  let lastProgressUpdate = 0;

  try {
    const enableGeocode =
      config.buscar_coordenadas_auto &&
      config.buscar_en_base_maestra;

    const result = await processInput({
      masterIndex: masterIndex.index,
      inputRows,
      enableGeocode,
      onProgress: (done, total, message) => {
        const now = Date.now();
        if (now - lastProgressUpdate < 100 && !message) return;
        lastProgressUpdate = now;

        const pct = Math.round((done / total) * 100);
        onProgress({
          status: "processing",
          progress: pct,
          total,
          procesados: done,
          encontrados: 0,
          geocodificados: 0,
          no_encontrados: 0,
          mensaje: message || `Procesando ${done} de ${total}...`,
        });
      },
    });

    addLog(
      setActivityLog,
      "success",
      `Proceso completado: ${result.stats.fromMaster} desde maestra · ${result.stats.geocoded} geocodificados · ${result.stats.notFound} sin coordenadas.`
    );

    if (
      config.actualizar_base_maestra &&
      result.newMasterEntries.length > 0 &&
      masterIndex
    ) {
      const additions: Row[] = result.newMasterEntries.map((e) => ({
        [masterIndex.keyField]: e.key,
        direccion: e.direccion,
        BARRIO: e.barrio,
        CIUDAD: e.ciudad,
        [masterIndex.latField]: e.lat,
        [masterIndex.lonField]: e.lon,
      }));
      masterRows = [...masterRows, ...additions];
      addLog(
        setActivityLog,
        "info",
        `Base maestra actualizada con ${additions.length} nuevos registros.`
      );
    }

    const registros = mapResultToRecords(
      result.rows,
      result.latField,
      result.lonField,
      result.stats,
      config.mostrar_sin_encontrar
    );

    return {
      registros,
      activity_log: [],
      stats: result.stats,
      updatedMasterRows: masterRows,
      latField: result.latField,
      lonField: result.lonField,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en el procesamiento";
    addLog(setActivityLog, "error", msg);
    throw new Error(msg);
  }
}

export function downloadResultExcel(
  registros: GeocodingRecord[],
  filename: string
) {
  const rows = registros.map((r) => {
    const out: Row = { ...r._raw };
    out["Latitud"] = r.latitud;
    out["Longitud"] = r.longitud;
    return out;
  });
  exportToXlsx(rows, filename);
}

export function downloadMasterExcel(masterRows: Row[], filename: string) {
  exportToXlsx(masterRows, filename);
}
