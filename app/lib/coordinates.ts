export interface ParsedCoordinates {
  lat: number;
  lon: number;
  label: string;
}

/** Parse decimal lat,lon (e.g. 28.6139,77.2090) */
export function parseDecimalCoordinates(input: string): ParsedCoordinates | null {
  const match = input.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return {
    lat,
    lon,
    label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
  };
}

/** Parse DMS format (e.g. 28°36'N 77°12'E) */
export function parseDMSCoordinates(input: string): ParsedCoordinates | null {
  const dmsRegex =
    /(-?\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)?\s*['′]?\s*([NSEWnsew])?\s*[,;\s]+\s*(-?\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)?\s*['′]?\s*([NSEWnsew])/i;
  const match = input.trim().match(dmsRegex);
  if (!match) return null;

  const latDeg = parseFloat(match[1]);
  const latMin = parseFloat(match[2] || "0");
  const latDir = (match[3] || "N").toUpperCase();
  const lonDeg = parseFloat(match[4]);
  const lonMin = parseFloat(match[5] || "0");
  const lonDir = match[6].toUpperCase();

  let lat = latDeg + latMin / 60;
  let lon = lonDeg + lonMin / 60;

  if (latDir === "S") lat = -lat;
  if (lonDir === "W") lon = -lon;

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return {
    lat,
    lon,
    label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
  };
}

export function parseAnyCoordinates(input: string): ParsedCoordinates | null {
  return parseDecimalCoordinates(input) ?? parseDMSCoordinates(input);
}

export function validateCoordinates(lat: number, lon: number): string | null {
  if (isNaN(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
  if (isNaN(lon) || lon < -180 || lon > 180) return "Longitude must be between -180 and 180";
  return null;
}
