'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api, ApiError } from '@/lib/api';
import type { Embarcacao } from '@/lib/types';
import type { CenterRequest } from '@/components/LeafletMap';

const LeafletMap = dynamic(() => import('@/components/LeafletMap').then((mod) => mod.LeafletMap), { ssr: false });

export default function MapaPage() {
  const { data: embarcacoes, loading, error, refetch } = useFetch<Embarcacao[]>('/embarcacoes');
  const [centerRequest, setCenterRequest] = useState<CenterRequest | null>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-none flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Mapa da Frota</h1>
        <p className="mt-1 text-sm text-foreground-soft">Localização atual de cada embarcação.</p>
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-[1fr_320px]">
        <LeafletMap embarcacoes={embarcacoes ?? []} centerRequest={centerRequest} />

        <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-card">
          <div className="flex-1 overflow-y-auto">
            {loading ? <p className="p-4 text-sm text-foreground-soft">Carregando…</p> : null}
            {!loading && embarcacoes?.length === 0 ? <p className="p-4 text-sm text-foreground-soft">Nenhuma embarcação cadastrada ainda.</p> : null}
            {embarcacoes?.map((v) => (
              <VesselRow
                key={v.id}
                vessel={v}
                onSaved={refetch}
                onCentralizar={() => setCenterRequest({ id: v.id, nonce: Date.now() })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VesselRow({ vessel, onSaved, onCentralizar }: { vessel: Embarcacao; onSaved: () => void; onCentralizar: () => void }) {
  const temCoords = vessel.latitude != null && vessel.longitude != null;
  const [lat, setLat] = useState(temCoords ? String(vessel.latitude) : '');
  const [lng, setLng] = useState(temCoords ? String(vessel.longitude) : '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (lat === '' || lng === '') {
      setErro('Preencha latitude e longitude.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.patch(`/embarcacoes/${vessel.id}/localizacao`, { latitude: Number(lat), longitude: Number(lng) });
      onSaved();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a localização.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="border-t border-line px-4 py-3 first:border-t-0">
      <p className="text-sm font-bold text-foreground">{vessel.nome}</p>
      <p className="mb-2 text-xs text-foreground-soft">
        {temCoords ? `${Number(vessel.latitude).toFixed(6)}, ${Number(vessel.longitude).toFixed(6)}` : 'Sem coordenadas cadastradas'}
      </p>
      {erro ? <p className="mb-2 text-xs text-danger">{erro}</p> : null}
      <div className="write-only mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          step="any"
          min={-90}
          max={90}
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        />
        <input
          type="number"
          step="any"
          min={-180}
          max={180}
          placeholder="Longitude"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={salvar}
          disabled={salvando}
          className="write-only rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          onClick={onCentralizar}
          disabled={!temCoords}
          className="rounded-md bg-background px-3 py-1 text-xs font-semibold text-foreground-soft hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          Centralizar
        </button>
      </div>
    </div>
  );
}
