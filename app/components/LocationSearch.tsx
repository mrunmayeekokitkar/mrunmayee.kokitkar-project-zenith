"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { useLocationStore } from "../lib/api-client";
import { parseAnyCoordinates, validateCoordinates } from "../lib/coordinates";

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  accuracy: string;
}

interface LocationSearchProps {
  onLocationSelect?: (lat: number, lng: number, name?: string) => void;
  defaultQuery?: string;
  showCurrentLocation?: boolean;
  /** When true, selecting a suggestion updates state only — no navigation side effects */
  updateInPlace?: boolean;
}

export function LocationSearch({
  onLocationSelect,
  defaultQuery = "",
  showCurrentLocation = true,
  updateInPlace = false,
}: LocationSearchProps) {
  const { latitude, longitude, locationName, setLocation } = useLocationStore();
  const [query, setQuery] = useState(defaultQuery || locationName);
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    function handlePointerOutside(event: Event) {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        const portal = document.getElementById("location-search-portal");
        if (portal && portal.contains(target)) return;
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerOutside);
    document.addEventListener("touchstart", handlePointerOutside);
    return () => {
      document.removeEventListener("pointerdown", handlePointerOutside);
      document.removeEventListener("touchstart", handlePointerOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    async function searchLocation() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      const coords = parseAnyCoordinates(debouncedQuery);
      if (coords) {
        const validationError = validateCoordinates(coords.lat, coords.lon);
        if (validationError) {
          setError(validationError);
          setResults([]);
          return;
        }
        setResults([
          {
            lat: coords.lat,
            lng: coords.lon,
            displayName: coords.label,
            accuracy: "coordinates",
          },
        ]);
        setIsOpen(true);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(debouncedQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults([data]);
          setIsOpen(true);
        } else {
          const err = await res.json().catch(() => ({}));
          setResults([]);
          setError(err.error ?? "Location not found");
        }
      } catch {
        setError("Geocoding service unavailable");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }

    searchLocation();
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (result: GeocodeResult) => {
      if (result?.lat == null || result?.lng == null || isNaN(result.lat) || isNaN(result.lng)) {
        return;
      }

      const validationError = validateCoordinates(result.lat, result.lng);
      if (validationError) {
        setError(validationError);
        return;
      }

      const name = result.displayName.split(",")[0];
      setQuery(name);
      setIsOpen(false);
      setError(null);
      setLocation(result.lat, result.lng, name);
      onLocationSelect?.(result.lat, result.lng, name);
    },
    [setLocation, onLocationSelect]
  );

  const handleSelectFirstSuggestion = useCallback(() => {
    if (results.length > 0) {
      handleSelect(results[0]);
      return;
    }

    const coords = parseAnyCoordinates(query);
    if (coords) {
      handleSelect({
        lat: coords.lat,
        lng: coords.lon,
        displayName: coords.label,
        accuracy: "coordinates",
      });
    }
  }, [results, query, handleSelect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const coords = parseAnyCoordinates(query);
    if (coords) {
      handleSelect({
        lat: coords.lat,
        lng: coords.lon,
        displayName: coords.label,
        accuracy: "coordinates",
      });
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        handleSelect(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Location not found");
      }
    } catch {
      setError("Geocoding service unavailable");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSelectFirstSuggestion();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const dropdown =
    typeof document !== "undefined" && isOpen && results.length > 0 && dropdownPos
      ? createPortal(
          <AnimatePresence>
            <motion.div
              id="location-search-portal"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              className="fixed rounded-lg border border-white/10 bg-slate-900/95 shadow-xl backdrop-blur-xl max-h-60 overflow-y-auto"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 9999,
              }}
            >
              {results.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-3 hover:bg-sky-500/10 border-b border-white/5 last:border-0 transition-colors group cursor-pointer min-h-[44px]"
                >
                  <p className="font-sans text-sm text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                    {r.displayName}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500 mt-1">
                    {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                  </p>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <div
      className="relative w-full"
      ref={wrapperRef}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-slate-500">
        Location Search
      </label>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            updateDropdownPosition();
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="City, Country, or Lat, Lng"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 pl-9 font-mono text-sm text-slate-200 outline-none focus:border-sky-500/50 focus:bg-sky-500/10 transition-colors min-h-[44px]"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {isSearching ? (
            <span className="block h-3 w-3 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          )}
        </div>
      </form>

      {showCurrentLocation && (
        <p className="mt-1.5 font-mono text-[9px] text-slate-500">
          Current: {locationName} ({latitude.toFixed(4)}, {longitude.toFixed(4)})
        </p>
      )}

      {error && (
        <p className="mt-1.5 font-mono text-[9px] text-red-400">{error}</p>
      )}

      {updateInPlace && (
        <p className="mt-1 font-mono text-[8px] text-slate-600">
          Press Enter or pick a suggestion to update telemetry in place
        </p>
      )}

      {dropdown}
    </div>
  );
}
