import { normalizeState } from "./game-core.js?v=9";

export const LIBRARY_KEY = "capygotchi-library-v2";

export function createPetId(now = Date.now(), random = Math.random()) {
  const suffix = Math.floor(Math.abs(random) * 1_679_616).toString(36).padStart(4, "0").slice(0, 4);
  return `capy-${Math.max(0, Number(now) || 0).toString(36)}-${suffix}`;
}

export function emptyLibrary() {
  return { version: 1, activeId: null, profiles: [] };
}

function normalizeProfile(candidate, now, fallbackIndex, usedIds) {
  if (!candidate || typeof candidate !== "object") return null;
  const state = normalizeState(candidate.state ?? candidate, now);
  let id = String(candidate.id || `capy-import-${fallbackIndex}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!id || usedIds.has(id)) id = createPetId(now + fallbackIndex, fallbackIndex / 997);
  usedIds.add(id);
  return {
    id,
    createdAt: Number.isFinite(candidate.createdAt) && candidate.createdAt > 0 ? candidate.createdAt : state.adoptedAt,
    lastPlayedAt: Number.isFinite(candidate.lastPlayedAt) && candidate.lastPlayedAt > 0 ? candidate.lastPlayedAt : state.updatedAt,
    state,
  };
}

export function normalizeLibrary(candidate, now = Date.now()) {
  if (!candidate || typeof candidate !== "object") return emptyLibrary();
  const usedIds = new Set();
  const profiles = (Array.isArray(candidate.profiles) ? candidate.profiles : [])
    .map((profile, index) => normalizeProfile(profile, now, index, usedIds))
    .filter(Boolean);
  const requestedActiveId = String(candidate.activeId || "");
  const activeId = profiles.some((profile) => profile.id === requestedActiveId) ? requestedActiveId : profiles[0]?.id ?? null;
  return { version: 1, activeId, profiles };
}

export function addProfile(input, state, now = Date.now(), id = createPetId(now)) {
  const library = normalizeLibrary(input, now);
  const petState = normalizeState(state, now);
  let safeId = id;
  if (library.profiles.some((profile) => profile.id === safeId)) safeId = createPetId(now + library.profiles.length, Math.random());
  return {
    ...library,
    activeId: safeId,
    profiles: [...library.profiles, { id: safeId, createdAt: petState.adoptedAt, lastPlayedAt: now, state: petState }],
  };
}

export function updateProfile(input, id, state, now = Date.now()) {
  const library = normalizeLibrary(input, now);
  if (!library.profiles.some((profile) => profile.id === id)) return library;
  return {
    ...library,
    profiles: library.profiles.map((profile) => profile.id === id
      ? { ...profile, lastPlayedAt: now, state: normalizeState(state, now) }
      : profile),
  };
}

export function selectProfile(input, id, now = Date.now()) {
  const library = normalizeLibrary(input, now);
  return library.profiles.some((profile) => profile.id === id) ? { ...library, activeId: id } : library;
}

export function removeProfile(input, id, now = Date.now()) {
  const library = normalizeLibrary(input, now);
  const profiles = library.profiles.filter((profile) => profile.id !== id);
  return {
    ...library,
    profiles,
    activeId: library.activeId === id ? profiles[0]?.id ?? null : library.activeId,
  };
}

export function activeProfile(input, now = Date.now()) {
  const library = normalizeLibrary(input, now);
  return library.profiles.find((profile) => profile.id === library.activeId) ?? null;
}
