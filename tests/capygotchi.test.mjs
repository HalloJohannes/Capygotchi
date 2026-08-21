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
  assert.equal(report.state.version, 2);
});

test("interactions stay within healthy stat limits", () => {
  const state = { ...makeState(1), satiety: 98, fun: 2, social: 99 };
  const changed = applyChanges(state, { satiety: 20, fun: -12, social: 9, xp: 5 }, 1);

  assert.equal(changed.satiety, 100);
  assert.equal(changed.fun, 0);
  assert.equal(changed.social, 100);
  assert.equal(changed.xp, 5);
});

test("old saved games migrate, names remain compact, and Emmi is the default", () => {
  const state = normalizeState({ version: 1, name: "  Frau   Flauschpfote mit Hut  ", satiety: 900, fun: -20 }, 12);
  assert.equal(state.name, cleanName("Frau Flauschpfote mit Hut"));
  assert.ok(state.name.length <= 14);
  assert.equal(state.satiety, 100);
  assert.equal(state.fun, 0);
  assert.equal(state.version, 2);
  assert.equal(state.social, 84);
  assert.equal(makeState(1).name, "Emmi");
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
  assert.doesNotMatch(html, /<(img|svg)\b/i);
  assert.match(app, /pointermove/);
  assert.match(app, /bathAnimation/);
  assert.match(app, /startBubbles/);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(serviceWorker, /capygotchi-v4/);
  assert.match(serviceWorker, /dialogues\.js/);
});
