const icons = ["✦", "♥", "☕", "●", "▲", "♫"];

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
  const cup = document.createElement("div");
  cup.className = "coffee-cup";
  cup.innerHTML = "<span>☕</span><i></i><i></i><i></i>";
  const meter = document.createElement("div");
  meter.className = "coffee-meter";
  meter.innerHTML = '<span class="coffee-sweetspot"></span><i class="coffee-marker"></i>';
  const marker = meter.querySelector(".coffee-marker");
  const stop = button("JETZT STOPPEN", "quest-game-action");
  const update = () => { status.textContent = `${rounds}/5 MISCHUNGEN · ${points} PUNKTE`; };
  stop.addEventListener("click", () => {
    if (stopped) return;
    rounds += 1;
    const distance = Math.abs(position - 50);
    points += distance <= 9 ? 20 : distance <= 20 ? 12 : 5;
    cup.classList.remove("is-perfect");
    void cup.offsetWidth;
    cup.classList.add("is-perfect");
    update();
    if (rounds === 5) {
      stopped = true;
      stop.disabled = true;
      onFinish(points);
    }
  });
  const animation = window.setInterval(() => {
    position += direction * 2.4;
    if (position >= 100 || position <= 0) direction *= -1;
    position = Math.max(0, Math.min(100, position));
    marker.style.left = `${position}%`;
  }, 30);
  stage.append(cup, meter, stop);
  update();
  onMessage("Genau goldbraun ist er perfekt. Bereit?");
  return () => { stopped = true; window.clearInterval(animation); };
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
  const places = [
    { id: "cafe", icon: "☕", label: "Café" },
    { id: "park", icon: "♣", label: "Park" },
    { id: "game", icon: "▦", label: "Spieleladen" },
    { id: "view", icon: "▲", label: "Aussicht" },
    { id: "pond", icon: "≈", label: "Teich" },
  ];
  const decoys = [{ icon: "◆", label: "Markt" }, { icon: "■", label: "Bahnhof" }, { icon: "●", label: "Platz" }];
  let next = 0;
  let mistakes = 0;
  const route = document.createElement("div");
  route.className = "route-order";
  route.innerHTML = places.map((place, index) => `<span data-route="${index}">${place.icon}<small>${index + 1}</small></span>`).join("");
  const map = document.createElement("div");
  map.className = "route-map";
  [...places, ...decoys].sort(() => Math.random() - 0.5).forEach((place, index) => {
    const marker = button(place.icon, "route-marker");
    marker.style.setProperty("--x", `${8 + ((index * 31) % 78)}%`);
    marker.style.setProperty("--y", `${8 + ((index * 47) % 72)}%`);
    marker.setAttribute("aria-label", place.label);
    marker.addEventListener("click", () => {
      if (place.id === places[next]?.id) {
        marker.classList.add("is-visited");
        route.querySelector(`[data-route="${next}"]`).classList.add("is-visited");
        next += 1;
        status.textContent = `${next}/5 ZIELE · ${mistakes} UMWEGE`;
        if (next === places.length) onFinish(Math.max(35, 100 - mistakes * 12));
      } else {
        mistakes += 1;
        marker.classList.add("is-wrong");
        window.setTimeout(() => marker.classList.remove("is-wrong"), 300);
        status.textContent = `${next}/5 ZIELE · ${mistakes} UMWEGE`;
      }
    });
    map.append(marker);
  });
  stage.append(route, map);
  status.textContent = "0/5 ZIELE · 0 UMWEGE";
  onMessage("Erst Kaffee, dann Park – ich kenne den Weg … fast!");
  return () => {};
}

function rhythmGame({ stage, status, onFinish, onMessage }) {
  emptyStage(stage, "rhythm-game");
  const colors = ["rose", "gold", "green", "blue"];
  const sequence = [Math.floor(Math.random() * 4)];
  let inputIndex = 0;
  let round = 1;
  let mistakes = 0;
  let accepting = false;
  let stopped = false;
  const pads = document.createElement("div");
  pads.className = "rhythm-pads";
  const padButtons = colors.map((color, index) => {
    const pad = button(String(index + 1), `rhythm-pad pad-${color}`);
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
            onFinish(Math.max(40, 100 - mistakes * 15));
            return;
          }
          sequence.push(Math.floor(Math.random() * 4));
          window.setTimeout(showSequence, 650);
        }
      } else {
        mistakes += 1;
        accepting = false;
        inputIndex = 0;
        status.textContent = `RUNDE ${round}/6 · ${mistakes} PATZER`;
        window.setTimeout(showSequence, 650);
      }
    });
    pads.append(pad);
    return pad;
  });
  const flash = (index) => {
    padButtons[index].classList.add("is-lit");
    window.setTimeout(() => padButtons[index]?.classList.remove("is-lit"), 300);
  };
  const showSequence = () => {
    if (stopped) return;
    accepting = false;
    inputIndex = 0;
    status.textContent = `RUNDE ${round}/6 · GUT AUFPASSEN`;
    sequence.forEach((value, index) => window.setTimeout(() => flash(value), 500 * index));
    window.setTimeout(() => {
      if (stopped) return;
      accepting = true;
      status.textContent = `RUNDE ${round}/6 · JETZT DU`;
    }, sequence.length * 500 + 250);
  };
  stage.append(pads);
  onMessage("Psst, die Seerosen spielen uns etwas vor.");
  window.setTimeout(showSequence, 450);
  return () => { stopped = true; };
}

const GAMES = { sparkles: sparkleGame, memory: memoryGame, coffee: coffeeGame, grill: grillGame, route: routeGame, rhythm: rhythmGame };

export function startQuestGame(options) {
  const game = GAMES[options.quest?.game];
  if (!game) throw new Error(`Unbekanntes Questspiel: ${options.quest?.game}`);
  return game(options);
}
