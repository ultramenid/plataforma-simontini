/* Simontini — demo alert dataset + procedural before/after imagery.
   Ported faithfully from the original data.js. TypeScript-typed.
   ponytail: static demo data; swap ALERTS for a GeoJSON API feed when backend exists. */

import { LngLatBounds, type StyleSpecification } from "maplibre-gl";

import type {
  Alert,
  AlertBase,
  AlertFeatureCollection,
  CrossingType,
  Filters,
  Polygon,
  Severity,
} from "@/lib/types";

function mulberry32(seedState: number) {
  return function () {
    seedState |= 0;
    seedState = (seedState + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Irregular polygon around a center point, roughly `km` across.
function makePoly(
  lng: number,
  lat: number,
  seed: number,
  km: number,
): number[][][] {
  const randomFn = mulberry32(seed);
  const vertexCount = 9 + Math.floor(randomFn() * 4);
  const rBase = km / 2 / 111; // degrees
  const ring: number[][] = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const radius = rBase * (0.55 + randomFn() * 0.9);
    ring.push([
      +(lng + (Math.cos(angle) * radius) / Math.cos((lat * Math.PI) / 180)).toFixed(5),
      +(lat + Math.sin(angle) * radius).toFixed(5),
    ]);
  }
  ring.push(ring[0]);
  return [ring];
}

// Project a lon/lat polygon ring onto a 640x400 canvas, centered and padded.
function polyPath(ring: number[][], pad = 0.15): string {
  const canvasWidth = 640,
    canvasHeight = 400;
  const lngs = ring.map((coord) => coord[0]),
    lats = ring.map((coord) => coord[1]);
  const minX = Math.min(...lngs),
    maxX = Math.max(...lngs);
  const minY = Math.min(...lats),
    maxY = Math.max(...lats);
  const contentWidth = maxX - minX,
    contentHeight = maxY - minY;
  const padX = contentWidth * pad,
    padY = contentHeight * pad;
  const boxWidth = contentWidth + padX * 2,
    boxHeight = contentHeight + padY * 2;
  // preserve aspect ratio, fit inside canvas
  const scale = Math.min(canvasWidth / boxWidth, canvasHeight / boxHeight);
  const offX = (canvasWidth - contentWidth * scale) / 2 - minX * scale;
  const offY = (canvasHeight - contentHeight * scale) / 2 - minY * scale;
  const flipY = (y: number) => canvasHeight - (y * scale + offY);
  return (
    ring
      .map(
        (coord, i) =>
          `${i ? "L" : "M"}${(coord[0] * scale + offX).toFixed(1)} ${flipY(coord[1]).toFixed(1)}`,
      )
      .join(" ") + " Z"
  );
}

// Procedural "satellite" tile. Deterministic per alert.
function satSVG(
  seed: number,
  cleared: boolean,
  alertGeometry: Polygon,
): string {
  const randomFn = mulberry32(seed * 11 + (cleared ? 997 : 0));
  const canvasWidth = 640,
    canvasHeight = 400;

  const riverY0 = canvasHeight * (0.25 + randomFn() * 0.4);
  const riverControl = canvasWidth * (0.25 + randomFn() * 0.3);
  const riverPath = `M-20 ${riverY0.toFixed(0)} C ${riverControl.toFixed(0)} ${(riverY0 + 55).toFixed(0)} ${(canvasWidth - riverControl).toFixed(0)} ${(riverY0 - 50).toFixed(0)} ${canvasWidth + 20} ${(riverY0 + 10).toFixed(0)}`;

  const base = cleared ? "#4a3b28" : "#122b1a";
  const greens = [
    "#153d20",
    "#1b4f28",
    "#1f5a2d",
    "#236636",
    "#114221",
    "#0f3a1c",
    "#1a4d26",
    "#2a6840",
    "#1c5027",
    "#2d5f35",
  ];
  const browns = [
    "#6d5134",
    "#7e6040",
    "#5c432b",
    "#8a6d4b",
    "#4f3a25",
    "#705336",
    "#61472e",
    "#7a5c3d",
    "#553d27",
    "#6b4f33",
  ];
  const scars = ["#372716", "#422c1a", "#51351f", "#2e2115"];

  const patchCount = cleared ? 32 : 70;
  let patches = "";
  for (let i = 0; i < patchCount; i++) {
    const cx = randomFn() * canvasWidth,
      cy = randomFn() * canvasHeight;
    const baseRadius = 18 + randomFn() * 55;
    const points: number[][] = [];
    const vertexCount = 7 + Math.floor(randomFn() * 5);
    for (let j = 0; j < vertexCount; j++) {
      const angle = (j / vertexCount) * Math.PI * 2;
      const radius = baseRadius * (0.55 + randomFn() * 0.75);
      points.push([
        +(cx + Math.cos(angle) * radius).toFixed(1),
        +(cy + Math.sin(angle) * radius).toFixed(1),
      ]);
    }
    const pathData =
      points.map((point, i) => (i ? "L" : "M") + point.join(",")).join(" ") + " Z";
    const palette = cleared
      ? randomFn() < 0.22
        ? greens
        : randomFn() < 0.18
          ? scars
          : browns
      : greens;
    const fill = palette[Math.floor(randomFn() * palette.length)];
    const op = cleared
      ? (0.35 + randomFn() * 0.45).toFixed(2)
      : (0.4 + randomFn() * 0.45).toFixed(2);
    patches += `<path d="${pathData}" fill="${fill}" opacity="${op}" style="mix-blend-mode:multiply"/>`;
  }

  let water = `<path d="${riverPath}" stroke="#2f4b52" stroke-width="12" fill="none" opacity="0.9"/>`;
  water += `<path d="${riverPath}" stroke="#385b63" stroke-width="6" fill="none" opacity="0.8"/>`;

  let roads = "";
  const roadCount = cleared ? 9 : 1;
  for (let i = 0; i < roadCount; i++) {
    let x = randomFn() * canvasWidth,
      y = randomFn() * canvasHeight;
    let pathData = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    const segs = 6 + Math.floor(randomFn() * 6);
    for (let j = 0; j < segs; j++) {
      x += (randomFn() - 0.5) * 110;
      y += (randomFn() - 0.3) * 80;
      pathData += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    roads += `<path d="${pathData}" stroke="#cbb07e" stroke-width="${cleared ? (1.2 + randomFn() * 1.8).toFixed(1) : 1}" fill="none" opacity="${cleared ? 0.75 : 0.35}" stroke-linecap="round"/>`;
    if (cleared && randomFn() < 0.5) {
      roads += `<path d="${pathData}" stroke="#8f7650" stroke-width="${(2 + randomFn() * 2).toFixed(1)}" fill="none" opacity="0.25" stroke-linecap="round" transform="translate(2,2)"/>`;
    }
  }

  let burns = "";
  if (cleared) {
    for (let i = 0; i < 4; i++) {
      const cx = randomFn() * canvasWidth,
        cy = randomFn() * canvasHeight,
        radius = 20 + randomFn() * 35;
      burns += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${radius.toFixed(0)}" ry="${(radius * 0.6).toFixed(0)}" fill="#2a1d10" opacity="${(0.25 + randomFn() * 0.35).toFixed(2)}"/>`;
    }
  }

  // Alert polygon overlay so before/after clearly frames the loss.
  let overlay = "";
  if (alertGeometry) {
    const polyPathStr = polyPath(alertGeometry.coordinates[0]);
    overlay = `<path d="${polyPathStr}" fill="none" stroke="#ff5c39" stroke-width="2.5" stroke-linejoin="round"/>`;
    overlay += `<path d="${polyPathStr}" fill="#ff5c39" opacity="0.12"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
    <defs>
      <filter
      id="n${seed}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${(0.008 + randomFn() * 0.007).toFixed(4)}" numOctaves="4" seed="${Math.floor(randomFn() * 99)}" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
        <feComponentTransfer in="gray" result="contrast">
          <feFuncA type="linear" slope="0.35" intercept="-0.05"/>
        </feComponentTransfer>
        <feComposite operator="in" in="contrast" in2="SourceGraphic" result="textured"/>
        <feBlend mode="overlay" in="textured" in2="SourceGraphic"/>
      </filter>
    </defs>
    <rect width="${canvasWidth}" height="${canvasHeight}" fill="${base}"/>
    <g filter="url(#n${seed})">${water}${patches}${roads}${burns}</g>
    ${overlay}
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const RAW_ALERTS: AlertBase[] = [
  {
    id: "ID-RIAU-2481",
    country: "Indonesia",
    region: "Riau, Sumatra",
    province: "Riau",
    district: "Pelalawan",
    island: "Sumatra",
    lng: 101.62,
    lat: 0.48,
    km: 9,
    date: "2026-06-28",
    publishedDate: "2026-07-02",
    ha: 412,
    severity: "high",
    driver: "Industrial oil palm",
    confidence: 0.94,
    source: "Sentinel-2 / GLAD-L",
    originalSource: "GLAD-L",
    crosscut: [
      {
        type: "concession",
        name: "PT Andalan Sawit Lestari (palm oil, HGU 214/2019)",
        ha: 412,
      },
      {
        type: "protected",
        name: "Tesso Nilo National Park buffer zone — 1.8 km overlap",
        ha: 48,
      },
      {
        type: "community",
        name: "Desa Lubuk Kembang Bunga customary claim",
        ha: 412,
      },
    ],
    crossings: [
      { type: "province", name: "Riau", ha: 412 },
      { type: "district", name: "Pelalawan", ha: 412 },
      { type: "island", name: "Sumatra", ha: 412 },
      { type: "watershed", name: "Tesso Nilo - Batang Kumu", ha: 196 },
    ],
    story: {
      title: "The buffer that keeps shrinking",
      body: [
        "Tesso Nilo lost more than half its lowland forest in twenty years, and the clearing detected on 28 June follows the same script: canals first, then roads, then fire. This alert sits 1.8 kilometres inside the park’s designated buffer, on land the concession maps as “plasma” smallholder allocation.",
        "Field partners report excavators entering from the northeast logging road on 21 June. The cleared block aligns with a 2024 permit-extension request that was never approved by the provincial land office.",
        "If the pattern holds, burning follows land clearing within six to ten weeks — well inside this year’s dry season window.",
      ],
    },
    media: [
      {
        outlet: "Mongabay",
        title:
          "Clearing detected inside Tesso Nilo buffer as dry season approaches",
        url: "https://news.mongabay.com/2026/07/tesso-nilo-buffer-clearing",
        date: "2026-07-04",
        excerpt:
          "Satellite alerts show 400+ hectares cleared inside the park’s buffer zone, on land mapped as smallholder allocation.",
      },
      {
        outlet: "Tempo",
        title: "Izin diperluas tanpa persetujuan, hutan penyangga Tesso Nilo dibuka",
        url: "https://www.tempo.co/lingkungan/tesso-nilo-2026",
        date: "2026-07-05",
      },
      {
        outlet: "Eyes on the Forest",
        title: "Field investigation: excavators enter from northeast logging road",
        url: "https://eyesontheforest.or.id/reports/tesso-nilo-june-2026",
        date: "2026-06-30",
        excerpt:
          "Investigators documented heavy machinery and fresh canal works matching the alert footprint.",
      },
    ],
  },
  {
    id: "ID-KALTENG-2456",
    country: "Indonesia",
    region: "Central Kalimantan",
    province: "Central Kalimantan",
    district: "Kotawaringin Timur",
    island: "Kalimantan",
    lng: 113.42,
    lat: -2.11,
    km: 12,
    date: "2026-06-25",
    publishedDate: "2026-06-29",
    ha: 655,
    severity: "high",
    driver: "Peatland conversion",
    confidence: 0.91,
    source: "Sentinel-1 radar",
    originalSource: "Sentinel-1",
    crosscut: [
      { type: "concession", name: "PT Borneo Agro Makmur (palm oil)", ha: 655 },
      {
        type: "moratorium",
        name: "Peatland moratorium map (PIPPIB rev. XXVI) — full overlap",
        ha: 655,
      },
    ],
    crossings: [
      { type: "province", name: "Central Kalimantan", ha: 655 },
      { type: "district", name: "Kotawaringin Timur", ha: 655 },
      { type: "island", name: "Kalimantan", ha: 655 },
      { type: "watershed", name: "Kahayan - Sebangau", ha: 655 },
    ],
    story: {
      title: "Draining the dome",
      body: [
        "Radar picked up canal excavation across a peat dome mapped at over four metres deep. Conversion here releases carbon for decades regardless of what is planted on top.",
        "The block lies entirely inside the national peatland moratorium map, which should bar any new licensing. The company holds a location permit issued by the district before the moratorium — a loophole contested in court since 2023.",
      ],
    },
    media: [
      {
        outlet: "BBC Indonesia",
        title: "Kanal baru membelah kubah gambut di Kotawaringin Timur",
        url: "https://www.bbc.com/indonesia/articles/kubah-gambut-2026",
        date: "2026-07-01",
        excerpt:
          "Citra radar menunjukkan penggalian kanal di kawasan moratorium gambut nasional.",
      },
      {
        outlet: "Pantau Gambut",
        title: "PIPPIB violation flagged: full-overlap conversion on deep peat",
        url: "https://pantaugambut.id/kabar/kotim-pippib-2026",
        date: "2026-06-30",
      },
    ],
  },
  {
    id: "ID-PAPUA-2390",
    country: "Indonesia",
    region: "Boven Digoel, South Papua",
    province: "South Papua",
    district: "Boven Digoel",
    island: "New Guinea",
    lng: 140.42,
    lat: -5.9,
    km: 14,
    date: "2026-06-19",
    publishedDate: "2026-06-24",
    ha: 1240,
    severity: "high",
    driver: "Industrial oil palm",
    confidence: 0.96,
    source: "Planet / RADD",
    originalSource: "RADD",
    crosscut: [
      {
        type: "concession",
        name: "Tanah Merah project block D (contested permits)",
        ha: 1240,
      },
      {
        type: "community",
        name: "Auyu indigenous territory — active FPIC dispute",
        ha: 1240,
      },
    ],
    crossings: [
      { type: "province", name: "South Papua", ha: 1240 },
      { type: "district", name: "Boven Digoel", ha: 1240 },
      { type: "island", name: "New Guinea", ha: 1240 },
      { type: "watershed", name: "Digul - Bian", ha: 892 },
    ],
    story: {
      title: "The last frontier forest",
      body: [
        "This is the largest single alert in the network this quarter: 1,240 hectares of primary forest inside the contested Tanah Merah project. Papua holds a third of Indonesia’s remaining rainforest, and Boven Digoel is its fastest-moving frontier.",
        "Auyu clans have petitioned since 2022 for the permits to be revoked, arguing consent was never given. Clearing accelerated after a 2025 appellate ruling returned two of seven blocks to the developer.",
      ],
    },
    media: [
      {
        outlet: "The Gecko Project",
        title: "Tanah Merah block D clearing resumes after appellate ruling",
        url: "https://thegeckoproject.org/tanah-merah-block-d-2026",
        date: "2026-06-27",
        excerpt:
          "The contested mega-plantation moves into primary forest claimed by Auyu clans, despite an unresolved FPIC dispute.",
      },
      {
        outlet: "Jubi",
        title: "Marga Auyu tolak pembukaan hutan adat di Boven Digoel",
        url: "https://jubi.id/tanah-papua/auyu-boven-digoel-2026",
        date: "2026-06-26",
      },
      {
        outlet: "Mongabay",
        title: "Largest deforestation alert of the quarter hits Papua frontier",
        url: "https://news.mongabay.com/2026/06/papua-frontier-alert",
        date: "2026-06-29",
      },
    ],
  },
  {
    id: "MY-SARAWAK-1877",
    country: "Malaysia",
    region: "Baram, Sarawak",
    province: "Sarawak",
    district: "Baram",
    island: "Borneo",
    lng: 114.38,
    lat: 3.24,
    km: 7,
    date: "2026-06-22",
    publishedDate: "2026-06-26",
    ha: 289,
    severity: "medium",
    driver: "Selective logging",
    confidence: 0.83,
    source: "Sentinel-2 / GLAD-L",
    originalSource: "GLAD-L",
    crosscut: [
      {
        type: "concession",
        name: "Samling-linked FMU T/0413 (timber)",
        ha: 289,
      },
      {
        type: "community",
        name: "Penan community mapping area, Upper Baram",
        ha: 289,
      },
    ],
    crossings: [
      { type: "province", name: "Sarawak", ha: 289 },
      { type: "district", name: "Baram", ha: 289 },
      { type: "island", name: "Borneo", ha: 289 },
      { type: "watershed", name: "Baram River", ha: 289 },
    ],
    story: null,
  },
  {
    id: "MY-SABAH-1904",
    country: "Malaysia",
    region: "Kinabatangan, Sabah",
    province: "Sabah",
    district: "Kinabatangan",
    island: "Borneo",
    lng: 117.95,
    lat: 5.42,
    km: 5,
    date: "2026-06-30",
    publishedDate: "2026-07-03",
    ha: 96,
    severity: "medium",
    driver: "Smallholder expansion",
    confidence: 0.77,
    source: "Sentinel-2",
    originalSource: "Sentinel-2",
    crosscut: [
      {
        type: "protected",
        name: "Kinabatangan Wildlife Sanctuary corridor — 400 m gap",
        ha: 0,
      },
    ],
    crossings: [
      { type: "province", name: "Sabah", ha: 96 },
      { type: "district", name: "Kinabatangan", ha: 96 },
      { type: "island", name: "Borneo", ha: 96 },
      { type: "watershed", name: "Kinabatangan River", ha: 96 },
    ],
    story: null,
  },
  {
    id: "TH-NAN-0912",
    country: "Thailand",
    region: "Nan Province",
    province: "Nan",
    district: "Na Noi",
    island: null,
    lng: 100.91,
    lat: 19.02,
    km: 4,
    date: "2026-06-15",
    publishedDate: "2026-06-19",
    ha: 58,
    severity: "low",
    driver: "Maize rotation",
    confidence: 0.71,
    source: "Sentinel-2",
    originalSource: "Sentinel-2",
    crosscut: [
      {
        type: "protected",
        name: "Doi Phu Kha National Park boundary — adjacent",
        ha: 0,
      },
    ],
    crossings: [
      { type: "province", name: "Nan", ha: 58 },
      { type: "district", name: "Na Noi", ha: 58 },
      { type: "watershed", name: "Nan River", ha: 42 },
    ],
    story: null,
  },
  {
    id: "LA-ATTAPEU-0654",
    country: "Laos",
    region: "Attapeu Province",
    province: "Attapeu",
    district: "Sanamxay",
    island: null,
    lng: 107.05,
    lat: 14.61,
    km: 8,
    date: "2026-06-26",
    publishedDate: "2026-06-30",
    ha: 340,
    severity: "high",
    driver: "Rubber / agribusiness",
    confidence: 0.88,
    source: "Sentinel-1 radar",
    originalSource: "Sentinel-1",
    crosscut: [
      {
        type: "concession",
        name: "Viet-Lao rubber ELC 2016/34 (expired 2024)",
        ha: 340,
      },
      { type: "protected", name: "Dong Ampham NBCA — 3.1 km overlap", ha: 112 },
    ],
    crossings: [
      { type: "province", name: "Attapeu", ha: 340 },
      { type: "district", name: "Sanamxay", ha: 340 },
      { type: "protected", name: "Dong Ampham NBCA", ha: 112 },
      { type: "watershed", name: "Xe Kong", ha: 340 },
    ],
    story: {
      title: "Clearing on an expired lease",
      body: [
        "The economic land concession covering this block expired in December 2024 and was never renewed, yet radar shows steady clearing through the 2026 wet season — a pattern auditors call “ghost concession” expansion.",
        "A third of the alert footprint falls inside Dong Ampham, one of the least-surveyed protected areas in the Annamites.",
      ],
    },
    media: [
      {
        outlet: "Radio Free Asia",
        title: "Ghost concession keeps clearing forest in Attapeu after lease expiry",
        url: "https://www.rfa.org/english/laos/attapeu-concession-2026",
        date: "2026-07-02",
        excerpt:
          "Villagers say company machinery never left after the 2024 expiry of the economic land concession.",
      },
    ],
  },
  {
    id: "KH-MONDULKIRI-0788",
    country: "Cambodia",
    region: "Mondulkiri Province",
    province: "Mondulkiri",
    district: "Oraing",
    island: null,
    lng: 107.19,
    lat: 12.78,
    km: 6,
    date: "2026-06-20",
    publishedDate: "2026-06-24",
    ha: 214,
    severity: "medium",
    driver: "Cashew conversion",
    confidence: 0.8,
    source: "Planet / RADD",
    originalSource: "RADD",
    crosscut: [
      {
        type: "protected",
        name: "Keo Seima Wildlife Sanctuary — core zone",
        ha: 214,
      },
      {
        type: "community",
        name: "Bunong indigenous communal land title (ICT) pending",
        ha: 214,
      },
    ],
    crossings: [
      { type: "province", name: "Mondulkiri", ha: 214 },
      { type: "district", name: "Oraing", ha: 214 },
      { type: "protected", name: "Keo Seima WS", ha: 214 },
      { type: "watershed", name: "Srepok River", ha: 214 },
    ],
    story: null,
  },
  {
    id: "VN-DAKLAK-0432",
    country: "Vietnam",
    region: "Đắk Lắk, Central Highlands",
    province: "Đắk Lắk",
    district: "Ea Kar",
    island: null,
    lng: 108.12,
    lat: 12.9,
    km: 4,
    date: "2026-06-12",
    publishedDate: "2026-06-16",
    ha: 61,
    severity: "low",
    driver: "Coffee expansion",
    confidence: 0.69,
    source: "Sentinel-2",
    originalSource: "Sentinel-2",
    crosscut: [
      {
        type: "concession",
        name: "State forest enterprise Ea So — management contract",
        ha: 61,
      },
    ],
    crossings: [
      { type: "province", name: "Đắk Lắk", ha: 61 },
      { type: "district", name: "Ea Kar", ha: 61 },
      { type: "watershed", name: "Srepok - Krông Ana", ha: 61 },
    ],
    story: null,
  },
  {
    id: "MM-SAGAING-1121",
    country: "Myanmar",
    region: "Sagaing Region",
    province: "Sagaing",
    district: "Kani",
    island: null,
    lng: 95.31,
    lat: 23.72,
    km: 7,
    date: "2026-06-24",
    publishedDate: "2026-06-28",
    ha: 305,
    severity: "high",
    driver: "Illegal logging",
    confidence: 0.86,
    source: "Sentinel-1 radar",
    originalSource: "Sentinel-1",
    crosscut: [
      {
        type: "concession",
        name: "No registered concession — unlicensed extraction",
        ha: 305,
      },
      {
        type: "protected",
        name: "Alaungdaw Kathapa National Park — 2.4 km overlap",
        ha: 92,
      },
    ],
    crossings: [
      { type: "province", name: "Sagaing", ha: 305 },
      { type: "district", name: "Kani", ha: 305 },
      { type: "protected", name: "Alaungdaw Kathapa NP", ha: 92 },
      { type: "watershed", name: "Chindwin River", ha: 305 },
    ],
    story: null,
  },
  {
    id: "PH-PALAWAN-0587",
    country: "Philippines",
    region: "Southern Palawan",
    province: "Palawan",
    district: "Brooke's Point",
    island: "Palawan",
    lng: 117.62,
    lat: 8.92,
    km: 5,
    date: "2026-06-27",
    publishedDate: "2026-07-01",
    ha: 142,
    severity: "medium",
    driver: "Nickel mining",
    confidence: 0.84,
    source: "Planet / RADD",
    originalSource: "RADD",
    crosscut: [
      {
        type: "concession",
        name: "MPSA 128-2023 nickel tenement (Brooke's Point)",
        ha: 142,
      },
      {
        type: "protected",
        name: "Mt. Mantalingahan Protected Landscape — buffer",
        ha: 0,
      },
      {
        type: "community",
        name: "Pala'wan ancestral domain CADT R4-BRP-0912",
        ha: 142,
      },
    ],
    crossings: [
      { type: "province", name: "Palawan", ha: 142 },
      { type: "district", name: "Brooke's Point", ha: 142 },
      { type: "island", name: "Palawan", ha: 142 },
      { type: "watershed", name: "Mantalingahan watershed", ha: 142 },
    ],
    story: {
      title: "Ore under the watershed",
      body: [
        "Test pits and haul-road clearing appeared across 142 hectares of the Mantalingahan buffer, upstream of irrigation systems that feed Brooke’s Point rice farms.",
        "The tenement overlaps a titled ancestral domain; the NCIP certification the permit relies on is under review after community petitions in late 2025.",
      ],
    },
    media: [
      {
        outlet: "Rappler",
        title: "Nickel test pits appear upstream of Brooke’s Point rice farms",
        url: "https://www.rappler.com/environment/palawan-nickel-2026",
        date: "2026-07-03",
        excerpt:
          "Residents fear siltation of irrigation systems fed by the Mantalingahan watershed.",
      },
      {
        outlet: "Palawan News",
        title: "NCIP review of MPSA 128-2023 certification still pending",
        url: "https://palawan-news.com/mpsa-128-review-2026",
        date: "2026-06-30",
      },
    ],
  },
  {
    id: "ID-ACEH-2502",
    country: "Indonesia",
    region: "Leuser Ecosystem, Aceh",
    province: "Aceh",
    district: "Southeast Aceh",
    island: "Sumatra",
    lng: 97.71,
    lat: 3.71,
    km: 5,
    date: "2026-07-02",
    publishedDate: "2026-07-06",
    ha: 121,
    severity: "medium",
    driver: "Road construction",
    confidence: 0.82,
    source: "Sentinel-2 / GLAD-L",
    originalSource: "GLAD-L",
    crosscut: [
      {
        type: "protected",
        name: "Leuser Ecosystem (KEL) — inside strategic area",
        ha: 121,
      },
      {
        type: "concession",
        name: "Provincial road project segment IX (unassessed)",
        ha: 121,
      },
    ],
    crossings: [
      { type: "province", name: "Aceh", ha: 121 },
      { type: "district", name: "Southeast Aceh", ha: 121 },
      { type: "island", name: "Sumatra", ha: 121 },
      { type: "watershed", name: "Tripa - Alas", ha: 121 },
    ],
    story: null,
  },
];

export const ALERTS: Alert[] = RAW_ALERTS.map((alert) => {
  const seed = Number(alert.id.split("-").pop()) || 0;
  const geometry: Polygon = {
    type: "Polygon",
    coordinates: makePoly(alert.lng, alert.lat, seed, alert.km),
  };
  return {
    ...alert,
    geometry,
    before: satSVG(seed, false, geometry),
    after: satSVG(seed, true, geometry),
  };
});

export const ALERTS_GEOJSON: AlertFeatureCollection = {
  type: "FeatureCollection",
  features: ALERTS.map((alert) => ({
    type: "Feature" as const,
    id: alert.id,
    properties: {
      id: alert.id,
      severity: alert.severity,
      country: alert.country,
      ha: alert.ha,
      date: alert.date,
    },
    geometry: alert.geometry,
  })),
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  high: "#ff5c39",
  medium: "#ffb02e",
  low: "#f2e04d",
};

export const CROSSING_COLOR: Record<CrossingType, string> = {
  watershed: "#4aa8ff",
  province: "#ff5c39",
  district: "#ffb02e",
  island: "#63b96b",
  protected: "#63b96b",
  concession: "#ff5c39",
  community: "#ffb02e",
  moratorium: "#7fc7ff",
};

export const ALERT_COLOR = "#ff5c39";

const LIGHT_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
      tileSize: 256,
      attribution: "© CARTO - SIMONTINI",
    },
  },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

const DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
      tileSize: 256,
      attribution: "© CARTO - SIMONTINI",
    },
  },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

export const BASEMAP = {
  light: {
    style: LIGHT_STYLE,
    attribution: "© CARTO · demo alerts are illustrative",
  },
  dark: {
    style: DARK_STYLE,
    attribution: "© CARTO · demo alerts are illustrative",
  },
  sat: {
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Imagery © Esri — demo alerts are illustrative",
  },
} as const;

/** Map tiles follow the resolved UI theme; `BasemapKey` only toggles Map vs Satellite. */
export const BASEMAP_FOR_THEME = (theme: "light" | "dark"): StyleSpecification =>
  theme === "dark" ? BASEMAP.dark.style : BASEMAP.light.style;

const MIN_DATE = new Date("2021-12-01");

/** Parse a "YYYY-MM-DD" alert date string to a local Date (avoids UTC drift). */
function parseAlertDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

function monthIdx(dateStr: string): number {
  const date = parseAlertDate(dateStr);
  return (
    (date.getFullYear() - MIN_DATE.getFullYear()) * 12 +
    (date.getMonth() - MIN_DATE.getMonth())
  );
}

export const MAX_MONTH = ALERTS.length
  ? Math.max(
      ...ALERTS.map((alert) =>
        Math.max(monthIdx(alert.date), monthIdx(alert.publishedDate)),
      ),
    )
  : 0;

export const HA_MIN = 0;
export const HA_MAX = 1300;

export function monthFromIdx(monthIndex: number): string {
  const date = new Date(MIN_DATE);
  date.setMonth(date.getMonth() + monthIndex);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function getAlert(id: string | null | undefined): Alert | undefined {
  if (!id) return undefined;
  return ALERTS.find((alert) => alert.id === id);
}

function haversineKm(first: Alert, second: Alert): number {
  const earthRadiusKm = 6371;
  const rad = Math.PI / 180;
  const dLat = (second.lat - first.lat) * rad;
  const dLng = (second.lng - first.lng) * rad;
  const haversineCore =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(first.lat * rad) * Math.cos(second.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineCore));
}

export interface RelatedAlert {
  alert: Alert;
  relation: string;
  km: number;
}

/** Other alerts ranked by shared administrative level (district > province >
    country), ties broken by distance. */
export function relatedAlerts(alert: Alert, max = 3): RelatedAlert[] {
  return ALERTS.filter((other) => other.id !== alert.id)
    .map((other) => {
      const km = haversineKm(alert, other);
      const rank =
        other.district && other.district === alert.district && other.province === alert.province
          ? 0
          : other.province && other.province === alert.province
            ? 1
            : other.country === alert.country
              ? 2
              : 3;
      let relation: string;
      switch (rank) {
        case 0:
          relation = `Same district · ${other.district}`;
          break;
        case 1:
          relation = `Same province · ${other.province}`;
          break;
        case 2:
          relation = `Same country · ${other.country}`;
          break;
        default:
          relation = `${Math.round(km)} km away`;
      }
      return { alert: other, relation, km, rank };
    })
    .sort((first, second) => first.rank - second.rank || first.km - second.km)
    .slice(0, max)
    .map(({ alert, relation, km }) => ({ alert, relation, km }));
}

export function fmtDate(dateStr: string): string {
  return parseAlertDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Narrow a GeoJSON coordinate pair (`number[]`) to a maplibre `[lng, lat]` tuple. */
export function toLngLat(coord: number[]): [number, number] {
  if (coord.length < 2) throw new Error("Expected a [lng, lat] coordinate pair");
  return [coord[0], coord[1]];
}

/** Bounding box enclosing a ring of `[lng, lat]` coordinates. Returns an empty
 *  bounds for an empty ring so callers don't crash on degenerate geometry. */
export function boundsOfRing(ring: number[][]): LngLatBounds {
  if (ring.length === 0) return new LngLatBounds();
  const first = toLngLat(ring[0]);
  return ring.reduce(
    (bounds, coord) => bounds.extend(toLngLat(coord)),
    new LngLatBounds(first, first),
  );
}

/** Distinct values of a selector across ALERTS, sorted ascending. */
function distinctSorted(selector: (alert: Alert) => string): string[] {
  return [...new Set(ALERTS.map(selector))].sort();
}

export const COUNTRIES = distinctSorted((alert) => alert.country);
export const DRIVERS = distinctSorted((alert) => alert.driver);
export const SOURCES = distinctSorted((alert) => alert.originalSource);

export function visibleAlerts(filters: Filters): Alert[] {
  const searchText = filters.code.trim().toLowerCase();
  return ALERTS.filter((alert) => {
    if (filters.country && alert.country !== filters.country) return false;
    if (filters.driver && alert.driver !== filters.driver) return false;
    if (filters.source && alert.originalSource !== filters.source) return false;
    if (searchText && !alert.id.toLowerCase().includes(searchText)) return false;
    if (alert.ha < filters.haFrom || alert.ha > filters.haTo) return false;
    const dateStr = filters.dateMode === "published" ? alert.publishedDate : alert.date;
    const idx = monthIdx(dateStr);
    if (idx < filters.monthFrom || idx > filters.monthTo) return false;
    return true;
  }).sort((first, second) => second.date.localeCompare(first.date));
}

export function defaultFilters(): Filters {
  return {
    dateMode: "detected",
    monthFrom: 0,
    monthTo: MAX_MONTH,
    haFrom: HA_MIN,
    haTo: HA_MAX,
    country: "",
    driver: "",
    source: "",
    code: "",
  };
}
