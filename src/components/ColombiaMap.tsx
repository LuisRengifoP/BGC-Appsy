import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeocodingRecord } from "@/types";

const cities = [
  { name: "Bogotá", lat: 4.711, lng: -74.0721 },
  { name: "Medellín", lat: 6.2442, lng: -75.5812 },
  { name: "Cartagena", lat: 10.391, lng: -75.5144 },
  { name: "Barranquilla", lat: 10.9685, lng: -74.7813 },
  { name: "Santa Marta", lat: 11.2408, lng: -74.199 },
  { name: "Valledupar", lat: 10.4631, lng: -73.2532 },
  { name: "Montería", lat: 8.748, lng: -75.8814 },
  { name: "Sincelejo", lat: 9.3047, lng: -75.3958 },
  { name: "Tadó", lat: 5.2667, lng: -76.5667 },
];

const cityIcon = L.divIcon({
  className: "colombia-city-marker",
  html: `<div style="
    width:14px;height:14px;
    background:#2563eb;
    border:2.5px solid #fff;
    border-radius:50%;
    box-shadow:0 1px 4px rgba(0,0,0,.35);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function geocodedIcon(color: string) {
  return L.divIcon({
    className: "colombia-geo-marker",
    html: `<div style="
      width:8px;height:8px;
      background:${color};
      border:1.5px solid #fff;
      border-radius:50%;
      box-shadow:0 0 3px rgba(0,0,0,.25);
    "></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
}

const estadoColors: Record<GeocodingRecord["estado"], string> = {
  encontrado: "#16a34a",
  geocodificado: "#ea580c",
  no_encontrado: "#dc2626",
};

interface ColombiaMapProps {
  records?: GeocodingRecord[];
}

export function ColombiaMap({ records = [] }: ColombiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.LayerGroup | null>(null);

  const stats = useMemo(() => {
    const byCity: Record<string, { encontrado: number; geocodificado: number; no_encontrado: number }> = {};
    let totalCoords = 0;

    for (const r of records) {
      if (r.latitud == null || r.longitud == null) continue;
      totalCoords++;
      const city = r.ciudad || "Sin ciudad";
      if (!byCity[city]) byCity[city] = { encontrado: 0, geocodificado: 0, no_encontrado: 0 };
      byCity[city][r.estado]++;
    }

    return { byCity, totalCoords };
  }, [records]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([4.5709, -74.2973], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "\u00a9 OpenStreetMap",
    }).addTo(map);

    cities.forEach((city) => {
      L.marker([city.lat, city.lng], { icon: cityIcon })
        .addTo(map)
        .bindPopup(`<strong>${city.name}</strong><br/>${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}`);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoLayerRef.current) {
      map.removeLayer(geoLayerRef.current);
    }

    if (records.length === 0) return;

    const layer = L.layerGroup().addTo(map);

    const grouped: Record<string, GeocodingRecord[]> = {};
    for (const r of records) {
      if (r.latitud == null || r.longitud == null) continue;
      const city = r.ciudad || "Sin ciudad";
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(r);
    }

    for (const city of Object.keys(grouped)) {
      const cityCoords = cities.find(
        (c) => c.name.toLowerCase() === city.toLowerCase()
      );

      const total = grouped[city].length;

      if (cityCoords) {
        const label = L.divIcon({
          className: "colombia-city-label",
          html: `<div style="
            position:absolute;top:-22px;left:50%;transform:translateX(-50%);
            background:rgba(255,255,255,.92);border:1px solid #cbd5e1;
            border-radius:4px;padding:1px 6px;white-space:nowrap;
            font-size:11px;font-weight:600;color:#1e293b;
            box-shadow:0 1px 2px rgba(0,0,0,.1);
          ">${city} <span style="color:#64748b;font-weight:400">(${total})</span></div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([cityCoords.lat, cityCoords.lng], { icon: label, interactive: false }).addTo(layer);
      }

      for (const r of grouped[city]) {
        if (r.latitud == null || r.longitud == null) continue;
        const lat = r.latitud;
        const lng = r.longitud;
        const color = estadoColors[r.estado];
        const marker = L.marker([lat, lng], {
          icon: geocodedIcon(color),
        }).addTo(layer);

        const estadoLabel =
          r.estado === "encontrado"
            ? "Encontrado en base maestra"
            : r.estado === "geocodificado"
              ? "Geocodificado autom\u00e1ticamente"
              : "Sin coordenadas";

        marker.bindPopup(`
          <div style="font-size:12px;line-height:1.5">
            <strong>${r.cliente}</strong><br/>
            <span style="color:#64748b">${r.direccion}</span><br/>
            <span style="color:${color};font-weight:600">${estadoLabel}</span><br/>
            <span style="font-family:monospace;font-size:11px">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
          </div>
        `);
      }
    }

    geoLayerRef.current = layer;
  }, [records]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {records.length > 0 ? "Resultados Geogr\u00e1ficos" : "Ciudades Principales"}
        </h3>
        {records.length > 0 && (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shadow-sm" />
              Ciudad
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-600 border border-white shadow-sm" />
              Encontrado
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 border border-white shadow-sm" />
              Geocodificado
            </span>
          </div>
        )}
      </div>
      <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
      {records.length > 0 && stats.totalCoords > 0 && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          {stats.totalCoords} coordenadas geolocalizadas
          {Object.keys(stats.byCity).length > 0 && (
            <span> en {Object.keys(stats.byCity).length} ciudades</span>
          )}
        </div>
      )}
    </div>
  );
}
