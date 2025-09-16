import React from "react";
import "../../css/overlays.css";

export default function IntroScreen({ onNext, onBack }) {
  return (
    <section className="intro-screen">
      <div className="intro-wrap">
        <div className="intro-card intro-centered">
          <img
            src="/munchie/eyelessneutral_Munchie.png"
            alt="Munchie the mascot"
            className="w-40 h-40 mx-auto mb-6 munchie-bounce"
          />

          <h1 className="intro-title">Welcome, Friend!</h1>

          <p className="intro-subtitle">
            Let’s learn numbers <span className="font-bold">1</span>,{" "}
            <span className="font-bold">2</span>, and{" "}
            <span className="font-bold">3</span>!
          </p>

          <div className="intro-actions">
            <button className="btn btn-primary" onClick={onNext}>
              Start Lesson
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
