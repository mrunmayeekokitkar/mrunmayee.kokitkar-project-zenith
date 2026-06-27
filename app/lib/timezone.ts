/** Approximate timezone from lat/lon using longitude bands (offline, no API key needed) */
export function getTimezoneFromCoordinates(lat: number, lon: number): string {
  const offsetHours = Math.round(lon / 15);
  const clamped = Math.max(-12, Math.min(14, offsetHours));

  const utcZones: Record<number, string> = {
    [-12]: "Etc/GMT+12",
    [-11]: "Pacific/Midway",
    [-10]: "Pacific/Honolulu",
    [-9]: "America/Anchorage",
    [-8]: "America/Los_Angeles",
    [-7]: "America/Denver",
    [-6]: "America/Chicago",
    [-5]: "America/New_York",
    [-4]: "America/Halifax",
    [-3]: "America/Sao_Paulo",
    [-2]: "Atlantic/South_Georgia",
    [-1]: "Atlantic/Azores",
    0: "UTC",
    1: "Europe/Paris",
    2: "Europe/Helsinki",
    3: "Europe/Moscow",
    4: "Asia/Dubai",
    5: "Asia/Karachi",
    5.5: "Asia/Kolkata",
    6: "Asia/Dhaka",
    7: "Asia/Bangkok",
    8: "Asia/Shanghai",
    9: "Asia/Tokyo",
    10: "Australia/Sydney",
    11: "Pacific/Guadalcanal",
    12: "Pacific/Auckland",
    13: "Pacific/Tongatapu",
    14: "Pacific/Kiritimati",
  };

  if (lat > 20 && lat < 35 && lon > 68 && lon < 97) return "Asia/Kolkata";
  if (lat > 6 && lat < 37 && lon > 68 && lon < 98) return "Asia/Kolkata";

  return utcZones[clamped] ?? "UTC";
}

export function formatLocalTime(utcDate: Date, lat: number, lon: number): string {
  const tz = getTimezoneFromCoordinates(lat, lon);
  try {
    return utcDate.toLocaleString("en-US", {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return utcDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  }
}

export function getTimezoneAbbreviation(utcDate: Date, lat: number, lon: number): string {
  const tz = getTimezoneFromCoordinates(lat, lon);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(utcDate);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "Local";
  } catch {
    return "Local";
  }
}
