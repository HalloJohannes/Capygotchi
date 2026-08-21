import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  absenceReport,
  addMemory,
  advanceState,
  applyChanges,
  cleanName,
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
  assert.equal(report.state.version, 3);
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
  assert.equal(state.version, 3);
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
  assert.equal(CAPY_WIDTH, 42);
  assert.equal(CAPY_HEIGHT, 26);
  assert.equal(CAPY_PIXELS.length, CAPY_HEIGHT);
  assert.ok(CAPY_PIXELS.every((row) => row.length === CAPY_WIDTH));
  assert.ok(CAPY_PIXELS.join("").includes("e"));
  assert.ok(CAPY_PIXELS.join("").includes("b"));
});

test("dialogues offer multiple two-step conversations and adapt to needs", () => {
  assert.ok(DIALOGUES.length >= 6);
  assert.ok(DIALOGUES.every((dialogue) => dialogue.turns.length >= 2));
  assert.ok(DIALOGUES.every((dialogue) => dialogue.turns.every((turn) => turn.choices.length >= 3)));
  assert.equal(dialogueFor({ ...makeState(1), social: 10 }).id, "missing-you");
  assert.equal(dialogueFor({ ...makeState(1), curiosity: 10 }).id, "brave-capy");
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
  assert.match(html, /NEUES CAPY ERWECKEN/);
  assert.match(html, /value="golden"/);
  assert.doesNotMatch(html, /<(img|svg)\b/i);
  assert.match(app, /pointermove/);
  assert.match(app, /bathAnimation/);
  assert.match(app, /startBubbles/);
  assert.match(app, /localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(app, /capygotchi-library-v1/);
  assert.match(app, /switchToPet/);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(serviceWorker, /capygotchi-v5/);
  assert.match(serviceWorker, /dialogues\.js/);
  assert.match(serviceWorker, /pet-library\.js/);
});
