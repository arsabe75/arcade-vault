"use client";

import { useState } from "react";
import Link from "next/link";
import { GAMES } from "@/src/data/games";
import { formatDate } from "@/src/lib/supabase/scores";
import { useTopScores } from "@/src/lib/supabase/scores";
import Podium from "./Podium";

export default function HallOfFame() {
  const [tab, setTab] = useState(GAMES[0].id);
  const { rows, loading, error, reload } = useTopScores(tab);

  const game = GAMES.find((g) => g.id === tab);

  if (!game) return null;

  const header = (
    <div className="th">
      <div>RANGO</div>
      <div>JUGADOR</div>
      <div>PUNTUACIÓN</div>
      <div>FECHA</div>
    </div>
  );

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {rows && rows.length >= 3 && <Podium top3={rows.slice(0, 3)} />}

      <div className="hall-table">
        {header}
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
        {!loading && !error && rows && rows.length === 0 && (
          <div className="lb-state">AÚN NO HAY MARCAS — ¡SÉ EL PRIMERO!</div>
        )}
        {!loading &&
          !error &&
          rows?.map((r, i) => (
            <div
              key={r.id}
              className={
                "tr" +
                (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")
              }
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
              <div className="pl">{r.initials}</div>
              <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              <div className="dt">{formatDate(r.created_at)}</div>
            </div>
          ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/">
          <button className="btn lg">VOLVER A LA BIBLIOTECA</button>
        </Link>
      </div>
    </div>
  );
}
