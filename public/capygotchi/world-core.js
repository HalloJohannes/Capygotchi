const MINUTE = 60_000;

export const WORLD_AREAS = Object.freeze({
  home: { id: "home", label: "ZUHAUSE AM TEICH", short: "ZUHAUSE", icon: "⌂" },
  meadow: { id: "meadow", label: "WILDWIESE & DAMWILD", short: "WILDWIESE", icon: "♣" },
  garden: { id: "garden", label: "GEMÜSEGARTEN", short: "GARTEN", icon: "▰" },
  wintergarden: { id: "wintergarden", label: "CAPY-WINTERGARTEN", short: "WINTERGARTEN", icon: "☕" },
});

export const ANIMAL_FRIENDS = Object.freeze({
  chicken: { id: "chicken", label: "Huhn Hilda", icon: "●", phrase: "Hilda pickt neugierig neben mir. Sie weiß wirklich alles aus dem Garten." },
  rabbit: { id: "rabbit", label: "Hase Fips", icon: "♢", phrase: "Fips ist zum Hüpfen vorbeigekommen. Ich versuche mitzuhalten." },
  duck: { id: "duck", label: "Ente Lotte", icon: "◆", phrase: "Lotte erzählt vom Teich. Sie erzählt sehr laut, aber sehr freundlich." },
  hedgehog: { id: "hedgehog", label: "Igel Piek", icon: "✹", phrase: "Piek besucht mich heute. Kuscheln geht nur ausgesprochen vorsichtig." },
  alpaca: { id: "alpaca", label: "Alpaka Wolke", icon: "♧", phrase: "Wolke und ich vergleichen gerade, wer flauschiger ist. Es bleibt unentschieden." },
  goose: { id: "goose", label: "Gans Greta", icon: "♪", phrase: "Greta läuft mit sehr wichtigen Schritten durch meine Welt." },
});

export const CROPS = Object.freeze({
  carrot: { id: "carrot", label: "Gartenkarotte", seedLabel: "Karottensamen", icon: "▲", growMs: 2 * MINUTE, yield: 2, food: { satiety: 19, fun: 3, curiosity: 2, xp: 5, phrase: "Selbst angebaut schmeckt die Karotte doppelt knackig!" } },
  tomato: { id: "tomato", label: "Sonnentomate", seedLabel: "Tomatensamen", icon: "●", growMs: 4 * MINUTE, yield: 2, food: { satiety: 15, fun: 5, clean: -2, xp: 6, phrase: "Plopp – diese Tomate schmeckt nach Gartensonne!" } },
  cucumber: { id: "cucumber", label: "Gartengurke", seedLabel: "Gurkensamen", icon: "▰", growMs: 6 * MINUTE, yield: 3, food: { satiety: 13, fun: 9, social: 2, xp: 7, phrase: "KNACK! Fast so gut wie Gewürzgurke – und selbst gezogen!" } },
  pumpkin: { id: "pumpkin", label: "Minikürbis", seedLabel: "Kürbissamen", icon: "◉", growMs: 10 * MINUTE, yield: 2, food: { satiety: 23, curiosity: 5, xp: 8, phrase: "Unser eigener Kürbis! Der ist capygroßartig." } },
});

function seedNumber(value) {
  return [...String(value)].reduce((sum, character) => ((sum * 33) ^ character.charCodeAt(0)) >>> 0, 2_166_136_261);
}

function nextMoveDelay(seed, at, visits) {
  return (3 + (seedNumber(`${seed}:move:${at}:${visits}`) % 6)) * MINUTE;
}

export function createWorld(now = Date.now(), area = "home", seed = "capy") {
  return {
    version: 1,
    area: WORLD_AREAS[area] ? area : "home",
    movedAt: now,
    nextMoveAt: now + nextMoveDelay(seed, now, 0),
    friendId: null,
    friendUntil: 0,
    visits: 0,
  };
}

export function normalizeWorld(candidate, now = Date.now(), seed = "capy") {
  const base = createWorld(now, candidate?.area, seed);
  const world = candidate && typeof candidate === "object" ? {
    ...base,
    ...candidate,
    version: 1,
    area: WORLD_AREAS[candidate.area] ? candidate.area : "home",
    movedAt: Math.max(0, Number(candidate.movedAt) || now),
    nextMoveAt: Math.max(now - 24 * 60 * MINUTE, Number(candidate.nextMoveAt) || base.nextMoveAt),
    friendId: ANIMAL_FRIENDS[candidate.friendId] ? candidate.friendId : null,
    friendUntil: Math.max(0, Number(candidate.friendUntil) || 0),
    visits: Math.max(0, Number(candidate.visits) || 0),
  } : base;

  let loops = 0;
  while (now >= world.nextMoveAt && loops < 96) {
    const movedAt = world.nextMoveAt;
    const areaIds = Object.keys(WORLD_AREAS).filter((id) => id !== world.area);
    const value = seedNumber(`${seed}:area:${movedAt}:${world.visits}`);
    world.area = areaIds[value % areaIds.length];
    world.movedAt = movedAt;
    world.visits += 1;
    const friends = Object.keys(ANIMAL_FRIENDS);
    world.friendId = value % 3 === 0 ? null : friends[(value >>> 4) % friends.length];
    world.friendUntil = world.friendId ? movedAt + (90 + (value % 121)) * 1000 : 0;
    world.nextMoveAt = movedAt + nextMoveDelay(seed, movedAt, world.visits);
    loops += 1;
  }
  if (loops >= 96 && now >= world.nextMoveAt) {
    world.nextMoveAt = now + nextMoveDelay(seed, now, world.visits);
    world.movedAt = now;
  }
  if (world.friendUntil <= now) {
    world.friendId = null;
    world.friendUntil = 0;
  }
  return world;
}

export function createGarden() {
  return {
    version: 1,
    selectedCrop: "carrot",
    seeds: { carrot: 3, tomato: 3, cucumber: 3, pumpkin: 2 },
    harvest: { carrot: 0, tomato: 0, cucumber: 0, pumpkin: 0 },
    plots: [null, null, null, null],
    totalHarvests: 0,
  };
}

export function normalizeGarden(candidate) {
  const base = createGarden();
  if (!candidate || typeof candidate !== "object") return base;
  const counts = (source, fallback) => Object.fromEntries(Object.keys(CROPS).map((id) => [id, Math.max(0, Math.floor(Number(source?.[id]) || fallback[id] || 0))]));
  const plots = Array.from({ length: 4 }, (_, index) => {
    const plot = candidate.plots?.[index];
    if (!plot || !CROPS[plot.cropId]) return null;
    const plantedAt = Math.max(0, Number(plot.plantedAt) || 0);
    return {
      cropId: plot.cropId,
      plantedAt,
      readyAt: Math.max(plantedAt + 1000, Number(plot.readyAt) || plantedAt + CROPS[plot.cropId].growMs),
      watered: Boolean(plot.watered),
    };
  });
  return {
    version: 1,
    selectedCrop: CROPS[candidate.selectedCrop] ? candidate.selectedCrop : "carrot",
    seeds: counts(candidate.seeds, base.seeds),
    harvest: counts(candidate.harvest, base.harvest),
    plots,
    totalHarvests: Math.max(0, Math.floor(Number(candidate.totalHarvests) || 0)),
  };
}

export function selectCrop(candidate, cropId) {
  const garden = normalizeGarden(candidate);
  return CROPS[cropId] ? { ...garden, selectedCrop: cropId } : garden;
}

export function plantCrop(candidate, plotIndex, now = Date.now()) {
  const garden = normalizeGarden(candidate);
  const crop = CROPS[garden.selectedCrop];
  if (!crop || garden.plots[plotIndex] || garden.seeds[crop.id] < 1) return { garden, planted: false };
  const plots = [...garden.plots];
  plots[plotIndex] = { cropId: crop.id, plantedAt: now, readyAt: now + crop.growMs, watered: false };
  return {
    planted: true,
    crop,
    garden: { ...garden, plots, seeds: { ...garden.seeds, [crop.id]: garden.seeds[crop.id] - 1 } },
  };
}

export function waterCrop(candidate, plotIndex, now = Date.now()) {
  const garden = normalizeGarden(candidate);
  const plot = garden.plots[plotIndex];
  if (!plot || plot.watered || now >= plot.readyAt) return { garden, watered: false };
  const plots = [...garden.plots];
  plots[plotIndex] = { ...plot, watered: true, readyAt: now + Math.max(15_000, (plot.readyAt - now) * 0.6) };
  return { garden: { ...garden, plots }, watered: true };
}

export function harvestCrop(candidate, plotIndex, now = Date.now()) {
  const garden = normalizeGarden(candidate);
  const plot = garden.plots[plotIndex];
  if (!plot || now < plot.readyAt) return { garden, harvested: false };
  const crop = CROPS[plot.cropId];
  const amount = crop.yield + (plot.watered ? 1 : 0);
  const plots = [...garden.plots];
  plots[plotIndex] = null;
  return {
    harvested: true,
    crop,
    amount,
    garden: {
      ...garden,
      plots,
      seeds: { ...garden.seeds, [crop.id]: garden.seeds[crop.id] + 1 },
      harvest: { ...garden.harvest, [crop.id]: garden.harvest[crop.id] + amount },
      totalHarvests: garden.totalHarvests + 1,
    },
  };
}

export function consumeHarvest(candidate, cropId) {
  const garden = normalizeGarden(candidate);
  if (!CROPS[cropId] || garden.harvest[cropId] < 1) return { garden, consumed: false };
  return { garden: { ...garden, harvest: { ...garden.harvest, [cropId]: garden.harvest[cropId] - 1 } }, consumed: true };
}

export function cropProgress(plot, now = Date.now()) {
  if (!plot) return 0;
  const duration = Math.max(1, plot.readyAt - plot.plantedAt);
  return Math.max(0, Math.min(100, ((now - plot.plantedAt) / duration) * 100));
}

export function cropTimeLabel(plot, now = Date.now()) {
  if (!plot) return "FREIES BEET";
  if (now >= plot.readyAt) return "ERNTEREIF";
  const seconds = Math.max(1, Math.ceil((plot.readyAt - now) / 1000));
  if (seconds < 60) return `NOCH ${seconds} SEK.`;
  return `NOCH ${Math.ceil(seconds / 60)} MIN.`;
}

export function travelCompanion(world, seed = "capy") {
  if (world?.friendId && ANIMAL_FRIENDS[world.friendId]) return world.friendId;
  const value = seedNumber(`${seed}:companion`);
  if (value % 3 === 0) return null;
  const ids = Object.keys(ANIMAL_FRIENDS);
  return ids[(value >>> 3) % ids.length];
}
