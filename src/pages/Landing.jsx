import { Link, useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-root">

      {/* Ambient glow */}
      <div className="landing-glow" />

      {/* LOGO */}
      <div className="logo-area">
        <div className="logo-glyph">
          <a href="/">
          <img src="/Ai.png" alt="GYANI Logo" />
          </a>
        </div>
        <div className="logo-wordmark">GYANI</div>
        <div className="logo-tagline">Local Intelligence • Ancient Wisdom</div>
      </div>

      {/* Divider */}
      <div className="landing-divider" />

      {/* HERO */}
      <div className="landing">

        <h1 className="hero-title">Your Local AI Assistant</h1>

        <p className="hero-subtitle">
          <span>Fast</span>•<span>Private</span>•<span>Runs on your machine</span>
        </p>

        <div className="hero-badges">
          <span className="badge">⚡ Offline</span>
          <span className="badge">🔒 No Cloud</span>
          <span className="badge">🧠 Ollama Powered</span>
        </div>

        <button
          className="start-btn"
          onClick={() => navigate("/chat")}
        >
          Get Started
        </button>

      </div>

      {/* Footer */}
      <div className="landing-footer">
        GYANI v1.0 — Powered by Ollama
      </div>

    </div>
  );
}