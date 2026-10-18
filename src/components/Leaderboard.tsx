import { formatDate } from "@/src/lib/supabase/scores";
import type { ScoreEntry } from "@/src/lib/supabase/scores";

export default function Leaderboard({ rows }: { rows: ScoreEntry[] }) {
  return (
    <div className="leaderboard">
      <h3>MEJORES PUNTUACIONES</h3>
      {rows.map((r, i) => (
        <div
          key={r.id}
          className={
            "lb-row" +
            (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")
          }
        >
          <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
          <div className="pl">
            {r.initials}
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                letterSpacing: "0.1em",
              }}
            >
              {formatDate(r.created_at)}
            </div>
          </div>
          <div className="sc">{r.score.toLocaleString("es-ES")}</div>
        </div>
      ))}
    </div>
  );
}
