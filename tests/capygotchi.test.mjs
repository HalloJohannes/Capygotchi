import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  absenceReport,
  addMemory,
  advanceState,
  applyChanges,
  cleanName,
  foodAvailability,
  growthFor,
  levelInfo,
  makeState,
  moodFor,
  normalizeState,
  statusPhrase,
} from "../public/capygotchi/game-core.js";
import { DIALOGUES, dialogueFor } from "../public/capygotchi/dialogues.js";
import { CAPY_HEIGHT, CAPY_PIXELS, CAPY_WIDTH } from "../public/capygotchi/pet-art.js";
import {
  LIBRARY_KEY,
  activeProfile,
  addProfile,
  emptyLibrary,
  normalizeLibrary,
  removeProfile,
  selectProfile,
  updateProfile,
} from "../public/capygotchi/pet-library.js";
import {
  QUEST_DEFINITIONS,
  activateQuest,
  completeQuest,
  currentQuest,
  dailyQuestQueue,
  normalizeQuestProgress,
  questIsDue,
  recordQuestAction,
  taskQuestComplete,
} from "../public/capygotchi/quest-core.js";
import {
  TRAVEL_DESTINATIONS,
  departNow,
  destinationById,
  isTraveling,
  normalizeTravel,
  travelProgress,
} from "../public/capygotchi/travel-core.js";
import {
  EQUIPMENT_SLOTS,
  ITEM_DEFINITIONS,
  addInventoryItem,
  createInventory,
  rewardForDestination,
  toggleEquipment,
  togglePlacedItem,
} from "../public/capygotchi/inventory-core.js";
import {
  ANIMAL_FRIENDS,
  CROPS,
  WORLD_AREAS,
  consumeHarvest,
  createGarden,
  createWorld,
  harvestCrop,
  normalizeWorld,
  plantCrop,
  selectCrop,
  travelCompanion,
  waterCrop,
} from "../public/capygotchi/world-core.js";
import { fallbackGermanyWeather, weatherFromApi } from "../public/capygotchi/weather.js";

test("six needs continue changing while the app is closed", () => {
  const start = Date.UTC(2026, 7, 21, 12);
  const state = makeState(start, "Emmi");
  const later = advanceState(state, start + 3_600_000);

  assert.equal(later.satiety, 77.8);
  assert.equal(later.fun, 74.9);
  assert.equal(later.clean, 87.9);
  assert.equal(later.energy, 85.2);
  assert.equal(later.social, 81.6);
  assert.equal(later.curiosity, 74.3);
});

test("sleep restores energy and slows all other needs", () => {
  const start = Date.UTC(2026, 7, 21, 12);
  const state = { ...makeState(start), sleeping: true, energy: 40 };
  const later = advanceState(state, start + 2 * 3_600_000);

  assert.equal(later.energy, 70);
  assert.equal(later.satiety, 77.6);
  assert.equal(later.fun, 77);
  assert.equal(later.social, 82.8);
  assert.equal(later.curiosity, 75.4);
});

test("absence report explains offline progress without killing the pet", () => {
  const start = Date.UTC(2026, 7, 21, 12);
  const report = absenceReport(makeState(start), start + 6 * 3_600_000);

  assert.equal(report.elapsedMs, 6 * 3_600_000);
  assert.ok(report.changes.satiety < 0);
  assert.ok(report.state.satiety >= 0);
  assert.equal(report.state.version, 6);
});

test("interactions stay within healthy stat limits", () => {
  const state = { ...makeState(1), satiety: 98, fun: 2, social: 99 };
  const changed = applyChanges(state, { satiety: 20, fun: -12, social: 9, xp: 5 }, 1);

  assert.equal(changed.satiety, 100);
  assert.equal(changed.fun, 0);
  assert.equal(changed.social, 100);
  assert.equal(changed.xp, 5);
});

test("pet state remains valid, names stay compact, and Emmi is the default", () => {
  const state = normalizeState({ version: 1, name: "  Frau   Flauschpfote mit Hut  ", satiety: 900, fun: -20 }, 12);
  assert.equal(state.name, cleanName("Frau Flauschpfote mit Hut"));
  assert.ok(state.name.length <= 14);
  assert.equal(state.satiety, 100);
  assert.equal(state.fun, 0);
  assert.equal(state.version, 6);
  assert.equal(state.social, 84);
  assert.equal(makeState(1).name, "Emmi");
  assert.equal(makeState(1, "Goldie", "golden").furVariant, "golden");
  assert.equal(normalizeState({ furVariant: "unknown" }, 12).furVariant, "classic");
});

test("the library keeps multiple independent capy saves and switches safely", () => {
  const emmi = { ...makeState(100, "Emmi", "classic"), satiety: 91 };
  const pino = { ...makeState(200, "Pino", "golden"), satiety: 23 };
  let library = addProfile(emptyLibrary(), emmi, 100, "emmi");
  library = addProfile(library, pino, 200, "pino");

  assert.equal(LIBRARY_KEY, "capygotchi-library-v2");
  assert.equal(library.profiles.length, 2);
  assert.equal(activeProfile(library, 200).state.name, "Pino");
  library = updateProfile(library, "pino", { ...pino, satiety: 55 }, 220);
  library = selectProfile(library, "emmi", 220);
  assert.equal(activeProfile(library, 220).state.satiety, 91);
  assert.equal(library.profiles.find((profile) => profile.id === "pino").state.satiety, 55);
  library = removeProfile(library, "emmi", 230);
  assert.equal(library.profiles.length, 1);
  assert.equal(library.activeId, "pino");
  assert.equal(normalizeLibrary({ ...library, activeId: "fehlt" }, 230).activeId, "pino");
});

test("mood, level, memories, and situation-aware phrases respond to care", () => {
  assert.equal(moodFor({ ...makeState(1), satiety: 4 }).tone, "urgent");
  assert.equal(moodFor({ ...makeState(1), sleeping: true }).tone, "sleeping");
  assert.equal(levelInfo(0).level, 1);
  assert.ok(levelInfo(220).level > 1);
  const remembered = addMemory(makeState(1), "Emmi hat Melone gegessen.", "♥", 2);
  assert.equal(remembered.memories.length, 1);
  assert.match(statusPhrase({ ...makeState(1), social: 4 }, Date.UTC(2026, 7, 21, 12)), /(Nähe|bei mir|vermiss|bleiben|an dich|lehnen|zusammen)/i);
});

test("the finer capybara uses a consistent image-free pixel grid", () => {
  assert.equal(CAPY_WIDTH, 56);
  assert.equal(CAPY_HEIGHT, 34);
  assert.equal(CAPY_PIXELS.length, CAPY_HEIGHT);
  assert.ok(CAPY_PIXELS.every((row) => row.length === CAPY_WIDTH));
  assert.ok(CAPY_PIXELS.join("").includes("e"));
  assert.ok(CAPY_PIXELS.join("").includes("b"));
  assert.ok(CAPY_PIXELS.join("").includes("h"));
});

test("growth follows levels without changing the saved pet identity", () => {
  assert.equal(growthFor({ ...makeState(1, "Emmi"), xp: 0 }).id, "baby");
  assert.equal(growthFor({ ...makeState(1, "Emmi"), xp: 22 * 5 ** 2 }).id, "grown");
  assert.equal(growthFor({ ...makeState(1, "Emmi"), xp: 22 * 9 ** 2 }).id, "majestic");
});

test("pickles and onions are temporary foods with opposite emotional effects", () => {
  const state = makeState(Date.UTC(2026, 7, 22, 12), "Emmi");
  const forcedPickle = foodAvailability("pickle", state, state.adoptedAt, "pickle-picnic");
  assert.equal(forcedPickle.available, true);
  assert.equal(forcedPickle.limited, true);
  const windows = Array.from({ length: 16 }, (_, index) => foodAvailability("onion", state, state.adoptedAt + index * 90 * 60_000));
  assert.ok(windows.some((entry) => entry.available));
  assert.ok(windows.some((entry) => !entry.available));
  const pickle = applyChanges(state, { satiety: 9, fun: 13 }, state.updatedAt);
  const onion = applyChanges(state, { satiety: 2, fun: -18 }, state.updatedAt);
  assert.ok(pickle.fun > state.fun);
  assert.ok(onion.fun < state.fun);
});

test("solo trips are deterministic, last two to three hours, and return with a souvenir", () => {
  const adoptedAt = Date.UTC(2026, 7, 1, 9);
  const seed = "emmi:reise";
  let travel = normalizeTravel(null, adoptedAt, adoptedAt, seed);
  const departure = travel.nextDepartureAt;
  travel = normalizeTravel(travel, adoptedAt, departure + 1, seed);
  assert.equal(isTraveling(travel, departure + 1), true);
  assert.ok(travel.returnsAt - travel.departedAt >= 120 * 60_000);
  assert.ok(travel.returnsAt - travel.departedAt <= 180 * 60_000);
  assert.ok(destinationById(travel.destinationId));
  assert.ok(travelProgress(travel, departure + 1) < 1);
  travel = normalizeTravel(travel, adoptedAt, travel.returnsAt + 1, seed);
  assert.equal(isTraveling(travel, travel.returnsAt + 1), false);
  assert.equal(travel.completedTrips, 1);
  assert.ok(travel.lastSouvenir);
  assert.ok(TRAVEL_DESTINATIONS.length >= 8);
});

test("a player can send the Capy on a destination-blind surprise trip", () => {
  const now = Date.UTC(2026, 7, 29, 10);
  const travel = departNow(null, now - 86_400_000, now, "emmi:surprise");

  assert.equal(travel.status, "away");
  assert.equal(travel.initiatedBy, "player");
  assert.ok(destinationById(travel.destinationId));
  assert.ok(travel.returnsAt - travel.departedAt >= 120 * 60_000);
  assert.ok(travel.returnsAt - travel.departedAt <= 180 * 60_000);
  const stillAway = departNow(travel, now - 86_400_000, now + 1, "emmi:surprise");
  assert.equal(stillAway.destinationId, travel.destinationId);
  assert.equal(stillAway.departedAt, travel.departedAt);
  assert.equal(stillAway.returnsAt, travel.returnsAt);
});

test("the collection has exclusive clothing slots and placeable finds", () => {
  let inventory = createInventory();
  assert.deepEqual(inventory.ownedItemIds, ["berry_cap"]);
  for (const id of ["forest_vest", "cloud_sweater", "watering_can"]) {
    inventory = addInventoryItem(inventory, id, 100).inventory;
  }

  inventory = toggleEquipment(inventory, "forest_vest").inventory;
  const swapped = toggleEquipment(inventory, "cloud_sweater");
  assert.equal(swapped.replacedId, "forest_vest");
  assert.equal(swapped.inventory.equipped.body, "cloud_sweater");
  assert.equal(Object.values(swapped.inventory.equipped).filter(Boolean).length, 1);

  const placed = togglePlacedItem(swapped.inventory, "watering_can");
  assert.equal(placed.placed, true);
  assert.deepEqual(placed.inventory.placedItemIds, ["watering_can"]);
  assert.equal(togglePlacedItem(placed.inventory, "watering_can").placed, false);
  assert.ok(Object.keys(ITEM_DEFINITIONS).length >= 20);
  assert.ok(Object.values(ITEM_DEFINITIONS).filter((item) => item.type === "wearable").every((item) => EQUIPMENT_SLOTS[item.slot]));
});

test("travel finds prefer an unowned destination reward and never duplicate", () => {
  let inventory = createInventory();
  const rewardId = rewardForDestination(inventory, "kaffeewolken", "emmi:first");
  assert.ok(rewardId);
  assert.equal(inventory.ownedItemIds.includes(rewardId), false);
  const first = addInventoryItem(inventory, rewardId, 100);
  assert.equal(first.added, true);
  const duplicate = addInventoryItem(first.inventory, rewardId, 200);
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.inventory.ownedItemIds.filter((id) => id === rewardId).length, 1);
});

test("the Capy changes between four living areas and can meet travel companions", () => {
  const now = Date.UTC(2026, 7, 29, 10);
  const initial = createWorld(now, "home", "emmi");
  const moved = normalizeWorld(initial, initial.nextMoveAt + 1, "emmi");
  assert.notEqual(moved.area, "home");
  assert.ok(WORLD_AREAS[moved.area]);
  assert.ok(Object.keys(WORLD_AREAS).includes("wintergarden"));
  assert.ok(!moved.friendId || ANIMAL_FRIENDS[moved.friendId]);
  const companion = travelCompanion({ ...moved, friendId: "duck" }, "emmi");
  assert.equal(companion, "duck");
});

test("vegetables grow offline, watering helps, and harvest becomes food", () => {
  const now = Date.UTC(2026, 7, 29, 10);
  let garden = selectCrop(createGarden(), "cucumber");
  const planted = plantCrop(garden, 0, now);
  assert.equal(planted.planted, true);
  assert.equal(planted.garden.seeds.cucumber, 2);
  const originalReadyAt = planted.garden.plots[0].readyAt;
  const watered = waterCrop(planted.garden, 0, now + 30_000);
  assert.equal(watered.watered, true);
  assert.ok(watered.garden.plots[0].readyAt < originalReadyAt);
  const harvested = harvestCrop(watered.garden, 0, watered.garden.plots[0].readyAt + 1);
  assert.equal(harvested.harvested, true);
  assert.equal(harvested.amount, CROPS.cucumber.yield + 1);
  assert.equal(harvested.garden.plots[0], null);
  const eaten = consumeHarvest(harvested.garden, "cucumber");
  assert.equal(eaten.consumed, true);
  assert.equal(eaten.garden.harvest.cucumber, harvested.amount - 1);
});

test("Germany weather averages four places and has a reliable offline season fallback", () => {
  const payload = [10, 14, 18, 22].map((temperature, index) => ({
    current: { temperature_2m: temperature, precipitation: index === 0 ? 0.8 : 0, weather_code: index === 0 ? 61 : 2, cloud_cover: 50, is_day: 1 },
  }));
  const weather = weatherFromApi(payload, 123);
  assert.equal(weather.temperature, 16);
  assert.equal(weather.kind, "rain");
  assert.equal(weather.source, "live");
  const fallback = fallbackGermanyWeather(Date.UTC(2026, 0, 15, 12));
  assert.equal(fallback.source, "offline");
  assert.ok(Number.isFinite(fallback.temperature));
});

test("dialogues offer multiple two-step conversations and adapt to needs", () => {
  assert.ok(DIALOGUES.length >= 7);
  assert.ok(DIALOGUES.every((dialogue) => dialogue.turns.length >= 2));
  assert.ok(DIALOGUES.every((dialogue) => dialogue.turns.every((turn) => turn.choices.length >= 3)));
  assert.equal(dialogueFor({ ...makeState(1), social: 10 }).id, "missing-you");
  assert.equal(dialogueFor({ ...makeState(1), curiosity: 10 }).id, "brave-capy");
});

test("the first quest becomes due exactly one minute after adoption", () => {
  const adoptedAt = Date.UTC(2026, 7, 21, 12);
  const progress = normalizeQuestProgress(null, adoptedAt, adoptedAt, "Emmi");
  assert.equal(progress.queue[0], "glitter-hunt");
  assert.equal(progress.nextAt, adoptedAt + 60_000);
  assert.equal(questIsDue(progress, adoptedAt + 59_999), false);
  assert.equal(questIsDue(progress, adoptedAt + 60_000), true);
  assert.equal(currentQuest(progress).title, "Glitzer im Schilf");
});

test("daily quest plans mix complex games and shared pet-care tasks", () => {
  const queue = dailyQuestQueue("2026-08-21", "Emmi", false);
  assert.equal(queue.length, 5);
  assert.ok(queue.filter((id) => QUEST_DEFINITIONS[id].type === "minigame").length >= 3);
  assert.ok(queue.filter((id) => QUEST_DEFINITIONS[id].type === "task").length >= 2);
  assert.ok(Object.values(QUEST_DEFINITIONS).filter((quest) => quest.type === "minigame").length >= 6);
});

test("shared tasks progress only through matching completed interactions", () => {
  const now = Date.UTC(2026, 7, 21, 12);
  const progress = {
    ...normalizeQuestProgress(null, now - 60_000, now, "Emmi"),
    queue: ["social-circle", "glitter-hunt", "day-trip", "board-memory", "city-tour"],
    nextAt: now,
  };
  let active = activateQuest(progress, "social-circle", now);
  active = recordQuestAction(active, "feed:melon");
  assert.equal(active.taskDone.length, 0);
  active = recordQuestAction(active, "together:cuddle");
  active = recordQuestAction(active, "together:talk");
  active = recordQuestAction(active, "play:rope");
  assert.equal(taskQuestComplete(active), true);
  const finished = completeQuest(active, "social-circle", 100, now + 1);
  assert.equal(finished.completed[0].stars, 3);
  assert.equal(finished.glitter, 9);
  assert.equal(finished.lifetimeCompleted, 1);
});

test("state migration preserves Capys and adds quests, inventory, garden, and world without a reset", () => {
  const now = Date.UTC(2026, 7, 21, 12);
  const old = { ...makeState(now - 120_000, "Lotti"), version: 3, xp: 77, questProgress: null };
  const migrated = normalizeState(old, now);
  const quests = normalizeQuestProgress(migrated.questProgress, migrated.adoptedAt, now, "Lotti");
  assert.equal(migrated.name, "Lotti");
  assert.equal(migrated.xp, 77);
  assert.equal(migrated.version, 6);
  assert.deepEqual(migrated.inventory.ownedItemIds, ["berry_cap"]);
  assert.equal(migrated.garden.plots.length, 4);
  assert.ok(WORLD_AREAS[migrated.world.area]);
  assert.equal(quests.nextAt, migrated.adoptedAt + 60_000);
  assert.equal(questIsDue(quests, now), true);
});

test("the published app is German, installable, dedicated, and drag-interactive", async () => {
  const [html, app, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("../public/capygotchi/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/capygotchi/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/capygotchi/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/capygotchi/sw.js", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<html lang="de">/);
  assert.match(html, /EIN GESCHENK VON JOHANNES/);
  assert.match(html, /value="Emmi"/);
  assert.match(html, /Zum Home-Bildschirm/);
  assert.match(html, /dialogue-dialog/);
  assert.match(html, /library-dialog/);
  assert.match(html, /quest-dialog/);
  assert.match(html, /quest-game-dialog/);
  assert.match(html, /quest-alert/);
  assert.match(html, /travel-dialog/);
  assert.match(html, /journey-dialog/);
  assert.match(html, /inventory-dialog/);
  assert.match(html, /garden-dialog/);
  assert.match(html, /WINTERGARTEN/);
  assert.match(html, /animal-visitor/);
  assert.match(html, /weather-dialog/);
  assert.match(html, /world-navigation/);
  assert.match(html, /DAMWILD-GEHEGE/);
  assert.match(html, /NEUES CAPY ERWECKEN/);
  assert.match(html, /value="golden"/);
  assert.doesNotMatch(html, /<(img|svg)\b/i);
  assert.match(app, /pointermove/);
  assert.match(app, /bathAnimation/);
  assert.match(app, /startBubbles/);
  assert.doesNotMatch(app, /localStorage\.removeItem/);
  assert.doesNotMatch(app, /capygotchi-library-v1/);
  assert.match(app, /normalizeQuestProgress/);
  assert.match(app, /startQuestGame/);
  assert.match(app, /switchToPet/);
  assert.match(app, /normalizeTravel/);
  assert.match(app, /departNow/);
  assert.match(app, /toggleEquipment/);
  assert.match(app, /plantCrop/);
  assert.match(app, /normalizeWorld/);
  assert.doesNotMatch(app, /selectLandscapeArea/);
  assert.match(app, /foodAvailability/);
  assert.match(app, /loadGermanyWeather/);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(serviceWorker, /capygotchi-v8/);
  assert.match(serviceWorker, /dialogues\.js/);
  assert.match(serviceWorker, /pet-library\.js/);
  assert.match(serviceWorker, /quest-core\.js/);
  assert.match(serviceWorker, /quest-games\.js/);
  assert.match(serviceWorker, /travel-core\.js/);
  assert.match(serviceWorker, /inventory-core\.js/);
  assert.match(serviceWorker, /world-core\.js/);
  assert.match(serviceWorker, /weather\.js/);
});
