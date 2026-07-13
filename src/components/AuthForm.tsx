"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";

type Tab = "login" | "register";

export default function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const saveAndRedirect = useCallback(
    (name: string) => {
      try {
        localStorage.setItem(
          "av_user",
          JSON.stringify({ name, loggedAt: Date.now() }),
        );
      } catch {
        /* no disponible */
      }
      router.push("/");
    },
    [router],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const name = username.trim() || "JUGADOR";
      saveAndRedirect(name);
    },
    [username, saveAndRedirect],
  );

  const handleGuest = useCallback(() => {
    saveAndRedirect("INVITADO");
  }, [saveAndRedirect]);

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={tab === "login" ? "on" : ""}
            onClick={() => setTab("login")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "register" ? "on" : ""}
            onClick={() => setTab("register")}
          >
            CREAR CUENTA
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>USUARIO</label>
            <input
              type="text"
              placeholder="Tu nombre de jugador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          {tab === "register" && (
            <div className="field">
              <label>EMAIL</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}

          <div className="field">
            <label>CONTRASEÑA</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </div>

          <Button
            variant="cyan"
            size="lg"
            type="submit"
            style={{ width: "100%", marginTop: 8 }}
            pulse
          >
            {tab === "login" ? "ENTRAR AL VAULT" : "CREAR CUENTA"}
          </Button>
        </form>

        {/* Guest */}
        <div style={{ marginTop: 12 }}>
          <Button
            variant="ghost"
            size="default"
            onClick={handleGuest}
            style={{ width: "100%" }}
          >
            🎮 JUGAR COMO INVITADO
          </Button>
        </div>

        {/* Divider */}
        <div className="auth-divider">O CONECTA CON</div>

        {/* Social buttons */}
        <div className="social">
          <Button variant="ghost" size="default" disabled>
            🔵 Google
          </Button>
          <Button variant="ghost" size="default" disabled>
            🐙 GitHub
          </Button>
        </div>

        {/* Terms */}
        <p
          style={{
            marginTop: 18,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-faint)",
            textAlign: "center",
            letterSpacing: "0.04em",
            lineHeight: 1.6,
          }}
        >
          Al entrar aceptas nuestros términos cósmicos y la política de
          privacidad intergaláctica. Tus datos están seguros en el Vault.
        </p>
      </div>
    </div>
  );
}
