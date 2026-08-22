export const CAPY_WIDTH = 56;
export const CAPY_HEIGHT = 34;

function ellipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

function bodyMask(x, y) {
  const back = ellipse(x, y, 20.5, 18.4, 19.5, 10.7);
  const shoulder = ellipse(x, y, 33, 17.6, 11.8, 10.5);
  const head = ellipse(x, y, 42.2, 13.8, 10.8, 10.6);
  const muzzle = ellipse(x, y, 50, 18.1, 7.5, 5.7);
  const ear = ellipse(x, y, 37.5, 5.1, 4.1, 3.9);
  const rearLeg = x >= 9 && x <= 15 && y >= 23 && y <= 32;
  const frontLeg = x >= 31 && x <= 37 && y >= 23 && y <= 32;
  return back || shoulder || head || muzzle || ear || rearLeg || frontLeg;
}

function isOutline(x, y) {
  if (!bodyMask(x, y)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !bodyMask(x + dx, y + dy));
}

export function capyPixelAt(x, y) {
  if (!bodyMask(x, y)) return ".";
  if ((x === 45 || x === 46) && (y === 10 || y === 11)) return x === 45 && y === 10 ? "g" : "e";
  if ((x === 45 || x === 46) && (y === 15 || y === 16)) return "b";
  if (x >= 53 && x <= 55 && y >= 17 && y <= 19) return "n";
  if (x >= 49 && x <= 53 && y === 22) return "k";
  if (x >= 36 && x <= 39 && y >= 4 && y <= 7) return "i";
  if ((x >= 10 && x <= 15 && y >= 30) || (x >= 32 && x <= 37 && y >= 30)) return "p";
  if (isOutline(x, y)) return "d";
  if (x >= 43 && y >= 14 && y <= 22) return "q";
  if ((y >= 10 && y <= 12 && x >= 9 && x <= 34) || (x >= 34 && x <= 41 && y >= 8 && y <= 10)) return "l";
  if (ellipse(x, y, 47, 17, 2.6, 2.3)) return "r";
  if ((x + y) % 17 === 0 && x < 39) return "s";
  if ((x * 3 + y) % 23 === 0 && x < 40 && y < 24) return "h";
  return "m";
}

export const CAPY_PIXELS = Object.freeze(
  Array.from({ length: CAPY_HEIGHT }, (_, y) =>
    Array.from({ length: CAPY_WIDTH }, (_, x) => capyPixelAt(x, y)).join(""),
  ),
);
