"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";

interface NavLink {
  href: string;
  label: string;
}

const LINKS: NavLink[] = [
  { href: "/", label: "BIBLIOTECA" },
  { href: "/salon", label: "SALÓN DE LA FAMA" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState(250);
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
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="av-nav">
        {/* Logo */}
        <Link href="/" className="logo" onClick={close}>
          <span className="logo-mark" />
          <span className="logo-text">ARCADE VAULT</span>
        </Link>

        {/* Desktop links */}
        <div className="links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="spacer" />

        {/* Credits */}
        <div className="coin-counter">
          <span className="coin" />
          {credits} CRÉDITOS
        </div>

        {/* Auth button */}
        <Link href="/auth" className="auth-btn">
          <Button variant="cyan" size="default">
            {user ? user.toUpperCase() : "INICIAR SESIÓN"}
          </Button>
        </Link>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
          style={{
            fontFamily: "var(--pixel)",
            fontSize: 14,
            letterSpacing: "0.2em",
            background: "transparent",
            border: 0,
            color: "var(--ink)",
            cursor: "pointer",
            padding: "8px 10px",
          }}
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile backdrop */}
      <div
        className={`av-mobile-backdrop${open ? " open" : ""}`}
        onClick={close}
        aria-hidden
      />

      {/* Mobile panel */}
      <div className={`av-mobile-panel${open ? " open" : ""}`} aria-hidden={!open}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(l.href) ? "active" : ""}
            onClick={close}
          >
            {l.label}
          </Link>
        ))}
        <div style={{ marginTop: 16 }}>
          <Link href="/auth" onClick={close}>
            <Button variant="magenta" size="default">
              {user ? user.toUpperCase() : "ENTRAR AL VAULT"}
            </Button>
          </Link>
        </div>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--pixel)",
            fontSize: 9,
            color: "var(--yellow)",
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, #fff8b0, #f5ff00 60%, #b0b800)",
              boxShadow: "0 0 8px var(--yellow)",
            }}
          />
          {credits} CRÉDITOS
        </div>
      </div>
    </>
  );
}
