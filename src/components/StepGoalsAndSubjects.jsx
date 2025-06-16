import React, { useState } from "react";
import "./StepGoalsSubjects.css";

const PUBLIC_URL = process.env.PUBLIC_URL;

const goalsWithIcons = [
  { id: "Remise à niveau", icon: "Remise-icon.svg" },
  { id: "SOS - échec scolaire", icon: "sos_og.svg" },
  { id: "Performance scolaire", icon: "electric_bolt_icon.svg" },
  { id: "Suivi scolaire", icon: "suivi_scolaire_og.svg" },
  { id: "Nouvel apprentissage", icon: "nouvel_apprenti_og.svg" },
];

const StepGoalsSubjects = ({ goalsSubjects, setGoalsSubjects, onNext, onBack }) => {
  // ✅ CORRECTION: Un seul objectif sélectionné (string, pas array)
  const [selectedGoal, setSelectedGoal] = useState(
    Array.isArray(goalsSubjects.goal) ? goalsSubjects.goal[0] || "" : goalsSubjects.goal || ""
  );
  const [subjects, setSubjects] = useState(goalsSubjects.subjects || []);

  // ✅ NOUVELLES MATIÈRES selon votre demande
  const allSubjects = [
    "Français",
    "Mathématiques", 
    "Histoire-Géographie",
    "Histoire-Géographie, Géopolitique et Sciences Politiques (HGGSP)",
    "Sciences économiques et sociales (SES)",
    "Physique-Chimie",
    "Sciences de la Vie et de la Terre (SVT)",
    "Espagnol, Allemand, Italien, autre",
    "Anglais",
    "Technologie",
    "Philosophie",
    "Numérique et Sciences informatiques (NSI)",
    "Sciences de l'ingénieur (SI)",
    "Humanités, Littérature et Philosophie (HLP)"
  ];

  // ✅ CORRECTION: Sélection unique (remplace la sélection précédente)
  const selectGoal = (goalId) => {
    setSelectedGoal(selectedGoal === goalId ? "" : goalId); // Désélectionne si déjà sélectionné
  };

  const toggleSubject = (subject) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleContinue = () => {
    if (selectedGoal && subjects.length > 0) {
      setGoalsSubjects({ goal: selectedGoal, subjects });
      onNext();
    } else {
      alert("Merci de sélectionner un objectif et au moins une matière.");
    }
  };

  return (
    <>
      {/* 🔙 Bouton retour externe */}
      <button className="btn-icon-outside" onClick={onBack}>
        <img src={`${PUBLIC_URL}/left-return-arrow.svg`} alt="Retour" className="icon-left" />
      </button>

      <div className="step-goals-subjects container py-5">
        <h3 className="section-title mb-4">Objectifs et détails</h3>

        <p className="form-label fw-semibold">
          Quels sont les axes d'amélioration ou objectifs ? <span className="required-star">*</span>
        </p>
        <div className="goals-grid mb-4">
          {goalsWithIcons.map((g) => (
            <button
              key={g.id}
              className={`goal-button ${selectedGoal === g.id ? "active" : ""}`}
              onClick={() => selectGoal(g.id)}
            >
              <img src={`${PUBLIC_URL}/${g.icon}`} alt={g.id} className="goal-icon" />
              {g.id}
            </button>
          ))}
        </div>

        <p className="form-label fw-semibold">
          Choisissez les matières : <span className="required-star">*</span>
        </p>
        <div className="subjects-grid-container mb-4">
          <div className="subjects-grid">
            {allSubjects.map((subject) => (
              <button
                key={subject}
                className={`subject-button ${subjects.includes(subject) ? "selected" : ""}`}
                onClick={() => toggleSubject(subject)}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button 
            className={`eddmon-btn ${(!selectedGoal || subjects.length === 0) ? 'disabled' : ''}`}
            onClick={handleContinue}
            disabled={!selectedGoal || subjects.length === 0}
          >
            Continuer
          </button>
        </div>
      </div>
    </>
  );
};

export default StepGoalsSubjects;