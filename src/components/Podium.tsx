import { formatDate } from "@/src/lib/supabase/scores";
import type { ScoreEntry } from "@/src/lib/supabase/scores";

interface PodiumProps {
  top3: ScoreEntry[];
}

export default function Podium({ top3 }: PodiumProps) {
  const [first, second, third] = top3; // silver left, gold center, bronze right

  return (
    <div className="podium">
      {/* Silver — 2nd place */}
      <div className="podium-slot silver">
        <div className="rank-num">02</div>
        <div className="name">{second?.initials ?? "—"}</div>
        <div className="score">
          {second?.score.toLocaleString("es-ES") ?? "—"}
        </div>
        <div className="date">
          {second ? formatDate(second.created_at) : "—"}
        </div>
      </div>

      {/* Gold — 1st place */}
      <div className="podium-slot gold">
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--gold)",
            letterSpacing: "0.18em",
          }}
        >
          CAMPEÓN
        </div>
        <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
          01
        </div>
        <div className="name">{first?.initials ?? "—"}</div>
        <div className="score" style={{ fontSize: 20 }}>
          {first?.score.toLocaleString("es-ES") ?? "—"}
        </div>
        <div className="date">{first ? formatDate(first.created_at) : "—"}</div>
      </div>

      {/* Bronze — 3rd place */}
      <div className="podium-slot bronze">
        <div className="rank-num">03</div>
        <div className="name">{third?.initials ?? "—"}</div>
        <div className="score">
          {third?.score.toLocaleString("es-ES") ?? "—"}
        </div>
        <div className="date">{third ? formatDate(third.created_at) : "—"}</div>
      </div>
    </div>
  );
}
