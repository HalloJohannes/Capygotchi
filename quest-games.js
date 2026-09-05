const icons = ["✦", "♥", "☕", "●", "▲", "♫"];

export const COFFEE_SWEETSPOT_WIDTHS = Object.freeze([24, 21, 18, 15, 12]);
export const CITY_ROUTE_PREVIEW_SECONDS = 6;
export const RHYTHM_COLORS = Object.freeze(["rose", "gold", "green", "blue", "lilac", "mint"]);

const CITY_PLACES = Object.freeze([
  { id: "cafe", icon: "☕", label: "Café" },
  { id: "park", icon: "♣", label: "Park" },
  { id: "game", icon: "▦", label: "Spieleladen" },
  { id: "view", icon: "▲", label: "Aussicht" },
  { id: "pond", icon: "≈", label: "Teich" },
]);

export function coffeeRoundScore(position, roundIndex) {
  const width = COFFEE_SWEETSPOT_WIDTHS[Math.max(0, Math.min(COFFEE_SWEETSPOT_WIDTHS.length - 1, roundIndex))];
  const distance = Math.abs(Number(position) - 50);
  if (distance <= width / 2) return 20;
  if (distance <= width / 2 + 10) return 12;
  return 5;
}

export function createCityRoute(random = Math.random) {
  const route = [...CITY_PLACES];
  for (let index = route.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.max(0, Math.min(0.999999, random())) * (index + 1));
    [route[index], route[target]] = [route[target], route[index]];
  }
  return route;
}

export function cityRouteScore(mistakes = 0, hints = 0) {
  return Math.max(40, 100 - Math.max(0, mistakes) * 8 - Math.max(0, hints) * 5);
}

export function nextRhythmStep(previous = -1, random = Math.random) {
  let value = Math.floor(Math.max(0, Math.min(0.999999, random())) * RHYTHM_COLORS.length);
  if (value === previous) value = (value + 1) % RHYTHM_COLORS.length;
  return value;
}

export function rhythmScore(mistakes = 0) {
  return Math.max(40, 100 - Math.max(0, mistakes) * 10);
}

function button(label, className = "quest-game-button") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function emptyStage(stage, className) {
  stage.className = `quest-stage ${className}`;
  stage.replaceChildren();
}

function sparkleGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "sparkle-game");
  let caught = 0;
  let left = 22;
  let ended = false;
  const field = document.createElement("div");
  field.className = "sparkle-field";
  stage.append(field);

  const update = () => { status.textContent = `✦ ${caught} GEFANGEN · ${left} SEK`; };
  const spawn = () => {
    if (ended) return;
    const target = button(icons[Math.floor(Math.random() * 2)], "sparkle-target");
    target.setAttribute("aria-label", "Funkelstern fangen");
    target.style.setProperty("--left", `${5 + Math.random() * 82}%`);
    target.style.setProperty("--top", `${6 + Math.random() * 72}%`);
    target.style.setProperty("--hue", `${Math.floor(Math.random() * 300)}deg`);
    target.addEventListener("click", () => {
      caught += 1;
      target.classList.add("is-caught");
      target.disabled = true;
      update();
      window.setTimeout(() => target.remove(), 260);
    });
    field.append(target);
    window.setTimeout(() => target.remove(), 1700);
  };
  update();
  onMessage("Schnell – ich sehe überall Glitzer!");
  const spawnTimer = window.setInterval(spawn, 430);
  spawn(); spawn();
  const clock = window.setInterval(() => {
    left -= 1;
    update();
    if (left <= 0) {
      ended = true;
      window.clearInterval(clock);
      window.clearInterval(spawnTimer);
      onFinish(Math.min(100, Math.round((caught / 18) * 100)));
    }
  }, 1000);
  return () => { ended = true; window.clearInterval(clock); window.clearInterval(spawnTimer); };
}

function memoryGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "memory-game");
  const symbols = ["☕", "✦", "▲", "♥", "♫", "●"];
  const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  let open = [];
  let matches = 0;
  let moves = 0;
  let locked = false;
  let stopped = false;
  const board = document.createElement("div");
  board.className = "memory-board";
  const update = () => { status.textContent = `${matches}/6 PAARE · ${moves} ZÜGE`; };
  deck.forEach((symbol, index) => {
    const card = button("?", "memory-card");
    card.dataset.symbol = symbol;
    card.setAttribute("aria-label", `Verdeckte Karte ${index + 1}`);
    card.addEventListener("click", () => {
      if (locked || card.classList.contains("is-open") || card.classList.contains("is-matched")) return;
      card.textContent = symbol;
      card.classList.add("is-open");
      open.push(card);
      if (open.length < 2) return;
      moves += 1;
      locked = true;
      update();
      if (open[0].dataset.symbol === open[1].dataset.symbol) {
        open.forEach((item) => item.classList.add("is-matched"));
        matches += 1;
        open = [];
        locked = false;
        update();
        if (matches === 6) onFinish(Math.max(35, 110 - moves * 5));
      } else {
        window.setTimeout(() => {
          if (stopped) return;
          open.forEach((item) => { item.textContent = "?"; item.classList.remove("is-open"); });
          open = [];
          locked = false;
        }, 720);
      }
    });
    board.append(card);
  });
  stage.append(board);
  update();
  onMessage("Ich bin Team Glitzerkarte. Welche merkst du dir?");
  return () => { stopped = true; };
}

function coffeeGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "coffee-game");
  let position = 0;
  let direction = 1;
  let rounds = 0;
  let points = 0;
  let stopped = false;
  let locked = false;
  let nextRoundTimer = 0;
  const cup = document.createElement("div");
  cup.className = "coffee-cup";
  cup.innerHTML = "<span>☕</span><i></i><i></i><i></i>";
  const meter = document.createElement("div");
  meter.className = "coffee-meter";
  meter.innerHTML = '<span class="coffee-sweetspot"></span><i class="coffee-marker"></i>';
  const marker = meter.querySelector(".coffee-marker");
  const sweetspot = meter.querySelector(".coffee-sweetspot");
  const stop = button("JETZT STOPPEN", "quest-game-action");
  const update = (message = "") => {
    const round = Math.min(rounds + 1, COFFEE_SWEETSPOT_WIDTHS.length);
    const width = COFFEE_SWEETSPOT_WIDTHS[Math.min(rounds, COFFEE_SWEETSPOT_WIDTHS.length - 1)];
    status.textContent = message || `RUNDE ${round}/5 · ZIEL ${width}% · ${points} PUNKTE`;
    sweetspot.style.setProperty("--sweetspot-width", `${width}%`);
  };
  stop.addEventListener("click", () => {
    if (stopped || locked) return;
    locked = true;
    stop.disabled = true;
    const earned = coffeeRoundScore(position, rounds);
    points += earned;
    rounds += 1;
    cup.classList.remove("is-perfect");
    void cup.offsetWidth;
    cup.classList.add("is-perfect");
    update(`${earned === 20 ? "PERFEKT" : earned === 12 ? "FAST PERFEKT" : "GUT GERÜHRT"} · +${earned} · ${points} PUNKTE`);
    if (rounds === 5) {
      stopped = true;
      window.clearInterval(animation);
      onFinish(points);
      return;
    }
    nextRoundTimer = window.setTimeout(() => {
      if (stopped) return;
      position = rounds % 2 ? 100 : 0;
      direction = rounds % 2 ? -1 : 1;
      marker.style.left = `${position}%`;
      locked = false;
      stop.disabled = false;
      update();
    }, 500);
  });
  const animation = window.setInterval(() => {
    if (locked || stopped) return;
    position += direction * 1.8;
    if (position >= 100 || position <= 0) direction *= -1;
    position = Math.max(0, Math.min(100, position));
    marker.style.left = `${position}%`;
  }, 30);
  stage.append(cup, meter, stop);
  update();
  onMessage("Die goldene Mitte wird jede Runde ein bisschen kleiner. Ganz ruhig!");
  return () => { stopped = true; window.clearInterval(animation); window.clearTimeout(nextRoundTimer); };
}

function grillGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "grill-game");
  const ingredients = [
    ["Mais", "🌽", true], ["Zwiebel", "◉", false], ["Paprika", "◆", true], ["Pilz", "♠", true],
    ["Zwiebelring", "◎", false], ["Zucchini", "●", true], ["Kürbis", "▲", true], ["Rote Zwiebel", "◉", false],
    ["Kartoffel", "●", true], ["Melone", "♥", true], ["Zwiebel", "◎", false], ["Tofu", "■", true],
  ];
  let index = 0;
  let correct = 0;
  const plate = document.createElement("div");
  plate.className = "grill-plate";
  const choices = document.createElement("div");
  choices.className = "grill-choices";
  const yes = button("AUF DEN GRILL", "quest-game-action");
  const no = button("WEGLASSEN", "quest-game-action danger-choice");
  choices.append(yes, no);
  const update = () => {
    const [name, symbol] = ingredients[index] || ["Fertig", "✦"];
    plate.innerHTML = `<span>${symbol}</span><strong>${name}</strong>`;
    status.textContent = `${index}/12 SORTIERT · ${correct} RICHTIG`;
  };
  const choose = (grill) => {
    const right = ingredients[index][2] === grill;
    if (right) correct += 1;
    plate.classList.remove("is-right", "is-wrong");
    void plate.offsetWidth;
    plate.classList.add(right ? "is-right" : "is-wrong");
    index += 1;
    if (index === ingredients.length) {
      yes.disabled = true; no.disabled = true;
      onFinish(Math.round((correct / ingredients.length) * 100));
    } else update();
  };
  yes.addEventListener("click", () => choose(true));
  no.addEventListener("click", () => choose(false));
  stage.append(plate, choices);
  update();
  onMessage("Alles riecht gut – außer diese verdächtigen Zwiebeln.");
  return () => {};
}

function routeGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "route-game");
  const places = createCityRoute();
  const decoys = [{ icon: "◆", label: "Markt" }, { icon: "■", label: "Bahnhof" }, { icon: "●", label: "Platz" }];
  const slots = [[12, 17], [38, 12], [68, 18], [87, 34], [18, 55], [46, 49], [74, 65], [34, 82]];
  let next = 0;
  let mistakes = 0;
  let hints = 0;
  let phase = "preview";
  let previewLeft = CITY_ROUTE_PREVIEW_SECONDS;
  let stopped = false;
  let previewInterval = 0;
  let previewTimeout = 0;
  let hintTimer = 0;
  const route = document.createElement("div");
  route.className = "route-order is-preview";
  route.setAttribute("aria-label", "Zu merkende Strecke");
  route.innerHTML = places.map((place, index) => `<span data-route="${index}"><b>${place.icon}</b><em>${place.label}</em><small>${index + 1}</small></span>`).join("");
  const map = document.createElement("div");
  map.className = "route-map is-preview";
  const controls = document.createElement("div");
  controls.className = "route-controls";
  const ready = button("ICH HAB’S", "quest-game-action route-ready");
  const hint = button("KLEINER HINWEIS", "quest-game-action route-hint");
  hint.hidden = true;
  controls.append(ready, hint);
  const markers = [];
  [...places, ...decoys].sort(() => Math.random() - 0.5).forEach((place, index) => {
    const marker = button(place.icon, "route-marker");
    marker.style.setProperty("--x", `${slots[index][0]}%`);
    marker.style.setProperty("--y", `${slots[index][1]}%`);
    marker.setAttribute("aria-label", place.label);
    marker.disabled = true;
    marker.addEventListener("click", () => {
      if (phase !== "walk" || stopped) return;
      if (place.id === places[next]?.id) {
        marker.disabled = true;
        marker.classList.add("is-visited");
        route.querySelector(`[data-route="${next}"]`).classList.add("is-visited");
        next += 1;
        status.textContent = `${next}/5 ZIELE · ${mistakes} UMWEGE`;
        if (next === places.length) {
          stopped = true;
          onFinish(cityRouteScore(mistakes, hints));
        }
      } else {
        mistakes += 1;
        marker.classList.add("is-wrong");
        window.setTimeout(() => marker.classList.remove("is-wrong"), 300);
        status.textContent = `${next}/5 ZIELE · ${mistakes} UMWEGE`;
      }
    });
    map.append(marker);
    markers.push(marker);
  });
  const beginWalk = () => {
    if (phase !== "preview" || stopped) return;
    phase = "walk";
    window.clearInterval(previewInterval);
    window.clearTimeout(previewTimeout);
    route.classList.remove("is-preview");
    route.classList.add("is-hidden");
    route.setAttribute("aria-hidden", "true");
    map.classList.remove("is-preview");
    markers.forEach((marker) => { marker.disabled = false; });
    ready.hidden = true;
    hint.hidden = false;
    status.textContent = "0/5 ZIELE · 0 UMWEGE";
    onMessage("Los geht’s. Ich laufe mit – wir finden den Weg zusammen!");
  };
  ready.addEventListener("click", beginWalk);
  hint.addEventListener("click", () => {
    if (phase !== "walk" || hints > 0 || stopped) return;
    hints = 1;
    hint.disabled = true;
    const target = route.querySelector(`[data-route="${next}"]`);
    route.removeAttribute("aria-hidden");
    target?.classList.add("is-hint");
    status.textContent = `${next}/5 ZIELE · KLEINER HINWEIS`;
    hintTimer = window.setTimeout(() => {
      target?.classList.remove("is-hint");
      route.setAttribute("aria-hidden", "true");
      if (!stopped) status.textContent = `${next}/5 ZIELE · ${mistakes} UMWEGE`;
    }, 1100);
  });
  stage.append(route, map, controls);
  status.textContent = `MERKEN · NOCH ${previewLeft} SEK`;
  onMessage("Merk dir unsere fünf Stationen. Danach verschwindet die Strecke!");
  previewInterval = window.setInterval(() => {
    previewLeft -= 1;
    if (previewLeft > 0) status.textContent = `MERKEN · NOCH ${previewLeft} SEK`;
  }, 1000);
  previewTimeout = window.setTimeout(beginWalk, CITY_ROUTE_PREVIEW_SECONDS * 1000);
  return () => {
    stopped = true;
    window.clearInterval(previewInterval);
    window.clearTimeout(previewTimeout);
    window.clearTimeout(hintTimer);
  };
}

function rhythmGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "rhythm-game");
  const sequence = [nextRhythmStep()];
  let inputIndex = 0;
  let round = 1;
  let mistakes = 0;
  let accepting = false;
  let stopped = false;
  const pads = document.createElement("div");
  pads.className = "rhythm-pads";
  const pendingTimers = new Set();
  const schedule = (callback, duration) => {
    const timer = window.setTimeout(() => { pendingTimers.delete(timer); callback(); }, duration);
    pendingTimers.add(timer);
    return timer;
  };
  const padButtons = RHYTHM_COLORS.map((color, index) => {
    const pad = button(String(index + 1), `rhythm-pad pad-${color}`);
    pad.setAttribute("aria-label", `Seerose ${index + 1}`);
    pad.addEventListener("click", () => {
      if (!accepting || stopped) return;
      flash(index);
      if (index === sequence[inputIndex]) {
        inputIndex += 1;
        if (inputIndex === sequence.length) {
          accepting = false;
          round += 1;
          if (round > 6) {
            stopped = true;
            onFinish(rhythmScore(mistakes));
            return;
          }
          sequence.push(nextRhythmStep(sequence.at(-1)));
          schedule(showSequence, 650);
        }
      } else {
        mistakes += 1;
        accepting = false;
        inputIndex = 0;
        status.textContent = `RUNDE ${round}/6 · ${mistakes} PATZER`;
        schedule(showSequence, 650);
      }
    });
    pads.append(pad);
    return pad;
  });
  const flash = (index) => {
    padButtons[index].classList.add("is-lit");
    schedule(() => padButtons[index]?.classList.remove("is-lit"), 300);
  };
  const showSequence = () => {
    if (stopped) return;
    accepting = false;
    inputIndex = 0;
    status.textContent = `RUNDE ${round}/6 · GUT AUFPASSEN`;
    sequence.forEach((value, index) => schedule(() => flash(value), 500 * index));
    schedule(() => {
      if (stopped) return;
      accepting = true;
      status.textContent = `RUNDE ${round}/6 · JETZT DU`;
    }, sequence.length * 500 + 250);
  };
  stage.append(pads);
  onMessage("Psst, sechs bunte Seerosen spielen uns etwas vor.");
  schedule(showSequence, 450);
  return () => { stopped = true; pendingTimers.forEach((timer) => window.clearTimeout(timer)); pendingTimers.clear(); };
}

const GAMES = { sparkles: sparkleGame, memory: memoryGame, coffee: coffeeGame, grill: grillGame, route: routeGame, rhythm: rhythmGame };

export function startQuestGame(options) {
  const game = GAMES[options.quest?.game];
  if (!game) throw new Error(`Unbekanntes Questspiel: ${options.quest?.game}`);
  return game(options);
}
