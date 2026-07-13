export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[] = [
  {
    id: "space-lancers",
    title: "SPACE LANCERS",
    short: "Derriba oleadas alienígenas en el vacío estelar.",
    long: "Pilota la LANCE-X7 a través del cinturón de Orión. Cada oleada trae formaciones más agresivas y jefes de flota que pondrán a prueba tus reflejos. Recolecta módulos de energía para cargar el RAYO DESTRUCTOR y limpia el sector antes de que la invasión llegue a la Tierra.",
    cat: "SHOOTER",
    cover: "space-lancers",
    color: "cyan",
    best: 984_200,
    plays: "2.1M",
  },
  {
    id: "neon-kombat",
    title: "NEON KOMBAT",
    short: "Enfréntate en duelos de lucha con estética cyberpunk.",
    long: "Elige entre 12 luchadores aumentados con implantes cibernéticos y domina los combates en arenas iluminadas con neón. Ejecuta combos especiales, rompe la guardia del rival y desata tu SUPER MOVIMIENTO para ganar la pelea ante una multitud virtual que ruge con cada golpe.",
    cat: "VERSUS",
    cover: "neon-kombat",
    color: "magenta",
    best: 567_800,
    plays: "1.8M",
  },
  {
    id: "crystal-maze",
    title: "CRYSTAL MAZE",
    short: "Resuelve laberintos de cristal antes de que el tiempo se agote.",
    long: "Gira pasillos, alinea espejos y desbloquea puertas de energía en 60 niveles diseñados a mano. Cada cristal que recolectas activa un nuevo camino, pero el cronómetro no se detiene. Solo los jugadores más astutos lograrán salir de las profundidades del LABERINTO DE CRISTAL.",
    cat: "PUZZLE",
    cover: "crystal-maze",
    color: "green",
    best: 345_600,
    plays: "3.4M",
  },
  {
    id: "star-raiders",
    title: "STAR RAIDERS",
    short: "Saquea bases estelares y escapa con el botín.",
    long: "Infíltate en estaciones espaciales abandonadas repletas de defensas automáticas y drones centinela. Esquiva láseres, piratea terminales y llena tus bolsillos con núcleos de energía antes de que el sistema de autodestrucción alcance el punto de no retorno.",
    cat: "ARCADE",
    cover: "star-raiders",
    color: "yellow",
    best: 1_250_000,
    plays: "4.7M",
  },
  {
    id: "void-hunters",
    title: "VOID HUNTERS",
    short: "Caza criaturas abisales en las profundidades del océano.",
    long: "Desciende a bordo del batiscafo ABYSS-9 hacia regiones inexploradas del océano profundo. Ilumina criaturas bioluminiscentes, evita depredadores colosales y documenta especies desconocidas. Cada inmersión genera un ecosistema procedural distinto.",
    cat: "ARCADE",
    cover: "void-hunters",
    color: "cyan",
    best: 712_300,
    plays: "890K",
  },
  {
    id: "hex-invaders",
    title: "HEX INVADERS",
    short: "Defiende la última ciudad del asedio hexagonal alienígena.",
    long: "Los invasores hexagonales descienden en formaciones geométricas imposibles. Tus torretas de defensa son todo lo que se interpone entre ellos y la ciudadela. Rota tus cañones en 360°, prioriza las amenazas entrantes y activa el ESCUDO HEX cuando la situación sea insostenible.",
    cat: "SHOOTER",
    cover: "hex-invaders",
    color: "magenta",
    best: 1_890_500,
    plays: "5.2M",
  },
  {
    id: "quantum-drift",
    title: "QUANTUM DRIFT",
    short: "Derrapa entre dimensiones cuánticas en carreras interdimensionales.",
    long: "Cada vuelta cambia las leyes de la física: gravedad, fricción y masa mutan en tiempo real. Pilota tu nave en 8 circuitos cuánticos, usa portales para adelantar posiciones y gestiona tu núcleo de fase para cambiar de dimensión en el momento justo.",
    cat: "VERSUS",
    cover: "quantum-drift",
    color: "green",
    best: 423_100,
    plays: "2.9M",
  },
  {
    id: "cyber-solitaire",
    title: "CYBER SOLITAIRE",
    short: "El clásico solitario con un giro hacker distópico.",
    long: "Desencripta mazos de datos en este solitario ambientado en una terminal de los 80. Cada carta que mueves desbloquea fragmentos de una conspiración corporativa. Completa las cuatro suites para revelar la verdad. Incluye modo contrarreloj y ranking global de decrypters.",
    cat: "PUZZLE",
    cover: "cyber-solitaire",
    color: "yellow",
    best: 156_700,
    plays: "6.1M",
  },
];

export const CATS: string[] = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Same seed always produces the same sequence of scores.
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { PLAYERS } from "./players";

export function seededScores(
  seed: number,
  count: number = 12,
): ScoreRow[] {
  const rng = mulberry32(seed);
  const shuffled = [...PLAYERS].sort(() => rng() - 0.5);

  const rows: ScoreRow[] = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const baseScore = 100_000 + seed * 73_421;
    const spread = Math.floor(rng() * baseScore * 0.6);
    const score = baseScore - spread + Math.floor(rng() * 50_000);

    const day = String(Math.floor(rng() * 28) + 1).padStart(2, "0");
    const month = String(Math.floor(rng() * 12) + 1).padStart(2, "0");
    const year = 2026;

    rows.push({
      rank: i + 1,
      name: shuffled[i],
      score,
      date: `${day}/${month}/${year}`,
    });
  }

  return rows.sort((a, b) => b.score - a.score).map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}
