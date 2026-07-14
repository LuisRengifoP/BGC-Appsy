import * as XLSX from "xlsx";

export type Row = Record<string, unknown>;

export interface MasterRecord {
  key: string;
  lat: number;
  lon: number;
}

export interface ProcessResult {
  rows: Row[];
  latField: string;
  lonField: string;
  stats: {
    total: number;
    fromMaster: number;
    geocoded: number;
    notFound: number;
  };
  newMasterEntries: Array<{ key: string; lat: number; lon: number; direccion: string; barrio: string; ciudad: string }>;
}

const norm = (v: unknown) => String(v ?? "").trim().replace(/\.0+$/, "").replace(/\s+/g, "");

export function parseWorkbook(buf: ArrayBuffer): { wb: XLSX.WorkBook; rows: Row[]; sheetName: string } {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheetName], { defval: null });
  return { wb, rows, sheetName };
}

/** Find first matching column name (case/space insensitive, accents stripped). */
export function findField(row: Row, candidates: string[]): string | null {
  const clean = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const keys = Object.keys(row);
  for (const c of candidates) {
    const t = clean(c);
    const found = keys.find((k) => clean(k) === t);
    if (found) return found;
  }
  return null;
}

export function buildMasterIndex(rows: Row[]): {
  index: Map<string, MasterRecord>;
  keyField: string;
  latField: string;
  lonField: string;
} {
  if (!rows.length) throw new Error("La base maestra está vacía.");
  const sample = rows[0];
  const keyField = findField(sample, ["nit", "numero de documento", "documento", "nit_real"]);
  const latField = findField(sample, ["latitud", "lat"]);
  const lonField = findField(sample, ["longitud", "lon", "lng"]);
  if (!keyField) throw new Error("Base maestra: no se encontró columna de documento/nit.");
  if (!latField || !lonField) throw new Error("Base maestra: no se encontraron columnas Latitud/Longitud.");

  const index = new Map<string, MasterRecord>();
  for (const r of rows) {
    const key = norm(r[keyField]);
    if (!key) continue;
    const lat = toNum(r[latField]);
    const lon = toNum(r[lonField]);
    if (lat == null || lon == null) continue;
    if (!index.has(key)) index.set(key, { key, lat, lon });
  }
  return { index, keyField, latField, lonField };
}

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function geocodeNominatim(
  direccion: string,
  barrio: string,
  ciudad: string,
  signal?: AbortSignal,
): Promise<{ lat: number; lon: number } | null> {
  const parts = [direccion, barrio, ciudad, "Colombia"].filter(Boolean).join(", ");
  if (!parts.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(parts)}`;
  try {
    const res = await fetch(url, {
      signal,
      headers: { "Accept-Language": "es" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export interface ProcessOptions {
  masterIndex: Map<string, MasterRecord>;
  inputRows: Row[];
  enableGeocode: boolean;
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
}

export async function processInput(opts: ProcessOptions): Promise<ProcessResult> {
  const { masterIndex, inputRows, enableGeocode, onProgress, signal } = opts;
  if (!inputRows.length) throw new Error("El archivo de entrada está vacío.");

  const sample = inputRows[0];
  const docField = findField(sample, ["numero de documento", "documento", "nit"]);
  const dirField = findField(sample, ["direccion cliente", "direccion", "direccion del servicio"]);
  const barrioField = findField(sample, ["barrio"]);
  const ciudadField = findField(sample, ["ciudad"]);
  const latField = findField(sample, ["latitud"]) ?? "Latitud";
  const lonField = findField(sample, ["longitud"]) ?? "Longitud";

  if (!docField) throw new Error("Archivo de entrada: falta columna 'Numero de documento'.");

  const stats = { total: inputRows.length, fromMaster: 0, geocoded: 0, notFound: 0 };
  const newMasterEntries: ProcessResult["newMasterEntries"] = [];
  const out: Row[] = [];

  for (let i = 0; i < inputRows.length; i++) {
    if (signal?.aborted) throw new Error("Cancelado");
    const row: Row = { ...inputRows[i] };
    const key = norm(row[docField]);
    const master = key ? masterIndex.get(key) : undefined;

    if (master) {
      row[latField] = master.lat;
      row[lonField] = master.lon;
      stats.fromMaster++;
    } else if (enableGeocode) {
      const direccion = dirField ? String(row[dirField] ?? "") : "";
      const barrio = barrioField ? String(row[barrioField] ?? "") : "";
      const ciudad = ciudadField ? String(row[ciudadField] ?? "") : "";
      onProgress?.(i, inputRows.length, `Geocodificando: ${direccion || key || "(sin dirección)"}`);
      const coords = await geocodeNominatim(direccion, barrio, ciudad, signal);
      if (coords) {
        row[latField] = coords.lat;
        row[lonField] = coords.lon;
        stats.geocoded++;
        if (key) {
          masterIndex.set(key, { key, lat: coords.lat, lon: coords.lon });
          newMasterEntries.push({ key, lat: coords.lat, lon: coords.lon, direccion, barrio, ciudad });
        }
      } else {
        row[latField] = null;
        row[lonField] = null;
        stats.notFound++;
      }
      // Respect Nominatim usage policy: 1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
    } else {
      if (row[latField] == null) row[latField] = null;
      if (row[lonField] == null) row[lonField] = null;
      stats.notFound++;
    }

    out.push(row);
    onProgress?.(i + 1, inputRows.length);
  }

  return { rows: out, latField, lonField, stats, newMasterEntries };
}

export function exportToXlsx(rows: Row[], filename: string, latField?: string, lonField?: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  // Ensure lat/lon columns are numeric-formatted
  if (latField || lonField) {
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    const headerRow = 0;
    const cols: Record<string, number> = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c })];
      if (cell) cols[String(cell.v)] = c;
    }
    for (const f of [latField, lonField]) {
      if (!f || cols[f] == null) continue;
      const c = cols[f];
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (cell && cell.v != null) {
          cell.t = "n";
          cell.z = "0.000000";
        }
      }
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
  XLSX.writeFile(wb, filename);
}
