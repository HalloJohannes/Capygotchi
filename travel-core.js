const HOUR = 3_600_000;

export const TRAVEL_DESTINATIONS = Object.freeze([
  {
    id: "speicherstadt",
    kind: "DEUTSCHLAND",
    place: "Hamburg",
    title: "Speicherstadt",
    icon: "⚓",
    fact: "Die historische Speicherstadt ist ein großes Lagerhausensemble, das von Fleeten und Brücken durchzogen wird.",
    doing: "läuft am Wasser entlang, zählt rote Backsteine und sucht ein Café mit Hafenblick",
    souvenir: "einen winzigen goldenen Anker",
    palette: "harbor",
  },
  {
    id: "museumsinsel",
    kind: "DEUTSCHLAND",
    place: "Berlin",
    title: "Museumsinsel",
    icon: "▥",
    fact: "Auf der Berliner Museumsinsel stehen fünf Museen dicht beieinander auf einer Insel in der Spree.",
    doing: "bestaunt alte Schätze, macht eine Spreepause und bewertet jedes Café nach Gemütlichkeit",
    souvenir: "eine glitzernde Museumskarte",
    palette: "city",
  },
  {
    id: "heide",
    kind: "DEUTSCHLAND",
    place: "Niedersachsen",
    title: "Lüneburger Heide",
    icon: "♣",
    fact: "Die Lüneburger Heide ist eine weite Kulturlandschaft mit Heideflächen, Wacholdern und alten Heidedörfern.",
    doing: "wandert auf einem sandigen Weg und grüßt sehr höflich jedes Tier am Wegesrand",
    souvenir: "ein violettes Heideblümchen",
    palette: "heath",
  },
  {
    id: "neuschwanstein",
    kind: "DEUTSCHLAND",
    place: "Bayern",
    title: "Schloss Neuschwanstein",
    icon: "♜",
    fact: "Das Schloss wurde im 19. Jahrhundert für König Ludwig II. oberhalb von Hohenschwangau gebaut.",
    doing: "schaut zu den Türmen hinauf und überlegt, welches Zimmer ein Capy-Spielzimmer werden könnte",
    souvenir: "eine kleine glitzernde Krone",
    palette: "alps",
  },
  {
    id: "gurkenwald",
    kind: "FANTASIEORT",
    place: "Knackengrün",
    title: "Der Große Gurkenwald",
    icon: "▰",
    fact: "Im Gurkenwald klingeln die Blätter beim Wind wie Einmachgläser. Seine Wege verändern sich nach jedem besonders lauten Knack.",
    doing: "probiert Gewürzgurken, kartiert knusprige Pfade und hält vorsichtshalber Ausschau nach Zwiebeln",
    souvenir: "eine königliche Gewürzgurke",
    palette: "pickle",
  },
  {
    id: "funkelfjord",
    kind: "FANTASIEORT",
    place: "Funkelholm",
    title: "Glitzerfjord",
    icon: "✦",
    fact: "Der Glitzerfjord funkelt nur, wenn jemand freundlich zu seinen Reisegefährten ist. Darum leuchtet er fast immer.",
    doing: "sammelt Lichtpunkte am Ufer und verschickt gedanklich eine besonders funkelnde Postkarte",
    souvenir: "einen warmen Funkelstein",
    palette: "glitter",
  },
  {
    id: "wuerfelstrand",
    kind: "FANTASIEORT",
    place: "Brettspielinsel",
    title: "Würfelstrand",
    icon: "▦",
    fact: "Am Würfelstrand bestimmen zwei sanfte Würfelwürfe, wohin die Wellen fließen und wer den nächsten Kakao bekommt.",
    doing: "spielt eine sehr lange Partie, gewinnt mit Charme und verliert ausgesprochen würdevoll",
    souvenir: "einen rosafarbenen Capy-Spielstein",
    palette: "game",
  },
  {
    id: "kaffeewolken",
    kind: "FANTASIEORT",
    place: "Mokkaburg",
    title: "Café über den Wolken",
    icon: "☕",
    fact: "Dieses Café schwebt auf einer Wolke. Bezahlt wird mit guten Geschichten und der Milchschaum sieht immer wie ein Capy aus.",
    doing: "trinkt Hafer-Milchschaum, beobachtet Wolken und erzählt der Bedienung von eurem Zuhause",
    souvenir: "eine Tasse voller Wolkenduft",
    palette: "coffee",
  },
]);

function seedNumber(value) {
  return [...String(value)].reduce((total, character) => ((total * 33) ^ character.charCodeAt(0)) >>> 0, 2_166_136_261);
}

function tripPlan(departedAt, seed, completedTrips = 0) {
  const value = seedNumber(`${seed}:${departedAt}:${completedTrips}`);
  const duration = (120 + (value % 61)) * 60_000;
  const destination = TRAVEL_DESTINATIONS[(value >>> 5) % TRAVEL_DESTINATIONS.length];
  return { destination, duration };
}

function homeDuration(returnedAt, seed, completedTrips) {
  const value = seedNumber(`${seed}:home:${returnedAt}:${completedTrips}`);
  return (8 + (value % 11)) * HOUR;
}

function initialTravel(adoptedAt, seed) {
  const firstWait = (5 + (seedNumber(`${seed}:first-trip`) % 4)) * HOUR;
  return {
    version: 1,
    status: "home",
    destinationId: null,
    departedAt: 0,
    returnsAt: 0,
    nextDepartureAt: Number(adoptedAt || Date.now()) + firstWait,
    completedTrips: 0,
    visitedIds: [],
    lastReturnAt: 0,
    lastDestinationId: null,
    lastSouvenir: "",
    returnPending: false,
  };
}

export function destinationById(id) {
  return TRAVEL_DESTINATIONS.find((destination) => destination.id === id) || null;
}

export function normalizeTravel(candidate, adoptedAt, now = Date.now(), seed = "capy") {
  const base = initialTravel(adoptedAt, seed);
  const hadTravel = Boolean(candidate && typeof candidate === "object");
  const travel = hadTravel ? {
    ...base,
    ...candidate,
    version: 1,
    status: candidate.status === "away" && destinationById(candidate.destinationId) ? "away" : "home",
    destinationId: destinationById(candidate.destinationId) ? candidate.destinationId : null,
    departedAt: Math.max(0, Number(candidate.departedAt) || 0),
    returnsAt: Math.max(0, Number(candidate.returnsAt) || 0),
    nextDepartureAt: Math.max(0, Number(candidate.nextDepartureAt) || base.nextDepartureAt),
    completedTrips: Math.max(0, Number(candidate.completedTrips) || 0),
    visitedIds: Array.isArray(candidate.visitedIds) ? [...new Set(candidate.visitedIds.filter((id) => destinationById(id)))].slice(-20) : [],
    returnPending: Boolean(candidate.returnPending),
  } : base;

  if (travel.status === "away" && now >= travel.returnsAt) {
    const destination = destinationById(travel.destinationId);
    travel.status = "home";
    travel.completedTrips += 1;
    travel.visitedIds = [...new Set([...travel.visitedIds, travel.destinationId])].slice(-20);
    travel.lastReturnAt = travel.returnsAt;
    travel.lastDestinationId = travel.destinationId;
    travel.lastSouvenir = destination?.souvenir || "eine schöne Erinnerung";
    travel.destinationId = null;
    travel.departedAt = 0;
    travel.nextDepartureAt = travel.returnsAt + homeDuration(travel.returnsAt, seed, travel.completedTrips);
    travel.returnsAt = 0;
    travel.returnPending = hadTravel;
  }

  let loops = 0;
  while (travel.status === "home" && now >= travel.nextDepartureAt && loops < 180) {
    const departedAt = travel.nextDepartureAt;
    const plan = tripPlan(departedAt, seed, travel.completedTrips);
    const returnsAt = departedAt + plan.duration;
    if (now < returnsAt) {
      travel.status = "away";
      travel.destinationId = plan.destination.id;
      travel.departedAt = departedAt;
      travel.returnsAt = returnsAt;
      travel.returnPending = false;
      break;
    }
    travel.completedTrips += 1;
    travel.visitedIds = [...new Set([...travel.visitedIds, plan.destination.id])].slice(-20);
    travel.lastReturnAt = returnsAt;
    travel.lastDestinationId = plan.destination.id;
    travel.lastSouvenir = plan.destination.souvenir;
    travel.nextDepartureAt = returnsAt + homeDuration(returnsAt, seed, travel.completedTrips);
    loops += 1;
  }

  if (loops >= 180 && now >= travel.nextDepartureAt) travel.nextDepartureAt = now + 3 * HOUR;
  return travel;
}

export function isTraveling(travel, now = Date.now()) {
  return Boolean(travel?.status === "away" && now < travel.returnsAt && destinationById(travel.destinationId));
}

export function travelTimeLabel(travel, now = Date.now()) {
  if (!isTraveling(travel, now)) return "ZU HAUSE";
  const minutes = Math.max(1, Math.ceil((travel.returnsAt - now) / 60_000));
  if (minutes < 60) return `NOCH ETWA ${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `NOCH ${hours} STD. ${rest ? `${rest} MIN.` : ""}`.trim();
}

export function travelProgress(travel, now = Date.now()) {
  if (!isTraveling(travel, now)) return 100;
  const duration = Math.max(1, travel.returnsAt - travel.departedAt);
  return Math.max(0, Math.min(100, ((now - travel.departedAt) / duration) * 100));
}
