import { NextResponse } from "next/server";
import * as satellite from "satellite.js";

export const dynamic = "force-dynamic";
export const revalidate = 0; // live predictions, no cache

interface ISSPass {
  rise_time: number;
  visible_seconds: number;
  max_elevation: number;
}

interface PassPrediction {
  passes: ISSPass[];
  message: string;
  request: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}

async function fetchISSTLE(): Promise<[string, string]> {
  try {
    const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE", {
      next: { revalidate: 1800 } // Cache TLE for 30 minutes
    });
    if (!res.ok) throw new Error(`CelesTrak status: ${res.status}`);
    const text = await res.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    
    // Find ZARYA/ISS index. CelesTrak returns 3 lines: Name, Line 1, Line 2.
    if (lines.length >= 3) {
      return [lines[1], lines[2]];
    }
    throw new Error("Invalid TLE response format");
  } catch (error) {
    console.warn("Failed to fetch live TLE from CelesTrak, using fallback:", error);
    // Recent TLE for ISS (approximate but extremely close)
    return [
      "1 25544U 98067A   26177.58156177  .00017006  00000-0  30188-3 0  9990",
      "2 25544  51.6416  60.2917 0005234 321.8415  38.2588 15.49845341573983"
    ];
  }
}

function calculateISSPasses(
  line1: string,
  line2: string,
  obsLat: number,
  obsLng: number,
  windowHours = 24
): ISSPass[] {
  const satrec = satellite.twoline2satrec(line1, line2);
  const observerGd = {
    latitude: satellite.degreesToRadians(obsLat),
    longitude: satellite.degreesToRadians(obsLng),
    height: 0.1 // 100 meters above sea level
  };

  const passes: ISSPass[] = [];
  let inPass = false;
  let passStartSec = 0;
  let maxEl = 0;

  const now = new Date();
  const startTimeMs = now.getTime();
  const stepSeconds = 15; // sample every 15 seconds
  const totalSteps = (windowHours * 3600) / stepSeconds;

  for (let i = 0; i < totalSteps; i++) {
    const time = new Date(startTimeMs + i * stepSeconds * 1000);
    const posVel = satellite.propagate(satrec, time);
    if (!posVel || !posVel.position || typeof posVel.position === "boolean") continue;

    const gmst = satellite.gstime(time);
    const posEcf = satellite.eciToEcf(posVel.position as satellite.EciVec3<number>, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGd, posEcf);
    const elDegrees = satellite.radiansToDegrees(lookAngles.elevation);

    // Consider visible if elevation is above 10 degrees
    if (elDegrees >= 10) {
      if (!inPass) {
        inPass = true;
        passStartSec = Math.floor(time.getTime() / 1000);
        maxEl = elDegrees;
      } else {
        if (elDegrees > maxEl) {
          maxEl = elDegrees;
        }
      }
    } else {
      if (inPass) {
        inPass = false;
        const endSec = Math.floor(time.getTime() / 1000);
        const duration = endSec - passStartSec;
        if (duration > 30) {
          passes.push({
            rise_time: passStartSec,
            visible_seconds: duration,
            max_elevation: maxEl
          });
        }
        maxEl = 0;
      }
    }
  }

  return passes;
}

function formatPassPrediction(passes: ISSPass[]): string {
  if (passes.length === 0) {
    return "NO - No visible passes predicted in the next 24 hours.";
  }

  const firstPass = passes[0];
  const riseTime = new Date(firstPass.rise_time * 1000);
  const durationMinutes = Math.round(firstPass.visible_seconds / 60);
  const maxElevation = Math.round(firstPass.max_elevation);

  const timeUntilPass = riseTime.getTime() - Date.now();
  const hoursUntil = Math.floor(timeUntilPass / (1000 * 60 * 60));
  const minutesUntil = Math.floor((timeUntilPass % (1000 * 60 * 60)) / (1000 * 60));

  const hoursStr = hoursUntil > 0 ? `${hoursUntil}h ` : "";
  const minutesStr = `${minutesUntil}m`;

  return `YES - Next pass in ${hoursStr}${minutesStr} at ${maxElevation}° elevation for ${durationMinutes}min.`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Missing latitude or longitude parameters" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude values" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90, longitude between -180 and 180" },
        { status: 400 }
      );
    }

    // 1. Fetch live TLE data
    const [line1, line2] = await fetchISSTLE();

    // 2. Propagate and find passes for the next 24 hours
    const passes = calculateISSPasses(line1, line2, latitude, longitude, 24);

    // 3. Format the result
    const prediction = formatPassPrediction(passes);

    return NextResponse.json({
      prediction,
      raw: {
        passes,
        message: "success",
        request: {
          latitude,
          longitude,
          altitude: 0
        }
      }
    });
  } catch (error) {
    console.error("Failed to calculate SGP4 ISS pass predictions:", error);
    return NextResponse.json(
      { error: "Failed to calculate ISS pass predictions" },
      { status: 500 }
    );
  }
}
