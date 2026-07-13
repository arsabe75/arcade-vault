export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="av-hero">
          <h1>ARCADE VAULT</h1>
          <p className="sub">
            <span className="blink">▸</span> PRESIONE START{" "}
            <span className="blink">◂</span>
          </p>
        </section>

        {/* Filters */}
        <div className="av-filters">
          <div className="av-search">
            <span className="ico">▶</span>
            <input type="text" placeholder="BUSCAR JUEGO..." />
          </div>
          <div className="av-chips">
            <button className="chip active">TODOS</button>
            <button className="chip">ARCADE</button>
            <button className="chip">RETRO</button>
            <button className="chip">PUZZLE</button>
            <button className="chip">ACCIÓN</button>
          </div>
        </div>

        {/* Game Grid */}
        <div className="av-grid">
          {/* Card 1 — Tetro */}
          <div className="card">
            <div className="cover">
              <span className="label">ARCADE</span>
              <div className="cover-bg cover-tetro" />
            </div>
            <div className="meta">
              <div className="title">TETRO BLAST</div>
              <div className="desc">
                Encaja las piezas antes que el tiempo acabe.
              </div>
              <div className="row">
                <div className="score-badge">
                  HIGH SCORE <b>324,850</b>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — Snake */}
          <div className="card">
            <div className="cover">
              <span className="label">RETRO</span>
              <div className="cover-bg cover-snake" />
            </div>
            <div className="meta">
              <div className="title">SNAKE-X</div>
              <div className="desc">
                Crece sin morderte la cola. Modo espejo incluido.
              </div>
              <div className="row">
                <div className="score-badge">
                  HIGH SCORE <b>98,720</b>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 — Invaders */}
          <div className="card">
            <div className="cover">
              <span className="label">ARCADE</span>
              <div className="cover-bg cover-invaders" />
            </div>
            <div className="meta">
              <div className="title">INVADERS++</div>
              <div className="desc">
                Defiende la Tierra. Noventa y nueve oleadas.
              </div>
              <div className="row">
                <div className="score-badge">
                  HIGH SCORE <b>512,400</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons showcase */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            padding: "0 32px 64px",
          }}
        >
          <button className="btn">JUGAR AHORA</button>
          <button className="btn magenta">HIGH SCORES</button>
          <button className="btn yellow pulse">NUEVO!</button>
          <button className="btn ghost">VER MÁS</button>
        </div>
    </>
  );
}
