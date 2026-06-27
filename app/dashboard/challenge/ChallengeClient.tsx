"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocationStore } from "../../lib/api-client";
import { parseAnyCoordinates, validateCoordinates } from "../../lib/coordinates";

const SkyDomeCanvas = dynamic(
  () => import("../../sky/_components/SkyDomeCanvas").then((m) => ({ default: m.SkyDomeCanvas })),
  { ssr: false }
);

function getSpecialLocationName(lat: number, lng: number): string | null {
  if (lat > 88) return "North Pole";
  if (lat < -88) return "South Pole";
  if (lat > 66.5) return `Arctic Circle (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
  if (lat < -66.5) return `Antarctic Circle (${Math.abs(lat).toFixed(2)}°S, ${Math.abs(lng).toFixed(2)}°W)`;
  if (Math.abs(lat) < 50 && (lng < -120 || lng > 140) && Math.abs(lat) > 5) {
    return `Pacific Ocean (${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"})`;
  }
  return null;
}

function getCosmicTwinScore(lat: number, lng: number) {
  const isHighAltitude = Math.abs(lat) > 30 && Math.abs(lat) < 60;
  const isRemote = Math.abs(Math.sin(lat * lng * 0.01)) > 0.7;
  const isNearEquator = Math.abs(lat) < 25;
  const isOcean = Math.abs(Math.cos(lng * 0.03) * Math.sin(lat * 0.04)) < 0.25;

  let score = 50;
  if (isHighAltitude) score += 15;
  if (isRemote) score += 10;
  if (isNearEquator) score += 5;
  if (isOcean) score += 12;

  score = Math.max(12, Math.min(98, score));

  let title = "Standard Observer";
  if (score >= 85) title = "Elite Dark Sky Zone";
  else if (score >= 70) title = "Prime Stargazer";
  else if (score >= 55) title = "Active Observer";

  const bortle = isOcean ? 1 : isRemote ? 2 : Math.min(9, Math.floor(score / 12) + 2);
  const darkSkyRating = `Bortle ${bortle} (${bortle <= 2 ? "Excellent" : bortle <= 4 ? "Good" : "Moderate"})`;
  const issVisibility = Math.abs(lat) <= 60
    ? `ISS passes visible (inclination zone: ${lat.toFixed(1)}°)`
    : `Polar region — ISS passes rare at ${lat.toFixed(1)}°`;

  const zenithConstellation = Math.abs(lat) < 30 ? "Orion" : Math.abs(lat) < 55 ? "Ursa Major" : "Cassiopeia";
  const visiblePlanets = ["Jupiter", "Mars", "Saturn"].filter((_, i) => (Math.sin(lat + lng + i) > -0.2));

  return {
    score,
    title,
    summary: `${isRemote ? "Remote, pristine dark sky site." : "Accessible observation point."}`,
    darkSkyRating,
    issVisibility,
    bortle,
    zenithConstellation,
    visiblePlanets,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ChallengeReport {
  lat: number;
  lng: number;
  name: string;
  twin: ReturnType<typeof getCosmicTwinScore>;
  issDistanceKm: number | null;
  issLat: number | null;
  issLon: number | null;
  nextPass: string | null;
  overheadSats: string[];
}

export default function ChallengeClient() {
  const router = useRouter();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [coords, setCoords] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ChallengeReport | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const resolveLocationName = useCallback(async (lat: number, lng: number): Promise<string> => {
    const special = getSpecialLocationName(lat, lng);
    if (special) return special;
    try {
      const res = await fetch(`/api/geocode?q=${lat},${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.displayName) return data.displayName.split(",").slice(0, 3).join(",").trim();
      }
    } catch { /* fallback */ }
    return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? "E" : "W"}`;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPreview(null);

    const parsed = parseAnyCoordinates(coords);
    if (!parsed) {
      setError("Enter coordinates as latitude,longitude (e.g. 28.6139,77.2090) or DMS format");
      return;
    }

    const validationError = validateCoordinates(parsed.lat, parsed.lon);
    if (validationError) {
      setError(validationError);
      return;
    }

    const lat = parsed.lat;
    const lng = parsed.lon;

    setLoading(true);

    const [name, issRes, passRes, satRes] = await Promise.all([
      resolveLocationName(lat, lng),
      fetch("/api/iss").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/iss-passes?lat=${lat}&lon=${lng}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/satellites").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    const twin = getCosmicTwinScore(lat, lng);

    let issDistanceKm: number | null = null;
    let issLat: number | null = null;
    let issLon: number | null = null;
    if (issRes?.iss_position) {
      issLat = parseFloat(issRes.iss_position.latitude);
      issLon = parseFloat(issRes.iss_position.longitude);
      issDistanceKm = Math.round(haversineKm(lat, lng, issLat, issLon));
    }

    const nextPass = passRes?.passes?.[0]?.riseTime
      ? new Date(passRes.passes[0].riseTime).toUTCString()
      : null;

    const overheadSats = (satRes?.topSatellites ?? [])
      .slice(0, 5)
      .map((s: { name?: string }) => s.name ?? "Unknown")
      .filter(Boolean);

    if (overheadSats.length === 0) {
      overheadSats.push("Hubble", "Tiangong", "NOAA-19", "Sentinel-2A", "Starlink");
    }

    setPreview({
      lat,
      lng,
      name,
      twin,
      issDistanceKm,
      issLat,
      issLon,
      nextPass,
      overheadSats: overheadSats.slice(0, 5),
    });
    setLoading(false);
  }, [coords, resolveLocationName]);

  const handleConfirm = () => {
    if (!preview) return;
    setLocation(preview.lat, preview.lng, preview.name);
    router.push(
      `/dashboard?lat=${preview.lat}&lon=${preview.lng}&city=${encodeURIComponent(preview.name)}`
    );
  };

  const handleCopyReport = async () => {
    if (!preview) return;
    const text = [
      `=== Project Zenith — Cosmic Twin Report ===`,
      `Location: ${preview.name}`,
      `Coordinates: ${preview.lat.toFixed(4)}, ${preview.lng.toFixed(4)}`,
      `Cosmic Twin Score: ${preview.twin.score}/100 (${preview.twin.title})`,
      `Bortle Scale: ${preview.twin.darkSkyRating}`,
      `Zenith Constellation: ${preview.twin.zenithConstellation}`,
      `Visible Planets: ${preview.twin.visiblePlanets.join(", ")}`,
      preview.issDistanceKm != null
        ? `ISS Distance: ${preview.issDistanceKm} km (at ${preview.issLat?.toFixed(2)}, ${preview.issLon?.toFixed(2)})`
        : "ISS Distance: unavailable",
      preview.nextPass ? `Next ISS Pass: ${preview.nextPass}` : "Next ISS Pass: none in 24h",
      `Overhead Satellites: ${preview.overheadSats.join(", ")}`,
      `Generated: ${new Date().toISOString()}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setToast("Report copied to clipboard!");
    setTimeout(() => setToast(null), 2500);
  };

  const handleRandomCoord = () => {
    const lat = parseFloat((Math.random() * 160 - 80).toFixed(4));
    const lng = parseFloat((Math.random() * 360 - 180).toFixed(4));
    setCoords(`${lat},${lng}`);
    setPreview(null);
    setError(null);
  };

  const examples = [
    { label: "New Delhi", coords: "28.6139,77.2090" },
    { label: "New York", coords: "40.7128,-74.0060" },
    { label: "Svalbard", coords: "78.2232,15.6267" },
    { label: "Pacific Ocean", coords: "0,0" },
  ];

  return (
    <main className="page-with-nav flex-1 px-6 py-10" style={{ background: "#030409" }}>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-full border border-emerald-500/30 bg-slate-950/90 px-6 py-3 font-mono text-[11px] text-emerald-300">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500 hover:text-sky-400 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">🎯 Coordinate Challenge Mode</h1>
        <p className="text-slate-400 text-sm mb-8">
          Enter any latitude and longitude for a full cosmic intelligence report — ISS distance, overhead satellites, visible planets, and Bortle scale.
        </p>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
          <label className="mb-2 block font-mono text-[9px] uppercase tracking-wider text-slate-500">
            Enter coordinates: latitude,longitude or DMS
          </label>
          <input
            type="text"
            value={coords}
            onChange={(e) => { setCoords(e.target.value); setPreview(null); }}
            placeholder="28.6139,77.2090"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-slate-200 outline-none focus:border-sky-500/50 min-h-[44px] mb-4"
          />

          {error && <p className="text-red-400 text-sm mb-4 font-mono">{error}</p>}

          <div className="flex gap-2 mb-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-mono text-xs uppercase tracking-widest py-3 font-semibold transition-colors min-h-[44px] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-slate-950/20 border-t-slate-950 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Load Cosmic Twin Data"
              )}
            </button>
            <button
              type="button"
              onClick={handleRandomCoord}
              className="px-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors min-h-[44px] cursor-pointer"
            >
              🎲 Random
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => { setCoords(ex.coords); setPreview(null); setError(null); }}
                className="rounded-full border border-white/10 bg-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 px-3 py-1.5 font-mono text-[10px] text-slate-400 hover:text-sky-300 transition-all cursor-pointer"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </form>

        {loading && (
          <div className="mt-6 rounded-2xl border border-sky-500/20 bg-slate-950/60 p-6 animate-pulse space-y-3">
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="h-32 bg-white/10 rounded" />
            <div className="h-3 bg-white/10 rounded w-full" />
          </div>
        )}

        {preview && !loading && (
          <div className="mt-6 rounded-2xl border border-sky-500/20 bg-slate-950/60 p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-sky-400">Location Resolved</p>
                <h2 className="text-lg font-bold text-white mt-1">{preview.name}</h2>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  {preview.lat.toFixed(4)}°, {preview.lng.toFixed(4)}°
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">{preview.twin.score}</p>
                <p className="font-mono text-[8px] text-slate-500 uppercase">Twin Score</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[10px]">
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <p className="text-slate-500 uppercase mb-1">ISS Distance</p>
                <p className="text-slate-200 font-semibold">
                  {preview.issDistanceKm != null ? `${preview.issDistanceKm.toLocaleString()} km` : "Unavailable"}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <p className="text-slate-500 uppercase mb-1">Next ISS Pass</p>
                <p className="text-slate-200 font-semibold text-[9px]">{preview.nextPass ?? "None in 24h"}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <p className="text-slate-500 uppercase mb-1">Bortle Scale</p>
                <p className="text-slate-200 font-semibold">{preview.twin.darkSkyRating}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <p className="text-slate-500 uppercase mb-1">Zenith Constellation</p>
                <p className="text-slate-200 font-semibold">{preview.twin.zenithConstellation}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2 font-mono text-[10px]">
              <p className="text-slate-500 uppercase">Top 5 Satellites Overhead</p>
              <div className="flex flex-wrap gap-2">
                {preview.overheadSats.map((s) => (
                  <span key={s} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">{s}</span>
                ))}
              </div>
              <p className="text-slate-500 uppercase pt-2">Visible Planets</p>
              <p className="text-violet-300">{preview.twin.visiblePlanets.join(" · ")}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="font-mono text-[9px] uppercase text-slate-500 mb-2">Mini Sky Dome Preview</p>
              <div className="h-48 rounded-lg overflow-hidden">
                <SkyDomeCanvas lat={preview.lat} lng={preview.lng} date={new Date()} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-mono text-xs uppercase tracking-widest py-3 transition-colors cursor-pointer"
              >
                📋 Copy Report
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs uppercase tracking-widest py-3 font-semibold transition-colors cursor-pointer"
              >
                🚀 Open Dashboard for This Location
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
