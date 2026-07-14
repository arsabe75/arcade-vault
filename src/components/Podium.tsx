import type { ScoreRow } from "@/src/data/games";

interface PodiumProps {
  top3: ScoreRow[];
}

export default function Podium({ top3 }: PodiumProps) {
  const [second, first, third] = top3; // silver left, gold center, bronze right

  return (
    <div className="podium">
      {/* Silver — 2nd place */}
      <div className="podium-slot silver">
        <div className="rank-num">02</div>
        <div className="name">{second?.name ?? "—"}</div>
        <div className="score">
          {second?.score.toLocaleString("es-ES") ?? "—"}
        </div>
        <div className="date">{second?.date ?? "—"}</div>
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
        <div className="name">{first?.name ?? "—"}</div>
        <div className="score" style={{ fontSize: 20 }}>
          {first?.score.toLocaleString("es-ES") ?? "—"}
        </div>
        <div className="date">{first?.date ?? "—"}</div>
      </div>

      {/* Bronze — 3rd place */}
      <div className="podium-slot bronze">
        <div className="rank-num">03</div>
        <div className="name">{third?.name ?? "—"}</div>
        <div className="score">
          {third?.score.toLocaleString("es-ES") ?? "—"}
        </div>
        <div className="date">{third?.date ?? "—"}</div>
      </div>
    </div>
  );
}
