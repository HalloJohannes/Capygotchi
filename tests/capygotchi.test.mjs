import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  advanceState,
  applyChanges,
  cleanName,
  levelInfo,
  makeState,
  moodFor,
  normalizeState,
} from "../public/capygotchi/game-core.js";

test("needs continue changing while the app is closed", () => {
  const start = Date.UTC(2026, 7, 21, 12);
  const state = makeState(start, "Momo");
  const later = advanceState(state, start + 3_600_000);

  assert.equal(later.satiety, 77.8);
  assert.equal(later.fun, 74.9);
  assert.equal(later.clean, 87.9);
  assert.equal(later.energy, 85.2);
});

test("sleep restores energy and slows other needs", () => {
  const start = Date.UTC(2026, 7, 21, 12);
  const state = { ...makeState(start), sleeping: true, energy: 40 };
  const later = advanceState(state, start + 2 * 3_600_000);

  assert.equal(later.energy, 70);
  assert.equal(later.satiety, 77.6);
  assert.equal(later.fun, 77);
});

test("interactions stay within healthy stat limits", () => {
  const state = { ...makeState(1), satiety: 98, fun: 2 };
  const changed = applyChanges(state, { satiety: 20, fun: -12, xp: 5 }, 1);

  assert.equal(changed.satiety, 100);
  assert.equal(changed.fun, 0);
  assert.equal(changed.xp, 5);
});

test("saved state is repaired and names remain compact", () => {
  const state = normalizeState({ name: "  Frau   Flauschpfote mit Hut  ", satiety: 900, fun: -20 }, 12);
  assert.equal(state.name, cleanName("Frau Flauschpfote mit Hut"));
  assert.ok(state.name.length <= 14);
  assert.equal(state.satiety, 100);
  assert.equal(state.fun, 0);
});

test("mood and level respond to care", () => {
  assert.equal(moodFor({ ...makeState(1), satiety: 4 }).tone, "urgent");
  assert.equal(moodFor({ ...makeState(1), sleeping: true }).tone, "sleeping");
  assert.equal(levelInfo(0).level, 1);
  assert.ok(levelInfo(220).level > 1);
});

test("the published app is image-free, German, and installable", async () => {
  const [html, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("../public/capygotchi/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/capygotchi/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/capygotchi/sw.js", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<html lang="de">/);
  assert.match(html, /Zum Home-Bildschirm/);
  assert.doesNotMatch(html, /<(img|svg)\b/i);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(serviceWorker, /capygotchi-v1/);
});
