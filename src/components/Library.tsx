"use client";

import { useState, useMemo } from "react";
import { GAMES, CATS } from "@/src/data/games";
import GameCard from "./GameCard";

export default function Library() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("TODOS");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return GAMES.filter((g) => {
      const matchesQuery = q === "" || g.title.toLowerCase().includes(q);
      const matchesCat = cat === "TODOS" || g.cat === cat;
      return matchesQuery && matchesCat;
    });
  }, [query, cat]);

  return (
    <>
      {/* Hero */}
      <section className="av-hero">
        <h1>ARCADE VAULT</h1>
        <p className="sub">
          <span className="blink">▸</span> PRESIONE START{" "}
          <span className="blink">◂</span>
        </p>
      </section>

      {/* Filters */}
      <div className="av-filters">
        <div className="av-search">
          <span className="ico">▶</span>
          <input
            type="text"
            placeholder="BUSCAR JUEGO..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="av-chips">
          {CATS.map((c) => (
            <button
              key={c}
              className={`chip${cat === c ? " active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Game Grid / Empty state */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            fontFamily: "var(--pixel)",
            fontSize: 14,
            letterSpacing: "0.16em",
            color: "var(--magenta)",
            textShadow: "0 0 12px rgba(255,0,110,0.5)",
          }}
        >
          NO HAY RESULTADOS
        </div>
      ) : (
        <div className="av-grid">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </>
  );
}
