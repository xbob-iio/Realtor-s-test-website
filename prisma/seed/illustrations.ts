/**
 * Демонстрационные иллюстрации интерьеров — собственная векторная графика
 * (без сторонних фотографий). Используются только seed-скриптом для демо-объектов,
 * чтобы их нельзя было спутать с реальными объявлениями.
 */

export type SceneKind = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'view' | 'workspace';

export interface Palette {
  wall: string;
  side: string;
  ceiling: string;
  floor: string;
  textile: string;
  accent: string;
  wood: string;
  metal: string;
  plant: string;
  art: [string, string];
  sky: 'day' | 'golden' | 'dusk';
}

export const PALETTES: Palette[] = [
  {
    wall: '#ede5d8',
    side: '#e2d6c5',
    ceiling: '#f6f1e9',
    floor: '#c9a27b',
    textile: '#8fa38a',
    accent: '#c9774d',
    wood: '#9b7653',
    metal: '#34363b',
    plant: '#5f7f58',
    art: ['#d9a441', '#3f5e6b'],
    sky: 'golden',
  },
  {
    wall: '#dcdbd7',
    side: '#cfcdc8',
    ceiling: '#ebeae7',
    floor: '#9c8671',
    textile: '#4b5057',
    accent: '#c9774d',
    wood: '#6f5846',
    metal: '#24262a',
    plant: '#4f6f4b',
    art: ['#b85c38', '#e0c9a6'],
    sky: 'dusk',
  },
  {
    wall: '#f3f1ed',
    side: '#e7e3dc',
    ceiling: '#faf9f7',
    floor: '#d9c4a6',
    textile: '#b5c2ca',
    accent: '#2f4858',
    wood: '#b08d6a',
    metal: '#2a2c30',
    plant: '#6b8f62',
    art: ['#e3b04b', '#2f4858'],
    sky: 'day',
  },
  {
    wall: '#f1e0d1',
    side: '#e6cfbb',
    ceiling: '#f8eee5',
    floor: '#b98b69',
    textile: '#c2703f',
    accent: '#365b6d',
    wood: '#8a5e3f',
    metal: '#2e2e30',
    plant: '#56784f',
    art: ['#f2c57c', '#365b6d'],
    sky: 'golden',
  },
  {
    wall: '#e8e5d7',
    side: '#dbd7c5',
    ceiling: '#f2f0e7',
    floor: '#a88c6c',
    textile: '#7c7f55',
    accent: '#b5835a',
    wood: '#7a5a3f',
    metal: '#2f2f2f',
    plant: '#4e6b45',
    art: ['#c47a55', '#ead9b5'],
    sky: 'day',
  },
  {
    wall: '#e4e7e6',
    side: '#d6dad8',
    ceiling: '#f0f2f1',
    floor: '#c4ab8e',
    textile: '#51606b',
    accent: '#d08a5a',
    wood: '#94714f',
    metal: '#26282c',
    plant: '#5c7d5a',
    art: ['#d08a5a', '#8fa5b5'],
    sky: 'dusk',
  },
];

const W = 1600;
const H = 1200;
const BW = { l: 250, r: 1350, t: 170, b: 790 };
const VP = { x: 800, y: 470 };

type Point = [number, number];

// ───────────────────────── утилиты ─────────────────────────

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** amount > 0 — светлее, < 0 — темнее */
function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const k = Math.abs(amount);
  const mix = (channel: number) => Math.round(channel + (target - channel) * k);
  return `#${[mix(r), mix(g), mix(b)].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" ${extra}/>`;
const poly = (points: Point[], fill: string, extra = '') =>
  `<polygon points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="${fill}" ${extra}/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" ${extra}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, width: number, extra = '') =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const shadow = (cx: number, cy: number, rx: number, ry: number, opacity = 0.22) =>
  ellipse(cx, cy, rx, ry, '#000', `opacity="${opacity}" filter="url(#blur)"`);

/** Точка на полу: глубина 0 — у стены, 1 — у нижнего края кадра; u 0..1 — слева направо */
function floorPoint(u: number, depth: number): Point {
  const y = BW.b + depth * (H - BW.b);
  const left = BW.l - (BW.l * (y - BW.b)) / (H - BW.b);
  const right = BW.r + ((W - BW.r) * (y - BW.b)) / (H - BW.b);
  return [left + (right - left) * u, y];
}

const SKY = {
  day: ['#9ec5e0', '#e6f1f7'],
  golden: ['#f0b98a', '#fbe7cf'],
  dusk: ['#7f93bd', '#f2c3a1'],
} as const;

// ───────────────────────── комната ─────────────────────────

function defs(p: Palette): string {
  const [skyTop, skyBottom] = SKY[p.sky];
  return `<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.wall, 0.08)}"/><stop offset="1" stop-color="${shade(p.wall, -0.03)}"/></linearGradient>
  <linearGradient id="sideL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(p.side, -0.1)}"/><stop offset="1" stop-color="${p.side}"/></linearGradient>
  <linearGradient id="sideR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${shade(p.side, -0.12)}"/><stop offset="1" stop-color="${p.side}"/></linearGradient>
  <linearGradient id="ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.ceiling, -0.04)}"/><stop offset="1" stop-color="${p.ceiling}"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.floor, -0.1)}"/><stop offset="1" stop-color="${shade(p.floor, 0.05)}"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8ec" stop-opacity="0.32"/><stop offset="1" stop-color="#fff8ec" stop-opacity="0"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3d6" stop-opacity="0.9"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="blurSm" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <clipPath id="floorClip"><polygon points="0,${H} ${W},${H} ${BW.r},${BW.b} ${BW.l},${BW.b}"/></clipPath>
</defs>`;
}

function roomShell(p: Palette, options: { tiles?: boolean; floorTiles?: boolean } = {}): string {
  const parts: string[] = [];
  parts.push(
    poly(
      [
        [0, 0],
        [W, 0],
        [BW.r, BW.t],
        [BW.l, BW.t],
      ],
      'url(#ceil)',
    ),
  );
  parts.push(
    poly(
      [
        [0, 0],
        [BW.l, BW.t],
        [BW.l, BW.b],
        [0, H],
      ],
      'url(#sideL)',
    ),
  );
  parts.push(
    poly(
      [
        [W, 0],
        [BW.r, BW.t],
        [BW.r, BW.b],
        [W, H],
      ],
      'url(#sideR)',
    ),
  );
  parts.push(rect(BW.l, BW.t, BW.r - BW.l, BW.b - BW.t, 'url(#wall)'));
  parts.push(
    poly(
      [
        [0, H],
        [W, H],
        [BW.r, BW.b],
        [BW.l, BW.b],
      ],
      'url(#floor)',
    ),
  );

  // Доски или плитка пола — линии сходятся в точку схода
  const floorLines: string[] = [];
  if (options.floorTiles) {
    for (let xb = -1600; xb <= 3200; xb += 200) {
      const xt = VP.x + ((xb - VP.x) * (BW.b - VP.y)) / (H - VP.y);
      floorLines.push(line(xb, H, xt, BW.b, shade(p.floor, -0.18), 2, 'opacity="0.55"'));
    }
    for (const depth of [0.08, 0.2, 0.36, 0.58, 0.88]) {
      const [x1, y] = floorPoint(0, depth);
      const [x2] = floorPoint(1, depth);
      floorLines.push(line(x1, y, x2, y, shade(p.floor, -0.18), 2, 'opacity="0.55"'));
    }
  } else {
    for (let xb = -2400; xb <= 4000; xb += 150) {
      const xt = VP.x + ((xb - VP.x) * (BW.b - VP.y)) / (H - VP.y);
      floorLines.push(line(xb, H, xt, BW.b, shade(p.floor, -0.2), 1.6, 'opacity="0.35"'));
    }
  }
  parts.push(`<g clip-path="url(#floorClip)">${floorLines.join('')}</g>`);

  if (options.tiles) {
    const tiles: string[] = [];
    for (let x = BW.l; x <= BW.r; x += 60)
      tiles.push(line(x, BW.t, x, BW.b, shade(p.wall, -0.1), 1.2, 'opacity="0.6"'));
    for (let y = BW.t; y <= BW.b; y += 60)
      tiles.push(line(BW.l, y, BW.r, y, shade(p.wall, -0.1), 1.2, 'opacity="0.6"'));
    parts.push(tiles.join(''));
  }

  // Плинтусы и углы
  parts.push(rect(BW.l, BW.b - 14, BW.r - BW.l, 14, shade(p.wall, -0.1)));
  parts.push(
    poly(
      [
        [0, H],
        [0, H - 26],
        [BW.l, BW.b - 14],
        [BW.l, BW.b],
      ],
      shade(p.side, -0.16),
    ),
  );
  parts.push(
    poly(
      [
        [W, H],
        [W, H - 26],
        [BW.r, BW.b - 14],
        [BW.r, BW.b],
      ],
      shade(p.side, -0.18),
    ),
  );
  parts.push(line(BW.l, BW.t, BW.l, BW.b, shade(p.side, -0.2), 2, 'opacity="0.5"'));
  parts.push(line(BW.r, BW.t, BW.r, BW.b, shade(p.side, -0.2), 2, 'opacity="0.5"'));
  return parts.join('\n');
}

function skyline(x: number, y: number, w: number, h: number, random: () => number, p: Palette): string {
  const parts: string[] = [];
  const far = p.sky === 'dusk' ? '#5f6f93' : p.sky === 'golden' ? '#c79a86' : '#9fb5c6';
  const near = p.sky === 'dusk' ? '#3f4a66' : p.sky === 'golden' ? '#9c776a' : '#7d95a8';
  for (const [color, minH, maxH, step] of [
    [far, 0.25, 0.55, 26],
    [near, 0.12, 0.38, 34],
  ] as const) {
    let cursor = x;
    while (cursor < x + w - 4) {
      // Здания не выходят за пределы стекла
      const bw = Math.min(step + random() * step * 1.6, x + w - cursor);
      const bh = h * (minH + random() * (maxH - minH));
      parts.push(rect(cursor, y + h - bh, bw, bh, color, 'opacity="0.85"'));
      if (p.sky === 'dusk' && color === near) {
        for (let wy = y + h - bh + 10; wy < y + h - 8; wy += 16) {
          for (let wx = cursor + 6; wx < cursor + bw - 8; wx += 12) {
            if (random() > 0.72) parts.push(rect(wx, wy, 5, 7, '#ffd9a0', 'opacity="0.9"'));
          }
        }
      }
      cursor += bw + 2;
    }
  }
  return parts.join('');
}

function windowOnWall(
  x: number,
  y: number,
  w: number,
  h: number,
  random: () => number,
  p: Palette,
  curtains = false,
): string {
  const frame = '#fbfaf8';
  const parts: string[] = [];
  parts.push(rect(x - 14, y - 14, w + 28, h + 28, shade(p.wall, -0.06), 'rx="6"'));
  parts.push(rect(x, y, w, h, 'url(#sky)'));
  parts.push(`<g>${skyline(x, y + h * 0.35, w, h * 0.65, random, p)}</g>`);
  parts.push(
    `<g fill="none" stroke="${frame}" stroke-width="12">${`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`}</g>`,
  );
  parts.push(rect(x + w / 2 - 5, y, 10, h, frame));
  parts.push(rect(x, y + h * 0.38, w, 9, frame));
  parts.push(rect(x - 26, y + h + 6, w + 52, 14, shade(p.wall, 0.4), 'rx="4"'));
  // Луч света на полу
  const [bl] = floorPoint((x - BW.l) / (BW.r - BW.l), 0);
  const [br] = floorPoint((x + w - BW.l) / (BW.r - BW.l), 0);
  const [fl, fy] = floorPoint((x - BW.l) / (BW.r - BW.l) + 0.08, 0.75);
  const [fr] = floorPoint((x + w - BW.l) / (BW.r - BW.l) + 0.22, 0.75);
  parts.push(
    poly(
      [
        [bl, BW.b],
        [br, BW.b],
        [fr, fy],
        [fl, fy],
      ],
      'url(#beam)',
    ),
  );
  if (curtains) {
    const curtain = shade(p.textile, 0.35);
    for (const cx of [x - 70, x + w + 10]) {
      parts.push(rect(cx, y - 40, 60, h + 120, curtain, 'rx="8" opacity="0.95"'));
      for (let fold = 1; fold < 4; fold++)
        parts.push(
          line(cx + fold * 15, y - 30, cx + fold * 15, y + h + 70, shade(curtain, -0.12), 3, 'opacity="0.6"'),
        );
    }
    parts.push(rect(x - 90, y - 50, w + 180, 8, p.metal, 'rx="4"'));
  }
  return parts.join('\n');
}

function plant(x: number, baseY: number, scale: number, p: Palette): string {
  const parts: string[] = [];
  parts.push(shadow(x, baseY + 6, 70 * scale, 16 * scale));
  parts.push(
    poly(
      [
        [x - 48 * scale, baseY - 90 * scale],
        [x + 48 * scale, baseY - 90 * scale],
        [x + 36 * scale, baseY],
        [x - 36 * scale, baseY],
      ],
      p.accent,
    ),
  );
  parts.push(
    rect(x - 52 * scale, baseY - 98 * scale, 104 * scale, 14 * scale, shade(p.accent, -0.12), 'rx="4"'),
  );
  const leaves: [number, number, number][] = [
    [-60, -210, -35],
    [55, -230, 30],
    [-10, -290, -5],
    [-95, -150, -60],
    [95, -165, 58],
    [30, -330, 12],
    [-45, -330, -20],
  ];
  for (const [dx, dy, angle] of leaves) {
    const lx = x + dx * scale;
    const ly = baseY + dy * scale;
    parts.push(line(x, baseY - 90 * scale, lx, ly + 40 * scale, shade(p.plant, -0.25), 4 * scale));
    parts.push(
      ellipse(
        lx,
        ly,
        26 * scale,
        70 * scale,
        shade(p.plant, (dx % 3) * 0.05),
        `transform="rotate(${angle} ${lx.toFixed(1)} ${ly.toFixed(1)})"`,
      ),
    );
  }
  return parts.join('');
}

function floorLamp(x: number, baseY: number, p: Palette): string {
  return [
    shadow(x, baseY + 4, 60, 12),
    ellipse(x, baseY, 42, 10, p.metal),
    line(x, baseY, x, baseY - 420, p.metal, 6),
    ellipse(x, baseY - 470, 160, 160, 'url(#glow)', 'opacity="0.55"'),
    poly(
      [
        [x - 60, baseY - 420],
        [x + 60, baseY - 420],
        [x + 40, baseY - 510],
        [x - 40, baseY - 510],
      ],
      '#f7efe0',
    ),
  ].join('');
}

function pendant(x: number, dropY: number, p: Palette, width = 90): string {
  return [
    line(x, BW.t - 60, x, dropY, p.metal, 3),
    ellipse(x, dropY + 60, 150, 110, 'url(#glow)', 'opacity="0.5"'),
    `<path d="M ${x - width / 2} ${dropY + 40} Q ${x} ${dropY - 30} ${x + width / 2} ${dropY + 40} Z" fill="${p.metal}"/>`,
    ellipse(x, dropY + 40, width / 2, 8, '#fff3d6'),
  ].join('');
}

function artwork(x: number, y: number, w: number, h: number, p: Palette, variant: number): string {
  const parts = [
    rect(x + 6, y + 10, w, h, '#000', 'opacity="0.12" filter="url(#blurSm)"'),
    rect(x, y, w, h, shade(p.wood, -0.25), 'rx="3"'),
    rect(x + 12, y + 12, w - 24, h - 24, '#fbf8f2'),
  ];
  if (variant % 2 === 0) {
    parts.push(ellipse(x + w * 0.42, y + h * 0.45, w * 0.2, w * 0.2, p.art[0]));
    parts.push(rect(x + w * 0.5, y + h * 0.5, w * 0.3, h * 0.3, p.art[1], 'opacity="0.9"'));
  } else {
    parts.push(
      `<path d="M ${x + 24} ${y + h - 30} Q ${x + w * 0.4} ${y + h * 0.2} ${x + w - 24} ${y + h * 0.55}" stroke="${p.art[1]}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    );
    parts.push(ellipse(x + w * 0.7, y + h * 0.32, w * 0.1, w * 0.1, p.art[0]));
  }
  return parts.join('');
}

function sofa(x: number, y: number, w: number, p: Palette): string {
  const base = p.textile;
  const dark = shade(base, -0.14);
  const light = shade(base, 0.1);
  return [
    shadow(x + w / 2, y + 205, w * 0.56, 34, 0.28),
    rect(x, y, w, 120, dark, 'rx="26"'),
    rect(x - 34, y + 50, 78, 150, shade(base, -0.06), 'rx="24"'),
    rect(x + w - 44, y + 50, 78, 150, shade(base, -0.06), 'rx="24"'),
    rect(x + 20, y + 95, w - 40, 105, base, 'rx="20"'),
    rect(x + 36, y + 70, w / 2 - 52, 60, light, 'rx="18"'),
    rect(x + w / 2 + 16, y + 70, w / 2 - 52, 60, light, 'rx="18"'),
    rect(x + 70, y + 26, 90, 70, shade(p.accent, 0.1), `rx="16" transform="rotate(-8 ${x + 115} ${y + 60})"`),
    rect(
      x + w - 170,
      y + 26,
      90,
      70,
      shade(p.art[0], 0.1),
      `rx="16" transform="rotate(7 ${x + w - 125} ${y + 60})"`,
    ),
    rect(x + 10, y + 198, 14, 26, p.metal, 'rx="3"'),
    rect(x + w - 24, y + 198, 14, 26, p.metal, 'rx="3"'),
  ].join('');
}

function coffeeTable(cx: number, cy: number, p: Palette): string {
  return [
    shadow(cx, cy + 70, 200, 26, 0.25),
    line(cx - 120, cy + 10, cx - 130, cy + 72, p.metal, 7),
    line(cx + 120, cy + 10, cx + 130, cy + 72, p.metal, 7),
    line(cx, cy + 16, cx, cy + 80, p.metal, 7),
    ellipse(cx, cy, 190, 36, p.wood),
    ellipse(cx, cy - 6, 190, 32, shade(p.wood, 0.12)),
    rect(cx - 60, cy - 34, 70, 24, p.art[1], 'rx="4"'),
    ellipse(cx + 70, cy - 22, 26, 10, '#fbf8f2'),
    rect(cx + 60, cy - 60, 20, 40, shade(p.accent, -0.05), 'rx="8"'),
  ].join('');
}

function rug(
  p: Palette,
  depthFrom: number,
  depthTo: number,
  uFrom: number,
  uTo: number,
  color: string,
): string {
  const a = floorPoint(uFrom, depthFrom);
  const b = floorPoint(uTo, depthFrom);
  const c = floorPoint(uTo + 0.05, depthTo);
  const d = floorPoint(uFrom - 0.05, depthTo);
  return poly([a, b, c, d], color, `opacity="0.9" stroke="${shade(color, -0.15)}" stroke-width="6"`);
}

function finish(content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${content}<rect width="${W}" height="${H}" fill="url(#vignette)"/></svg>`;
}

// ───────────────────────── сцены ─────────────────────────

function livingScene(p: Palette, random: () => number): string {
  return finish(
    [
      defs(p),
      roomShell(p),
      windowOnWall(320, 260, 300, 400, random, p, true),
      artwork(860, 300, 300, 200, p, 0),
      rug(p, 0.25, 0.78, 0.26, 0.8, shade(p.textile, 0.45)),
      sofa(700, 590, 560, p),
      floorLamp(1330, 950, p),
      plant(230, 1080, 1.15, p),
      coffeeTable(900, 960, p),
      pendant(800, 230, p, 80),
    ].join('\n'),
  );
}

function bedroomScene(p: Palette, random: () => number): string {
  const blanket = shade(p.textile, 0.25);
  return finish(
    [
      defs(p),
      roomShell(p),
      windowOnWall(330, 250, 240, 380, random, p, true),
      artwork(860, 280, 360, 150, p, 1),
      shadow(1000, 1090, 380, 40, 0.3),
      rect(700, 470, 600, 260, shade(p.wood, -0.05), 'rx="22"'),
      rect(720, 490, 560, 220, shade(p.textile, -0.05), 'rx="18"'),
      poly(
        [
          [690, 700],
          [1310, 700],
          [1420, 1010],
          [580, 1010],
        ],
        '#fbfaf7',
      ),
      rect(580, 1010, 840, 70, shade('#fbfaf7', -0.08), 'rx="10"'),
      poly(
        [
          [660, 800],
          [1340, 800],
          [1420, 1010],
          [580, 1010],
        ],
        blanket,
      ),
      rect(580, 1010, 840, 70, shade(blanket, -0.12), 'rx="10"'),
      line(640, 860, 1360, 860, shade(blanket, -0.1), 6, 'opacity="0.7"'),
      rect(760, 640, 230, 90, '#ffffff', 'rx="30"'),
      rect(1010, 640, 230, 90, '#ffffff', 'rx="30"'),
      rect(880, 660, 200, 80, shade(p.accent, 0.15), 'rx="26"'),
      shadow(560, 905, 90, 14),
      rect(480, 770, 150, 130, p.wood, 'rx="10"'),
      rect(490, 830, 130, 6, shade(p.wood, -0.2)),
      line(555, 770, 555, 700, p.metal, 5),
      ellipse(555, 640, 110, 90, 'url(#glow)', 'opacity="0.6"'),
      poly(
        [
          [515, 700],
          [595, 700],
          [580, 640],
          [530, 640],
        ],
        '#f5ecdc',
      ),
      plant(1460, 1100, 0.9, p),
    ].join('\n'),
  );
}

function kitchenScene(p: Palette, random: () => number): string {
  const cabinet = shade(p.wall, 0.35);
  const lower = shade(p.textile, 0.05);
  const counter = shade(p.metal, 0.25);
  const doors: string[] = [];
  for (let x = BW.l + 40; x < BW.r - 60; x += 150) {
    doors.push(rect(x + 4, 214, 142, 160, shade(cabinet, -0.04), 'rx="6"'));
    doors.push(line(x + 120, 330, x + 120, 360, p.metal, 5));
    doors.push(rect(x + 4, 622, 142, 150, shade(lower, -0.06), 'rx="6"'));
    doors.push(line(x + 30, 640, x + 118, 640, p.metal, 5));
  }
  const splash: string[] = [];
  for (let x = BW.l + 40; x < BW.r - 40; x += 44)
    splash.push(line(x, 390, x, 588, shade(p.wall, -0.12), 1.5, 'opacity="0.6"'));
  for (let y = 390; y < 590; y += 22)
    splash.push(line(BW.l + 40, y, BW.r - 40, y, shade(p.wall, -0.12), 1.5, 'opacity="0.6"'));
  void random;
  return finish(
    [
      defs(p),
      roomShell(p),
      rect(BW.l + 40, 200, BW.r - BW.l - 80, 185, cabinet, 'rx="8"'),
      rect(BW.l + 40, 385, BW.r - BW.l - 80, 205, shade(p.wall, 0.25)),
      splash.join(''),
      rect(BW.l + 30, 588, BW.r - BW.l - 60, 26, counter, 'rx="4"'),
      rect(BW.l + 40, 612, BW.r - BW.l - 80, 172, lower),
      doors.join(''),
      poly(
        [
          [900, 200],
          [1080, 200],
          [1110, 300],
          [870, 300],
        ],
        shade(p.metal, 0.35),
      ),
      rect(930, 548, 130, 40, shade(p.metal, 0.1), 'rx="6"'),
      `<path d="M 520 588 L 520 520 Q 520 492 548 492 L 566 492" stroke="${p.metal}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
      plant(400, 588, 0.45, p),
      shadow(800, 1130, 420, 40, 0.3),
      poly(
        [
          [470, 860],
          [1130, 860],
          [1210, 960],
          [390, 960],
        ],
        shade(counter, 0.6),
      ),
      rect(390, 960, 820, 150, p.wood, 'rx="6"'),
      rect(390, 960, 820, 18, shade(p.wood, -0.2)),
      ellipse(700, 895, 70, 20, '#fbf8f2'),
      ellipse(700, 880, 40, 22, p.art[0]),
      ellipse(735, 884, 26, 16, p.accent),
      ...[520, 800, 1080].map((x) =>
        [
          line(x - 40, 1110, x - 50, 1190, p.metal, 6),
          line(x + 40, 1110, x + 50, 1190, p.metal, 6),
          ellipse(x, 1105, 70, 18, shade(p.textile, -0.1)),
        ].join(''),
      ),
      pendant(540, 600, p, 120),
      pendant(800, 620, p, 120),
      pendant(1060, 600, p, 120),
    ].join('\n'),
  );
}

function bathroomScene(p: Palette, random: () => number): string {
  const tileWall = { ...p, wall: shade(p.wall, 0.3) };
  const porcelain = '#fbfbfa';
  void random;
  return finish(
    [
      defs(tileWall),
      roomShell(tileWall, { tiles: true, floorTiles: true }),
      shadow(650, 820, 380, 30, 0.25),
      rect(300, 600, 700, 200, porcelain, 'rx="40"'),
      rect(320, 600, 660, 34, shade(porcelain, -0.05), 'rx="16"'),
      rect(300, 780, 700, 20, shade(porcelain, -0.08), 'rx="6"'),
      `<path d="M 900 600 L 900 540 Q 900 515 925 515 L 950 515" stroke="${p.metal}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
      // Душевая перегородка и лейка над ванной
      rect(310, 300, 16, 300, shade(p.metal, 0.3), 'rx="4"'),
      rect(326, 300, 230, 300, '#dcebf2', 'opacity="0.35"'),
      line(556, 300, 556, 600, '#ffffff', 3, 'opacity="0.7"'),
      line(760, 230, 760, 330, p.metal, 6),
      ellipse(760, 336, 44, 12, p.metal),
      rect(590, 360, 200, 16, shade(p.wall, 0.4), 'rx="4"'),
      rect(610, 318, 26, 42, p.art[0], 'rx="8"'),
      rect(646, 330, 22, 30, shade(p.accent, 0.2), 'rx="6"'),
      rect(678, 312, 30, 48, '#fbf8f2', 'rx="8"'),
      shadow(1180, 820, 180, 20),
      rect(1040, 590, 280, 200, p.wood, 'rx="10"'),
      line(1180, 600, 1180, 780, shade(p.wood, -0.2), 3),
      rect(1030, 568, 300, 26, porcelain, 'rx="8"'),
      ellipse(1180, 580, 70, 12, shade(porcelain, -0.1)),
      line(1180, 540, 1180, 566, p.metal, 8),
      ellipse(1180, 380, 110, 130, shade(p.metal, 0.2)),
      ellipse(1180, 380, 100, 120, '#e9f1f4'),
      ellipse(1150, 340, 30, 50, '#ffffff', 'opacity="0.5"'),
      rect(1330, 380, 16, 30, p.metal),
      ellipse(1338, 360, 60, 50, 'url(#glow)', 'opacity="0.7"'),
      rect(150, 420, 70, 260, shade(p.accent, 0.1), 'rx="10"'),
      line(185, 440, 185, 660, shade(p.accent, -0.1), 4, 'opacity="0.7"'),
      plant(1460, 1110, 0.8, p),
    ].join('\n'),
  );
}

function viewScene(p: Palette, random: () => number): string {
  const parts = [defs(p), roomShell(p)];
  const x = 300;
  const y = 210;
  const w = 1000;
  const h = 540;
  parts.push(rect(x - 16, y - 16, w + 32, h + 32, shade(p.wall, -0.08), 'rx="6"'));
  parts.push(rect(x, y, w, h, 'url(#sky)'));
  parts.push(skyline(x, y + h * 0.3, w, h * 0.55, random, p));
  parts.push(rect(x, y + h * 0.84, w, h * 0.16, p.sky === 'dusk' ? '#6f86ad' : '#9cc2d6', 'opacity="0.85"'));
  parts.push(line(x, y + h * 0.9, x + w, y + h * 0.88, '#ffffff', 3, 'opacity="0.5"'));
  for (let i = 1; i < 4; i++) parts.push(rect(x + (w / 4) * i - 5, y, 10, h, '#f7f6f2'));
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#f7f6f2" stroke-width="14"/>`,
  );
  const [bl] = floorPoint(0.05, 0);
  const [br] = floorPoint(0.95, 0);
  const [fl, fy] = floorPoint(0.2, 0.7);
  const [fr] = floorPoint(1.1, 0.7);
  parts.push(
    poly(
      [
        [bl, BW.b],
        [br, BW.b],
        [fr, fy],
        [fl, fy],
      ],
      'url(#beam)',
    ),
  );
  parts.push(rug(p, 0.3, 0.85, 0.2, 0.75, shade(p.textile, 0.5)));
  // Кресло
  const chair = p.textile;
  parts.push(shadow(560, 1050, 190, 26, 0.3));
  parts.push(rect(420, 760, 280, 200, shade(chair, -0.12), 'rx="60"'));
  parts.push(rect(390, 850, 340, 150, chair, 'rx="48"'));
  parts.push(rect(430, 870, 260, 60, shade(chair, 0.12), 'rx="26"'));
  parts.push(line(430, 995, 420, 1050, p.metal, 7));
  parts.push(line(690, 995, 700, 1050, p.metal, 7));
  // Столик с кофе
  parts.push(shadow(850, 1030, 90, 14));
  parts.push(line(850, 930, 850, 1025, p.metal, 6));
  parts.push(ellipse(850, 930, 80, 18, p.wood));
  parts.push(rect(830, 890, 34, 36, '#fbf8f2', 'rx="8"'));
  parts.push(plant(1300, 1090, 1.05, p));
  return finish(parts.join('\n'));
}

function workspaceScene(p: Palette, random: () => number): string {
  const books: string[] = [];
  let bx = 870;
  const colors = [p.accent, p.art[0], p.art[1], p.textile, shade(p.wood, 0.2)];
  for (let i = 0; i < 12; i++) {
    const bw = 18 + random() * 16;
    const bh = 60 + random() * 30;
    books.push(rect(bx, 400 - bh, bw, bh, colors[i % colors.length]!, 'rx="3"'));
    bx += bw + 3;
  }
  return finish(
    [
      defs(p),
      roomShell(p),
      windowOnWall(330, 250, 260, 400, random, p, false),
      rect(850, 400, 420, 16, p.wood, 'rx="4"'),
      books.join(''),
      rect(850, 250, 420, 14, p.wood, 'rx="4"'),
      plant(1180, 250, 0.35, p),
      shadow(1000, 1000, 360, 34, 0.28),
      rect(720, 700, 560, 22, p.wood, 'rx="6"'),
      line(750, 720, 740, 990, p.metal, 8),
      line(1250, 720, 1260, 990, p.metal, 8),
      rect(900, 520, 260, 160, p.metal, 'rx="10"'),
      rect(910, 530, 240, 140, shade(p.art[1], 0.35)),
      rect(1010, 680, 40, 22, p.metal),
      rect(760, 668, 120, 34, shade(p.metal, 0.3), 'rx="6"'),
      line(1180, 700, 1210, 600, p.metal, 5),
      poly(
        [
          [1185, 600],
          [1245, 600],
          [1230, 570],
          [1200, 570],
        ],
        p.accent,
      ),
      ellipse(1215, 640, 90, 70, 'url(#glow)', 'opacity="0.5"'),
      shadow(980, 1120, 150, 20),
      rect(880, 850, 220, 170, shade(p.textile, -0.08), 'rx="40"'),
      rect(860, 980, 260, 60, p.textile, 'rx="24"'),
      line(990, 1040, 990, 1110, p.metal, 8),
      line(930, 1120, 1050, 1120, p.metal, 8),
      plant(260, 1080, 1, p),
    ].join('\n'),
  );
}

const SCENES: Record<SceneKind, (p: Palette, random: () => number) => string> = {
  living: livingScene,
  bedroom: bedroomScene,
  kitchen: kitchenScene,
  bathroom: bathroomScene,
  view: viewScene,
  workspace: workspaceScene,
};

export const SCENE_LABELS: Record<SceneKind, string> = {
  living: 'гостиная',
  bedroom: 'спальня',
  kitchen: 'кухня',
  bathroom: 'ванная комната',
  view: 'вид из окна',
  workspace: 'рабочее место',
};

export function renderScene(kind: SceneKind, palette: Palette, seed: number): string {
  return SCENES[kind](palette, mulberry32(seed));
}
