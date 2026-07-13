"use client";

import { useState, useCallback } from "react";
import Button from "./Button";

interface GameOverModalProps {
  score: number;
  gameId: string;
  onRestart: () => void;
  onExit: () => void;
}

export default function GameOverModal({
  score,
  gameId,
  onRestart,
  onExit,
}: GameOverModalProps) {
  const [initials, setInitials] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    if (initials.trim().length === 0) return;
    try {
      const raw = localStorage.getItem("av_scores");
      const all: Record<string, { initials: string; score: number }[]> = raw
        ? JSON.parse(raw)
        : {};
      const list = all[gameId] ?? [];
      list.push({ initials: initials.trim().toUpperCase().slice(0, 3), score });
      all[gameId] = list;
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {
      /* localStorage no disponible */
    }
    setSaved(true);
  }, [initials, score, gameId]);

  return (
    <div className="modal-bd">
      <div className="modal">
        <h2 className="flicker">GAME OVER</h2>
        <div className="final-label">PUNTUACIÓN FINAL</div>
        <div className="final">{score.toLocaleString("en-US")}</div>

        {!saved ? (
          <>
            <div className="input-row">
              <input
                type="text"
                placeholder="TUS INICIALES..."
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
            <div className="actions">
              <Button variant="magenta" onClick={handleSave}>
                💾 GUARDAR PUNTUACIÓN
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="toast-saved">PUNTUACIÓN GUARDADA</span>
            <div className="actions" style={{ marginTop: 24 }}>
              <Button variant="cyan" onClick={onRestart}>
                🔄 JUGAR DE NUEVO
              </Button>
              <Button variant="ghost" onClick={onExit}>
                🏠 VOLVER AL VAULT
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
