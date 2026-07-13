import type { ScoreRow } from "@/src/data/games";

function formatScore(n: number): string {
  return n.toLocaleString("en-US");
}

interface PodiumProps {
  top3: ScoreRow[];
}

export default function Podium({ top3 }: PodiumProps) {
  const [third, first, second] = top3; // gold center, silver right, bronze left

  const Slot = ({
    player,
    rank,
    tier,
  }: {
    player: ScoreRow | undefined;
    rank: number;
    tier: "gold" | "silver" | "bronze";
  }) => (
    <div className={`podium-slot ${tier}`}>
      <div className="rank-num">{rank}</div>
      {player ? (
        <>
          <div className="name">{player.name}</div>
          <div className="score">{formatScore(player.score)}</div>
          <div className="date">{player.date}</div>
        </>
      ) : (
        <div
          className="name"
          style={{ color: "var(--ink-faint)", fontStyle: "italic" }}
        >
          —
        </div>
      )}
    </div>
  );

  return (
    <div className="podium">
      <Slot player={third} rank={3} tier="bronze" />
      <Slot player={first} rank={1} tier="gold" />
      <Slot player={second} rank={2} tier="silver" />
    </div>
  );
}
