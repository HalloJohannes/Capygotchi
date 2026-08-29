import {
  CARE,
  FOODS,
  NEED_KEYS,
  TOGETHER,
  TOYS,
  absenceReport,
  addMemory,
  advanceState,
  applyChanges,
  cleanName,
  dayNumber,
  foodAvailability,
  growthFor,
  levelInfo,
  makeState,
  moodFor,
  statusPhrase,
} from "./game-core.js?v=8";
import { CAPY_HEIGHT, CAPY_PIXELS, CAPY_WIDTH } from "./pet-art.js?v=8";
import { dialogueFor } from "./dialogues.js?v=8";
import {
  LIBRARY_KEY,
  activeProfile,
  addProfile,
  emptyLibrary,
  normalizeLibrary,
  removeProfile,
  selectProfile,
  updateProfile,
} from "./pet-library.js?v=8";
import {
  QUEST_DEFINITIONS,
  activateQuest,
  completeQuest,
  currentQuest,
  normalizeQuestProgress,
  questIsDue,
  questTimeLabel,
  recordQuestAction,
  taskQuestComplete,
} from "./quest-core.js?v=8";
import { startQuestGame } from "./quest-games.js?v=8";
import {
  departNow,
  destinationById,
  isTraveling,
  normalizeTravel,
  travelProgress,
  travelTimeLabel,
} from "./travel-core.js?v=8";
import { fallbackGermanyWeather, loadGermanyWeather } from "./weather.js?v=8";
import {
  EQUIPMENT_SLOTS,
  ITEM_DEFINITIONS,
  addInventoryItem,
  inventoryCompletion,
  normalizeInventory,
  rewardForDestination,
  toggleEquipment,
  togglePlacedItem,
} from "./inventory-core.js?v=8";
import {
  ANIMAL_FRIENDS,
  CROPS,
  WORLD_AREAS,
  consumeHarvest,
  cropProgress,
  cropTimeLabel,
  harvestCrop,
  normalizeGarden,
  normalizeWorld,
  plantCrop,
  selectCrop,
  travelCompanion,
  waterCrop,
} from "./world-core.js?v=8";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const NEED_LABELS = {
  satiety: "Satt",
  fun: "Spaß",
  clean: "Sauber",
  energy: "Energie",
  social: "Nähe",
  curiosity: "Neugier",
};

const GROUPS = {
  feed: { kicker: "FÜTTERN", title: "Zieh Futter zu {name}", instruction: "Halte einen Leckerbissen und zieh ihn direkt zur Schnute.", items: FOODS },
  play: { kicker: "SPIELEN", title: "Was spielen wir?", instruction: "Wirf Ball oder Frisbee ins Gehege – andere Spielsachen brauchen deine Hand.", items: TOYS },
  care: { kicker: "PFLEGEN", title: "Mach selbst mit", instruction: "Bürste mehrfach durchs Fell oder zieh die Badeente zum Capybara.", items: CARE },
  together: { kicker: "GEMEINSAM", title: "Zeit für euch", instruction: "Zieh eine gemeinsame Aktivität zu deinem Capybara oder ins Gehege.", items: TOGETHER },
};

const CAPY_ANIMATIONS = [
  "is-eating", "is-loved", "is-fetching", "is-playing", "is-brushed", "is-bathing",
  "is-drying", "is-cuddling", "is-talking", "is-exploring", "is-sunbathing", "is-tugging", "is-disgusted",
];

const elements = {
  day: $("#day-label"),
  clock: $("#clock"),
  habitat: $("#habitat"),
  speech: $("#speech-text"),
  capy: $("#pixel-capy"),
  petButton: $("#pet-button"),
  pond: $("#pond"),
  heartLayer: $("#heart-layer"),
  sceneLayer: $("#scene-layer"),
  bubbleLayer: $("#bubble-layer"),
  dropHint: $("#drop-hint"),
  name: $("#pet-name"),
  level: $("#level"),
  xp: $("#xp-fill"),
  mood: $("#mood"),
  actions: $("#actions"),
  sleepAction: $("#sleep-action"),
  sleepLabel: $("#sleep-label"),
  tray: $("#activity-tray"),
  trayKicker: $("#tray-kicker"),
  trayTitle: $("#tray-title"),
  trayInstruction: $("#tray-instruction"),
  trayItems: $("#tray-items"),
  trayProgress: $("#tray-progress"),
  ghost: $("#drag-ghost"),
  toast: $("#toast"),
  dedicationDialog: $("#dedication-dialog"),
  welcomeDialog: $("#welcome-dialog"),
  awayDialog: $("#away-dialog"),
  journalDialog: $("#journal-dialog"),
  libraryDialog: $("#library-dialog"),
  questDialog: $("#quest-dialog"),
  questGameDialog: $("#quest-game-dialog"),
  questAlert: $("#quest-alert"),
  questBadge: $("#quest-badge"),
  questStage: $("#quest-stage"),
  questGameStatus: $("#quest-game-status"),
  travelPostcard: $("#travel-postcard"),
  travelDialog: $("#travel-dialog"),
  weatherDialog: $("#weather-dialog"),
  weatherIcon: $("#weather-icon"),
  weatherTemperature: $("#weather-temperature"),
  journeyDialog: $("#journey-dialog"),
  inventoryDialog: $("#inventory-dialog"),
  gardenDialog: $("#garden-dialog"),
  inventoryGrid: $("#inventory-grid"),
  gardenPlots: $("#garden-plots"),
  animalVisitor: $("#animal-visitor"),
  outfitLayer: $("#outfit-layer"),
  placedItemsLayer: $("#placed-items-layer"),
  dialogueDialog: $("#dialogue-dialog"),
  settingsDialog: $("#settings-dialog"),
};

let library = emptyLibrary();
let activePetId = null;
let hasStoredState = false;
let awayInfo = null;
let state = loadState();
let currentPhrase = statusPhrase(state);
let activeTray = null;
let selectedItem = null;
let drag = null;
let interactionBusy = false;
let bubbleSession = null;
let currentConversation = null;
let toastTimer = 0;
let lastPetAt = 0;
let audioContext;
let deferredInstallPrompt = null;
let suppressClickUntil = 0;
let adoptionMode = "first";
let questWakeTimer = 0;
let activeGameCleanup = null;
let pendingQuestAction = null;
let lastQuestNotice = "";
let weatherData = fallbackGermanyWeather();
let weatherLoading = false;
let inventoryFilter = "all";

const NAME_SUGGESTIONS = ["Emmi", "Flocke", "Lotti", "Pino", "Nala", "Keks", "Maja", "Oskar"];

function loadState() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    library = raw ? normalizeLibrary(JSON.parse(raw)) : emptyLibrary();
    const profile = activeProfile(library);
    hasStoredState = Boolean(profile);
    if (!profile) return makeState();
    activePetId = profile.id;
    awayInfo = absenceReport(profile.state);
    library = updateProfile(library, activePetId, awayInfo.state);
    return awayInfo.state;
  } catch {
    library = emptyLibrary();
    activePetId = null;
    hasStoredState = false;
    return makeState();
  }
}

function saveState() {
  if (!hasStoredState || !activePetId) return;
  try {
    library = updateProfile(library, activePetId, state);
    library = selectProfile(library, activePetId);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  } catch {
    showToast("Die Capy-Bibliothek konnte nicht gespeichert werden.");
  }
}

function travelSeed() {
  return `${activePetId || "new"}:${state.name}:${state.adoptedAt}`;
}

function worldSeed() {
  return `${activePetId || "new"}:${state.name}:world`;
}

function prepareTravelCargo() {
  if (!isTraveling(state.travel)) return;
  state.inventory = normalizeInventory(state.inventory);
  state.world = normalizeWorld(state.world, Date.now(), worldSeed());
  if (!state.travel.rewardId) {
    state.travel.rewardId = rewardForDestination(state.inventory, state.travel.destinationId, `${travelSeed()}:${state.travel.departedAt}`);
  }
  if (state.travel.companionId === null || state.travel.companionId === undefined) {
    state.travel.companionId = travelCompanion(state.world, `${travelSeed()}:${state.travel.destinationId}:${state.travel.departedAt}`);
  }
}

function syncTravelState(now = Date.now()) {
  if (!hasStoredState) return false;
  const previousStatus = state.travel?.status || "home";
  const canDepart = !state.sleeping && !interactionBusy && !currentConversation && !activeTray && !document.querySelector("dialog[open]");
  if (!state.travel || state.travel.status === "away" || canDepart) {
    state.travel = normalizeTravel(state.travel, state.adoptedAt, now, travelSeed());
  }
  const traveling = isTraveling(state.travel, now);
  if (traveling) prepareTravelCargo();
  if (state.travel?.returnPending && !traveling) {
    const destination = destinationById(state.travel.lastDestinationId);
    const rewardId = state.travel.lastRewardId || rewardForDestination(state.inventory, state.travel.lastDestinationId, `${travelSeed()}:return:${state.travel.completedTrips}`);
    const reward = rewardId ? ITEM_DEFINITIONS[rewardId] : null;
    const companion = ANIMAL_FRIENDS[state.travel.lastCompanionId];
    const inventoryResult = rewardId ? addInventoryItem(state.inventory, rewardId, now) : { inventory: state.inventory, added: false };
    state.inventory = inventoryResult.inventory;
    if (!reward) {
      state.garden = normalizeGarden(state.garden);
      state.garden.seeds = Object.fromEntries(Object.entries(state.garden.seeds).map(([key, amount]) => [key, amount + 1]));
    }
    state.travel = { ...state.travel, returnPending: false, lastRewardId: rewardId };
    state = applyChanges(state, { curiosity: 9, fun: 5, social: -2, energy: -4, xp: 12 });
    const findText = reward ? `${reward.label} für unsere Sammlung` : "ein buntes Samentütchen für den Garten";
    const companionText = companion ? ` Zusammen mit ${companion.label}.` : "";
    remember(`${state.name} ist aus ${destination?.title || "einem Abenteuer"} zurück und brachte ${findText} mit.${companionText}`, reward?.icon || "⌁");
    currentPhrase = `Da bin ich wieder! Ich war in ${destination?.title || "der Ferne"} und habe ${findText} mitgebracht.${companion ? ` ${companion.label} war dabei!` : ""}`;
    showToast(`${state.name.toUpperCase()} IST ZURÜCK · ${reward?.label?.toUpperCase() || "NEUE SAMEN"}!`, 5200);
  } else if (traveling) {
    const destination = destinationById(state.travel.destinationId);
    const companion = ANIMAL_FRIENDS[state.travel.companionId];
    currentPhrase = `Reisepost von ${state.name}: Ich bin gerade in ${destination.title}${companion ? ` – ${companion.label} ist mitgekommen` : ""} und komme von allein wieder zurück.`;
  }
  if (previousStatus !== state.travel?.status && state.travel?.status === "away") {
    const destination = destinationById(state.travel.destinationId);
    showToast(`${state.name} ist allein nach ${destination.title} gereist.`, 4200);
  }
  return traveling;
}

function syncWorldState(now = Date.now(), traveling = isTraveling(state.travel, now)) {
  const previousArea = state.world?.area || state.landscapeArea || "home";
  state.world = normalizeWorld(state.world, now, worldSeed());
  state.garden = normalizeGarden(state.garden);
  state.inventory = normalizeInventory(state.inventory);
  if (state.sleeping) state.world = { ...state.world, area: "home" };
  state.landscapeArea = state.world.area;
  if (!traveling && previousArea !== state.world.area && !interactionBusy && !document.querySelector("dialog[open]")) {
    const area = WORLD_AREAS[state.world.area];
    currentPhrase = `Ich bin von allein weitergezogen. Jetzt bin ich bei ${area.label.toLowerCase()}.`;
    showToast(`${state.name} ist jetzt bei ${area.short}.`, 2800);
  }
}

function wanderPosition(now = Date.now()) {
  const value = [...`${state.name}:${state.landscapeArea}:${Math.floor(now / 30_000)}`]
    .reduce((sum, character) => ((sum * 31) + character.charCodeAt(0)) >>> 0, 17);
  return 25 + (value % 51);
}

function renderOutfit() {
  elements.outfitLayer.replaceChildren();
  for (const [slot, itemId] of Object.entries(state.inventory.equipped)) {
    const item = ITEM_DEFINITIONS[itemId];
    if (!item) continue;
    const piece = document.createElement("i");
    piece.className = "outfit-piece";
    piece.dataset.slot = slot;
    piece.dataset.item = itemId;
    piece.textContent = item.icon;
    elements.outfitLayer.append(piece);
  }
}

function renderPlacedItems(traveling = false) {
  elements.placedItemsLayer.replaceChildren();
  if (traveling) return;
  const areaItems = state.inventory.placedItemIds
    .map((id) => ITEM_DEFINITIONS[id])
    .filter((item) => item?.area === state.landscapeArea);
  areaItems.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "placed-world-item";
    button.dataset.itemId = item.id;
    button.style.setProperty("--left", `${19 + ((index * 31) % 66)}%`);
    button.style.setProperty("--bottom", `${105 + ((index % 2) * 48)}px`);
    const icon = document.createElement("span");
    icon.textContent = item.icon;
    const label = document.createElement("small");
    label.textContent = item.label;
    button.append(icon, label);
    elements.placedItemsLayer.append(button);
  });
}

function renderAnimalVisitor(traveling = false) {
  const friend = !traveling && !state.sleeping ? ANIMAL_FRIENDS[state.world.friendId] : null;
  elements.animalVisitor.hidden = !friend;
  if (!friend) return;
  $("#visitor-icon").textContent = friend.icon;
  $("#visitor-name").textContent = friend.label;
  elements.animalVisitor.setAttribute("aria-label", `${friend.label} begrüßen`);
}

function renderLandscape(now = Date.now(), traveling = isTraveling(state.travel, now)) {
  const growth = growthFor(state);
  elements.habitat.dataset.area = state.landscapeArea;
  elements.habitat.classList.toggle("is-away", traveling);
  elements.petButton.dataset.growth = growth.id;
  elements.petButton.setAttribute("aria-label", `${state.name} streicheln oder einen ausgewählten Gegenstand geben`);
  $('.cabin[data-landmark="cabin"]').setAttribute("aria-label", `${state.name}s kleine Schlafhütte ansehen`);
  elements.petButton.style.setProperty("--pet-x", `${wanderPosition(now)}%`);
  $("#growth-label").textContent = `${growth.label} · WÄCHST MIT DIR`;
  $("#area-name").textContent = traveling ? "CAPY AUF SOLO-REISE" : WORLD_AREAS[state.landscapeArea].label;
  const moveMinutes = Math.max(1, Math.ceil((state.world.nextMoveAt - now) / 60_000));
  $("#area-choice").textContent = traveling ? "ZIEL SELBST GEWÄHLT" : `CAPY WÄHLT SELBST · WEITER IN ~${moveMinutes} MIN`;
  $$("[data-area]", $("#world-navigation")).forEach((item) => item.classList.toggle("is-active", item.dataset.area === state.landscapeArea));
  renderOutfit();
  renderPlacedItems(traveling);
  renderAnimalVisitor(traveling);
  elements.travelPostcard.hidden = !traveling;
  if (!traveling) {
    if (elements.travelDialog.open) elements.travelDialog.close();
    return;
  }
  const destination = destinationById(state.travel.destinationId);
  $("#travel-stamp").textContent = destination.icon;
  $("#travel-kind").textContent = `REISEPOST · ${destination.kind}`;
  $("#travel-place").textContent = destination.title;
  $("#travel-countdown").textContent = travelTimeLabel(state.travel, now);
  if (elements.travelDialog.open) {
    $("#travel-dialog-countdown").textContent = travelTimeLabel(state.travel, now);
    $("#travel-progress-fill").style.setProperty("--value", `${travelProgress(state.travel, now)}%`);
  }
}

function renderWeather() {
  elements.habitat.dataset.weather = weatherData.kind;
  elements.weatherIcon.textContent = weatherData.icon;
  elements.weatherTemperature.textContent = `${Math.round(weatherData.temperature)}°`;
  $("#weather-dialog-icon").textContent = weatherData.icon;
  $("#weather-dialog-label").textContent = weatherData.label;
  $("#weather-dialog-temp").textContent = `${weatherData.temperature.toLocaleString("de-DE")} °C`;
  $("#weather-dialog-phrase").textContent = weatherData.phrase;
  $("#weather-clouds").textContent = `${weatherData.cloudCover} %`;
  $("#weather-rain").textContent = `${weatherData.precipitation.toLocaleString("de-DE")} mm`;
}

async function refreshWeather(force = false) {
  if (weatherLoading) return;
  weatherLoading = true;
  weatherData = await loadGermanyWeather({ force });
  weatherLoading = false;
  renderWeather();
}

function openWeatherDetails() {
  renderWeather();
  openDialog(elements.weatherDialog);
}

function openTravelDetails() {
  if (!isTraveling(state.travel)) return;
  const destination = destinationById(state.travel.destinationId);
  $("#travel-dialog-kind").textContent = `${destination.kind} · REISEPOST`;
  $("#travel-dialog-title").textContent = destination.title;
  $("#travel-dialog-place").textContent = destination.place;
  $("#travel-dialog-icon").textContent = destination.icon;
  $("#travel-dialog-doing").textContent = `${state.name} ${destination.doing}.`;
  $("#travel-dialog-fact").textContent = destination.fact;
  $("#travel-dialog-countdown").textContent = travelTimeLabel(state.travel);
  $("#travel-progress-fill").style.setProperty("--value", `${travelProgress(state.travel)}%`);
  $("#travel-illustration").dataset.palette = destination.palette;
  const companion = ANIMAL_FRIENDS[state.travel.companionId];
  $("#travel-companion").hidden = !companion;
  if (companion) {
    $("#travel-companion-icon").textContent = companion.icon;
    $("#travel-companion-name").textContent = companion.label;
  }
  $("#travel-reward-label").textContent = state.travel.rewardId ? "Ein geheimnisvoller neuer Fund" : "Eine Überraschung aus der Ferne";
  $("#travel-history").textContent = `${state.name} hat bereits ${state.travel.completedTrips} ${state.travel.completedTrips === 1 ? "Solo-Reise" : "Solo-Reisen"} beendet und ${state.travel.visitedIds.length} verschiedene Orte entdeckt.`;
  openDialog(elements.travelDialog);
}

function openJourneyDialog() {
  if (!hasStoredState) return;
  if (isTraveling(state.travel)) {
    openTravelDetails();
    return;
  }
  if (state.sleeping) {
    showToast(`Weck ${state.name} erst auf, bevor der Rucksack gepackt wird.`);
    return;
  }
  if (interactionBusy || currentConversation) {
    showToast("Lass die aktuelle gemeinsame Aktion kurz zu Ende gehen.");
    return;
  }
  closeTray();
  $("#journey-capy-name").textContent = state.name;
  $("#journey-title").textContent = `${state.name}, wohin geht es wohl?`;
  openDialog(elements.journeyDialog);
}

function startManualJourney() {
  if (isTraveling(state.travel) || state.sleeping || interactionBusy) return;
  const now = Date.now();
  state.travel = departNow(state.travel, state.adoptedAt, now, travelSeed());
  prepareTravelCargo();
  const destination = destinationById(state.travel.destinationId);
  const companion = ANIMAL_FRIENDS[state.travel.companionId];
  state = applyChanges(state, { curiosity: 5, fun: 3, energy: -2, social: companion ? 2 : -1, xp: 4 }, now);
  remember(`${state.name} wurde von dir auf eine Überraschungsreise geschickt. Das Ziel: ${destination.title}.${companion ? ` ${companion.label} reist mit.` : ""}`, "⌁");
  elements.journeyDialog.close();
  talk(`Rucksack gepackt! Ich habe mein Ziel selbst gewählt: ${destination.title}.${companion ? ` ${companion.label} kommt mit!` : ""} Bis später!`);
  playSound("happy");
  haptic([20, 35, 20, 35, 35]);
  showToast(`${state.name.toUpperCase()} IST AUF ÜBERRASCHUNGSREISE!`, 4200);
  render(now);
  window.setTimeout(openTravelDetails, 220);
}

function renderInventory(filter = inventoryFilter) {
  inventoryFilter = filter;
  state.inventory = normalizeInventory(state.inventory);
  state.garden = normalizeGarden(state.garden);
  const completion = inventoryCompletion(state.inventory);
  const equippedCount = Object.values(state.inventory.equipped).filter(Boolean).length;
  $("#inventory-summary").innerHTML = `
    <div><strong>${completion.owned}/${completion.total}</strong><small>ENTDECKT</small></div>
    <div><strong>${equippedCount}/5</strong><small>ANGEZOGEN</small></div>
    <div><strong>${state.inventory.placedItemIds.length}</strong><small>PLATZIERT</small></div>`;
  $$("button[data-filter]", $("#inventory-tabs")).forEach((button) => button.classList.toggle("is-active", button.dataset.filter === filter));
  elements.inventoryGrid.replaceChildren();

  if (filter === "harvest") {
    const gardenCard = document.createElement("article");
    gardenCard.className = "inventory-card is-placed";
    gardenCard.innerHTML = '<span class="inventory-card-icon">♣</span><strong>Gemüsegarten</strong><small>Pflanzen, gießen und offline wachsen lassen.</small><button type="button" data-open-garden>GARTEN PFLEGEN</button>';
    elements.inventoryGrid.append(gardenCard);
    for (const crop of Object.values(CROPS)) {
      const card = document.createElement("article");
      card.className = "inventory-card";
      card.innerHTML = `<span class="inventory-card-icon">${crop.icon}</span><strong>${crop.label}</strong><small>${state.garden.harvest[crop.id]} Stück im Vorrat.</small><button type="button" data-feed-harvest="${crop.id}" ${state.garden.harvest[crop.id] ? "" : "disabled"}>${state.garden.harvest[crop.id] ? "JETZT FÜTTERN" : "NOCH NICHT GEERNTET"}</button>`;
      elements.inventoryGrid.append(card);
    }
    return;
  }

  const definitions = Object.values(ITEM_DEFINITIONS).filter((item) => filter === "all" || item.type === filter);
  for (const item of definitions) {
    const owned = state.inventory.ownedItemIds.includes(item.id);
    const equipped = item.slot && state.inventory.equipped[item.slot] === item.id;
    const placed = state.inventory.placedItemIds.includes(item.id);
    const card = document.createElement("article");
    card.className = `inventory-card${owned ? "" : " is-locked"}${equipped ? " is-equipped" : ""}${placed ? " is-placed" : ""}`;
    const icon = document.createElement("span");
    icon.className = "inventory-card-icon";
    icon.textContent = owned ? item.icon : "?";
    const name = document.createElement("strong");
    name.textContent = owned ? item.label : "Unbekannter Reisefund";
    const detail = document.createElement("small");
    detail.textContent = owned ? item.detail : "Dein Capy kann diesen Gegenstand von einer Reise mitbringen.";
    const tag = document.createElement("em");
    tag.textContent = item.slot ? EQUIPMENT_SLOTS[item.slot] : WORLD_AREAS[item.area].short;
    const action = document.createElement("button");
    action.type = "button";
    action.dataset.inventoryItem = item.id;
    action.disabled = !owned;
    action.textContent = !owned ? "NOCH UNENTDECKT" : item.type === "wearable" ? (equipped ? "AUSZIEHEN" : "ANZIEHEN") : (placed ? "EINPACKEN" : "PLATZIEREN");
    card.append(icon, name, detail, tag, action);
    elements.inventoryGrid.append(card);
  }
}

function openInventory(filter = "all") {
  if (!hasStoredState || interactionBusy) return;
  closeTray();
  renderInventory(filter);
  openDialog(elements.inventoryDialog);
}

function useInventoryItem(itemId) {
  const item = ITEM_DEFINITIONS[itemId];
  if (!item) return;
  if (item.type === "wearable") {
    const result = toggleEquipment(state.inventory, itemId);
    state.inventory = result.inventory;
    const replaced = ITEM_DEFINITIONS[result.replacedId];
    talk(result.equipped
      ? `${item.label} steht mir ausgezeichnet!${replaced ? ` ${replaced.label} kommt dafür zurück in den Rucksack.` : ""}`
      : `${item.label} liegt wieder ordentlich im Rucksack.`, { speak: false });
    animateCapy("is-loved", 1200);
  } else {
    const result = togglePlacedItem(state.inventory, itemId);
    state.inventory = result.inventory;
    talk(result.placed
      ? `${item.label} steht jetzt bei ${WORLD_AREAS[item.area].label.toLowerCase()}. Ich werde es dort wiederfinden.`
      : `${item.label} ist wieder sicher im Rucksack.`, { speak: false });
  }
  haptic(16);
  renderInventory();
  render();
}

function renderGarden(now = Date.now()) {
  state.garden = normalizeGarden(state.garden);
  const picker = $("#seed-picker");
  picker.replaceChildren();
  for (const crop of Object.values(CROPS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `seed-button${state.garden.selectedCrop === crop.id ? " is-active" : ""}`;
    button.dataset.cropId = crop.id;
    button.innerHTML = `<span>${crop.icon}</span><strong>${crop.label}</strong><small>× ${state.garden.seeds[crop.id]}</small>`;
    picker.append(button);
  }

  const ownsWateringCan = state.inventory.ownedItemIds.includes("watering_can");
  elements.gardenPlots.replaceChildren();
  state.garden.plots.forEach((plot, index) => {
    const card = document.createElement("article");
    if (!plot) {
      const crop = CROPS[state.garden.selectedCrop];
      card.className = "garden-plot is-empty";
      card.innerHTML = `<span>＋</span><strong>BEET ${index + 1} IST FREI</strong><small>${crop.label} auswählen</small><button type="button" data-garden-action="plant" data-plot="${index}" ${state.garden.seeds[crop.id] ? "" : "disabled"}>${crop.icon} EINPFLANZEN</button>`;
    } else {
      const crop = CROPS[plot.cropId];
      const ready = now >= plot.readyAt;
      card.className = `garden-plot${ready ? " is-ready" : ""}`;
      card.innerHTML = `<span>${crop.icon}</span><strong>${crop.label.toUpperCase()}</strong><small>${cropTimeLabel(plot, now)}${plot.watered ? " · GEGOSSEN" : ""}</small><div class="crop-progress"><span style="--value:${cropProgress(plot, now)}%"></span></div>`;
      const action = document.createElement("button");
      action.type = "button";
      action.dataset.plot = String(index);
      action.dataset.gardenAction = ready ? "harvest" : "water";
      action.disabled = !ready && (!ownsWateringCan || plot.watered);
      action.textContent = ready ? "JETZT ERNTEN" : plot.watered ? "WÄCHST SCHNELLER" : ownsWateringCan ? "MIT GIESSKANNE GIESSEN" : "GIESSKANNE AUF REISE FINDEN";
      card.append(action);
    }
    elements.gardenPlots.append(card);
  });
  $("#harvest-pantry").innerHTML = `<strong>DEIN ERNTEVORRAT · BEIM FÜTTERN VERFÜGBAR</strong><div class="pantry-row">${Object.values(CROPS).map((crop) => `<span>${crop.icon}<b>× ${state.garden.harvest[crop.id]}</b></span>`).join("")}</div>`;
}

function openGarden() {
  if (!hasStoredState || isTraveling(state.travel)) {
    if (isTraveling(state.travel)) showToast("Der Garten wartet, bis dein Capy wieder zu Hause ist.");
    return;
  }
  if (elements.inventoryDialog.open) elements.inventoryDialog.close();
  renderGarden();
  openDialog(elements.gardenDialog);
}

function performGardenAction(action, plotIndex) {
  const now = Date.now();
  if (action === "plant") {
    const result = plantCrop(state.garden, plotIndex, now);
    state.garden = result.garden;
    if (result.planted) talk(`${result.crop.label} ist eingepflanzt. Es wächst auch weiter, wenn du die App schließt.`, { speak: false });
    else showToast("Für dieses Beet fehlt gerade Saatgut.");
  } else if (action === "water") {
    if (!state.inventory.ownedItemIds.includes("watering_can")) {
      showToast("Die Gießkanne kann dein Capy von einer Reise mitbringen.");
      return;
    }
    const result = waterCrop(state.garden, plotIndex, now);
    state.garden = result.garden;
    if (result.watered) talk("Gluck, gluck – jetzt wächst das Gemüse deutlich schneller!", { speak: false });
  } else if (action === "harvest") {
    const result = harvestCrop(state.garden, plotIndex, now);
    state.garden = result.garden;
    if (result.harvested) {
      state = applyChanges(state, { curiosity: 3, fun: 2, xp: 5 }, now);
      remember(`${state.name} hat mit dir ${result.amount} × ${result.crop.label} geerntet.`, result.crop.icon);
      talk(`${result.amount} ${result.crop.label}! Die können wir jetzt direkt aus dem Futterfach geben.`);
      showToast(`ERNTE: ${result.amount} × ${result.crop.label.toUpperCase()}`, 3200);
    }
  }
  playSound("tap");
  haptic(14);
  renderGarden(now);
  render(now);
}

function scheduleQuestWake(now = Date.now()) {
  window.clearTimeout(questWakeTimer);
  questWakeTimer = 0;
  if (!hasStoredState || !state.questProgress) return;
  const quest = currentQuest(state.questProgress);
  if (!quest || state.questProgress.activeId || state.questProgress.nextAt <= now) return;
  const delay = Math.min(2_147_000_000, Math.max(25, state.questProgress.nextAt - now + 25));
  questWakeTimer = window.setTimeout(() => {
    questWakeTimer = 0;
    render(Date.now());
  }, delay);
}

function renderQuestIndicator(now = Date.now()) {
  if (!hasStoredState || !state.questProgress) {
    elements.questAlert.hidden = true;
    elements.questBadge.hidden = true;
    scheduleQuestWake(now);
    return;
  }
  const quest = currentQuest(state.questProgress);
  const due = questIsDue(state.questProgress, now) && !isTraveling(state.travel, now);
  elements.questAlert.hidden = !due;
  elements.questBadge.hidden = !due;
  if (quest) $("#quest-alert-title").textContent = quest.title;
  if (due && quest) {
    const noticeKey = `${activePetId}:${state.questProgress.dayKey}:${quest.id}`;
    if (noticeKey !== lastQuestNotice && !document.hidden && !interactionBusy && !elements.welcomeDialog.open && !elements.dedicationDialog.open) {
      lastQuestNotice = noticeKey;
      talk(state.questProgress.activeId
        ? `Unsere Quest „${quest.title}“ wartet auf uns.`
        : quest.intro);
      playSound("happy");
      haptic([12, 35, 12]);
    }
  }
  scheduleQuestWake(now);
}

function renderQuestBoard(now = Date.now()) {
  if (!state.questProgress) return;
  state.questProgress = normalizeQuestProgress(state.questProgress, state.adoptedAt, now, `${activePetId}:${state.name}`);
  const progress = state.questProgress;
  const completedById = new Map(progress.completed.map((entry) => [entry.id, entry]));
  const nextQuest = currentQuest(progress);
  $("#quest-summary").innerHTML = `
    <div><strong>${progress.completed.length}/5</strong><small>HEUTE</small></div>
    <div><strong>✦ ${progress.glitter}</strong><small>GLITZER</small></div>
    <div><strong>${progress.streak || 0}</strong><small>TAGES-SERIE</small></div>`;
  const list = $("#quest-list");
  list.replaceChildren();
  progress.queue.forEach((id, index) => {
    const quest = QUEST_DEFINITIONS[id];
    const completed = completedById.get(id);
    const active = progress.activeId === id;
    const current = nextQuest?.id === id;
    const due = current && questIsDue(progress, now) && !active;
    const card = document.createElement("article");
    card.className = `quest-card ${completed ? "is-done" : active ? "is-active" : due ? "is-due" : "is-locked"}`;
    const icon = document.createElement("span");
    icon.className = "quest-card-icon";
    icon.textContent = completed ? "✓" : quest.icon;
    const info = document.createElement("div");
    info.className = "quest-card-info";
    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${quest.title}`;
    const description = document.createElement("small");
    description.textContent = quest.short;
    const meta = document.createElement("span");
    meta.textContent = completed
      ? `${"★".repeat(completed.stars)} · +${completed.reward} GLITZER`
      : active ? "QUEST AKTIV"
        : current ? questTimeLabel(progress, now)
          : "WIRD SPÄTER FREIGESCHALTET";
    info.append(title, description, meta);
    const action = document.createElement("button");
    action.type = "button";
    action.className = "quest-card-action";
    action.dataset.questId = id;
    action.disabled = Boolean(completed || (!active && !due));
    action.textContent = completed ? "FERTIG" : active ? (quest.type === "task" ? "ANSEHEN" : "SPIELEN") : due ? "STARTEN" : "GESPERRT";
    card.append(icon, info, action);
    if (active && quest.type === "task") {
      const goals = document.createElement("div");
      goals.className = "quest-goals";
      quest.goals.forEach((goal) => {
        const row = document.createElement("div");
        const done = progress.taskDone.includes(goal.action);
        row.className = `quest-goal${done ? " is-done" : ""}`;
        row.textContent = `${done ? "✓" : "○"} ${goal.label}`;
        goals.append(row);
      });
      card.append(goals);
    }
    list.append(card);
  });
}

function openQuestBoard() {
  if (!hasStoredState) return;
  if (interactionBusy) {
    showToast("Lass die aktuelle Aktion kurz zu Ende gehen.");
    return;
  }
  closeTray();
  renderQuestBoard();
  openDialog(elements.questDialog);
}

function startQuestById(id) {
  if (isTraveling(state.travel)) {
    const destination = destinationById(state.travel.destinationId);
    showToast(`${state.name} ist gerade in ${destination?.title || "der Ferne"}. Die Quest wartet.`);
    return;
  }
  if (state.sleeping) {
    showToast(`Weck ${state.name} zuerst ganz sanft auf.`);
    return;
  }
  const quest = QUEST_DEFINITIONS[id];
  if (!quest) return;
  state.questProgress = activateQuest(state.questProgress, id);
  if (state.questProgress.activeId !== id) {
    showToast("Diese Quest ist noch nicht freigeschaltet.");
    return;
  }
  saveState();
  if (quest.type === "task") {
    if (elements.questDialog.open) elements.questDialog.close();
    talk(quest.intro);
    showToast("Die Quest läuft – nutze unten die normalen Aktionen.", 3600);
    render();
    return;
  }
  if (elements.questDialog.open) elements.questDialog.close();
  activeGameCleanup?.();
  activeGameCleanup = null;
  $("#quest-game-kicker").textContent = `${quest.icon} GEMEINSAME QUEST`;
  $("#quest-game-title").textContent = quest.title;
  $("#quest-game-instruction").textContent = quest.instruction;
  elements.questGameStatus.textContent = "BEREIT?";
  openDialog(elements.questGameDialog);
  activeGameCleanup = startQuestGame({
    quest,
    stage: elements.questStage,
    status: elements.questGameStatus,
    onMessage: (message) => talk(message, { speak: false }),
    onFinish: (score) => finishQuestGame(score),
  });
  render();
}

function finishQuestGame(score) {
  const quest = currentQuest(state.questProgress);
  if (!quest || quest.type !== "minigame" || state.questProgress.activeId !== quest.id) return;
  activeGameCleanup?.();
  activeGameCleanup = null;
  state.questProgress = completeQuest(state.questProgress, quest.id, score);
  const result = state.questProgress.completed.find((entry) => entry.id === quest.id);
  state = applyChanges(state, quest.reward);
  remember(`${state.name} hat die Quest „${quest.title}“ mit ${result.stars} Sternen gemeistert.`, "✦");
  if (elements.questGameDialog.open) elements.questGameDialog.close();
  talk(`${"Stern! ".repeat(result.stars)}Wir haben „${quest.title}“ geschafft. Mit dir sind Abenteuer noch schöner!`);
  animateCapy("is-loved", 1700);
  playSound("happy");
  haptic([18, 25, 18, 25, 30]);
  showToast(`QUEST GESCHAFFT · +${result.reward} GLITZER · ${result.score} PUNKTE`, 4200);
  render();
}

function cancelQuestGame() {
  activeGameCleanup?.();
  activeGameCleanup = null;
  if (elements.questGameDialog.open) elements.questGameDialog.close();
  talk("Kein Problem. Unsere Quest wartet hier auf uns.", { speak: false });
  render();
}

function trackQuestAction() {
  const action = pendingQuestAction;
  pendingQuestAction = null;
  if (!action || !state.questProgress) return null;
  const quest = currentQuest(state.questProgress);
  if (!quest || quest.type !== "task") return null;
  const updated = recordQuestAction(state.questProgress, action);
  if (updated === state.questProgress) return null;
  state.questProgress = updated;
  if (!taskQuestComplete(updated)) {
    showToast(`QUEST: ${updated.taskDone.length}/${quest.goals.length} AUFGABEN ERLEDIGT`, 3200);
    return null;
  }
  state.questProgress = completeQuest(updated, quest.id, 100);
  const result = state.questProgress.completed.find((entry) => entry.id === quest.id);
  state = applyChanges(state, quest.reward);
  remember(`${state.name} hat mit dir die Quest „${quest.title}“ vollständig erlebt.`, "✦");
  showToast(`QUEST GESCHAFFT · +${result.reward} GLITZER`, 4200);
  return { quest, result };
}

function buildPixelCapy() {
  elements.capy.style.setProperty("--capy-cols", CAPY_WIDTH);
  elements.capy.style.setProperty("--capy-rows", CAPY_HEIGHT);
  const fragment = document.createDocumentFragment();
  CAPY_PIXELS.forEach((row, y) => {
    [...row].forEach((code, x) => {
      const pixel = document.createElement("span");
      pixel.className = `pixel pixel-${code}`;
      pixel.style.setProperty("--x", x);
      pixel.style.setProperty("--y", y);
      fragment.append(pixel);
    });
  });
  elements.capy.replaceChildren(fragment);
}

function render(now = Date.now()) {
  state = advanceState(state, now);
  const traveling = syncTravelState(now);
  syncWorldState(now, traveling);
  if (hasStoredState) state.questProgress = normalizeQuestProgress(state.questProgress, state.adoptedAt, now, `${activePetId}:${state.name}`);
  const mood = moodFor(state);
  const level = levelInfo(state.xp);
  const hour = new Date(now).getHours();
  const period = hour < 6 || hour >= 21 ? "night" : hour < 9 || hour >= 18 ? "dusk" : "day";

  elements.day.textContent = `TAG ${dayNumber(state, now)}`;
  elements.clock.textContent = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(now);
  elements.habitat.dataset.period = state.sleeping ? "night" : period;
  elements.habitat.classList.toggle("is-sleeping", state.sleeping);
  elements.capy.dataset.mood = mood.tone;
  elements.capy.dataset.variant = state.furVariant;
  elements.capy.classList.toggle("is-dirty", state.clean < 38);
  elements.capy.classList.toggle("is-tired", state.energy < 25 && !state.sleeping);
  elements.name.textContent = state.name.toUpperCase();
  elements.level.textContent = `LV. ${level.level}`;
  elements.xp.style.setProperty("--value", `${level.progress}%`);
  elements.mood.className = `mood mood-${mood.tone}`;
  elements.mood.innerHTML = traveling
    ? '<span aria-hidden="true">⌁</span> AUF REISEN'
    : `<span aria-hidden="true">${state.sleeping ? "☾" : "♥"}</span> ${mood.label}`;
  elements.speech.textContent = currentPhrase;
  const collection = inventoryCompletion(state.inventory);
  $("#inventory-count").textContent = `${collection.owned} / ${collection.total} GEGENSTÄNDE`;

  for (const key of NEED_KEYS) {
    const rounded = Math.round(state[key]);
    const output = $(`[data-value="${key}"]`);
    const meter = $(`[data-meter="${key}"]`);
    output.textContent = `${rounded}%`;
    meter.style.setProperty("--value", `${rounded}%`);
    meter.dataset.level = rounded < 25 ? "low" : rounded < 55 ? "mid" : "good";
    meter.setAttribute("aria-valuenow", String(rounded));
  }

  elements.sleepLabel.textContent = state.sleeping ? "WECKEN" : "SCHLAFEN";
  elements.sleepAction.querySelector("small").textContent = state.sleeping ? "Guten Morgen" : "Licht aus";
  $$('button[data-action]:not([data-action="sleep"])', elements.actions).forEach((button) => {
    button.disabled = state.sleeping || interactionBusy || traveling;
  });
  elements.sleepAction.disabled = interactionBusy || traveling;
  renderLandscape(now, traveling);
  renderWeather();
  renderQuestIndicator(now);
  if (elements.inventoryDialog.open) renderInventory();
  if (elements.gardenDialog.open) renderGarden(now);
  saveState();
}

function talk(phrase, { speak = true } = {}) {
  currentPhrase = phrase;
  elements.speech.textContent = phrase;
  if (speak && state.voice && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "de-DE";
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.toLowerCase().startsWith("de"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }
}

function playSound(kind = "happy") {
  if (!state.sound) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();
    const notes = kind === "sleep" ? [330, 262]
      : kind === "splash" ? [392, 523, 392]
        : kind === "sad" ? [330, 247, 196]
          : kind === "tap" ? [440]
            : [523, 659];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.032, audioContext.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.08 + 0.1);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * 0.08);
      oscillator.stop(audioContext.currentTime + index * 0.08 + 0.11);
    });
  } catch {
    // Audio is optional; Safari may reject it before the first gesture.
  }
}

function haptic(pattern = 18) {
  if (state.haptics && navigator.vibrate) navigator.vibrate(pattern);
}

function showToast(message, duration = 2400) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => { elements.toast.hidden = true; }, duration);
}

function openDialog(dialog) {
  if (dialog && !dialog.open) dialog.showModal();
}

function animateCapy(className, duration = 1400) {
  elements.capy.classList.remove(...CAPY_ANIMATIONS);
  void elements.capy.offsetWidth;
  elements.capy.classList.add(className);
  window.setTimeout(() => elements.capy.classList.remove(className), duration);
}

function itemSprite(key, extra = "") {
  const sprite = document.createElement("span");
  sprite.className = `item-sprite sprite-${key} ${extra}`.trim();
  return sprite;
}

function itemFor(category, key) {
  if (category === "feed" && key.startsWith("harvest-")) {
    const cropId = key.slice("harvest-".length);
    const crop = CROPS[cropId];
    if (!crop) return null;
    return {
      ...crop.food,
      label: crop.label,
      detail: `Eigene Ernte · noch ${state.garden.harvest[cropId]} Stück`,
      harvest: true,
      cropId,
    };
  }
  return GROUPS[category]?.items[key] || null;
}

function trayEntries(category, group) {
  const entries = Object.entries(group.items);
  if (category !== "feed") return entries;
  const harvest = Object.values(CROPS)
    .filter((crop) => state.garden.harvest[crop.id] > 0)
    .map((crop) => [`harvest-${crop.id}`, itemFor("feed", `harvest-${crop.id}`)]);
  return [...harvest, ...entries];
}

function sceneObject(key, x, y, className = "") {
  const object = itemSprite(key, `scene-object ${className}`);
  object.style.left = `${x}px`;
  object.style.top = `${y}px`;
  elements.sceneLayer.append(object);
  return object;
}

function remember(text, icon) {
  state = addMemory(state, text, icon);
}

function finishInteraction(changes, phrase, memory, icon = "♥", reaction = "happy") {
  state = applyChanges(state, changes);
  remember(memory, icon);
  const questCompletion = trackQuestAction();
  interactionBusy = false;
  talk(questCompletion
    ? `Geschafft! „${questCompletion.quest.title}“ war richtig schön mit dir. Schau, wie viel es glitzert!`
    : phrase);
  playSound(questCompletion || reaction !== "hate" ? "happy" : "sad");
  haptic(questCompletion ? [18, 25, 18, 25, 30] : reaction === "hate" ? [40, 22, 40] : [18, 30, 18]);
  if (questCompletion || reaction === "love") animateCapy("is-loved", 1700);
  else if (reaction === "hate") animateCapy("is-disgusted", 1900);
  render();
}

function openTray(category) {
  if (isTraveling(state.travel)) {
    const destination = destinationById(state.travel.destinationId);
    showToast(`${state.name} ist gerade in ${destination?.title || "der Ferne"}.`);
    return;
  }
  if (state.sleeping || interactionBusy) return;
  const group = GROUPS[category];
  if (!group) return;
  activeTray = category;
  selectedItem = null;
  elements.trayKicker.textContent = group.kicker;
  elements.trayTitle.textContent = group.title.replace("{name}", state.name);
  elements.trayInstruction.textContent = category === "feed"
    ? `${group.instruction} Seltene Markt-Snacks tauchen nur zeitweise auf.`
    : group.instruction;
  elements.trayProgress.hidden = true;
  elements.trayProgress.querySelector("span").style.width = "0%";
  elements.trayItems.replaceChildren();

  const questId = state.questProgress?.activeId || "";
  for (const [key, item] of trayEntries(category, group)) {
    const availability = category === "feed" && !item.harvest ? foodAvailability(key, state, Date.now(), questId) : { available: true };
    if (!availability.available) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tray-item${item.temporary ? " is-limited" : ""}${item.harvest ? " is-harvest" : ""}`;
    button.dataset.category = category;
    button.dataset.key = key;
    button.setAttribute("aria-label", `${item.label}: ${item.detail}. Ziehen oder auswählen.`);
    button.append(itemSprite(key));
    const text = document.createElement("span");
    text.innerHTML = `<strong>${item.label}</strong><small>${item.detail}</small>`;
    button.append(text);
    if (item.temporary) {
      const badge = document.createElement("em");
      badge.className = "tray-item-badge";
      badge.textContent = availability.reason || "NUR KURZ DA";
      button.append(badge);
    }
    elements.trayItems.append(button);
  }

  elements.tray.hidden = false;
  $$('[data-action]', elements.actions).forEach((button) => button.classList.toggle("is-active", button.dataset.action === category));
  window.setTimeout(() => elements.tray.classList.add("is-open"), 0);
}

function closeTray() {
  activeTray = null;
  selectedItem = null;
  elements.tray.classList.remove("is-open");
  elements.tray.hidden = true;
  elements.dropHint.hidden = true;
  $$('[data-action]', elements.actions).forEach((button) => button.classList.remove("is-active"));
}

function selectItem(category, key) {
  selectedItem = { category, key };
  $$(".tray-item", elements.trayItems).forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.category === category && button.dataset.key === key);
  });
  const item = itemFor(category, key);
  if (!item) return;
  const target = targetFor(category, key) === "capy" ? state.name : "das Gehege";
  talk(`${item.label} ausgewählt. Tippe jetzt auf ${target} – oder zieh es direkt hin.`, { speak: false });
  showToast(`${item.label} ausgewählt`, 1700);
}

function targetFor(category, key) {
  if (category === "feed") return "capy";
  if (category === "care") return "capy";
  if (category === "play" && key === "rope") return "capy";
  if (category === "together" && ["cuddle", "talk"].includes(key)) return "capy";
  return "habitat";
}

function inside(point, rect, inset = 0) {
  return point.x >= rect.left + inset && point.x <= rect.right - inset && point.y >= rect.top + inset && point.y <= rect.bottom - inset;
}

function hitTarget(category, key, point) {
  const target = targetFor(category, key);
  if (target === "capy") return inside(point, elements.capy.getBoundingClientRect(), -8);
  return inside(point, elements.habitat.getBoundingClientRect(), 8);
}

function showDragGhost(clientX, clientY, key) {
  elements.ghost.replaceChildren(itemSprite(key));
  elements.ghost.hidden = false;
  elements.ghost.style.transform = `translate3d(${clientX - 34}px, ${clientY - 34}px, 0)`;
}

function startDrag(event) {
  const button = event.target.closest(".tray-item");
  if (!button || interactionBusy || state.sleeping || isTraveling(state.travel)) return;
  event.preventDefault();
  selectItem(button.dataset.category, button.dataset.key);
  drag = {
    pointerId: event.pointerId,
    category: button.dataset.category,
    key: button.dataset.key,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    moved: false,
    work: 0,
    lastSparkle: 0,
  };
  button.setPointerCapture?.(event.pointerId);
  showDragGhost(event.clientX, event.clientY, drag.key);
  elements.dropHint.textContent = targetFor(drag.category, drag.key) === "capy" ? `ZU ${state.name.toUpperCase()}` : "INS GEHEGE";
  elements.dropHint.hidden = false;
  if (["brush", "rope"].includes(drag.key)) elements.trayProgress.hidden = false;
  haptic(9);
}

function addCareSparkle(clientX, clientY) {
  const habitatRect = elements.habitat.getBoundingClientRect();
  const sparkle = document.createElement("i");
  sparkle.className = "care-sparkle";
  sparkle.textContent = "✦";
  sparkle.style.left = `${clientX - habitatRect.left}px`;
  sparkle.style.top = `${clientY - habitatRect.top}px`;
  elements.sceneLayer.append(sparkle);
  window.setTimeout(() => sparkle.remove(), 650);
}

function moveDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  const segment = Math.hypot(event.clientX - drag.lastX, event.clientY - drag.lastY);
  drag.moved ||= Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 9;
  const point = { x: event.clientX, y: event.clientY };
  const onTarget = hitTarget(drag.category, drag.key, point);
  if (onTarget && ["brush", "rope"].includes(drag.key)) {
    drag.work += segment;
    const goal = drag.key === "brush" ? 145 : 180;
    elements.trayProgress.querySelector("span").style.width = `${Math.min(100, drag.work / goal * 100)}%`;
    if (drag.work - drag.lastSparkle > 28) {
      drag.lastSparkle = drag.work;
      addCareSparkle(event.clientX, event.clientY);
      haptic(5);
    }
  }
  elements.capy.classList.toggle("drop-ready", onTarget && targetFor(drag.category, drag.key) === "capy");
  elements.habitat.classList.toggle("drop-ready", onTarget && targetFor(drag.category, drag.key) === "habitat");
  elements.dropHint.classList.toggle("is-ready", onTarget);
  showDragGhost(event.clientX, event.clientY, drag.key);
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
}

function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  const finished = drag;
  drag = null;
  suppressClickUntil = Date.now() + 450;
  elements.ghost.hidden = true;
  elements.dropHint.hidden = true;
  elements.capy.classList.remove("drop-ready");
  elements.habitat.classList.remove("drop-ready");
  const point = { x: event.clientX, y: event.clientY };
  if (!finished.moved) return;
  if (!hitTarget(finished.category, finished.key, point)) {
    showToast(targetFor(finished.category, finished.key) === "capy" ? `Noch näher zu ${state.name} ziehen!` : "Wirf es weiter nach oben ins Gehege!");
    return;
  }
  if (finished.key === "brush" && finished.work < 90) {
    showToast("Noch ein paar Bürstenstriche durchs Fell!");
    return;
  }
  if (finished.key === "rope" && finished.work < 110) {
    showToast("Zieh das Seil kräftig über dem Capybara hin und her!");
    return;
  }
  performItem(finished.category, finished.key, point);
}

async function performItem(category, key, clientPoint) {
  if (interactionBusy || state.sleeping || isTraveling(state.travel)) return;
  const item = itemFor(category, key);
  if (!item) return;
  if (category === "feed" && !item.harvest) {
    const availability = foodAvailability(key, state, Date.now(), state.questProgress?.activeId || "");
    if (!availability.available) {
      showToast(`${item.label} ist gerade nicht mehr auf dem Markt.`);
      closeTray();
      return;
    }
  }
  if (item.harvest) {
    const result = consumeHarvest(state.garden, item.cropId);
    if (!result.consumed) {
      showToast(`${item.label} ist nicht mehr im Erntevorrat.`);
      closeTray();
      return;
    }
    state.garden = result.garden;
  }
  interactionBusy = true;
  pendingQuestAction = `${category}:${key}`;
  selectedItem = null;
  render();

  if (category === "feed") await feedAnimation(key, item);
  else if (category === "play" && ["ball", "frisbee"].includes(key)) await fetchAnimation(key, item, clientPoint);
  else if (category === "play" && key === "bubbles") startBubbles(item);
  else if (category === "play" && key === "rope") await simpleAnimation("is-tugging", 1800, item, `Mit ${state.name} am Zerrseil gespielt.`, "⚽");
  else if (category === "care" && key === "brush") await simpleAnimation("is-brushed", 1900, item, `${state.name}s Fell gründlich gebürstet.`, "✦");
  else if (category === "care" && key === "bath") await bathAnimation(item);
  else if (category === "care" && key === "towel") await simpleAnimation("is-drying", 1900, item, `${state.name} flauschig trocken gerubbelt.`, "☁");
  else if (category === "together" && key === "cuddle") await cuddleAnimation(item);
  else if (category === "together" && key === "talk") await talkAnimation(item);
  else if (category === "together" && key === "explore") await exploreAnimation(item, clientPoint);
  else if (category === "together" && key === "sunbathe") await simpleAnimation("is-sunbathing", 2700, item, `Mit ${state.name} in der Sonne gedöst.`, "☀");
}

async function feedAnimation(key, item) {
  const habitatRect = elements.habitat.getBoundingClientRect();
  const capyRect = elements.capy.getBoundingClientRect();
  const food = sceneObject(key, capyRect.right - habitatRect.left - 17, capyRect.top - habitatRect.top + capyRect.height * 0.57, "is-feeding");
  animateCapy("is-eating", 2100);
  talk(item.reaction === "hate" ? "Moment … ist das etwa eine Zwiebel?" : `Oh! ${item.label}! Gib her …`, { speak: false });
  playSound("tap");
  await wait(2100);
  food.remove();
  const memory = item.reaction === "hate"
    ? `${state.name} hat mutig an einer Zwiebel probiert und sehr deutlich gezeigt, dass es sie hasst.`
    : `${state.name} hat ${item.label} aus deiner Hand gefuttert.`;
  const icon = key === "melon" ? "🍉" : key === "pickle" ? "▰" : key === "onion" ? "◉" : "●";
  finishInteraction(
    item,
    item.reaction === "hate" ? item.phrase : state.satiety + item.satiety > 112 ? "Puh, mein Bauch ist jetzt kugelrund!" : item.phrase,
    memory,
    icon,
    item.reaction,
  );
}

async function fetchAnimation(key, item, clientPoint) {
  const habitatRect = elements.habitat.getBoundingClientRect();
  const x = Math.max(24, Math.min(habitatRect.width - 45, clientPoint.x - habitatRect.left));
  const y = Math.max(105, Math.min(habitatRect.height - 72, clientPoint.y - habitatRect.top));
  const toy = sceneObject(key, x, y, "is-landed");
  const fetchX = Math.max(-105, Math.min(105, x - habitatRect.width / 2));
  elements.capy.style.setProperty("--fetch-x", `${fetchX}px`);
  animateCapy("is-fetching", 2500);
  talk(`${item.label} entdeckt – ich komme!`, { speak: false });
  playSound("tap");
  await wait(1250);
  toy.classList.add("is-returning");
  await wait(1300);
  toy.remove();
  finishInteraction(item, item.phrase, `${state.name} hat ${item.label === "Ball" ? "den Ball" : "die Frisbee"} apportiert.`, "⚽");
}

function startBubbles(item) {
  elements.bubbleLayer.replaceChildren();
  const positions = [[12, 46], [34, 34], [59, 49], [79, 30], [21, 67], [48, 69], [72, 62], [87, 78]];
  positions.forEach(([left, top], index) => {
    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = "bubble";
    bubble.style.left = `${left}%`;
    bubble.style.top = `${top}%`;
    bubble.style.setProperty("--delay", `${index * -0.17}s`);
    bubble.setAttribute("aria-label", "Seifenblase zerplatzen lassen");
    elements.bubbleLayer.append(bubble);
  });
  bubbleSession = { item, popped: 0, total: positions.length, timer: window.setTimeout(() => finishBubbles(), 14_000) };
  animateCapy("is-playing", 14_000);
  talk("Hilf mir! Tipp die Seifenblasen kaputt!", { speak: false });
  showToast("Tippe alle 8 Seifenblasen!", 2800);
}

function popBubble(button) {
  if (!bubbleSession || button.classList.contains("is-popped")) return;
  button.classList.add("is-popped");
  bubbleSession.popped += 1;
  playSound("tap");
  haptic(8);
  animateCapy("is-playing", 550);
  window.setTimeout(() => button.remove(), 280);
  if (bubbleSession.popped >= bubbleSession.total) finishBubbles();
}

function finishBubbles() {
  if (!bubbleSession) return;
  window.clearTimeout(bubbleSession.timer);
  const { item, popped, total } = bubbleSession;
  bubbleSession = null;
  elements.bubbleLayer.replaceChildren();
  elements.capy.classList.remove("is-playing");
  const factor = Math.max(0.35, popped / total);
  const changes = { ...item, fun: item.fun * factor, curiosity: item.curiosity * factor, xp: item.xp * factor };
  finishInteraction(changes, popped === total ? item.phrase : `${popped} Blasen! Die anderen fangen wir beim nächsten Mal.`, `${state.name} hat ${popped} Seifenblasen gejagt.`, "○");
}

async function bathAnimation(item) {
  const habitatRect = elements.habitat.getBoundingClientRect();
  const pondRect = elements.pond.getBoundingClientRect();
  const bathX = pondRect.left + pondRect.width / 2 - habitatRect.left;
  const duck = sceneObject("bath", bathX, pondRect.top - habitatRect.top + 2, "is-floating");
  elements.habitat.classList.add("bath-time");
  animateCapy("is-bathing", 3800);
  talk("Ab in den Teich – CAAAAPY-SPLASH!", { speak: false });
  await wait(1050);
  playSound("splash");
  haptic([15, 40, 25]);
  await wait(1300);
  talk("Schau mal, ich kann richtig gut schwimmen!", { speak: false });
  await wait(1500);
  duck.remove();
  elements.habitat.classList.remove("bath-time");
  finishInteraction(item, item.phrase, `${state.name} ist in den Teich gesprungen und geschwommen.`, "≈");
}

async function simpleAnimation(className, duration, item, memory, icon) {
  animateCapy(className, duration);
  talk(item.detail, { speak: false });
  playSound("tap");
  await wait(duration);
  finishInteraction(item, item.phrase, memory, icon);
}

async function cuddleAnimation(item) {
  animateCapy("is-cuddling", 2400);
  for (let index = 0; index < 5; index += 1) {
    window.setTimeout(() => spawnHeart(), index * 260);
  }
  talk("Mmmh … ich rücke ganz nah zu dir.", { speak: false });
  await wait(2400);
  finishInteraction(item, item.phrase, `${state.name} hat ganz lange mit dir gekuschelt.`, "♥");
}

async function talkAnimation(item) {
  animateCapy("is-talking", 1200);
  talk("Oh ja! Ich wollte dich sowieso etwas fragen …", { speak: false });
  await wait(850);
  startConversation(item);
}

function startConversation(item) {
  const dialogue = dialogueFor(state);
  currentConversation = { dialogue, item, turn: 0, changes: {}, answers: [] };
  $("#dialogue-topic").textContent = "ECHTES CAPY-GESPRÄCH";
  $("#dialogue-title").textContent = dialogue.title;
  renderConversationTurn();
  openDialog(elements.dialogueDialog);
}

function renderConversationTurn() {
  if (!currentConversation) return;
  const turn = currentConversation.dialogue.turns[currentConversation.turn];
  $("#dialogue-message").innerHTML = `<strong>${state.name}</strong><p>${turn.prompt}</p>`;
  const choices = $("#dialogue-choices");
  choices.replaceChildren();
  turn.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-choice";
    button.textContent = choice.label;
    button.addEventListener("click", () => chooseDialogueAnswer(choice));
    choices.append(button);
  });
  talk(turn.prompt);
}

function chooseDialogueAnswer(choice) {
  if (!currentConversation) return;
  currentConversation.answers.push(choice.label);
  for (const [key, value] of Object.entries(choice.changes || {})) {
    currentConversation.changes[key] = (currentConversation.changes[key] || 0) + value;
  }
  $("#dialogue-message").innerHTML = `<span class="your-answer">DU: ${choice.label}</span><strong>${state.name}</strong><p>${choice.response}</p>`;
  talk(choice.response);
  animateCapy("is-talking", 1500);
  const choices = $("#dialogue-choices");
  choices.replaceChildren();
  const next = document.createElement("button");
  next.type = "button";
  next.className = "dialogue-next";
  const hasNext = currentConversation.turn + 1 < currentConversation.dialogue.turns.length;
  next.textContent = hasNext ? "WEITERREDEN" : "GESPRÄCH BEENDEN";
  next.addEventListener("click", () => {
    if (hasNext) {
      currentConversation.turn += 1;
      renderConversationTurn();
    } else {
      finishConversation();
    }
  });
  choices.append(next);
}

function finishConversation() {
  if (!currentConversation) return;
  const { dialogue, item, changes, answers } = currentConversation;
  currentConversation = null;
  elements.dialogueDialog.close();
  const totalChanges = { ...item };
  for (const [key, value] of Object.entries(changes)) totalChanges[key] = (Number(totalChanges[key]) || 0) + value;
  finishInteraction(totalChanges, "Danke, dass du mit mir geredet hast. Jetzt fühle ich mich dir noch näher.", `${dialogue.memory} Deine Antworten: ${answers.join(" · ")}`, "…");
}

async function exploreAnimation(item, clientPoint) {
  const habitatRect = elements.habitat.getBoundingClientRect();
  const x = Math.max(24, Math.min(habitatRect.width - 40, clientPoint.x - habitatRect.left));
  const y = Math.max(120, Math.min(habitatRect.height - 60, clientPoint.y - habitatRect.top));
  const leaf = sceneObject("explore", x, y, "is-landed");
  elements.capy.style.setProperty("--fetch-x", `${Math.max(-100, Math.min(100, x - habitatRect.width / 2))}px`);
  animateCapy("is-exploring", 3000);
  talk("Warte – da raschelt etwas!", { speak: false });
  await wait(3000);
  leaf.remove();
  finishInteraction(item, item.phrase, `${state.name} hat eine neue Ecke des Geheges erkundet.`, "⌁");
}

function performSelectedOnCapy() {
  if (!selectedItem || targetFor(selectedItem.category, selectedItem.key) !== "capy") return false;
  performItem(selectedItem.category, selectedItem.key, { x: elements.capy.getBoundingClientRect().left, y: elements.capy.getBoundingClientRect().top });
  return true;
}

function performSelectedInHabitat(event) {
  if (!selectedItem || targetFor(selectedItem.category, selectedItem.key) !== "habitat") return false;
  performItem(selectedItem.category, selectedItem.key, { x: event.clientX, y: event.clientY });
  return true;
}

function toggleSleep() {
  if (interactionBusy) return;
  if (isTraveling(state.travel)) {
    showToast(`${state.name} schläft heute erst nach der Rückkehr wieder in der Hütte.`);
    return;
  }
  closeTray();
  if (state.sleeping) {
    state = advanceState(state);
    state.sleeping = false;
    remember(`${state.name} ist gut erholt aufgewacht.`, "☀");
    talk(state.energy > 88 ? "Guten Morgen! Ich fühle mich capystark." : "Huch – bin schon wach!");
    playSound("happy");
  } else {
    state.sleeping = true;
    state.updatedAt = Date.now();
    remember(`${state.name} ist gemütlich eingeschlafen.`, "☾");
    talk("Gute Nacht. Ich erhole mich weiter, auch wenn du die App schließt.");
    playSound("sleep");
  }
  state.interactions += 1;
  haptic(24);
  render();
}

function petCapy(event) {
  event.stopPropagation();
  if (Date.now() < suppressClickUntil || interactionBusy) return;
  if (isTraveling(state.travel)) {
    openTravelDetails();
    return;
  }
  if (performSelectedOnCapy()) return;
  if (Date.now() - lastPetAt < 500) return;
  lastPetAt = Date.now();
  if (state.sleeping) {
    talk("Mmmh … noch fünf Capy-Minuten.", { speak: false });
    return;
  }
  state = applyChanges(state, { fun: 1.2, social: 2.2, xp: 0.5 });
  if (state.interactions % 8 === 0) remember(`${state.name} wurde liebevoll hinter dem Ohr gekrault.`, "♥");
  talk("Hihi, das kitzelt! Noch ein bisschen hinterm Ohr.", { speak: state.interactions % 5 === 0 });
  animateCapy("is-loved", 1050);
  playSound("tap");
  haptic(12);
  spawnHeart(event);
  render();
}

function spawnHeart(event) {
  const rect = elements.petButton.getBoundingClientRect();
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.textContent = "♥";
  heart.style.left = `${event?.clientX ? event.clientX - rect.left : rect.width * (0.35 + Math.random() * 0.3)}px`;
  heart.style.top = `${event?.clientY ? event.clientY - rect.top : rect.height * 0.5}px`;
  elements.heartLayer.append(heart);
  window.setTimeout(() => heart.remove(), 1000);
}

function formatDuration(milliseconds) {
  const minutes = Math.max(1, Math.round(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} MINUTEN`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} ${hours === 1 ? "STUNDE" : "STUNDEN"}`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "TAG" : "TAGE"}`;
}

function showAwayReport() {
  if (isTraveling(state.travel)) return;
  if (!awayInfo || awayInfo.elapsedMs < 5 * 60_000) return;
  $("#away-title").textContent = `${state.name} hat auf dich gewartet`;
  $("#away-clock").textContent = formatDuration(awayInfo.elapsedMs);
  $("#away-text").textContent = awayInfo.sleeping
    ? `${state.name} hat weitergeschlafen und dabei neue Energie gesammelt.`
    : `${state.name} war die ganze Zeit weiter lebendig. Bedürfnisse haben sich verändert – aber dein Capybara kann nicht sterben.`;
  const changes = $("#away-changes");
  changes.replaceChildren();
  NEED_KEYS.forEach((key) => {
    const delta = Math.round(awayInfo.changes[key]);
    if (delta === 0) return;
    const item = document.createElement("div");
    item.innerHTML = `<span>${NEED_LABELS[key]}</span><strong class="${delta > 0 ? "positive" : "negative"}">${delta > 0 ? "+" : ""}${delta}</strong>`;
    changes.append(item);
  });
  openDialog(elements.awayDialog);
}

function renderJournal() {
  $("#journal-dialog .sheet-title h2").textContent = `${state.name}s Tagebuch`;
  $("#journal-summary").innerHTML = `<strong>TAG ${dayNumber(state)}</strong><span>${state.interactions} gemeinsame Momente · Level ${levelInfo(state.xp).level}</span>`;
  const list = $("#memory-list");
  list.replaceChildren();
  const memories = [...state.memories].reverse();
  if (!memories.length) {
    const empty = document.createElement("li");
    empty.className = "memory-empty";
    empty.textContent = "Euer nächstes gemeinsames Erlebnis wird hier festgehalten.";
    list.append(empty);
    return;
  }
  memories.forEach((memory) => {
    const row = document.createElement("li");
    const date = memory.at ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(memory.at) : "Früher";
    row.innerHTML = `<span class="memory-icon">${memory.icon}</span><div><strong>${memory.text}</strong><small>${date}</small></div>`;
    list.append(row);
  });
}

function relativeVisit(timestamp) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 2) return "gerade aktiv";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
}

function renderLibrary() {
  saveState();
  $("#library-count").textContent = `${library.profiles.length} ${library.profiles.length === 1 ? "CAPY" : "CAPYS"} IN DEINER FAMILIE`;
  const list = $("#library-list");
  list.replaceChildren();
  library.profiles.forEach((profile) => {
    const preview = advanceState(profile.state);
    const previewTravel = normalizeTravel(preview.travel, preview.adoptedAt, Date.now(), `${profile.id}:${preview.name}:${preview.adoptedAt}`);
    const mood = moodFor(preview);
    const card = document.createElement("article");
    card.className = `library-card${profile.id === activePetId ? " is-active" : ""}`;
    card.dataset.profileId = profile.id;

    const avatar = document.createElement("span");
    avatar.className = `library-capy fur-${preview.furVariant}`;
    avatar.setAttribute("aria-hidden", "true");
    const info = document.createElement("div");
    info.className = "library-pet-info";
    const name = document.createElement("strong");
    name.textContent = preview.name;
    const meta = document.createElement("small");
    meta.textContent = `TAG ${dayNumber(preview)} · LV. ${levelInfo(preview.xp).level} · ${mood.label}`;
    const visit = document.createElement("span");
    const previewQuests = normalizeQuestProgress(preview.questProgress, preview.adoptedAt, Date.now(), `${profile.id}:${preview.name}`);
    const destination = isTraveling(previewTravel) ? destinationById(previewTravel.destinationId) : null;
    visit.textContent = destination
      ? `Unterwegs: ${destination.title} · ${travelTimeLabel(previewTravel)} · ✦ ${previewQuests.glitter}`
      : `${profile.id === activePetId ? "Gerade bei dir" : relativeVisit(profile.lastPlayedAt)} · ✦ ${previewQuests.glitter}`;
    info.append(name, meta, visit);

    const actions = document.createElement("div");
    actions.className = "library-card-actions";
    const open = document.createElement("button");
    open.type = "button";
    open.dataset.libraryAction = "switch";
    open.textContent = profile.id === activePetId ? "AKTIV" : "ÖFFNEN";
    open.disabled = profile.id === activePetId;
    open.setAttribute("aria-label", `${preview.name} öffnen`);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.libraryAction = "remove";
    remove.className = "library-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${preview.name} aus der Bibliothek löschen`);
    actions.append(open, remove);
    card.append(avatar, info, actions);
    list.append(card);
  });
}

function openLibrary() {
  if (interactionBusy) {
    showToast("Lass die aktuelle Aktion kurz zu Ende gehen.");
    return;
  }
  closeTray();
  renderLibrary();
  openDialog(elements.libraryDialog);
}

function resetSceneForSwitch() {
  window.clearTimeout(questWakeTimer);
  questWakeTimer = 0;
  activeGameCleanup?.();
  activeGameCleanup = null;
  if (elements.questGameDialog.open) elements.questGameDialog.close();
  if (elements.questDialog.open) elements.questDialog.close();
  if (elements.travelDialog.open) elements.travelDialog.close();
  if (elements.journeyDialog.open) elements.journeyDialog.close();
  if (elements.inventoryDialog.open) elements.inventoryDialog.close();
  if (elements.gardenDialog.open) elements.gardenDialog.close();
  closeTray();
  if (bubbleSession) window.clearTimeout(bubbleSession.timer);
  bubbleSession = null;
  currentConversation = null;
  interactionBusy = false;
  selectedItem = null;
  pendingQuestAction = null;
  lastQuestNotice = "";
  elements.sceneLayer.replaceChildren();
  elements.bubbleLayer.replaceChildren();
  elements.habitat.classList.remove("bath-time", "drop-ready");
  elements.capy.classList.remove(...CAPY_ANIMATIONS, "drop-ready");
}

function switchToPet(id) {
  if (id === activePetId) {
    elements.libraryDialog.close();
    return;
  }
  saveState();
  library = selectProfile(library, id);
  const profile = activeProfile(library);
  if (!profile) return;
  activePetId = profile.id;
  const report = absenceReport(profile.state);
  state = report.state;
  awayInfo = report;
  library = updateProfile(library, activePetId, state);
  currentPhrase = statusPhrase(state);
  resetSceneForSwitch();
  elements.libraryDialog.close();
  render();
  saveState();
  if (report.elapsedMs >= 5 * 60_000) window.setTimeout(showAwayReport, 160);
  else talk(`Da bist du ja! ${state.name} freut sich, dich zu sehen.`, { speak: false });
}

function prepareAdoption(mode = "new") {
  adoptionMode = mode;
  const form = $("#welcome-form");
  form.reset();
  const suggestion = NAME_SUGGESTIONS[library.profiles.length % NAME_SUGGESTIONS.length];
  $("#welcome-name").value = suggestion;
  $("#welcome-kicker").textContent = mode === "first" ? "DEIN ERSTES CAPY" : "NOCH EIN NEUER FREUND";
  $("#welcome-title").textContent = mode === "first" ? "Erwecke dein Capygotchi!" : "Wer zieht als Nächstes ein?";
  $("#welcome-copy").textContent = mode === "first"
    ? "Deine neue Capy-Bibliothek beginnt hier. Wie soll dein erstes Capybara heißen?"
    : "Dieses Capy bekommt einen ganz eigenen Spielstand mit eigenen Bedürfnissen und Erinnerungen.";
  $("#welcome-cancel").hidden = mode !== "new";
  if (mode === "new") {
    form.elements.voice.checked = state.voice;
    form.elements.sound.checked = state.sound;
    const furInputs = [...form.elements.fur];
    furInputs[library.profiles.length % furInputs.length].checked = true;
  }
}

function deletePet(id) {
  const profile = library.profiles.find((item) => item.id === id);
  if (!profile) return;
  if (!window.confirm(`Möchtest du ${profile.state.name} und diesen gesamten Spielstand wirklich löschen?`)) return;
  const wasActive = id === activePetId;
  if (wasActive) saveState();
  library = removeProfile(library, id);
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); } catch { showToast("Löschen fehlgeschlagen."); return; }
  if (!wasActive) {
    renderLibrary();
    return;
  }
  const next = activeProfile(library);
  if (next) {
    if (elements.settingsDialog.open) elements.settingsDialog.close();
    activePetId = null;
    switchToPet(next.id);
    showToast(`${profile.state.name} wurde aus der Bibliothek gelöscht.`);
    return;
  }
  activePetId = null;
  hasStoredState = false;
  awayInfo = null;
  state = makeState();
  currentPhrase = statusPhrase(state);
  elements.libraryDialog.close();
  elements.settingsDialog.close();
  resetSceneForSwitch();
  render();
  prepareAdoption("empty");
  openDialog(elements.welcomeDialog);
}

function syncSettingsForm() {
  $("#settings-name").value = state.name;
  $("#setting-voice").checked = state.voice;
  $("#setting-sound").checked = state.sound;
  $("#setting-haptics").checked = state.haptics;
}

buildPixelCapy();
render();
refreshWeather();

if (!hasStoredState) {
  prepareAdoption("first");
  window.setTimeout(() => openDialog(elements.dedicationDialog), 180);
} else {
  window.setTimeout(showAwayReport, 280);
}

elements.actions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "sleep") toggleSleep();
  else if (button.dataset.action === "travel") openJourneyDialog();
  else if (activeTray === button.dataset.action) closeTray();
  else openTray(button.dataset.action);
});

elements.trayItems.addEventListener("pointerdown", startDrag);
elements.trayItems.addEventListener("click", (event) => {
  if (event.detail !== 0) return;
  const button = event.target.closest(".tray-item");
  if (button) selectItem(button.dataset.category, button.dataset.key);
});
document.addEventListener("pointermove", moveDrag, { passive: false });
document.addEventListener("pointerup", endDrag, { passive: false });
document.addEventListener("pointercancel", endDrag, { passive: false });

elements.petButton.addEventListener("click", petCapy);
elements.habitat.addEventListener("click", (event) => {
  if (Date.now() < suppressClickUntil || event.target.closest("button")) return;
  performSelectedInHabitat(event);
});
elements.bubbleLayer.addEventListener("click", (event) => {
  const bubble = event.target.closest(".bubble");
  if (bubble) popBubble(bubble);
});

$("#tray-close").addEventListener("click", closeTray);
$("#speech-button").addEventListener("click", () => talk(currentPhrase));
$("#library-button").addEventListener("click", openLibrary);
$("#quest-button").addEventListener("click", openQuestBoard);
elements.questAlert.addEventListener("click", openQuestBoard);
$("#journal-button").addEventListener("click", () => { renderJournal(); openDialog(elements.journalDialog); });
$("#settings-button").addEventListener("click", () => { syncSettingsForm(); openDialog(elements.settingsDialog); });
$("#weather-button").addEventListener("click", openWeatherDetails);
elements.travelPostcard.addEventListener("click", openTravelDetails);
$("#inventory-button").addEventListener("click", () => openInventory("all"));
$("#start-journey-button").addEventListener("click", startManualJourney);

$("#inventory-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (button) renderInventory(button.dataset.filter);
});

elements.inventoryGrid.addEventListener("click", (event) => {
  const itemButton = event.target.closest("button[data-inventory-item]");
  if (itemButton && !itemButton.disabled) useInventoryItem(itemButton.dataset.inventoryItem);
  if (event.target.closest("button[data-open-garden]")) openGarden();
  const harvestButton = event.target.closest("button[data-feed-harvest]");
  if (harvestButton && !harvestButton.disabled) {
    elements.inventoryDialog.close();
    openTray("feed");
    selectItem("feed", `harvest-${harvestButton.dataset.feedHarvest}`);
  }
});

$("#seed-picker").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-crop-id]");
  if (!button) return;
  state.garden = selectCrop(state.garden, button.dataset.cropId);
  renderGarden();
});

elements.gardenPlots.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-garden-action]");
  if (button && !button.disabled) performGardenAction(button.dataset.gardenAction, Number(button.dataset.plot));
});

elements.animalVisitor.addEventListener("click", () => {
  const friend = ANIMAL_FRIENDS[state.world.friendId];
  if (!friend) return;
  state = applyChanges(state, { social: 3, fun: 2, xp: 1 });
  talk(friend.phrase);
  animateCapy("is-loved", 950);
  haptic(12);
  render();
});

elements.placedItemsLayer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-item-id]");
  const item = ITEM_DEFINITIONS[button?.dataset.itemId];
  if (!item) return;
  talk(`${item.label}: ${item.detail}`, { speak: false });
  showToast("Im Inventar kannst du den Gegenstand wieder einpacken.");
});

elements.habitat.addEventListener("click", (event) => {
  const landmark = event.target.closest("button[data-landmark]");
  if (!landmark || isTraveling(state.travel)) return;
  if (landmark.dataset.landmark === "cabin") {
    talk(state.sleeping
      ? "Pssst … hier schlafe ich gerade ganz warm und sicher."
      : "Das ist meine Hütte. Abends rolle ich mich dort ein – mit dem Schlafen-Knopf bringst du mich hinein.", { speak: false });
  } else if (landmark.dataset.landmark === "garden") openGarden();
  else talk("Mein Wintergarten! Hier passen Kaffee, Brettspiele, Pflanzen und Tierfreunde perfekt zusammen.", { speak: false });
});

$("#dedication-next").addEventListener("click", () => {
  elements.dedicationDialog.close();
  prepareAdoption("first");
  window.setTimeout(() => openDialog(elements.welcomeDialog), 120);
});

$("#new-pet-button").addEventListener("click", () => {
  saveState();
  elements.libraryDialog.close();
  prepareAdoption("new");
  window.setTimeout(() => openDialog(elements.welcomeDialog), 100);
});

$("#welcome-cancel").addEventListener("click", () => elements.welcomeDialog.close());

$("#library-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-library-action]");
  const card = event.target.closest(".library-card");
  if (!button || !card) return;
  if (button.dataset.libraryAction === "switch") switchToPet(card.dataset.profileId);
  if (button.dataset.libraryAction === "remove") deletePet(card.dataset.profileId);
});

$("#quest-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-quest-id]");
  if (button && !button.disabled) startQuestById(button.dataset.questId);
});

$("#quest-game-close").addEventListener("click", cancelQuestGame);
$("#quest-game-cancel").addEventListener("click", cancelQuestGame);
elements.questGameDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelQuestGame();
});

$("#welcome-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state = makeState(Date.now(), form.get("name"), form.get("fur"));
  state.voice = form.get("voice") === "on";
  state.sound = form.get("sound") === "on";
  state = addMemory(state, adoptionMode === "first"
    ? `Heute ist ${state.name} bei dir eingezogen – ein Geschenk von Johannes.`
    : `${state.name} ist als neues Mitglied deiner Capy-Familie eingezogen.`, "♥");
  library = addProfile(library, state);
  activePetId = library.activeId;
  hasStoredState = true;
  saveState();
  elements.welcomeDialog.close();
  talk(`Hallo! Ich bin ${state.name}. Ich liebe Glitzer, Ausflüge, Brettspiele, Grillabende ohne Zwiebeln – und vor allem Gesellschaft. Schön, dass du da bist!`);
  animateCapy("is-loved", 1600);
  playSound("happy");
  render();
});

$("#away-close").addEventListener("click", () => elements.awayDialog.close());
elements.dialogueDialog.addEventListener("cancel", (event) => event.preventDefault());

$("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.name = cleanName($("#settings-name").value);
  state.voice = $("#setting-voice").checked;
  state.sound = $("#setting-sound").checked;
  state.haptics = $("#setting-haptics").checked;
  saveState();
  elements.settingsDialog.close();
  talk(`Alles klar. Du kannst mich ${state.name} nennen.`, { speak: false });
  showToast("Einstellungen gespeichert");
  render();
});

$("#reset-button").addEventListener("click", () => {
  deletePet(activePetId);
});

$("#install-help-button").addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  const help = $("#install-help");
  help.hidden = !help.hidden;
});

$$('[data-close]').forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $("#install-help-button").textContent = "APP INSTALLIEREN";
});

window.addEventListener("online", () => {
  showToast("Wieder online – Wetter und Capy sind bereit.");
  refreshWeather(true);
});
window.addEventListener("offline", () => showToast("Offline-Modus – dein Spielstand bleibt erhalten."));
window.addEventListener("pagehide", saveState);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const report = absenceReport(state);
    state = report.state;
    currentPhrase = statusPhrase(state);
    render();
    if (report.elapsedMs >= 5 * 60_000) {
      awayInfo = report;
      showAwayReport();
    }
  } else {
    saveState();
  }
});

window.setInterval(() => render(), 30_000);
window.setInterval(() => refreshWeather(true), 30 * 60_000);
window.setInterval(() => {
  if (!state.sleeping && !interactionBusy && !document.hidden && !isTraveling(state.travel)) {
    currentPhrase = statusPhrase(state);
    elements.speech.textContent = currentPhrase;
  }
}, 90_000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
