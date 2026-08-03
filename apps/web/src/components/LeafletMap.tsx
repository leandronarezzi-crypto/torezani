'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMapInstance, Marker } from 'leaflet';
import { useEffect, useRef } from 'react';
import { escapeHtml } from '@/lib/format';
import type { Embarcacao } from '@/lib/types';

export interface CenterRequest {
  id: number;
  nonce: number;
}

const DEFAULT_CENTER: [number, number] = [-14.5, -45];
const DEFAULT_ZOOM = 4;

export function LeafletMap({ embarcacoes, centerRequest }: { embarcacoes: Embarcacao[]; centerRequest: CenterRequest | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());

  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      mapRef.current = map;
      renderMarkers(L);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((leafletModule) => renderMarkers(leafletModule.default));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacoes]);

  useEffect(() => {
    if (!centerRequest) return;
    const map = mapRef.current;
    const marker = markersRef.current.get(centerRequest.id);
    if (!map || !marker) return;
    map.setView(marker.getLatLng(), 13);
    marker.openPopup();
  }, [centerRequest]);

  function renderMarkers(L: typeof import('leaflet')) {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = new Map();

    const comCoordenadas = embarcacoes.filter((v) => v.latitude != null && v.longitude != null);
    comCoordenadas.forEach((v) => {
      const marker = L.marker([Number(v.latitude), Number(v.longitude)]).addTo(map);
      marker.bindPopup(`<strong>${escapeHtml(v.nome)}</strong><br><a href="/embarcacoes/${v.id}">Ver detalhes</a>`);
      markersRef.current.set(v.id, marker);
    });

    if (comCoordenadas.length) {
      const bounds = L.latLngBounds(comCoordenadas.map((v) => [Number(v.latitude), Number(v.longitude)] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }

  return <div ref={containerRef} className="leaflet-container h-full w-full rounded-xl border border-line" />;
}
