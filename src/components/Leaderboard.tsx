import type { ScoreRow } from "@/src/data/games";

function topClass(rank: number): string {
  if (rank === 1) return "top1";
  if (rank === 2) return "top2";
  if (rank === 3) return "top3";
  return "";
}

function formatScore(n: number): string {
  return n.toLocaleString("en-US");
}

export default function Leaderboard({ rows }: { rows: ScoreRow[] }) {
  return (
    <div className="leaderboard">
      <h3>🏆 MEJORES PUNTUACIONES</h3>
      {rows.map((r) => (
        <div key={r.rank} className={`lb-row ${topClass(r.rank)}`}>
          <span className="rk">
            {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
          </span>
          <span className="pl">{r.name}</span>
          <span className="sc">{formatScore(r.score)}</span>
        </div>
      ))}
    </div>
  );
}
