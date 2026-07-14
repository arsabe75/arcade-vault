"use client";

import { useState, useCallback } from "react";

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
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = name.trim().toUpperCase().slice(0, 10);
    if (trimmed.length === 0) return;
    try {
      const raw = localStorage.getItem("av_scores");
      const all: Record<string, { initials: string; score: number }[]> = raw
        ? JSON.parse(raw)
        : {};
      const list = all[gameId] ?? [];
      list.push({ initials: trimmed, score });
      all[gameId] = list;
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {
      /* localStorage no disponible */
    }
    setSaved(true);
  }, [name, score, gameId]);

  return (
    <div className="modal-bd">
      <div className="modal">
        <h2>FIN DEL JUEGO</h2>
        <div className="final-label">PUNTUACIÓN FINAL</div>
        <div className="final">{score.toLocaleString("es-ES")}</div>

        {!saved ? (
          <>
            <div className="input-row">
              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value.toUpperCase().slice(0, 10))
                }
                placeholder="TUS INICIALES"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <button className="btn yellow" onClick={handleSave}>
                GUARDAR PUNTUACIÓN
              </button>
            </div>
          </>
        ) : (
          <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        )}

        <div className="actions">
          <button className="btn" onClick={onRestart}>
            JUGAR DE NUEVO
          </button>
          <button className="btn magenta" onClick={onExit}>
            VOLVER AL VAULT
          </button>
        </div>
      </div>
    </div>
  );
}
