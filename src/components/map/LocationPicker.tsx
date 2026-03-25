"use client";

import { useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { motion } from 'framer-motion';

// Fix Leaflet default icon issues for Next.js
if (typeof window !== 'undefined' && L.Icon) {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLocation?: { latitude: number, longitude: number } | null;
}

const LocationPicker = ({ onLocationSelect, initialLocation }: LocationPickerProps) => {
    const [position, setPosition] = useState<L.LatLng | null>(
        initialLocation ? new L.LatLng(initialLocation.latitude, initialLocation.longitude) : null
    );

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            },
        });
        return position ? <Marker position={position} /> : null;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[300px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        >
            <MapContainer
                center={position || [0, 0]}
                zoom={position ? 13 : 2}
                className="h-full w-full"
                style={{ background: '#0a0a0a' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapEvents />
            </MapContainer>
            <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-3xl flex items-center justify-between pointer-events-auto">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                        {position ? `Pinned: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : "Click grid to pin resonance"}
                    </p>
                    {position && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setPosition(null);
                                onLocationSelect(0, 0); // Reset or handle as null
                            }}
                            className="text-[8px] font-black uppercase text-neutral-500 hover:text-white"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default LocationPicker;

