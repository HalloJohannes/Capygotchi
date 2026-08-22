export const WEATHER_CACHE_KEY = "capygotchi-weather-v1";
export const GERMANY_WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=53.55,52.52,50.11,48.14&longitude=9.99,13.41,8.68,11.58&current=temperature_2m,precipitation,weather_code,cloud_cover,is_day&timezone=Europe%2FBerlin";

function mean(values) {
  const valid = values.map(Number).filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function category(codes, precipitation, cloudCover) {
  if (codes.some((code) => code >= 95)) return "storm";
  if (codes.some((code) => [71, 73, 75, 77, 85, 86].includes(code))) return "snow";
  if (precipitation >= 0.15 || codes.some((code) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82))) return "rain";
  if (codes.some((code) => [45, 48].includes(code))) return "fog";
  if (cloudCover >= 72 || codes.some((code) => code === 3)) return "cloud";
  if (cloudCover >= 32 || codes.some((code) => code === 2)) return "partly";
  return "clear";
}

const WEATHER_COPY = Object.freeze({
  clear: { icon: "☀", label: "Sonnig", phrase: "Deutschland-Mitte ist sonnig – perfekte Zeit für die große Wiese." },
  partly: { icon: "◒", label: "Sonne & Wolken", phrase: "Ein paar Wolken ziehen über Deutschland. Mein Fell findet das sehr angenehm." },
  cloud: { icon: "☁", label: "Wolkig", phrase: "Heute tragen die Wolken eine besonders weiche graue Decke." },
  rain: { icon: "≈", label: "Regnerisch", phrase: "In Deutschland regnet es. Gut, dass Teichwasser mir keine Angst macht." },
  snow: { icon: "✣", label: "Schnee", phrase: "Es schneit! Ich brauche dringend eine winzige Capy-Mütze." },
  storm: { icon: "ϟ", label: "Gewitter", phrase: "Draußen grummelt es. Ich bleibe lieber in der Nähe meiner Hütte." },
  fog: { icon: "≋", label: "Neblig", phrase: "Deutschland liegt im Nebel. Die Wildwiese sieht heute geheimnisvoll aus." },
});

export function weatherFromApi(payload, now = Date.now()) {
  const entries = Array.isArray(payload) ? payload : [payload];
  const currents = entries.map((entry) => entry?.current).filter(Boolean);
  if (!currents.length) throw new Error("Keine Wetterdaten");
  const temperature = mean(currents.map((current) => current.temperature_2m));
  const precipitation = mean(currents.map((current) => current.precipitation));
  const cloudCover = mean(currents.map((current) => current.cloud_cover));
  const codes = currents.map((current) => Number(current.weather_code)).filter(Number.isFinite);
  const kind = category(codes, precipitation, cloudCover);
  return {
    version: 1,
    fetchedAt: now,
    source: "live",
    kind,
    temperature: Math.round(temperature * 10) / 10,
    precipitation: Math.round(precipitation * 10) / 10,
    cloudCover: Math.round(cloudCover),
    isDay: mean(currents.map((current) => current.is_day)) >= 0.5,
    ...WEATHER_COPY[kind],
  };
}

export function fallbackGermanyWeather(now = Date.now()) {
  const date = new Date(now);
  const month = date.getMonth();
  const seasonal = [3, 4, 8, 12, 16, 19, 21, 21, 17, 12, 7, 4][month];
  const hour = date.getHours();
  const temperature = seasonal + (hour >= 13 && hour <= 17 ? 2 : hour < 7 ? -2 : 0);
  const cycle = Math.floor(now / 21_600_000) % 4;
  const kind = ["partly", "cloud", "clear", "partly"][cycle];
  return {
    version: 1,
    fetchedAt: now,
    source: "offline",
    kind,
    temperature,
    precipitation: 0,
    cloudCover: kind === "cloud" ? 78 : kind === "partly" ? 48 : 18,
    isDay: hour >= 7 && hour < 21,
    ...WEATHER_COPY[kind],
  };
}

function readCache(now) {
  try {
    const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || "null");
    if (cached && Number(cached.fetchedAt) > now - 45 * 60_000) return cached;
  } catch {
    // Wetter funktioniert auch ohne Browser-Speicher.
  }
  return null;
}

export async function loadGermanyWeather({ force = false, now = Date.now() } = {}) {
  if (!force) {
    const cached = readCache(now);
    if (cached) return cached;
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(GERMANY_WEATHER_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Wetterstatus ${response.status}`);
    const weather = weatherFromApi(await response.json(), now);
    try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather)); } catch { /* optional */ }
    return weather;
  } catch {
    return readCache(now) || fallbackGermanyWeather(now);
  } finally {
    window.clearTimeout(timer);
  }
}
