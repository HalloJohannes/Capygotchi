export const STORAGE_KEY = "capygotchi-state-v1";
export const FUR_VARIANTS = Object.freeze(["classic", "golden", "chocolate", "cream"]);

export const NEED_KEYS = Object.freeze(["satiety", "fun", "clean", "energy", "social", "curiosity"]);

export const DEFAULT_STATE = Object.freeze({
  version: 5,
  name: "Emmi",
  furVariant: "classic",
  adoptedAt: 0,
  updatedAt: 0,
  satiety: 82,
  fun: 78,
  clean: 90,
  energy: 88,
  social: 84,
  curiosity: 76,
  xp: 0,
  interactions: 0,
  sleeping: false,
  voice: true,
  sound: true,
  haptics: true,
  memories: [],
  questProgress: null,
  travel: null,
  landscapeArea: "home",
});

export const FOODS = Object.freeze({
  carrot: { label: "Karotte", detail: "+18 satt · knackig", satiety: 18, fun: 2, clean: 0, xp: 3, phrase: "Knack! Karotten sind capytastisch." },
  apple: { label: "Apfel", detail: "+14 satt · saftig", satiety: 14, fun: 1, energy: 3, xp: 3, phrase: "Knirsch. Der ist wunderbar saftig!" },
  melon: { label: "Melone", detail: "+24 satt · Lieblingsfutter", satiety: 24, fun: 5, clean: -3, xp: 5, phrase: "Mmmelone! Jetzt klebt meine Schnute." },
  pumpkin: { label: "Kürbis", detail: "+20 satt · macht neugierig", satiety: 20, curiosity: 4, xp: 4, phrase: "So orange und so lecker. Davon will ich mehr!" },
  pickle: { label: "Gewürzgurke", detail: "Selten · liebt es!", temporary: true, reaction: "love", satiety: 9, fun: 13, social: 3, clean: -2, xp: 7, phrase: "KNACK! Gewürzgurken sind kleine grüne Glücksmomente!" },
  onion: { label: "Zwiebel", detail: "Selten · hasst es", temporary: true, reaction: "hate", satiety: 2, fun: -18, social: -5, energy: -2, xp: 1, phrase: "BÄH! Eine Zwiebel! Meine Schnute ist zutiefst enttäuscht." },
});

export const TOYS = Object.freeze({
  ball: { label: "Ball", detail: "Wirf ihn ins Gehege", fun: 18, social: 5, energy: -5, satiety: -2, xp: 7, phrase: "Nochmal! Ich bringe den Ball zurück." },
  frisbee: { label: "Frisbee", detail: "Weit werfen und apportieren", fun: 22, curiosity: 4, energy: -7, satiety: -3, xp: 9, phrase: "Gefangen! Hast du meinen Capy-Sprint gesehen?" },
  bubbles: { label: "Seifenblasen", detail: "Tippe alle Blasen kaputt", fun: 20, curiosity: 8, energy: -4, xp: 8, phrase: "Plopp, plopp! Die glitzern so schön." },
  rope: { label: "Zerrseil", detail: "Zieh es über das Capybara", fun: 17, social: 8, energy: -5, xp: 7, phrase: "Du bist stark – aber ich lasse nicht los!" },
});

export const CARE = Object.freeze({
  brush: { label: "Bürste", detail: "Mehrfach durchs Fell ziehen", clean: 18, fun: 4, social: 5, xp: 6, phrase: "Oh ja, genau hinter dem Ohr!" },
  bath: { label: "Badeente", detail: "Zum Capy ziehen: ab in den Teich", clean: 35, fun: 8, energy: -3, curiosity: 3, xp: 9, phrase: "Plitsch, platsch – ich bin blitzblank!" },
  towel: { label: "Handtuch", detail: "Trockenrubbeln und kuscheln", clean: 8, social: 8, fun: 3, xp: 5, phrase: "Warm, trocken und extra flauschig!" },
});

export const TOGETHER = Object.freeze({
  cuddle: { label: "Kuscheln", detail: "Das Herz zum Capy ziehen", social: 22, fun: 5, energy: 2, xp: 7, phrase: "Bleib noch kurz. So ist es richtig gemütlich." },
  talk: { label: "Reden", detail: "Zeit für ein Capy-Gespräch", social: 16, curiosity: 5, xp: 6, phrase: "Ich höre dir zu. Erzähl mir von deinem Tag!" },
  explore: { label: "Entdecken", detail: "Das Blatt ins Gehege ziehen", curiosity: 24, fun: 8, energy: -6, satiety: -2, xp: 9, phrase: "Hier riecht alles spannend. Komm, wir schauen nach!" },
  sunbathe: { label: "Sonnenbad", detail: "Gemeinsam zur Ruhe kommen", energy: 10, social: 7, clean: -2, xp: 5, phrase: "Ahhh … Sonne auf dem Fell und du in meiner Nähe." },
});

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function makeState(now = Date.now(), name = "Emmi", furVariant = "classic") {
  return {
    ...DEFAULT_STATE,
    name: cleanName(name),
    furVariant: FUR_VARIANTS.includes(furVariant) ? furVariant : "classic",
    adoptedAt: now,
    updatedAt: now,
    memories: [],
  };
}

export function cleanName(value) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 14);
  return name || "Emmi";
}

function normalizeMemories(candidate) {
  if (!Array.isArray(candidate)) return [];
  return candidate
    .filter((entry) => entry && typeof entry.text === "string")
    .slice(-24)
    .map((entry) => ({
      at: Number.isFinite(Number(entry.at)) ? Number(entry.at) : 0,
      icon: String(entry.icon || "♥").slice(0, 3),
      text: String(entry.text).slice(0, 120),
    }));
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
    version: 5,
    name: cleanName(candidate.name),
    furVariant: FUR_VARIANTS.includes(candidate.furVariant) ? candidate.furVariant : "classic",
    adoptedAt: Number.isFinite(candidate.adoptedAt) && candidate.adoptedAt > 0 ? candidate.adoptedAt : now,
    updatedAt: Number.isFinite(candidate.updatedAt) && candidate.updatedAt > 0 ? candidate.updatedAt : now,
    satiety: need("satiety"),
    fun: need("fun"),
    clean: need("clean"),
    energy: need("energy"),
    social: need("social"),
    curiosity: need("curiosity"),
    xp: Math.max(0, Number(candidate.xp) || 0),
    interactions: Math.max(0, Number(candidate.interactions) || 0),
    sleeping: Boolean(candidate.sleeping),
    voice: candidate.voice !== false,
    sound: candidate.sound !== false,
    haptics: candidate.haptics !== false,
    memories: normalizeMemories(candidate.memories),
    questProgress: candidate.questProgress && typeof candidate.questProgress === "object" ? candidate.questProgress : null,
    travel: candidate.travel && typeof candidate.travel === "object" ? candidate.travel : null,
    landscapeArea: ["home", "meadow", "garden"].includes(candidate.landscapeArea) ? candidate.landscapeArea : "home",
  };
}

function foodSeed(state) {
  return [...String(state?.name || "capy")].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

export function foodAvailability(key, state, now = Date.now(), questId = "") {
  const item = FOODS[key];
  if (!item?.temporary) return { available: true, limited: false };
  if (key === "pickle" && questId === "pickle-picnic") return { available: true, limited: true, reason: "QUEST-FUND" };
  const seed = foodSeed(state);
  const windowSize = key === "pickle" ? 2 * 3_600_000 : 90 * 60_000;
  const every = key === "pickle" ? 4 : 8;
  const bucket = Math.floor(now / windowSize);
  const available = (bucket + seed + (key === "onion" ? 3 : 0)) % every === 0;
  return {
    available,
    limited: true,
    reason: available ? "NUR KURZE ZEIT" : "NICHT IM MARKT",
    nextChangeAt: (bucket + 1) * windowSize,
  };
}

export function growthFor(state) {
  const { level } = levelInfo(state?.xp || 0);
  if (level >= 10) return { id: "majestic", label: "PRÄCHTIGES CAPY", level };
  if (level >= 6) return { id: "grown", label: "ERWACHSENES CAPY", level };
  if (level >= 3) return { id: "young", label: "JUNGES CAPY", level };
  return { id: "baby", label: "KLEINES CAPY", level };
}

export function advanceState(input, now = Date.now()) {
  const state = normalizeState(input, now);
  const elapsedHours = clamp((now - state.updatedAt) / 3_600_000, 0, 24 * 30);
  if (elapsedHours <= 0) return state;

  const rates = state.sleeping
    ? { satiety: -2.2, fun: -0.5, clean: -0.8, energy: 15, social: -0.6, curiosity: -0.3 }
    : { satiety: -4.2, fun: -3.1, clean: -2.1, energy: -2.8, social: -2.4, curiosity: -1.7 };

  for (const key of NEED_KEYS) state[key] = clamp(state[key] + rates[key] * elapsedHours);
  state.updatedAt = now;
  return state;
}

export function absenceReport(input, now = Date.now()) {
  const before = normalizeState(input, now);
  const elapsedMs = clamp(now - before.updatedAt, 0, 30 * 86_400_000);
  const state = advanceState(before, now);
  return {
    state,
    elapsedMs,
    sleeping: before.sleeping,
    changes: Object.fromEntries(NEED_KEYS.map((key) => [key, state[key] - before[key]])),
  };
}

export function applyChanges(input, changes, now = Date.now()) {
  const state = advanceState(input, now);
  for (const key of NEED_KEYS) {
    if (Number.isFinite(changes[key])) state[key] = clamp(state[key] + changes[key]);
  }
  state.xp = Math.max(0, state.xp + (Number(changes.xp) || 0));
  state.interactions += Number(changes.interactions) || 1;
  state.updatedAt = now;
  return state;
}

export function addMemory(input, text, icon = "♥", now = Date.now()) {
  const state = normalizeState(input, now);
  const memories = [...state.memories, { at: now, icon: String(icon).slice(0, 3), text: String(text).slice(0, 120) }].slice(-24);
  return { ...state, memories };
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
  const needs = NEED_KEYS.map((key) => Number(state[key]));
  const average = needs.reduce((sum, value) => sum + value, 0) / needs.length;
  const minimum = Math.min(...needs);
  if (minimum < 12) return { label: "BRAUCHT DICH", tone: "urgent" };
  if (average < 38) return { label: "MÜRRISCH", tone: "sad" };
  if (average < 62) return { label: "GANZ OKAY", tone: "okay" };
  if (average >= 88) return { label: "SEELIG", tone: "great" };
  return { label: "GLÜCKLICH", tone: "happy" };
}

function phraseFrom(options, state, now, salt = 0) {
  const bucket = Math.floor(now / 900_000);
  const seed = Math.abs(Math.floor(state.interactions * 7 + state.xp * 3 + dayNumber(state, now) * 11 + bucket + salt));
  return options[seed % options.length];
}

const URGENT_PHRASES = Object.freeze({
  satiety: [
    "Mein Bauch grummelt. Ziehst du mir etwas Leckeres zur Schnute?",
    "Ich glaube, mein Bauch versucht gerade, mit dir zu sprechen. Er sagt: Melone?",
    "Nur ein winziges Häppchen … oder ein capygroßes. Ich bin da flexibel.",
    "Ich werde ein bisschen wackelig vor Hunger. Hast du Futter für mich?",
    "Meine Schnute hält schon Ausschau nach etwas Knackigem.",
  ],
  fun: [
    "Mir ist capylangweilig. Wirf mir ein Spielzeug!",
    "Meine Pfoten wollen etwas erleben. Spielen wir zusammen?",
    "Ich habe noch ganz viel Quatsch im Kopf, aber niemanden zum Mitmachen.",
    "Der Ball sieht so aus, als würde er uns vermissen.",
    "Können wir etwas Albernes machen? Ich wäre sofort bereit.",
  ],
  clean: [
    "Uff … mein Fell könnte Bürste oder Bad gebrauchen.",
    "Ich rieche ein bisschen nach Abenteuer. Und ein bisschen nach Matsch.",
    "Magst du mein Fell wieder weich und flauschig machen?",
    "Ein Sprung in den Teich wäre jetzt genau richtig.",
    "Da klebt etwas an meinem Po. Ich stelle lieber keine Fragen.",
  ],
  energy: [
    "Meine Pfötchen sind ganz schön müde.",
    "Ich brauche eine Pause. Weckst du mich später ganz sanft?",
    "Meine Augen werden schwer wie zwei kleine Melonen.",
    "Heute ist mein Akku eher Capy-klein. Darf ich schlafen?",
    "Ich kann noch kuscheln, aber fürs Rennen fehlt mir gerade die Puste.",
  ],
  social: [
    "Magst du kurz bei mir bleiben und kuscheln?",
    "Ich vermisse deine Nähe. Ein Nasenstups würde schon helfen.",
    "Kannst du mir kurz erzählen, wie dein Tag war? Ich höre gern zu.",
    "Ich bin hier – aber zusammen fühlt sich hier viel wärmer an.",
    "Darf ich mich ein kleines bisschen an dich lehnen?",
  ],
  curiosity: [
    "Ich will etwas entdecken. Gehen wir auf Erkundung?",
    "Meine Nase sagt, irgendwo wartet ein kleines Abenteuer.",
    "Heute habe ich noch gar nichts Neues beschnuppert.",
    "Ziehst du das Blatt ins Gehege? Ich möchte nachsehen, woher es kommt.",
    "Mein neugieriges Ohr wackelt. Das ist ein sicheres Abenteuerzeichen.",
  ],
});

const LOW_PHRASES = Object.freeze({
  satiety: ["Ein kleiner Apfel würde jetzt wunderbar knirschen.", "Ich hätte Platz für genau eine Melone. Vielleicht auch zwei.", "Ist schon bald Futterzeit? Nur eine völlig beiläufige Frage."],
  fun: ["Der Tag könnte ein kleines bisschen mehr hüpfen vertragen.", "Wollen wir Seifenblasen jagen? Ich übe schon mein Plopp-Gesicht.", "Mein Zerrseil fühlt sich heute so ungezerrt an."],
  clean: ["Ein paar Bürstenstriche wären ziemlich gemütlich.", "Mein Fell hat heute einen wilden Abenteuer-Look.", "Wenn du magst, wäre ich bereit für ein kleines Wellnessprogramm."],
  energy: ["Ich bin noch wach, aber mein inneres Kissen ruft schon.", "Vielleicht machen wir heute etwas Ruhiges zusammen?", "Meine Schritte werden gerade ein bisschen kleiner."],
  social: ["Ich würde gern etwas Zeit nur mit dir verbringen.", "Ein kleines Gespräch wäre jetzt schön.", "Weißt du, was mir gerade fehlt? Du – ein bisschen näher."],
  curiosity: ["Zeigst du mir später etwas Neues?", "Ich frage mich, was heute hinter dem Schilf raschelt.", "Vielleicht machen wir eine winzige Entdeckungsrunde?"],
});

const TIME_PHRASES = Object.freeze({
  morning: [
    "Guten Morgen! Ich habe schon auf dich gewartet – ganz geduldig und nur ein bisschen wackelnd.",
    "Morgenlicht auf dem Fell fühlt sich an wie ein kleiner warmer Kuschler.",
    "Ich bin wach! Also mein linkes Ohr zumindest. Der Rest kommt gleich nach.",
    "Heute könnte etwas richtig Schönes passieren. Du bist ja schon da.",
    "Frühstück, Nasenstups, Abenteuer – die Reihenfolge darfst du bestimmen.",
  ],
  day: [
    "Mit dir ist selbst ein ganz normaler Tag ein guter Capy-Tag.",
    "Ich habe gerade beschlossen: Heute wird freundlich und ein bisschen albern.",
    "Meine Nase ist warm, mein Zuhause gemütlich und du bist da. Alles wichtig.",
    "Nur zur Erinnerung: Du machst das ziemlich gut mit uns beiden.",
    "Wollen wir eine kleine Erinnerung fürs Tagebuch erleben?",
  ],
  dusk: [
    "Das Abendlicht macht den Teich ganz golden. Bleibst du kurz bei mir?",
    "Der Tag wird leiser. Das ist meine liebste Zeit für ein Gespräch.",
    "Ich finde, wir haben uns heute eine gemütliche Pause verdient.",
    "Wenn die Sonne sinkt, sehen meine Ohren besonders elegant aus. Finde ich.",
    "Lass uns den Tag mit etwas Schönem beenden.",
  ],
  night: [
    "Der Mond ist da. Zeit für einen letzten Kuschler und dann ein Nickerchen?",
    "Nachts klingt der Teich wie ein ganz leises Schlaflied.",
    "Falls du heute viel getragen hast: Hier darfst du es kurz ablegen.",
    "Ich passe auf die Sterne auf. Du kannst dich ausruhen.",
    "Gute Abende brauchen drei Dinge: Ruhe, Nähe und vielleicht einen Snack.",
  ],
});

const HAPPY_PHRASES = Object.freeze([
  "Weißt du, was ich an dir mag? Dass du immer wiederkommst.",
  "Ich bin vielleicht klein und gepixelt, aber meine Freude über dich ist riesig.",
  "Mein geheimes Talent ist Entspannen. Mein zweitgeheimstes ist Melone finden.",
  "Wenn ich mit den Ohren wackle, heißt das: Schön, dass du da bist.",
  "Heute fühle ich mich weich, mutig und bereit für ein kleines Abenteuer.",
  "Ein Capybara braucht nicht viel. Wasser, Freunde und jemanden wie dich.",
  "Ich habe dir einen Platz neben mir freigehalten. Der ist immer deiner.",
  "Kleine Pause? Wir können gemeinsam überhaupt nichts tun. Darin bin ich ausgezeichnet.",
  "Du kümmerst dich um mich. Ich kümmere mich dafür um dein Lächeln, okay?",
  "Manchmal ist Glück einfach eine warme Schnute und ein vertrauter Mensch.",
  "Ich glaube, wir sind ein ziemlich gutes Team. Capy-High-Five?",
  "Falls heute niemand gesagt hat, dass du liebenswert bist: Ich sage es jetzt.",
  "Ich sammle keine Dinge. Ich sammle gemeinsame Momente im Tagebuch.",
  "Meine Tagesprognose: 80 Prozent Kuscheln, 20 Prozent Melonenkrümel.",
  "Darf ich heute dein kleiner ruhiger Ort sein?",
  "Wusstest du, dass ein Nasenstups praktisch eine winzige Umarmung ist?",
  "Ich bin froh, dass Johannes ausgerechnet uns beide zusammengebracht hat.",
  "Vielleicht bin ich dein Haustier. Aber du bist eindeutig mein Lieblingsmensch.",
  "Wenn irgendwo etwas glitzert, muss ich kurz hinsehen. Das ist Capy-Gesetz.",
  "Kaffeeduft, ein Brettspiel und du am Tisch – so klingt ein ziemlich perfekter Nachmittag.",
  "Ich wäre heute gern unterwegs. Mein Abenteuergepäck besteht aus Mut und drei Snacks.",
  "Grillen wir bald zusammen? Für mich bitte alles außer Zwiebeln. Wirklich alles außer Zwiebeln.",
  "Gesellschaft ist mein Lieblingswetter. Mit dir ist heute eindeutig sonnig.",
  "Ich habe das Spielbrett aufgebaut. Die Glitzerfigur gehört natürlich mir.",
]);

export function statusPhrase(state, now = Date.now()) {
  if (state.sleeping) return "Pssst … ich träume von einem warmen Teich.";
  const needs = NEED_KEYS.map((key) => [key, state[key]]).sort((a, b) => a[1] - b[1]);
  const [lowest, value] = needs[0];
  if (value < 25) return phraseFrom(URGENT_PHRASES[lowest], state, now, 17);
  if (value < 48) return phraseFrom(LOW_PHRASES[lowest], state, now, 29);
  const hour = new Date(now).getHours();
  const period = hour < 7 ? "morning" : hour < 17 ? "day" : hour < 21 ? "dusk" : "night";
  if ((Math.floor(now / 900_000) + state.interactions) % 3 === 0) return phraseFrom(TIME_PHRASES[period], state, now, 41);
  return phraseFrom(HAPPY_PHRASES, state, now, 53);
}
