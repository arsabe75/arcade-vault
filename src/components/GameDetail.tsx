"use client";

import { useMemo } from "react";
import Link from "next/link";
import { GAMES } from "@/src/data/games";
import { useTopScores } from "@/src/lib/supabase/scores";
import Leaderboard from "./Leaderboard";

export default function GameDetail({ id }: { id: string }) {
  const game = useMemo(() => GAMES.find((g) => g.id === id), [id]);
  const { rows, loading, error, reload } = useTopScores(id);

  if (!game) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "120px 20px",
          fontFamily: "var(--pixel)",
          fontSize: 14,
          letterSpacing: "0.16em",
          color: "var(--magenta)",
          textShadow: "0 0 12px rgba(255,0,110,0.5)",
        }}
      >
        JUEGO NO ENCONTRADO
        <div style={{ marginTop: 24 }}>
          <Link href="/">← VOLVER AL VAULT</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`} />
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {rows?.[0]?.score !== undefined
                  ? rows[0].score.toLocaleString("es-ES")
                  : "—"}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/jugar/${game.id}`}>
              <button className="btn xl pulse">▶ JUGAR AHORA</button>
            </Link>
            <Link href="/">
              <button className="btn ghost lg">VOLVER AL VAULT</button>
            </Link>
          </div>
        </div>
      </div>

      <aside>
        {loading || error || !rows || rows.length === 0 ? (
          <div className="leaderboard">
            <h3>MEJORES PUNTUACIONES</h3>
            {loading && <div className="lb-state">CARGANDO…</div>}
            {error && (
              <>
                <div className="lb-state">NO SE PUDO CARGAR EL LEADERBOARD</div>
                <div style={{ padding: "0 16px 20px", textAlign: "center" }}>
                  <button className="btn ghost" onClick={reload}>
                    REINTENTAR
                  </button>
                </div>
              </>
            )}
            {!loading && !error && (
              <div className="lb-state">
                AÚN NO HAY MARCAS — ¡SÉ EL PRIMERO!
              </div>
            )}
          </div>
        ) : (
          <Leaderboard rows={rows} />
        )}
      </aside>
    </div>
  );
}
