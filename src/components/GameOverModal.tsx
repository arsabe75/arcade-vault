"use client";

import { useState, useCallback } from "react";

import { insertScore } from "@/src/lib/supabase/scores";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim().toUpperCase().slice(0, 10);
    if (trimmed.length === 0 || saving) return;
    setSaving(true);
    setError(false);
    try {
      await insertScore(gameId, trimmed, score);
      setSaved(true);
    } catch {
      setError(true);
      setSaving(false); // permite reintentar con el mismo input
    }
  }, [name, score, gameId, saving]);

  return (
    <div className="modal-bd">
      <div className="modal">
        <h2>FIN DEL JUEGO</h2>
        <div className="final-label">PUNTUACIÓN FINAL</div>
        <div className="final">{score.toLocaleString("es-ES")}</div>

        {!saved ? (
          <>
            {error && (
              <div className="save-error">NO SE PUDO GUARDAR — REINTENTA</div>
            )}
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
              <button
                className="btn yellow"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "GUARDANDO…" : "GUARDAR PUNTUACIÓN"}
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
