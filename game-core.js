export const STORAGE_KEY = "capygotchi-state-v1";

export const DEFAULT_STATE = Object.freeze({
  version: 1,
  name: "Momo",
  adoptedAt: 0,
  updatedAt: 0,
  satiety: 82,
  fun: 78,
  clean: 90,
  energy: 88,
  xp: 0,
  interactions: 0,
  sleeping: false,
  voice: true,
  sound: true,
  haptics: true,
});

export const FOODS = Object.freeze({
  carrot: { label: "Karotte", detail: "+18 satt · knackig", satiety: 18, fun: 2, energy: 0, clean: 0, xp: 3, phrase: "Knack! Karotten sind capytastisch." },
  apple: { label: "Apfel", detail: "+14 satt · +3 Energie", satiety: 14, fun: 1, energy: 3, clean: 0, xp: 3, phrase: "Knirsch. Der ist wunderbar saftig!" },
  melon: { label: "Melone", detail: "+24 satt · klebrig", satiety: 24, fun: 4, energy: 0, clean: -3, xp: 4, phrase: "Mmmelone! Jetzt klebt meine Schnute." },
});

export const CARE = Object.freeze({
  brush: { label: "Bürsten", detail: "+18 sauber · gemütlich", clean: 18, fun: 3, energy: 0, xp: 4, phrase: "Oh ja, genau hinter dem Ohr!" },
  bath: { label: "Baden", detail: "+34 sauber · plitsch", clean: 34, fun: 1, energy: -2, xp: 5, phrase: "Plitsch, platsch – ich bin blitzblank!" },
});

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function makeState(now = Date.now(), name = "Momo") {
  return {
    ...DEFAULT_STATE,
    name: cleanName(name),
    adoptedAt: now,
    updatedAt: now,
  };
}

export function cleanName(value) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 14);
  return name || "Momo";
}

export function normalizeState(candidate, now = Date.now()) {
  const base = makeState(now);
  if (!candidate || typeof candidate !== "object") return base;
  const need = (key) => {
    const value = Number(candidate[key]);
    return Number.isFinite(value) ? clamp(value) : base[key];
  };
  return {
    ...base,
    ...candidate,
    name: cleanName(candidate.name),
    adoptedAt: Number.isFinite(candidate.adoptedAt) && candidate.adoptedAt > 0 ? candidate.adoptedAt : now,
    updatedAt: Number.isFinite(candidate.updatedAt) && candidate.updatedAt > 0 ? candidate.updatedAt : now,
    satiety: need("satiety"),
    fun: need("fun"),
    clean: need("clean"),
    energy: need("energy"),
    xp: Math.max(0, Number(candidate.xp) || 0),
    interactions: Math.max(0, Number(candidate.interactions) || 0),
    sleeping: Boolean(candidate.sleeping),
    voice: candidate.voice !== false,
    sound: candidate.sound !== false,
    haptics: candidate.haptics !== false,
  };
}

export function advanceState(input, now = Date.now()) {
  const state = normalizeState(input, now);
  const elapsedHours = clamp((now - state.updatedAt) / 3_600_000, 0, 24 * 7);
  if (elapsedHours <= 0) return state;

  if (state.sleeping) {
    state.satiety = clamp(state.satiety - 2.2 * elapsedHours);
    state.fun = clamp(state.fun - 0.5 * elapsedHours);
    state.clean = clamp(state.clean - 0.8 * elapsedHours);
    state.energy = clamp(state.energy + 15 * elapsedHours);
  } else {
    state.satiety = clamp(state.satiety - 4.2 * elapsedHours);
    state.fun = clamp(state.fun - 3.1 * elapsedHours);
    state.clean = clamp(state.clean - 2.1 * elapsedHours);
    state.energy = clamp(state.energy - 2.8 * elapsedHours);
  }

  state.updatedAt = now;
  return state;
}

export function applyChanges(input, changes, now = Date.now()) {
  const state = advanceState(input, now);
  for (const key of ["satiety", "fun", "clean", "energy"]) {
    if (Number.isFinite(changes[key])) state[key] = clamp(state[key] + changes[key]);
  }
  state.xp = Math.max(0, state.xp + (Number(changes.xp) || 0));
  state.interactions += Number(changes.interactions) || 1;
  state.updatedAt = now;
  return state;
}

export function levelInfo(xp) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 22)) + 1;
  const levelStart = 22 * (level - 1) ** 2;
  const levelEnd = 22 * level ** 2;
  return {
    level,
    progress: clamp(((xp - levelStart) / (levelEnd - levelStart)) * 100),
  };
}

export function dayNumber(state, now = Date.now()) {
  return Math.max(1, Math.floor((now - state.adoptedAt) / 86_400_000) + 1);
}

export function moodFor(state) {
  if (state.sleeping) return { label: "SCHLÄFT", tone: "sleeping" };
  const needs = [state.satiety, state.fun, state.clean, state.energy];
  const average = needs.reduce((sum, value) => sum + value, 0) / needs.length;
  const minimum = Math.min(...needs);
  if (minimum < 12) return { label: "BRAUCHT DICH", tone: "urgent" };
  if (average < 38) return { label: "MÜRRISCH", tone: "sad" };
  if (average < 62) return { label: "GANZ OKAY", tone: "okay" };
  if (average >= 88) return { label: "SEELIG", tone: "great" };
  return { label: "GLÜCKLICH", tone: "happy" };
}

export function statusPhrase(state) {
  if (state.sleeping) return "Pssst … ich träume von einem warmen Teich.";
  const needs = [
    ["satiety", state.satiety],
    ["fun", state.fun],
    ["clean", state.clean],
    ["energy", state.energy],
  ].sort((a, b) => a[1] - b[1]);
  const [lowest, value] = needs[0];
  if (value < 25) {
    return {
      satiety: "Mein Bauch grummelt. Hast du etwas Leckeres?",
      fun: "Mir ist capylangweilig. Spielen wir eine Runde?",
      clean: "Uff … mein Fell könnte etwas Pflege gebrauchen.",
      energy: "Meine Pfötchen sind ganz schön müde.",
    }[lowest];
  }
  const hour = new Date().getHours();
  if (hour < 7) return "So früh schon wach? Ich bin noch ein bisschen capymüde.";
  if (hour >= 21) return "Der Mond ist da. Zeit für ein gemütliches Nickerchen?";
  const messages = [
    "Mit dir ist jeder Tag ein guter Capy-Tag.",
    "Heute wäre ein prima Tag für eine Karotte.",
    "Wusstest du? Ich kann fast überall entspannen.",
    "Kraulst du mich kurz hinter dem Ohr?",
  ];
  return messages[Math.floor((state.interactions + dayNumber(state)) % messages.length)];
}
