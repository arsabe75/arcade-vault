"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/src/data/games";
import Button from "./Button";

export default function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }, []);

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/juego/${game.id}`);
    },
    [router, game.id],
  );

  const handleCardClick = useCallback(() => {
    router.push(`/juego/${game.id}`);
  }, [router, game.id]);

  const btnVariant =
    game.color === "magenta"
      ? "magenta"
      : game.color === "yellow"
        ? "yellow"
        : "cyan";

  return (
    <div
      ref={ref}
      className="card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={handleCardClick}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`}></div>
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <Button variant={btnVariant as "cyan" | "magenta" | "yellow"} size="default" onClick={handlePlay}>
            JUGAR
          </Button>
        </div>
      </div>
    </div>
  );
}
