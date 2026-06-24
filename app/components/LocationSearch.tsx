"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "framer-motion";

interface LocationResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultQuery?: string;
}

export function LocationSearch({ onLocationSelect, defaultQuery = "" }: LocationSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function searchLocation() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      // 1. Check if it's already a lat/lng coordinate string (e.g. "40.71, -74.00")
      const coordMatch = debouncedQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[3]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setResults([{
            display_name: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat: lat.toString(),
            lon: lng.toString()
          }]);
          setIsOpen(true);
          return;
        }
      }

      // 2. Fetch from Nominatim API (Free OpenStreetMap geocoding)
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5`, {
          headers: {
            "Accept-Language": "en"
          }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      } finally {
        setIsSearching(false);
      }
    }

    searchLocation();
  }, [debouncedQuery]);

  const handleSelect = (result: LocationResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Update local input display (take first part of name for brevity)
    setQuery(result.display_name.split(',')[0]);
    setIsOpen(false);
    
    // Pass back to parent
    onLocationSelect(lat, lng);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-slate-500">Location Search</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="City, Country, or Lat, Lng"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 pl-9 font-mono text-sm text-slate-200 outline-none focus:border-sky-500/50 focus:bg-sky-500/10 transition-colors"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {isSearching ? (
             <span className="block h-3 w-3 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
          ) : (
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 mt-2 w-full rounded-lg border border-white/10 bg-slate-900/95 shadow-xl backdrop-blur-xl max-h-60 overflow-y-auto"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-sky-500/10 border-b border-white/5 last:border-0 transition-colors group cursor-pointer"
              >
                <p className="font-sans text-sm text-slate-200 truncate group-hover:text-sky-300 transition-colors">{r.display_name}</p>
                <p className="font-mono text-[10px] text-slate-500 mt-1">{parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
