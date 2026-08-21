import {
  CARE,
  FOODS,
  NEED_KEYS,
  STORAGE_KEY,
  TOGETHER,
  TOYS,
  absenceReport,
  addMemory,
  advanceState,
  applyChanges,
  cleanName,
  dayNumber,
  levelInfo,
  makeState,
  moodFor,
  statusPhrase,
} from "./game-core.js?v=5";
import { CAPY_HEIGHT, CAPY_PIXELS, CAPY_WIDTH } from "./pet-art.js?v=5";
import { dialogueFor } from "./dialogues.js?v=5";
import {
  LIBRARY_KEY,
  activeProfile,
  addProfile,
  emptyLibrary,
  normalizeLibrary,
  removeProfile,
  selectProfile,
  updateProfile,
} from "./pet-library.js?v=5";

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
  "is-drying", "is-cuddling", "is-talking", "is-exploring", "is-sunbathing", "is-tugging",
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

const NAME_SUGGESTIONS = ["Emmi", "Flocke", "Lotti", "Pino", "Nala", "Keks", "Maja", "Oskar"];

function loadState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("capygotchi-library-v1");
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
  elements.mood.innerHTML = `<span aria-hidden="true">${state.sleeping ? "☾" : "♥"}</span> ${mood.label}`;
  elements.speech.textContent = currentPhrase;

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
    button.disabled = state.sleeping || interactionBusy;
  });
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
    const notes = kind === "sleep" ? [330, 262] : kind === "splash" ? [392, 523, 392] : kind === "tap" ? [440] : [523, 659];
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

function finishInteraction(changes, phrase, memory, icon = "♥") {
  state = applyChanges(state, changes);
  remember(memory, icon);
  interactionBusy = false;
  talk(phrase);
  playSound("happy");
  haptic([18, 30, 18]);
  render();
}

function openTray(category) {
  if (state.sleeping || interactionBusy) return;
  const group = GROUPS[category];
  if (!group) return;
  activeTray = category;
  selectedItem = null;
  elements.trayKicker.textContent = group.kicker;
  elements.trayTitle.textContent = group.title.replace("{name}", state.name);
  elements.trayInstruction.textContent = group.instruction;
  elements.trayProgress.hidden = true;
  elements.trayProgress.querySelector("span").style.width = "0%";
  elements.trayItems.replaceChildren();

  for (const [key, item] of Object.entries(group.items)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tray-item";
    button.dataset.category = category;
    button.dataset.key = key;
    button.setAttribute("aria-label", `${item.label}: ${item.detail}. Ziehen oder auswählen.`);
    button.append(itemSprite(key));
    const text = document.createElement("span");
    text.innerHTML = `<strong>${item.label}</strong><small>${item.detail}</small>`;
    button.append(text);
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
  const item = GROUPS[category].items[key];
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
  if (!button || interactionBusy || state.sleeping) return;
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
  if (interactionBusy || state.sleeping) return;
  const item = GROUPS[category]?.items[key];
  if (!item) return;
  interactionBusy = true;
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
  talk(`Oh! ${item.label}! Gib her …`, { speak: false });
  playSound("tap");
  await wait(2100);
  food.remove();
  finishInteraction(item, state.satiety + item.satiety > 112 ? "Puh, mein Bauch ist jetzt kugelrund!" : item.phrase, `${state.name} hat ${item.label} aus deiner Hand gefuttert.`, key === "melon" ? "🍉" : "●");
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
    visit.textContent = profile.id === activePetId ? "Gerade bei dir" : relativeVisit(profile.lastPlayedAt);
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
  closeTray();
  if (bubbleSession) window.clearTimeout(bubbleSession.timer);
  bubbleSession = null;
  currentConversation = null;
  interactionBusy = false;
  selectedItem = null;
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
$("#journal-button").addEventListener("click", () => { renderJournal(); openDialog(elements.journalDialog); });
$("#settings-button").addEventListener("click", () => { syncSettingsForm(); openDialog(elements.settingsDialog); });

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
  talk(`Hallo! Ich bin ${state.name}. Ich mag warme Teiche, Melone und dass du jetzt da bist. Danke, dass du auf mich aufpasst!`);
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

window.addEventListener("online", () => showToast("Wieder online – dein Capy ist bereit."));
window.addEventListener("offline", () => showToast("Offline-Modus – dein Spielstand bleibt erhalten."));
window.addEventListener("pagehide", saveState);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const report = absenceReport(state);
    state = report.state;
    currentPhrase = statusPhrase(state);
    if (report.elapsedMs >= 5 * 60_000) {
      awayInfo = report;
      showAwayReport();
    }
    render();
  } else {
    saveState();
  }
});

window.setInterval(() => render(), 30_000);
window.setInterval(() => {
  if (!state.sleeping && !interactionBusy && !document.hidden) {
    currentPhrase = statusPhrase(state);
    elements.speech.textContent = currentPhrase;
  }
}, 90_000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
