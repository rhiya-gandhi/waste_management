import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RecyclerFacility, WasteBatch } from '../types/database.types';
import { MapPin, Navigation, Info, AlertCircle } from 'lucide-react';

// Fix Leaflet's default icon paths in bundled environments
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const recyclerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const batchIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapViewProps {
  recyclers?: RecyclerFacility[];
  batches?: WasteBatch[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  maskPrivateAddresses?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  recyclers = [],
  batches = [],
  center = [12.9716, 77.5946], // Default Bangalore center
  zoom = 12,
  height = '450px',
  maskPrivateAddresses = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer with proper attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      let pointsCount = 0;

      // Add Recycler Markers
      recyclers.forEach((rec) => {
        if (rec.latitude && rec.longitude) {
          const marker = L.marker([rec.latitude, rec.longitude], { icon: recyclerIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong style="color: #15803d; font-size: 13px;">${rec.facility_name}</strong><br/>
              <span style="color: #64748b;">${rec.facility_address}</span><br/>
              <span style="font-weight: 600; color: #0284c7;">Radius: ${rec.max_distance_km} km</span><br/>
              <span style="font-size: 10px; color: #16a34a; font-weight: bold;">✔ Verified Recycler</span>
            </div>
          `);
          bounds.extend([rec.latitude, rec.longitude]);
          pointsCount++;
        }
      });

      // Add Waste Batch Markers (with privacy protection)
      batches.forEach((b) => {
        if (b.latitude && b.longitude) {
          const displayAddress = maskPrivateAddresses
            ? b.pickup_address.split(',').slice(-2).join(',') || 'Neighborhood Sector'
            : b.pickup_address;

          const marker = L.marker([b.latitude, b.longitude], { icon: batchIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong style="color: #0369a1; font-size: 13px;">${b.title}</strong><br/>
              <span>${b.quantity} ${b.unit} • ${b.material_category.replace('_', ' ')}</span><br/>
              <span style="color: #64748b;">📍 ${displayAddress}</span><br/>
              <span style="font-size: 10px; color: #d97706; font-weight: 600;">Status: ${b.status}</span>
            </div>
          `);
          bounds.extend([b.latitude, b.longitude]);
          pointsCount++;
        }
      });

      // Auto-fit bounds if markers exist
      if (pointsCount > 1) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } catch (err) {
      console.error('Leaflet map error', err);
      setMapError('Interactive map tiles could not be initialized in this view.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [recyclers, batches, center, zoom, maskPrivateAddresses]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {mapError ? (
        <div className="p-8 text-center bg-amber-50 text-amber-800 rounded-2xl flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-sm font-semibold">{mapError}</p>
          <p className="text-xs text-amber-700 mt-1">
            Displaying the list-based location fallback below.
          </p>
        </div>
      ) : (
        <>
          <div ref={mapContainerRef} style={{ height, width: '100%' }} />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 text-xs shadow-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-700 font-medium">Verified Recyclers ({recyclers.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
              <span className="text-slate-700 font-medium">Waste Batches ({batches.length})</span>
            </div>
            {maskPrivateAddresses && (
              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Private generator addresses masked</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
