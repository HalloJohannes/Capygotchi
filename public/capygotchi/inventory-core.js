export const EQUIPMENT_SLOTS = Object.freeze({
  head: "KOPF",
  face: "GESICHT",
  neck: "HALS",
  body: "OBERKÖRPER",
  feet: "PFOTEN",
});

export const ITEM_DEFINITIONS = Object.freeze({
  berry_cap: { id: "berry_cap", type: "wearable", slot: "head", label: "Beeren-Capy", icon: "▰", detail: "Eine kleine weinrote Reisemütze." },
  travel_hat: { id: "travel_hat", type: "wearable", slot: "head", label: "Reisehut", icon: "⌂", detail: "Sieht nach großen Plänen aus." },
  flower_crown: { id: "flower_crown", type: "wearable", slot: "head", label: "Blumenkranz", icon: "✿", detail: "Von der Heide mitgebracht." },
  round_glasses: { id: "round_glasses", type: "wearable", slot: "face", label: "Runde Brille", icon: "◎", detail: "Für kluge Museumsblicke." },
  cozy_scarf: { id: "cozy_scarf", type: "wearable", slot: "neck", label: "Kuschelschal", icon: "≈", detail: "Warm, weich und kaffeefarben." },
  glitter_scarf: { id: "glitter_scarf", type: "wearable", slot: "neck", label: "Glitzerschal", icon: "✦", detail: "Funkelt bei jedem Capy-Schritt." },
  forest_vest: { id: "forest_vest", type: "wearable", slot: "body", label: "Waldweste", icon: "▥", detail: "Robust und voller Taschen." },
  cloud_sweater: { id: "cloud_sweater", type: "wearable", slot: "body", label: "Wolkenpulli", icon: "☁", detail: "Ein besonders flauschiges Oberteil." },
  raincoat: { id: "raincoat", type: "wearable", slot: "body", label: "Regenmantel", icon: "≈", detail: "Für Hafenregen und Pfützensprünge." },
  striped_socks: { id: "striped_socks", type: "wearable", slot: "feet", label: "Ringelsocken", icon: "∥", detail: "Vier wären zu viel – zwei Capy-Socken reichen." },
  hiking_boots: { id: "hiking_boots", type: "wearable", slot: "feet", label: "Wanderschuhe", icon: "▰", detail: "Kleine Schuhe für große Wege." },
  duck_slippers: { id: "duck_slippers", type: "wearable", slot: "feet", label: "Entenpantoffeln", icon: "◆", detail: "Quaken fast, wenn man genau hinhört." },
  milk_frother: { id: "milk_frother", type: "placeable", area: "wintergarden", label: "Milchaufschäumer", icon: "☕", detail: "Macht im Wintergarten perfekten Hafer-Schaum." },
  watering_can: { id: "watering_can", type: "placeable", area: "garden", label: "Gießkanne", icon: "≋", detail: "Beschleunigt das Wachstum im Gemüsebeet." },
  board_game: { id: "board_game", type: "placeable", area: "wintergarden", label: "Capy-Brettspiel", icon: "▦", detail: "Bereit für sehr gemütliche Partien." },
  picnic_blanket: { id: "picnic_blanket", type: "placeable", area: "meadow", label: "Picknickdecke", icon: "▤", detail: "Ein Lieblingsplatz auf der Wildwiese." },
  travel_trunk: { id: "travel_trunk", type: "placeable", area: "home", label: "Reisetruhe", icon: "▣", detail: "Bewahrt kleine Abenteuer sicher auf." },
  garden_lantern: { id: "garden_lantern", type: "placeable", area: "garden", label: "Gartenlaterne", icon: "✦", detail: "Leuchtet zwischen den Beeten." },
  toy_kite: { id: "toy_kite", type: "placeable", area: "meadow", label: "Capy-Drachen", icon: "◇", detail: "Tänzelt über der Wiese im Wind." },
  flower_pot: { id: "flower_pot", type: "placeable", area: "wintergarden", label: "Funkel-Blumentopf", icon: "♣", detail: "Ein seltener Topf aus dem Gurkenwald." },
  tiny_radio: { id: "tiny_radio", type: "placeable", area: "wintergarden", label: "Kleines Radio", icon: "♫", detail: "Spielt leise Musik für Besuchstage." },
  travel_camera: { id: "travel_camera", type: "placeable", area: "home", label: "Reisekamera", icon: "◉", detail: "Für Erinnerungen neben der Capy-Hütte." },
});

export const DESTINATION_REWARDS = Object.freeze({
  speicherstadt: ["raincoat", "travel_trunk", "travel_camera"],
  museumsinsel: ["round_glasses", "board_game", "tiny_radio"],
  heide: ["flower_crown", "picnic_blanket", "garden_lantern"],
  neuschwanstein: ["forest_vest", "travel_hat", "hiking_boots"],
  gurkenwald: ["watering_can", "striped_socks", "flower_pot"],
  funkelfjord: ["glitter_scarf", "cloud_sweater", "garden_lantern"],
  wuerfelstrand: ["board_game", "duck_slippers", "toy_kite"],
  kaffeewolken: ["milk_frother", "cozy_scarf", "tiny_radio"],
});

const STARTER_ITEMS = Object.freeze(["berry_cap"]);

function uniqueKnown(values) {
  return [...new Set(Array.isArray(values) ? values.filter((id) => ITEM_DEFINITIONS[id]) : [])];
}

export function createInventory() {
  return {
    version: 1,
    ownedItemIds: [...STARTER_ITEMS],
    equipped: { head: null, face: null, neck: null, body: null, feet: null },
    placedItemIds: [],
    discoveredAt: {},
  };
}

export function normalizeInventory(candidate) {
  const base = createInventory();
  if (!candidate || typeof candidate !== "object") return base;
  const ownedItemIds = uniqueKnown([...STARTER_ITEMS, ...(candidate.ownedItemIds || [])]);
  const equipped = { ...base.equipped };
  for (const slot of Object.keys(EQUIPMENT_SLOTS)) {
    const id = candidate.equipped?.[slot];
    if (ownedItemIds.includes(id) && ITEM_DEFINITIONS[id]?.slot === slot) equipped[slot] = id;
  }
  const placedItemIds = uniqueKnown(candidate.placedItemIds)
    .filter((id) => ownedItemIds.includes(id) && ITEM_DEFINITIONS[id].type === "placeable");
  return {
    version: 1,
    ownedItemIds,
    equipped,
    placedItemIds,
    discoveredAt: candidate.discoveredAt && typeof candidate.discoveredAt === "object" ? { ...candidate.discoveredAt } : {},
  };
}

export function addInventoryItem(candidate, itemId, now = Date.now()) {
  const inventory = normalizeInventory(candidate);
  if (!ITEM_DEFINITIONS[itemId] || inventory.ownedItemIds.includes(itemId)) return { inventory, added: false };
  return {
    added: true,
    inventory: {
      ...inventory,
      ownedItemIds: [...inventory.ownedItemIds, itemId],
      discoveredAt: { ...inventory.discoveredAt, [itemId]: now },
    },
  };
}

export function toggleEquipment(candidate, itemId) {
  const inventory = normalizeInventory(candidate);
  const item = ITEM_DEFINITIONS[itemId];
  if (!item || item.type !== "wearable" || !inventory.ownedItemIds.includes(itemId)) return { inventory, equipped: false, replacedId: null };
  const alreadyEquipped = inventory.equipped[item.slot] === itemId;
  const replacedId = alreadyEquipped ? null : inventory.equipped[item.slot];
  return {
    equipped: !alreadyEquipped,
    replacedId,
    inventory: {
      ...inventory,
      equipped: { ...inventory.equipped, [item.slot]: alreadyEquipped ? null : itemId },
    },
  };
}

export function togglePlacedItem(candidate, itemId) {
  const inventory = normalizeInventory(candidate);
  const item = ITEM_DEFINITIONS[itemId];
  if (!item || item.type !== "placeable" || !inventory.ownedItemIds.includes(itemId)) return { inventory, placed: false };
  const alreadyPlaced = inventory.placedItemIds.includes(itemId);
  return {
    placed: !alreadyPlaced,
    inventory: {
      ...inventory,
      placedItemIds: alreadyPlaced
        ? inventory.placedItemIds.filter((id) => id !== itemId)
        : [...inventory.placedItemIds, itemId],
    },
  };
}

function seedNumber(value) {
  return [...String(value)].reduce((sum, character) => ((sum * 31) + character.charCodeAt(0)) >>> 0, 17);
}

export function rewardForDestination(candidate, destinationId, seed = "capy") {
  const inventory = normalizeInventory(candidate);
  const preferred = DESTINATION_REWARDS[destinationId] || [];
  const allItems = Object.keys(ITEM_DEFINITIONS);
  const available = [...preferred, ...allItems].filter((id, index, list) => list.indexOf(id) === index && !inventory.ownedItemIds.includes(id));
  if (!available.length) return null;
  return available[seedNumber(`${seed}:${destinationId}:${inventory.ownedItemIds.length}`) % available.length];
}

export function inventoryCompletion(candidate) {
  const inventory = normalizeInventory(candidate);
  return { owned: inventory.ownedItemIds.length, total: Object.keys(ITEM_DEFINITIONS).length };
}
