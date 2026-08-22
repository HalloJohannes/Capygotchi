const MINUTE = 60_000;
const DAY = 86_400_000;

export const QUEST_DEFINITIONS = Object.freeze({
  "glitter-hunt": {
    id: "glitter-hunt",
    type: "minigame",
    game: "sparkles",
    icon: "✦",
    title: "Glitzer im Schilf",
    short: "Fangt gemeinsam die funkelnden Teichsterne.",
    intro: "Da glitzert etwas! Hilfst du mir, alle Funkelsterne einzusammeln?",
    instruction: "Tippe in 22 Sekunden so viele Funkelsterne wie möglich.",
    reward: { xp: 16, fun: 8, curiosity: 6, social: 3 },
  },
  "board-memory": {
    id: "board-memory",
    type: "minigame",
    game: "memory",
    icon: "▦",
    title: "Capy-Merkspiel",
    short: "Ein richtiges Brettspiel für zwei schlaue Köpfe.",
    intro: "Brettspielzeit! Ich merke mir die Snacks, du die Wege – Deal?",
    instruction: "Finde alle sechs Paare mit möglichst wenigen Zügen.",
    reward: { xp: 20, fun: 10, curiosity: 5, social: 4 },
  },
  "coffee-perfect": {
    id: "coffee-perfect",
    type: "minigame",
    game: "coffee",
    icon: "☕",
    title: "Perfekter Capy-Kaffee",
    short: "Trefft fünfmal den goldenen Wohlfühlbereich.",
    intro: "Kaffeeduft! Meiner ist natürlich nur ein capyfreundlicher Hafer-Milchschaum.",
    instruction: "Stoppe den wandernden Punkt fünfmal im goldenen Bereich.",
    reward: { xp: 18, energy: 7, fun: 7, social: 3 },
  },
  "onion-free-grill": {
    id: "onion-free-grill",
    type: "minigame",
    game: "grill",
    icon: "♨",
    title: "Das zwiebelfreie Grillfest",
    short: "Grillt Lieblingssnacks – aber keine einzige Zwiebel.",
    intro: "Grillabend! Aber bitte pass auf: Zwiebeln finde ich wirklich capygrässlich.",
    instruction: "Gutes Grillgut kommt auf den Rost, Zwiebeln bleiben draußen.",
    reward: { xp: 20, satiety: 9, fun: 8, social: 5 },
  },
  "city-tour": {
    id: "city-tour",
    type: "minigame",
    game: "route",
    icon: "⌁",
    title: "Unterwegs mit Capy",
    short: "Findet gemeinsam den Weg durch eine kleine Stadt.",
    intro: "Rucksack gepackt? Ich bin gern unterwegs – solange wir zusammen gehen.",
    instruction: "Besuche die fünf Ziele in der angezeigten Reihenfolge.",
    reward: { xp: 22, curiosity: 12, fun: 6, energy: -3, social: 4 },
  },
  "pond-rhythm": {
    id: "pond-rhythm",
    type: "minigame",
    game: "rhythm",
    icon: "♫",
    title: "Seerosen-Symphonie",
    short: "Merkt euch die immer längere Teichmelodie.",
    intro: "Die Seerosen spielen Musik! Können wir ihre Melodie nachklopfen?",
    instruction: "Merke dir die leuchtende Folge und tippe sie richtig nach.",
    reward: { xp: 21, fun: 10, curiosity: 7, social: 3 },
  },
  "social-circle": {
    id: "social-circle",
    type: "task",
    icon: "♥",
    title: "Zeit für Gesellschaft",
    short: "Kuscheln, reden und gemeinsam am Seil ziehen.",
    intro: "Heute wünsche ich mir ganz viel Gesellschaft. Machen wir drei Dinge zusammen?",
    instruction: "Erledige die drei Aktivitäten in der normalen Aktionsleiste.",
    goals: [
      { action: "together:cuddle", label: "Lange kuscheln" },
      { action: "together:talk", label: "Ein Gespräch führen" },
      { action: "play:rope", label: "Am Zerrseil spielen" },
    ],
    reward: { xp: 22, social: 14, fun: 7 },
  },
  "day-trip": {
    id: "day-trip",
    type: "task",
    icon: "▲",
    title: "Kleiner Tagesausflug",
    short: "Entdecken, Proviant essen und danach abtrocknen.",
    intro: "Ich möchte raus! Packen wir Apfelproviant und ein Handtuch für unterwegs ein?",
    instruction: "Erledige die drei Aktivitäten in beliebiger Reihenfolge.",
    goals: [
      { action: "together:explore", label: "Eine Ecke entdecken" },
      { action: "feed:apple", label: "Apfelproviant teilen" },
      { action: "care:towel", label: "Fell trockenrubbeln" },
    ],
    reward: { xp: 24, curiosity: 12, fun: 7, social: 5 },
  },
  "cozy-evening": {
    id: "cozy-evening",
    type: "task",
    icon: "☀",
    title: "Goldener Wohlfühltag",
    short: "Teichbad, Sonnenplatz und ein Stück Melone.",
    intro: "Mein Traumprogramm: baden, Sonne und klebrige Melonenschnute. Bist du dabei?",
    instruction: "Erfülle gemeinsam mit deinem Capy alle drei Wünsche.",
    goals: [
      { action: "care:bath", label: "In den Teich springen" },
      { action: "together:sunbathe", label: "Ein Sonnenbad nehmen" },
      { action: "feed:melon", label: "Melone genießen" },
    ],
    reward: { xp: 23, clean: 6, energy: 6, fun: 7 },
  },
  "pickle-picnic": {
    id: "pickle-picnic",
    type: "task",
    icon: "▰",
    title: "Die geheime Gurkenpause",
    short: "Findet eine seltene Gewürzgurke und macht daraus einen Ausflug.",
    intro: "Psst! Im Markt gibt es gerade Gewürzgurken. Meine absolute Lieblingsknabberei! Machen wir eine Gurkenpause?",
    instruction: "Die seltene Gewürzgurke ist während dieser Quest im Futterfach verfügbar.",
    goals: [
      { action: "feed:pickle", label: "Gewürzgurke gemeinsam knacken" },
      { action: "together:explore", label: "Einen Picknickplatz entdecken" },
      { action: "together:cuddle", label: "Nach dem Ausflug kuscheln" },
    ],
    reward: { xp: 26, satiety: 5, fun: 12, social: 8, curiosity: 5 },
  },
});

const QUEST_IDS = Object.keys(QUEST_DEFINITIONS);
const GAME_IDS = QUEST_IDS.filter((id) => QUEST_DEFINITIONS[id].type === "minigame");
const TASK_IDS = QUEST_IDS.filter((id) => QUEST_DEFINITIONS[id].type === "task");
const NEXT_DELAYS = [35, 75, 130, 210].map((minutes) => minutes * MINUTE);

export function questDayKey(now = Date.now()) {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function seedNumber(value) {
  return [...String(value)].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

function rotate(items, amount) {
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function dailyQuestQueue(dayKey = questDayKey(), seed = "capy", firstDay = false) {
  const value = seedNumber(`${dayKey}:${seed}`);
  const games = rotate(GAME_IDS, value % GAME_IDS.length);
  const tasks = rotate(TASK_IDS, Math.floor(value / 7) % TASK_IDS.length);
  const queue = firstDay
    ? ["glitter-hunt", tasks[0], games.find((id) => id !== "glitter-hunt"), tasks[1], games.find((id) => id !== "glitter-hunt" && id !== games.find((game) => game !== "glitter-hunt"))]
    : [games[0], tasks[0], games[1], tasks[1], games[2]];
  return [...new Set(queue)].slice(0, 5);
}

function baseProgress(adoptedAt, now, seed, previous = {}) {
  const firstDay = !previous.dayKey;
  return {
    version: 1,
    dayKey: questDayKey(now),
    queue: dailyQuestQueue(questDayKey(now), seed, firstDay),
    completed: [],
    activeId: null,
    taskDone: [],
    nextAt: firstDay ? Number(adoptedAt || now) + MINUTE : now + MINUTE,
    lifetimeCompleted: Math.max(0, Number(previous.lifetimeCompleted) || 0),
    glitter: Math.max(0, Number(previous.glitter) || 0),
    streak: Math.max(0, Number(previous.streak) || 0),
    lastPerfectDay: typeof previous.lastPerfectDay === "string" ? previous.lastPerfectDay : "",
    history: Array.isArray(previous.history) ? previous.history.slice(-30) : [],
  };
}

export function normalizeQuestProgress(candidate, adoptedAt, now = Date.now(), seed = "capy") {
  if (!candidate || typeof candidate !== "object") return baseProgress(adoptedAt, now, seed);
  if (candidate.dayKey !== questDayKey(now)) return baseProgress(adoptedAt, now, seed, candidate);
  const queue = Array.isArray(candidate.queue) ? candidate.queue.filter((id) => QUEST_DEFINITIONS[id]).slice(0, 5) : [];
  const completed = Array.isArray(candidate.completed)
    ? candidate.completed.filter((entry) => entry && queue.includes(entry.id)).map((entry) => ({
      id: entry.id,
      score: Math.max(0, Number(entry.score) || 0),
      stars: Math.min(3, Math.max(1, Number(entry.stars) || 1)),
      reward: Math.max(0, Number(entry.reward) || 0),
      at: Number(entry.at) || now,
    }))
    : [];
  const activeId = queue.includes(candidate.activeId) && !completed.some((entry) => entry.id === candidate.activeId) ? candidate.activeId : null;
  return {
    ...baseProgress(adoptedAt, now, seed, candidate),
    ...candidate,
    version: 1,
    dayKey: questDayKey(now),
    queue: queue.length === 5 ? queue : dailyQuestQueue(questDayKey(now), seed, false),
    completed,
    activeId,
    taskDone: activeId && Array.isArray(candidate.taskDone) ? [...new Set(candidate.taskDone.map(String))] : [],
    nextAt: Number.isFinite(Number(candidate.nextAt)) ? Number(candidate.nextAt) : now,
    lifetimeCompleted: Math.max(0, Number(candidate.lifetimeCompleted) || 0),
    glitter: Math.max(0, Number(candidate.glitter) || 0),
    streak: Math.max(0, Number(candidate.streak) || 0),
    history: Array.isArray(candidate.history) ? candidate.history.filter((entry) => entry?.id && QUEST_DEFINITIONS[entry.id]).slice(-30) : [],
  };
}

export function currentQuest(progress) {
  if (!progress) return null;
  const completed = new Set(progress.completed.map((entry) => entry.id));
  const id = progress.activeId || progress.queue.find((questId) => !completed.has(questId));
  return id ? QUEST_DEFINITIONS[id] : null;
}

export function questIsDue(progress, now = Date.now()) {
  return Boolean(currentQuest(progress) && (progress.activeId || now >= progress.nextAt));
}

export function activateQuest(progress, id, now = Date.now()) {
  if (!progress || !progress.queue.includes(id) || progress.completed.some((entry) => entry.id === id)) return progress;
  if (progress.activeId && progress.activeId !== id) return progress;
  if (!progress.activeId && now < progress.nextAt) return progress;
  return { ...progress, activeId: id, taskDone: [], startedAt: now };
}

export function recordQuestAction(progress, action) {
  const quest = currentQuest(progress);
  if (!quest || quest.type !== "task" || progress.activeId !== quest.id) return progress;
  if (!quest.goals.some((goal) => goal.action === action) || progress.taskDone.includes(action)) return progress;
  return { ...progress, taskDone: [...progress.taskDone, action] };
}

export function taskQuestComplete(progress) {
  const quest = currentQuest(progress);
  return Boolean(quest?.type === "task" && quest.goals.every((goal) => progress.taskDone.includes(goal.action)));
}

export function questStars(score) {
  const value = Math.max(0, Number(score) || 0);
  if (value >= 85) return 3;
  if (value >= 55) return 2;
  return 1;
}

function previousDayKey(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return questDayKey(new Date(year, month - 1, day).getTime() - DAY / 2);
}

export function completeQuest(progress, id, score = 100, now = Date.now()) {
  if (!progress || !progress.queue.includes(id) || progress.completed.some((entry) => entry.id === id)) return progress;
  const stars = questStars(score);
  const reward = 3 + stars * 2;
  const completed = [...progress.completed, { id, score: Math.round(score), stars, reward, at: now }];
  const perfectDay = completed.length === progress.queue.length;
  const streak = perfectDay
    ? (progress.lastPerfectDay === previousDayKey(progress.dayKey) ? progress.streak + 1 : 1)
    : progress.streak;
  return {
    ...progress,
    completed,
    activeId: null,
    taskDone: [],
    nextAt: perfectDay ? now + DAY : now + NEXT_DELAYS[Math.min(completed.length - 1, NEXT_DELAYS.length - 1)],
    lifetimeCompleted: progress.lifetimeCompleted + 1,
    glitter: progress.glitter + reward,
    streak,
    lastPerfectDay: perfectDay ? progress.dayKey : progress.lastPerfectDay,
    history: [...progress.history, { id, score: Math.round(score), stars, at: now }].slice(-30),
  };
}

export function questTimeLabel(progress, now = Date.now()) {
  if (!currentQuest(progress)) return "HEUTE GESCHAFFT";
  if (progress.activeId) return "AKTIV";
  const remaining = Math.max(0, progress.nextAt - now);
  if (remaining <= 0) return "JETZT BEREIT";
  const minutes = Math.ceil(remaining / MINUTE);
  if (minutes < 60) return `IN ${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `IN ${hours} H ${rest ? `${rest} MIN` : ""}`.trim();
}
