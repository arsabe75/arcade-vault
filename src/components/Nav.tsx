"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("av_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) setUser(parsed.name);
      }
    } catch {
      /* localStorage no disponible durante SSR */
    }
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/juego") || pathname.startsWith("/jugar");
    return pathname.startsWith(href);
  };

  const handleSignOut = useCallback(() => {
    try { localStorage.removeItem("av_user"); } catch { /* */ }
    setUser(null);
    close();
  }, [close]);

  return (
    <>
      <nav className="av-nav">
        {/* Logo */}
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="links">
          <Link
            href="/"
            className={isActive("/") ? "active" : ""}
          >
            Biblioteca
          </Link>
          <Link
            href="/salon"
            className={isActive("/salon") ? "active" : ""}
          >
            Salón de la Fama
          </Link>
        </div>

        <div className="spacer" />

        {/* Credits */}
        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {/* Auth button */}
        {user ? (
          <button className="btn ghost auth-btn" onClick={handleSignOut}>
            {user} ▾
          </button>
        ) : (
          <Link href="/auth" className="auth-btn">
            <button className="btn">Iniciar Sesión</button>
          </Link>
        )}

        {/* Hamburger */}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      {/* Mobile backdrop */}
      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      />

      {/* Mobile panel */}
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link
          href="/"
          className={isActive("/") ? "active" : ""}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/salon"
          className={isActive("/salon") ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/auth"
          className={isActive("/auth") ? "active" : ""}
          onClick={close}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
