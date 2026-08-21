export const CAPY_WIDTH = 42;
export const CAPY_HEIGHT = 26;

function ellipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

function bodyMask(x, y) {
  const back = ellipse(x, y, 15.5, 14, 14.5, 8.2);
  const shoulder = ellipse(x, y, 25, 13.5, 8.5, 8);
  const head = ellipse(x, y, 31, 10.7, 8.2, 8.1);
  const muzzle = ellipse(x, y, 36.5, 14.1, 5.5, 4.3);
  const ear = ellipse(x, y, 28, 3.7, 3.1, 3.1);
  const rearLeg = x >= 7 && x <= 12 && y >= 17 && y <= 24;
  const frontLeg = x >= 23 && x <= 28 && y >= 17 && y <= 24;
  return back || shoulder || head || muzzle || ear || rearLeg || frontLeg;
}

function isOutline(x, y) {
  if (!bodyMask(x, y)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !bodyMask(x + dx, y + dy));
}

export function capyPixelAt(x, y) {
  if (!bodyMask(x, y)) return ".";
  if ((x === 34 || x === 35) && (y === 8 || y === 9)) return x === 34 && y === 8 ? "g" : "e";
  if ((x === 34 || x === 35) && y === 12) return "b";
  if ((x === 40 || x === 41) && y >= 13 && y <= 15) return "n";
  if (x >= 37 && x <= 40 && y === 17) return "k";
  if (x >= 27 && x <= 29 && y >= 3 && y <= 5) return "i";
  if ((x >= 8 && x <= 11 && y >= 22) || (x >= 24 && x <= 27 && y >= 22)) return "p";
  if (isOutline(x, y)) return "d";
  if (x >= 32 && y >= 11 && y <= 17) return "q";
  if ((y >= 8 && y <= 10 && x >= 8 && x <= 26) || (x >= 27 && x <= 31 && y >= 6 && y <= 8)) return "l";
  if ((x + y) % 13 === 0 && x < 29) return "s";
  return "m";
}

export const CAPY_PIXELS = Object.freeze(
  Array.from({ length: CAPY_HEIGHT }, (_, y) =>
    Array.from({ length: CAPY_WIDTH }, (_, x) => capyPixelAt(x, y)).join(""),
  ),
);
