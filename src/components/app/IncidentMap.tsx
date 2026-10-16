import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident, Priority } from "@/lib/types";
import { CITY } from "@/lib/demo-data";

export interface IncidentMapProps {
  incidents: Incident[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  cluster?: boolean;
  hotspots?: boolean;
  fitSignal?: number;
  pick?: { point: { lat: number; lng: number } | null; onPick: (p: { lat: number; lng: number }) => void };
  center?: [number, number];
  zoom?: number;
}

const PRIO_CLASS: Record<Priority, string> = {
  Critical: "bg-critical",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-success",
};

function markerIcon(p: Priority, selected: boolean) {
  const size = selected ? 20 : 14;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="block rounded-full ${PRIO_CLASS[p]} ring-2 ring-card shadow-elevated ${selected ? "outline-2 outline-foreground" : ""}" style="width:${size}px;height:${size}px"></span>`,
  });
}

function clusterIcon(n: number, hasCritical: boolean) {
  const size = n > 20 ? 44 : n > 8 ? 36 : 30;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="flex items-center justify-center rounded-full text-xs font-semibold ${hasCritical ? "bg-critical/85" : "bg-primary/85"} text-primary-foreground ring-4 ${hasCritical ? "ring-critical/25" : "ring-primary/25"}" style="width:${size}px;height:${size}px">${n}</span>`,
  });
}

export default function IncidentMap({ incidents, selectedId, onSelect, className, cluster = true, hotspots = false, fitSignal, pick, center, zoom }: IncidentMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pickLayer = useRef<L.LayerGroup | null>(null);
  const latest = useRef({ incidents, selectedId, onSelect, cluster, hotspots, pick });
  latest.current = { incidents, selectedId, onSelect, cluster, hotspots, pick };

  const draw = () => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const { incidents, selectedId, onSelect, cluster, hotspots } = latest.current;
    if (hotspots) {
      const cells = new Map<string, Incident[]>();
      for (const i of incidents) {
        const k = `${Math.round(i.lat * 60)}:${Math.round(i.lng * 60)}`;
        cells.set(k, [...(cells.get(k) ?? []), i]);
      }
      for (const list of cells.values()) {
        if (list.length < 2) continue;
        const lat = list.reduce((a, b) => a + b.lat, 0) / list.length;
        const lng = list.reduce((a, b) => a + b.lng, 0) / list.length;
        L.circle([lat, lng], { radius: 250 + list.length * 120, stroke: false, fillColor: "#e5484d", fillOpacity: Math.min(0.12 + list.length * 0.05, 0.45), interactive: false }).addTo(g);
      }
    }
    const z = m.getZoom();
    if (cluster && z < 14) {
      const cellSize = z < 12 ? 0.03 : 0.012;
      const cells = new Map<string, Incident[]>();
      for (const i of incidents) {
        const k = `${Math.floor(i.lat / cellSize)}:${Math.floor(i.lng / cellSize)}`;
        cells.set(k, [...(cells.get(k) ?? []), i]);
      }
      for (const list of cells.values()) {
        if (list.length === 1) {
          const i = list[0];
          L.marker([i.lat, i.lng], { icon: markerIcon(i.priority, i.id === selectedId), title: `${i.ref} · ${i.title}`, keyboard: true }).on("click", () => onSelect?.(i.id)).addTo(g);
          continue;
        }
        const lat = list.reduce((a, b) => a + b.lat, 0) / list.length;
        const lng = list.reduce((a, b) => a + b.lng, 0) / list.length;
        L.marker([lat, lng], { icon: clusterIcon(list.length, list.some((i) => i.priority === "Critical")), title: `${list.length} incidents` })
          .on("click", () => m.flyTo([lat, lng], Math.min(z + 2, 16)))
          .addTo(g);
      }
    } else {
      for (const i of incidents) {
        L.marker([i.lat, i.lng], { icon: markerIcon(i.priority, i.id === selectedId), title: `${i.ref} · ${i.title}`, keyboard: true }).on("click", () => onSelect?.(i.id)).addTo(g);
      }
    }
  };

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView(center ?? CITY.center, zoom ?? 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    pickLayer.current = L.layerGroup().addTo(m);
    m.on("zoomend", draw);
    m.on("click", (e: L.LeafletMouseEvent) => latest.current.pick?.onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    draw();
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(draw, [incidents, selectedId, cluster, hotspots]);

  useEffect(() => {
    const m = map.current;
    if (!m || !selectedId) return;
    const i = incidents.find((x) => x.id === selectedId);
    if (i) m.flyTo([i.lat, i.lng], Math.max(m.getZoom(), 15), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const m = map.current;
    if (!m || fitSignal === undefined || !incidents.length) return;
    m.fitBounds(L.latLngBounds(incidents.map((i) => [i.lat, i.lng])), { padding: [30, 30] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  useEffect(() => {
    const g = pickLayer.current;
    if (!g) return;
    g.clearLayers();
    if (pick?.point) {
      L.marker([pick.point.lat, pick.point.lng], { icon: markerIcon("Critical", true) }).addTo(g);
      map.current?.panTo([pick.point.lat, pick.point.lng]);
    }
  }, [pick?.point]);

  return <div ref={el} className={className} role="application" aria-label="Interactive city incident map" />;
}
