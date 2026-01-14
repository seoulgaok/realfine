"use client";

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Map as MapGL, MapRef, Source, Layer, Popup } from 'react-map-gl';
import type { MapLayerMouseEvent, FillLayer, LineLayer } from 'react-map-gl';
import { TrendingUp, Users, MapPin, X } from "lucide-react";
import Link from "next/link";
import 'mapbox-gl/dist/mapbox-gl.css';

export interface VaultInfo {
  dong: string;
  gu: string;
  tvl: number;
  participants: number;
  projects: number;
  isOpen: boolean;
  projectName?: string;
}

export interface DongBoundary {
  dong: string;
  gu: string;
  land_count: number;
  center_lat: number;
  center_lon: number;
  boundary_geojson: object | null;
}

interface VaultMapProps {
  vaults: VaultInfo[];
  boundaries: DongBoundary[];
  onSelectVault?: (dong: string) => void;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
}

function getTvlColor(tvl: number, isOpen: boolean): string {
  if (!isOpen) return "#e5e7eb";
  if (tvl >= 300000) return "#166534";
  if (tvl >= 200000) return "#15803d";
  if (tvl >= 100000) return "#22c55e";
  if (tvl >= 50000) return "#86efac";
  return "#dcfce7";
}

export function VaultMap({ vaults, boundaries, onSelectVault, className = "" }: VaultMapProps) {
  const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
  const [hoveredDong, setHoveredDong] = useState<string | null>(null);
  const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ lng: number; lat: number } | null>(null);
  const mapRef = useRef<MapRef>(null);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_WEB_KEY;

  const vaultMap = useMemo(() => {
    const map = new Map<string, VaultInfo>();
    vaults.forEach(v => map.set(v.dong, v));
    return map;
  }, [vaults]);

  const geoJsonData = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!boundaries?.length) return null;

    return {
      type: 'FeatureCollection',
      features: boundaries
        .filter(b => b.boundary_geojson)
        .map(b => {
          const vault = vaultMap.get(b.dong);
          return {
            type: 'Feature' as const,
            properties: {
              dongName: b.dong,
              gu: b.gu,
              isOpen: vault?.isOpen ?? false,
              tvl: vault?.tvl ?? 0,
              fillColor: getTvlColor(vault?.tvl ?? 0, vault?.isOpen ?? false),
              hasVault: !!vault,
            },
            geometry: b.boundary_geojson as GeoJSON.Geometry,
          };
        })
    };
  }, [boundaries, vaultMap]);

  const handleMapLoad = useCallback(() => setMapStyleLoaded(true), []);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features?.[0]) {
      setHoveredDong(e.features[0].properties?.dongName);
      const canvas = mapRef.current?.getCanvas();
      if (canvas) canvas.style.cursor = 'pointer';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredDong(null);
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = '';
  }, []);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const dongName = e.features?.[0]?.properties?.dongName;
    const vault = dongName ? vaultMap.get(dongName) : null;
    if (vault) {
      setSelectedVault(vault);
      setPopupCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      onSelectVault?.(dongName);
    }
  }, [vaultMap, onSelectVault]);

  const fillLayer: FillLayer = {
    id: 'dong-fill',
    type: 'fill',
    source: 'seoul-dongs',
    paint: {
      'fill-color': ['get', 'fillColor'],
      'fill-opacity': ['case', ['==', ['get', 'dongName'], hoveredDong], 0.9, 0.7]
    }
  };

  const lineLayer: LineLayer = {
    id: 'dong-border',
    type: 'line',
    source: 'seoul-dongs',
    paint: {
      'line-color': ['case',
        ['==', ['get', 'dongName'], hoveredDong], '#111827',
        ['get', 'hasVault'], '#166534',
        '#9ca3af'
      ],
      'line-width': ['case',
        ['==', ['get', 'dongName'], hoveredDong], 3,
        ['get', 'hasVault'], 2,
        1
      ]
    }
  };

  if (!MAPBOX_TOKEN) {
    return <div className={`flex items-center justify-center bg-gray-100 border-2 border-gray-200 ${className}`}>
      <p className="text-gray-500">Map configuration error</p>
    </div>;
  }

  if (!geoJsonData) {
    return <div className={`flex items-center justify-center bg-gray-100 border-2 border-gray-200 ${className}`}>
      <p className="text-gray-500">No boundary data</p>
    </div>;
  }

  return (
    <div className={`relative ${className}`}>
      <MapGL
        ref={mapRef}
        initialViewState={{ latitude: 37.5326, longitude: 126.9679, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={handleMapLoad}
        interactiveLayerIds={mapStyleLoaded ? ['dong-fill'] : []}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {mapStyleLoaded && (
          <Source id="seoul-dongs" type="geojson" data={geoJsonData}>
            <Layer {...fillLayer} />
            <Layer {...lineLayer} />
          </Source>
        )}

        {selectedVault && popupCoords && (
          <Popup
            longitude={popupCoords.lng}
            latitude={popupCoords.lat}
            anchor="bottom"
            onClose={() => { setSelectedVault(null); setPopupCoords(null); }}
            closeButton={false}
            offset={15}
          >
            <div className="p-4 min-w-[200px]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedVault.dong}</h3>
                  <span className="text-sm text-gray-500">{selectedVault.gu}</span>
                </div>
                <button onClick={() => { setSelectedVault(null); setPopupCoords(null); }} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border ${selectedVault.isOpen ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {selectedVault.isOpen ? 'Vault Open' : 'Coming Soon'}
                </span>
              </div>

              {selectedVault.isOpen && (
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" />TVL</span>
                    <span className="font-bold">{formatNumber(selectedVault.tvl)} USDT0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" />Participants</span>
                    <span className="font-bold">{selectedVault.participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />Projects</span>
                    <span className="font-bold">{selectedVault.projects}</span>
                  </div>
                </div>
              )}

              {selectedVault.isOpen && (
                <Link href={`/realfi/dong/${encodeURIComponent(selectedVault.dong)}`}
                  className="block w-full text-center py-2 px-4 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                  View Vault
                </Link>
              )}
            </div>
          </Popup>
        )}
      </MapGL>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-gray-200 p-3 text-sm">
        <div className="font-bold text-gray-900 mb-2">Vault TVL</div>
        <div className="space-y-1.5">
          {[
            { color: '#166534', label: '300K+' },
            { color: '#15803d', label: '200K-300K' },
            { color: '#22c55e', label: '100K-200K' },
            { color: '#86efac', label: '50K-100K' },
            { color: '#dcfce7', label: '<50K' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: color }} />
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-300" />
            <span className="text-gray-700">Coming Soon</span>
          </div>
        </div>
      </div>

      {hoveredDong && (
        <div className="absolute top-4 left-4 bg-white border-2 border-gray-900 px-3 py-2 text-sm font-bold shadow-lg">
          {hoveredDong}
          {vaultMap.get(hoveredDong) && (
            <span className="ml-2 text-green-600">{formatNumber(vaultMap.get(hoveredDong)!.tvl)} USDT0</span>
          )}
        </div>
      )}
    </div>
  );
}