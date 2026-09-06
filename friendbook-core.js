export const FRIEND_PROFILES = Object.freeze([
  {
    id: "kaeptn-keks",
    destinationId: "speicherstadt",
    name: "Käpt’n Keks",
    species: "Silbermöwe",
    icon: "♢",
    home: "auf einem roten Speicherstadtdach",
    traits: ["wachsam", "seefest", "großzügig"],
    likes: ["Hafengeschichten", "Butterkekskrümel"],
    quote: "Gute Freunde finden auch bei Nebel nach Hause.",
    description: "Kennt jede Brücke beim Namen und teilt den besten Aussichtspunkt über den Fleeten.",
    travelInfluence: {
      label: "Hafenkompass",
      description: "Käpt’n Keks findet sichere Abkürzungen und erzählt dabei die besten Hafengeschichten.",
      changes: { curiosity: 6, social: 3, energy: -2 },
    },
  },
  {
    id: "fiete",
    destinationId: "speicherstadt",
    name: "Fiete",
    species: "Fischotter",
    icon: "≈",
    home: "an einem stillen Fleet in Hamburg",
    traits: ["verspielt", "hilfsbereit", "neugierig"],
    likes: ["glatte Kiesel", "Wasserwettrennen"],
    quote: "Ein kleiner Umweg am Wasser ist meistens der schönste Weg.",
    description: "Kann unter jeder Brücke hindurchtauchen und baut aus Fundstücken winzige Boote.",
    travelInfluence: {
      label: "Fleet-Flitzer",
      description: "Fiete macht jeden Wasserweg zum ausgelassenen Entdeckerabenteuer.",
      changes: { fun: 7, curiosity: 3, clean: -3 },
    },
  },
  {
    id: "alma",
    destinationId: "museumsinsel",
    name: "Alma",
    species: "Haussperling",
    icon: "⌁",
    home: "im efeubewachsenen Museumshof",
    traits: ["klug", "aufgeweckt", "gesellig"],
    likes: ["alte Landkarten", "Caféterrassen"],
    quote: "In jedem alten Ding steckt eine neue Geschichte.",
    description: "Flattert von Ausstellung zu Ausstellung und merkt sich jedes spannende Detail.",
    travelInfluence: {
      label: "Museumsfunke",
      description: "Alma entdeckt überall eine Geschichte und kommt mit jedem Tier ins Gespräch.",
      changes: { curiosity: 7, social: 3, energy: -2 },
    },
  },
  {
    id: "minna",
    destinationId: "museumsinsel",
    name: "Minna",
    species: "Museumsmaus",
    icon: "●",
    home: "hinter dem großen Säulensaal",
    traits: ["leise", "feinsinnig", "mutig"],
    likes: ["Miniaturkunst", "Käsekuchenpausen"],
    quote: "Man muss nicht groß sein, um große Kunst zu lieben.",
    description: "Entdeckt die kleinsten Verzierungen und kennt eine besonders gemütliche Leseecke.",
    travelInfluence: {
      label: "Stille Schatzsuche",
      description: "Minna findet kleine Wunder und plant zwischendurch besonders kluge Ruhepausen.",
      changes: { curiosity: 5, energy: 4, social: 1 },
    },
  },
  {
    id: "frieda",
    destinationId: "heide",
    name: "Frieda",
    species: "Heidschnucke",
    icon: "♧",
    home: "zwischen Heidekraut und Wacholder",
    traits: ["sanft", "bodenständig", "geduldig"],
    likes: ["violette Blüten", "lange Spaziergänge"],
    quote: "Langsam gehen heißt: mehr Schönes sehen.",
    description: "Zeigt neuen Freunden die leisesten Sandwege und hört ausgesprochen gut zu.",
    travelInfluence: {
      label: "Heideruhe",
      description: "Frieda sorgt für langsame Wege, gute Gespräche und eine Extraportion Erholung.",
      changes: { energy: 6, social: 4, fun: 1 },
    },
  },
  {
    id: "junis",
    destinationId: "heide",
    name: "Junis",
    species: "Rotfuchs",
    icon: "▲",
    home: "unter einer alten Wacholderwurzel",
    traits: ["ideenreich", "höflich", "abenteuerlustig"],
    likes: ["Sonnenuntergänge", "Spurenrätsel"],
    quote: "Das beste Abenteuer beginnt oft hinter dem nächsten Hügel.",
    description: "Erfindet freundliche Schnitzeljagden, bei denen niemand zurückgelassen wird.",
    travelInfluence: {
      label: "Spurenrätsel",
      description: "Junis verwandelt Umwege in aufregende Rätsel – das kostet ein wenig Puste.",
      changes: { curiosity: 6, fun: 5, energy: -3 },
    },
  },
  {
    id: "ludwig",
    destinationId: "neuschwanstein",
    name: "Ludwig",
    species: "Murmeltier",
    icon: "♜",
    home: "auf einer sonnigen Alpenwiese",
    traits: ["träumerisch", "loyal", "gemütlich"],
    likes: ["Schlossgeschichten", "Bergpicknicks"],
    quote: "Für Freunde ist in der kleinsten Berghütte Platz.",
    description: "Plant fantastische Burgen und besitzt eine erstaunlich königliche Picknickdecke.",
    travelInfluence: {
      label: "Königspicknick",
      description: "Ludwig packt gemütliche Pausen und für alle einen Platz auf der Decke ein.",
      changes: { energy: 7, social: 3, fun: 1 },
    },
  },
  {
    id: "tilda",
    destinationId: "neuschwanstein",
    name: "Tilda",
    species: "Alpendohle",
    icon: "✦",
    home: "hoch über den Schlosstürmen",
    traits: ["furchtlos", "elegant", "aufmerksam"],
    likes: ["glitzernde Kronen", "Aufwinde"],
    quote: "Von oben sieht selbst ein Problem ein bisschen kleiner aus.",
    description: "Fliegt die schönsten Panoramarunden und bringt verlorene Dinge zuverlässig zurück.",
    travelInfluence: {
      label: "Panoramamut",
      description: "Tilda zeigt neue Aussichten und macht mutig für steile, anstrengende Wege.",
      changes: { curiosity: 7, fun: 4, energy: -3 },
    },
  },
  {
    id: "knack",
    destinationId: "gurkenwald",
    name: "Knack",
    species: "Laubfrosch",
    icon: "▰",
    home: "auf dem größten Gurkenblatt",
    traits: ["fröhlich", "direkt", "erfinderisch"],
    likes: ["Gewürzgurken", "Regentrommeln"],
    quote: "Ein herzhaftes Knack macht jeden Tag besser.",
    description: "Findet jeden versteckten Gurkenpfad – und erkennt Zwiebeln schon von weitem.",
    travelInfluence: {
      label: "Gurkenproviant",
      description: "Knack bringt knusprigen Proviant mit und macht selbst lange Wege herrlich albern.",
      changes: { fun: 7, satiety: 4, clean: -2 },
    },
  },
  {
    id: "dillie",
    destinationId: "gurkenwald",
    name: "Dillie",
    species: "Bänderschnecke",
    icon: "@",
    home: "im duftenden Dillbeet",
    traits: ["achtsam", "warmherzig", "gründlich"],
    likes: ["Tautropfen", "langsame Brettspiele"],
    quote: "Freundschaft darf sich ruhig Zeit nehmen.",
    description: "Schmückt ihr Häuschen mit Glitzerpunkten und gewinnt jedes Geduldsspiel.",
    travelInfluence: {
      label: "Sorgfaltspause",
      description: "Dillie achtet auf saubere Pfoten, ruhige Pausen und freundliche Gesellschaft.",
      changes: { clean: 6, social: 4, energy: 1 },
    },
  },
  {
    id: "lumi",
    destinationId: "funkelfjord",
    name: "Lumi",
    species: "Polarhase",
    icon: "◇",
    home: "unter dem schimmernden Nordlicht",
    traits: ["still", "fantasievoll", "treu"],
    likes: ["Funkelsteine", "warmer Kakao"],
    quote: "Ein Licht wird heller, wenn man es miteinander teilt.",
    description: "Sammelt Lichtreflexe in kleinen Gläsern und verschenkt die schönsten an Freunde.",
    travelInfluence: {
      label: "Geteiltes Licht",
      description: "Lumi teilt jedes Funkeln und lässt stille Augenblicke besonders nah wirken.",
      changes: { social: 6, curiosity: 3, energy: 1 },
    },
  },
  {
    id: "fuenkchen",
    destinationId: "funkelfjord",
    name: "Fünkchen",
    species: "Ringelrobbe",
    icon: "◉",
    home: "auf einer glitzernden Fjordscholle",
    traits: ["albern", "mutig", "herzlich"],
    likes: ["Wellenrutschen", "leuchtende Postkarten"],
    quote: "Ein bisschen Quatsch hält die Freundschaft warm.",
    description: "Rutscht schneller als der Wind und kann sogar ernste Capys zum Kichern bringen.",
    travelInfluence: {
      label: "Wellenquatsch",
      description: "Fünkchen sorgt für Lachanfälle, Freundschaft und ziemlich nasse Rutschpartien.",
      changes: { fun: 8, social: 3, clean: -3 },
    },
  },
  {
    id: "poeppel",
    destinationId: "wuerfelstrand",
    name: "Pöppel",
    species: "Zwergpinguin",
    icon: "▦",
    home: "neben der großen Würfelbucht",
    traits: ["strategisch", "fair", "begeistert"],
    likes: ["Brettspiele", "knappe Endrunden"],
    quote: "Gewinnen ist schön – zusammen spielen ist schöner.",
    description: "Erklärt Regeln geduldig und gratuliert bei jeder Niederlage von ganzem Herzen.",
    travelInfluence: {
      label: "Faire Endrunde",
      description: "Pöppel hat immer ein Brettspiel dabei und macht aus jeder Pause eine knappe Partie.",
      changes: { fun: 7, curiosity: 5, energy: -2 },
    },
  },
  {
    id: "karo",
    destinationId: "wuerfelstrand",
    name: "Karo",
    species: "Strandkrabbe",
    icon: "◆",
    home: "in einer bunten Spielsteinhöhle",
    traits: ["schlagfertig", "kreativ", "verlässlich"],
    likes: ["Würfelsammlungen", "Sandburgenpläne"],
    quote: "Seitwärts kommt man manchmal auf die besten Ideen.",
    description: "Erfindet ständig neue Spielregeln und baut für alle einen Platz am Spieltisch.",
    travelInfluence: {
      label: "Seitwärts-Idee",
      description: "Karo denkt um die Ecke und erfindet auf jedem Weg ein neues gemeinsames Spiel.",
      changes: { curiosity: 5, fun: 4, social: 2 },
    },
  },
  {
    id: "mokka",
    destinationId: "kaffeewolken",
    name: "Mokka",
    species: "Alpaka",
    icon: "☕",
    home: "auf einer flauschigen Kaffeewolke",
    traits: ["gelassen", "gastfreundlich", "kreativ"],
    likes: ["Milchschaumkunst", "lange Gespräche"],
    quote: "Ein guter Kaffee beginnt mit einem Platz für dich.",
    description: "Zaubert Capygesichter in Milchschaum und weiß immer, wer gerade eine Pause braucht.",
    travelInfluence: {
      label: "Wolkenpause",
      description: "Mokka findet die gemütlichsten Cafés und hört bei einer sicheren Schaumkrone zu.",
      changes: { energy: 5, social: 4, curiosity: 2 },
    },
  },
  {
    id: "crema",
    destinationId: "kaffeewolken",
    name: "Crema",
    species: "Siebenschläfer",
    icon: "☾",
    home: "im warmen Kissenregal des Wolkencafés",
    traits: ["kuschelig", "aufmerksam", "genussvoll"],
    likes: ["Kaffeeduft", "Regennachmittage"],
    quote: "Die gemütlichste Pause ist die, die man teilt.",
    description: "Kennt jede Sofaecke und wacht für gute Freunde sogar vor dem Mittagsschlaf auf.",
    travelInfluence: {
      label: "Kuschelkraft",
      description: "Crema kennt jede gute Sofaecke; nach so viel Gemütlichkeit locken Umwege etwas weniger.",
      changes: { energy: 8, social: 4, curiosity: -1 },
    },
  },
]);

const FRIEND_BY_ID = Object.freeze(Object.fromEntries(FRIEND_PROFILES.map((friend) => [friend.id, friend])));

function seedNumber(value) {
  return [...String(value)].reduce((total, character) => ((total * 33) ^ character.charCodeAt(0)) >>> 0, 2_166_136_261);
}

export function friendForId(id) {
  return FRIEND_BY_ID[id] || null;
}

export function knownTravelFriend(candidate, id) {
  const friend = friendForId(id);
  if (!friend) return null;
  const friendBook = normalizeFriendBook(candidate);
  return friendBook.friends.some((entry) => entry.id === friend.id) ? friend : null;
}

export function friendTravelChanges(id, scale = 1) {
  const friend = friendForId(id);
  if (!friend?.travelInfluence?.changes) return {};
  const normalizedScale = Math.max(0, Math.min(1, Number(scale) || 0));
  return Object.fromEntries(
    Object.entries(friend.travelInfluence.changes)
      .map(([key, value]) => [key, Math.round(value * normalizedScale)])
      .filter(([, value]) => value !== 0),
  );
}

export function createFriendBook() {
  return { version: 1, friends: [], unseenIds: [], processedTripKeys: [] };
}

export function normalizeFriendBook(candidate) {
  const entries = Array.isArray(candidate?.friends) ? candidate.friends : [];
  const byId = new Map();
  for (const entry of entries) {
    if (!friendForId(entry?.id)) continue;
    const previous = byId.get(entry.id);
    const normalized = {
      id: entry.id,
      firstMetAt: Math.max(0, Number(entry.firstMetAt) || 0),
      lastMetAt: Math.max(0, Number(entry.lastMetAt) || 0),
      meetings: Math.max(1, Number(entry.meetings) || 1),
      destinationIds: [...new Set((Array.isArray(entry.destinationIds) ? entry.destinationIds : []).filter(Boolean))].slice(-12),
    };
    if (!previous || normalized.lastMetAt >= previous.lastMetAt) byId.set(entry.id, normalized);
  }
  const friends = [...byId.values()].sort((a, b) => b.lastMetAt - a.lastMetAt);
  const knownIds = new Set(friends.map((friend) => friend.id));
  return {
    version: 1,
    friends,
    unseenIds: [...new Set((Array.isArray(candidate?.unseenIds) ? candidate.unseenIds : []).filter((id) => knownIds.has(id)))],
    processedTripKeys: [...new Set((Array.isArray(candidate?.processedTripKeys) ? candidate.processedTripKeys : []).filter((key) => typeof key === "string"))].slice(-64),
  };
}

export function travelFriendFor(destinationId, candidate, seed = "capy", excludedIds = []) {
  const friendBook = normalizeFriendBook(candidate);
  const excluded = new Set(Array.isArray(excludedIds) ? excludedIds : []);
  const destinationFriends = FRIEND_PROFILES.filter((friend) => friend.destinationId === destinationId && !excluded.has(friend.id));
  if (!destinationFriends.length) return null;
  const knownIds = new Set(friendBook.friends.map((friend) => friend.id));
  const unseen = destinationFriends.filter((friend) => !knownIds.has(friend.id));
  const pool = unseen.length ? unseen : destinationFriends;
  return pool[seedNumber(`${seed}:${destinationId}:${friendBook.friends.length}`) % pool.length];
}

export function meetTravelFriend(candidate, friendId, destinationId, now = Date.now(), tripKey = "") {
  const friendBook = normalizeFriendBook(candidate);
  const friend = friendForId(friendId);
  if (!friend) return { friendBook, friend: null, firstMeeting: false };
  const existing = friendBook.friends.find((entry) => entry.id === friend.id);
  if (tripKey && friendBook.processedTripKeys.includes(tripKey)) {
    return { friendBook, friend, firstMeeting: false, processed: false };
  }
  const entry = existing
    ? {
      ...existing,
      lastMetAt: now,
      meetings: existing.meetings + 1,
      destinationIds: [...new Set([...existing.destinationIds, destinationId || friend.destinationId])].slice(-12),
    }
    : {
      id: friend.id,
      firstMetAt: now,
      lastMetAt: now,
      meetings: 1,
      destinationIds: [destinationId || friend.destinationId],
    };
  return {
    friendBook: {
      version: 1,
      friends: [entry, ...friendBook.friends.filter((item) => item.id !== friend.id)],
      unseenIds: existing ? friendBook.unseenIds : [...new Set([friend.id, ...friendBook.unseenIds])],
      processedTripKeys: tripKey ? [...friendBook.processedTripKeys, tripKey].slice(-64) : friendBook.processedTripKeys,
    },
    friend,
    firstMeeting: !existing,
    processed: true,
  };
}

export function markFriendBookSeen(candidate) {
  return { ...normalizeFriendBook(candidate), unseenIds: [] };
}

export function friendBookCompletion(candidate) {
  const friendBook = normalizeFriendBook(candidate);
  return {
    met: friendBook.friends.length,
    total: FRIEND_PROFILES.length,
    meetings: friendBook.friends.reduce((total, friend) => total + friend.meetings, 0),
    unseen: friendBook.unseenIds.length,
  };
}
