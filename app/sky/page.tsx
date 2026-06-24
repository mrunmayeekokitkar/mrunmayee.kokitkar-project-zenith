"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocationSearch } from "../components/LocationSearch";

/* ------------------------------------------------------------------ */
/* Types & Math                                                       */
/* ------------------------------------------------------------------ */

interface GeoCoords {
  lat: number;
  lng: number;
}

interface SkyData {
  sunAltitude: number;
  sunAzimuth: number;
  moonPhase: number;
  siderealTime: number;
  dayLengthHr: number;
  isDay: boolean;
}

// Simple deterministic math to calculate sky values based on lat/lng and date
function calculateSkyData(date: Date, coords: GeoCoords): SkyData {
  const jd = (date.getTime() / 86400000) + 2440587.5;
  const d = jd - 2451545.0; // days since J2000

  // 1. Sidereal Time (simplified Greenwich + Local)
  let gmst = 18.697374558 + 24.06570982441908 * d;
  gmst = gmst % 24;
  if (gmst < 0) gmst += 24;
  let lmst = gmst + coords.lng / 15;
  lmst = lmst % 24;
  if (lmst < 0) lmst += 24;

  // 2. Sun Position (simplified)
  const q = (280.459 + 0.98564736 * d) % 360;
  const g = ((357.529 + 0.98560028 * d) % 360) * (Math.PI / 180);
  const eclipticLon = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * (Math.PI / 180);
  const epsilon = (23.439 - 0.00000036 * d) * (Math.PI / 180); // obliquity of ecliptic

  let ra = Math.atan2(Math.cos(epsilon) * Math.sin(eclipticLon), Math.cos(eclipticLon));
  let dec = Math.asin(Math.sin(epsilon) * Math.sin(eclipticLon));
  
  ra = (ra * 180 / Math.PI) / 15; // hours
  if (ra < 0) ra += 24;

  const ha = (lmst - ra) * 15 * (Math.PI / 180); // hour angle in radians
  const latRad = coords.lat * (Math.PI / 180);

  let sunAlt = Math.asin(Math.sin(latRad) * Math.sin(dec) + Math.cos(latRad) * Math.cos(dec) * Math.cos(ha));
  let sunAz = Math.atan2(
    -Math.sin(ha),
    Math.cos(latRad) * Math.tan(dec) - Math.sin(latRad) * Math.cos(ha)
  );

  sunAlt = sunAlt * (180 / Math.PI);
  sunAz = (sunAz * (180 / Math.PI) + 360) % 360;

  // 3. Moon Phase (simplified 29.53 day cycle, 0 = new, 0.5 = full, 1 = new)
  const synodicMonth = 29.53058867;
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14)).getTime(); // Jan 6 2000
  const phase = ((date.getTime() - knownNewMoon) / 86400000) % synodicMonth;
  const phaseRatio = phase / synodicMonth;
  const moonPhaseOut = phaseRatio < 0 ? phaseRatio + 1 : phaseRatio;

  // 4. Day length estimation
  const declRad = dec; // already radians
  const p = -0.0145; // roughly -0.83 deg for sun atmospheric refraction
  const cosW0 = (Math.sin(p) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));
  let dayLength = 12; // default equinox
  if (cosW0 >= 1) dayLength = 0; // polar night
  else if (cosW0 <= -1) dayLength = 24; // midnight sun
  else dayLength = (Math.acos(cosW0) * 180 / Math.PI) / 15 * 2;

  return {
    sunAltitude: sunAlt,
    sunAzimuth: sunAz,
    moonPhase: moonPhaseOut,
    siderealTime: lmst,
    dayLengthHr: dayLength,
    isDay: sunAlt > -0.83 // accounting for refraction
  };
}

/* ------------------------------------------------------------------ */
/* Starfield Canvas Component                                         */
/* ------------------------------------------------------------------ */

function SkyCanvas({ data, mode }: { data: SkyData, mode: "past" | "future" }) {
  const { isDay, sunAltitude } = data;
  const isTwilight = sunAltitude > -18 && sunAltitude <= 0;
  
  // Theme gradients based on mode and time of day
  const skyBackground = useMemo(() => {
    if (isDay) {
      return mode === "past" 
        ? "linear-gradient(to bottom, #d4a373, #faedcd)" // Sepia day
        : "linear-gradient(to bottom, #48cae4, #ade8f4)"; // Cyan day
    } else if (isTwilight) {
      return mode === "past"
        ? "linear-gradient(to bottom, #2b2d42, #8d99ae, #ef233c)" // Reddish twilight
        : "linear-gradient(to bottom, #03045e, #0077b6, #00b4d8)"; // Electric twilight
    } else {
      return mode === "past"
        ? "linear-gradient(to bottom, #000000, #14110F)" // Deep void
        : "linear-gradient(to bottom, #050517, #1b1b3a)"; // Violet void
    }
  }, [isDay, isTwilight, mode]);

  return (
    <div className="absolute inset-0 transition-colors duration-1000 ease-in-out" style={{ background: skyBackground }}>
      {/* Stars - visible at night/twilight */}
      <AnimatePresence>
        {(!isDay) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: isTwilight ? 0.3 : 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60"
            style={{ 
              filter: mode === "past" ? "sepia(0.5) hue-rotate(-30deg)" : "hue-rotate(60deg) brightness(1.2)"
            }}
          />
        )}
      </AnimatePresence>

      {/* Sun/Moon Orb */}
      <div 
        className="absolute w-32 h-32 rounded-full transition-all duration-[1500ms] ease-out -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${(data.sunAzimuth / 360) * 100}%`,
          top: `${100 - ((data.sunAltitude + 90) / 180) * 100}%`, // Rough visual mapping
          background: isDay 
            ? "radial-gradient(circle, #fff 20%, rgba(255,255,255,0) 70%)"
            : "radial-gradient(circle, #e2e8f0 30%, rgba(226,232,240,0) 80%)",
          boxShadow: isDay ? "0 0 100px 40px rgba(255,255,255,0.4)" : "0 0 40px 10px rgba(200,200,255,0.1)",
          opacity: Math.max(0, (data.sunAltitude + 20) / 40) // Fade out below horizon
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Number Ticker Component                                            */
/* ------------------------------------------------------------------ */
function TickerValue({ value, unit }: { value: string | number, unit?: string }) {
  return (
    <div className="flex items-baseline gap-1 overflow-hidden">
      <motion.span 
        key={value}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-mono text-2xl font-bold text-slate-100"
      >
        {value}
      </motion.span>
      {unit && <span className="font-mono text-[10px] text-slate-500">{unit}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function SkyTimeMachine() {
  // Inputs
  const [lat, setLat] = useState(19.0760); // Mumbai
  const [lng, setLng] = useState(72.8777);
  const [baseDate, setBaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [baseTime, setBaseTime] = useState("12:00");
  
  // Scrubber State
  const [offsetYears, setOffsetYears] = useState(0);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  
  // Data
  const [skyData, setSkyData] = useState<SkyData | null>(null);
  
  // Animation/Transition trigger
  const [transitionKey, setTransitionKey] = useState(0);

  const mode = offsetYears < 0 ? "past" : "future";

  // When form inputs change, recalculate base active date
  useEffect(() => {
    const dateStr = `${baseDate}T${baseTime}:00`;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      // Apply scrubber offset
      const updated = new Date(d);
      updated.setFullYear(updated.getFullYear() + offsetYears);
      setActiveDate(updated);
      setSkyData(calculateSkyData(updated, { lat, lng }));
    }
  }, [baseDate, baseTime, lat, lng, offsetYears]);

  // Handle Scrub
  const handleScrub = (val: number) => {
    setOffsetYears(val);
    setTransitionKey(prev => prev + 1);
  };

  const setLocation = (l: number, lg: number) => {
    setLat(l);
    setLng(lg);
  };

  return (
    <main className="flex-1 page-with-nav relative flex overflow-hidden bg-[#03040a]">
      
      {/* ── Sky Visualization Background ── */}
      <div className="absolute inset-0 z-0">
        {skyData && <SkyCanvas data={skyData} mode={mode} />}
        
        {/* Warp Transition Effect on scrub */}
        <AnimatePresence>
          <motion.div
            key={`warp-${transitionKey}`}
            initial={{ opacity: 1, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 z-10 bg-white/10 pointer-events-none mix-blend-overlay"
          />
        </AnimatePresence>
      </div>

      {/* ── Left Input Panel ── */}
      <div className="relative z-20 flex w-full max-w-sm flex-col border-r border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
        <div className="mb-8">
          <h1 className="font-mono text-lg uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
              <circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/>
            </svg>
            Sky Time Machine
          </h1>
          <p className="mt-2 font-sans text-xs text-slate-400">
            Reconstruct celestial alignments from the distant past or project them into the future.
          </p>
        </div>

        <div className="flex flex-col gap-5 flex-1">
          {/* Coordinates */}
          <LocationSearch 
            defaultQuery="Mumbai"
            onLocationSelect={(l, lg) => setLocation(l, lg)}
          />

          <hr className="border-white/5 my-2" />

          {/* Date & Time */}
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-slate-500">Base Date</label>
            <input 
              type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-slate-200 outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-slate-500">Base Time (Local)</label>
            <input 
              type="time" value={baseTime} onChange={e => setBaseTime(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-slate-200 outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* ── Right Telemetry HUD ── */}
      <div className="absolute right-6 top-24 z-20 w-64 pointer-events-none hidden md:block">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-sky-400 mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"/> Current Epoch
            </h3>
            <p className="font-mono text-sm text-white mb-1">{activeDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
            <p className="font-mono text-xs text-slate-400">{activeDate.toLocaleTimeString()}</p>
          </div>

          {skyData && (
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Sun Alt</p>
                <TickerValue value={skyData.sunAltitude.toFixed(1)} unit="°" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Sun Az</p>
                <TickerValue value={skyData.sunAzimuth.toFixed(1)} unit="°" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Sidereal Time</p>
                <TickerValue value={skyData.siderealTime.toFixed(2)} unit="hr" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Moon Phase</p>
                <TickerValue value={(skyData.moonPhase * 100).toFixed(0)} unit="%" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Scrubber HUD ── */}
      <div className="absolute bottom-6 left-[400px] right-6 z-20">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Mode Badge background glow */}
          <div className={`absolute top-0 right-0 w-64 h-full bg-gradient-to-l opacity-20 pointer-events-none transition-colors duration-1000 ${
            mode === "past" ? "from-amber-500" : "from-violet-500"
          }`} />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Temporal Offset Scrubber</span>
            <span className={`rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-widest border transition-colors ${
              mode === "past" 
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400" 
                : "border-violet-500/30 bg-violet-500/10 text-violet-400"
            }`}>
              {mode === "past" ? "Historical Mode" : "Future Mode"}
            </span>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <span className="font-mono text-xs text-slate-500 w-12 text-right">-100y</span>
            <input 
              type="range" 
              min="-100" max="100" step="1"
              value={offsetYears}
              onChange={e => handleScrub(Number(e.target.value))}
              className="zenith-scrubber flex-1"
            />
            <span className="font-mono text-xs text-slate-500 w-12">+100y</span>
          </div>
          
          <div className="mt-3 text-center relative z-10">
            <span className="font-mono text-sm font-semibold text-white">
              {offsetYears > 0 ? "+" : ""}{offsetYears} Years
            </span>
          </div>
        </div>
      </div>

    </main>
  );
}
