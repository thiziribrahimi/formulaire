import React, { useState } from "react";

import StepServiceChoice from "./components/StepServiceChoice";
import StepStudentDescription from "./components/StepStudentDescription";
import StepObjectiveAndDetails from "./components/StepObjectiveAndDetails";
import StepCourseFrequency from "./components/StepCourseFrequency";
import StepAvailability from "./components/StepAvailability";
import StepContactForm from "./components/StepContactForm";
import StepFinalForm from "./components/StepFinalForm";
import CartSummary from "./components/CartSummary";
import ProgressBar from "./components/ProgressBar";

import "./App.css";

const PUBLIC_URL = process.env.PUBLIC_URL;

function App() {
  const [step, setStep] = useState(0);
  const [showCartMobile, setShowCartMobile] = useState(false);

  const [selectedService, setSelectedService] = useState("");
  const [studentInfo, setStudentInfo] = useState({
    firstName: "",
    level: "",
    needs: [],
    specifics: [],
  });

  const [goalsSubjects, setGoalsSubjects] = useState({
    goal: "",
    subjects: [],
  });

  const [courseFrequency, setCourseFrequency] = useState({
    timesPerWeek: null,
    duration: null,
  });

  const [availability, setAvailability] = useState([]);

  const [contactInfo, setContactInfo] = useState({
    gender: "",
    parentName: "",
    email: "",
    phone: "",
  });

  const next = () => setStep((prev) => prev + 1);
  
  // ✅ SOLUTION 1 : Fonction back() améliorée avec réinitialisation
  const back = () => {
    const newStep = Math.max(step - 1, 0);
    setStep(newStep);
    
    // ✅ Réinitialiser tous les états si on revient à l'étape 0
    if (newStep === 0) {
      console.log("🔄 Retour à l'étape 0 - Réinitialisation de tous les états");
      setSelectedService("");
      setStudentInfo({
        firstName: "",
        level: "",
        needs: [],
        specifics: [],
      });
      setGoalsSubjects({
        goal: "",
        subjects: [],
      });
      setCourseFrequency({
        timesPerWeek: null,
        duration: null,
      });
      setAvailability([]);
      setContactInfo({
        gender: "",
        parentName: "",
        email: "",
        phone: "",
      });
      // ✅ Masquer le panier mobile si ouvert
      setShowCartMobile(false);
    }
  };

  // ✅ Webhook 1 – Étape 6 : Envoi du dossier principal - LOGIQUE FINALE
  const handleSendMainData = async (contactData) => {
    const objectifsFormatted = goalsSubjects.goal
      ? Array.isArray(goalsSubjects.goal)
        ? goalsSubjects.goal.join(", ")
        : goalsSubjects.goal
      : "Non précisé";

    // ✅ NOUVELLE LOGIQUE - Gestion ultra-robuste des disponibilités
    let disponibilitesFormatted = "Non spécifié";

    console.log('🔍 Raw availability in App.js:', availability);
    console.log('🔍 Availability type:', typeof availability);
    console.log('🔍 Is array?', Array.isArray(availability));
    console.log('🔍 Array length:', Array.isArray(availability) ? availability.length : 'N/A');

    // ✅ INSPECTION DÉTAILLÉE du contenu de l'array
    if (Array.isArray(availability) && availability.length > 0) {
      console.log('🔍 Array contents inspection:');
      availability.forEach((item, index) => {
        console.log(`  [${index}]:`, item, `(type: ${typeof item})`);
      });
    }

    try {
      if (!availability) {
        disponibilitesFormatted = "Non spécifié";
        console.log('✅ Case: null/undefined availability');
      } else if (typeof availability === 'string' && availability.trim() !== '') {
        // ✅ C'est déjà une string - parfait
        disponibilitesFormatted = availability;
        console.log('✅ Case: string availability ->', disponibilitesFormatted);
      } else if (Array.isArray(availability) && availability.length > 0) {
        // ✅ C'est un array - analyser chaque élément
        console.log('🔧 Case: array availability - processing each element...');
        
        const processedSlots = availability.map((item, index) => {
          console.log(`🔍 Processing array item ${index}:`, item, typeof item);
          
          if (typeof item === 'string') {
            // L'élément est déjà une string
            console.log(`  ✅ Item ${index} is already a string:`, item);
            return item;
          } else if (typeof item === 'object' && item !== null) {
            // L'élément est un objet - l'analyser en détail
            console.log(`  🔧 Item ${index} is an object, analyzing...`);
            
            if (item.fullSlot) {
              // Format: { fullSlot: "Lundi Matin - 04/06/2025..." }
              console.log(`  ✅ Item ${index} has fullSlot:`, item.fullSlot);
              return item.fullSlot;
            } else if (item.day && item.period && item.time && item.date) {
              // Format: { day: "Lundi", period: "Matin", time: "09:00", date: "2025-06-04", type: "obligatoire" }
              const typeLabel = item.typeLabel || (item.type === "obligatoire" ? "Obligatoire" : "Optionnelle");
              let dateFormatted;
              try {
                dateFormatted = item.dateFormatted || new Date(item.date).toLocaleDateString('fr-FR');
              } catch (e) {
                console.warn(`  ⚠️ Date parsing error for item ${index}:`, e);
                dateFormatted = item.date;
              }
              const reconstructed = `${item.day} ${item.period} - ${dateFormatted} à ${item.time} (${typeLabel})`;
              console.log(`  ✅ Item ${index} reconstructed:`, reconstructed);
              return reconstructed;
            } else if (item.key && item.typeLabel && item.dateFormatted && item.time) {
              // Format alternatif avec key: { key: "Lundi-Matin", typeLabel: "Obligatoire", ... }
              const [day, period] = item.key.split('-');
              const reconstructed = `${day} ${period} - ${item.dateFormatted} à ${item.time} (${item.typeLabel})`;
              console.log(`  ✅ Item ${index} reconstructed from key:`, reconstructed);
              return reconstructed;
            } else {
              // Objet non reconnu - essayer de l'analyser autrement
              console.log(`  ⚠️ Item ${index} unknown object format, keys:`, Object.keys(item));
              
              // Essayer d'extraire les informations importantes
              const keys = Object.keys(item);
              const values = Object.values(item);
              
              // Chercher des patterns connus
              const dayPattern = values.find(v => typeof v === 'string' && ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].includes(v));
              const timePattern = values.find(v => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v));
              
              if (dayPattern && timePattern) {
                const fallback = `${dayPattern} - ${timePattern}`;
                console.log(`  🔧 Item ${index} pattern fallback:`, fallback);
                return fallback;
              } else {
                const fallback = `Créneau ${index + 1}: ${JSON.stringify(item)}`;
                console.log(`  ❌ Item ${index} JSON fallback:`, fallback);
                return fallback;
              }
            }
          } else {
            // Type inconnu
            const fallback = `Créneau ${index + 1}: ${String(item)}`;
            console.log(`  ❌ Item ${index} unknown type fallback:`, fallback);
            return fallback;
          }
        });
        
        disponibilitesFormatted = processedSlots.filter(slot => slot && slot.trim()).join('\n');
        console.log('✅ Final processed array result:', disponibilitesFormatted);
        
      } else if (typeof availability === 'object' && availability !== null) {
        // ✅ C'est un objet (pas un array) - extraire les informations utiles
        console.log('🔧 Case: object availability - analyzing...');
        
        if (availability.text) {
          // Format: { text: "...", detailed: [...] }
          disponibilitesFormatted = availability.text;
          console.log('✅ Used availability.text:', disponibilitesFormatted);
        } else if (availability.detailed && Array.isArray(availability.detailed)) {
          // Format: { detailed: [{ fullSlot: "..." }] }
          disponibilitesFormatted = availability.detailed
            .map(slot => slot.fullSlot || JSON.stringify(slot))
            .join('\n');
          console.log('✅ Used availability.detailed:', disponibilitesFormatted);
        } else {
          // ✅ Objet quelconque - essayer de l'analyser
          const entries = Object.entries(availability);
          console.log('🔍 Object entries:', entries);
          
          if (entries.length > 0) {
            const slots = entries.map(([key, data]) => {
              console.log('🔍 Processing object entry:', key, data);
              
              if (typeof data === 'object' && data !== null && data.day && data.period && data.time && data.date) {
                const typeLabel = data.type === "obligatoire" ? "Obligatoire" : "Optionnelle";
                let dateFormatted;
                try {
                  dateFormatted = new Date(data.date).toLocaleDateString('fr-FR');
                } catch (e) {
                  dateFormatted = data.date;
                }
                const slotText = `${data.day} ${data.period} - ${dateFormatted} à ${data.time} (${typeLabel})`;
                console.log('✅ Created slot from object entry:', slotText);
                return slotText;
              } else {
                const fallback = `${key}: ${String(data)}`;
                console.log('⚠️ Fallback for object entry:', fallback);
                return fallback;
              }
            });
            disponibilitesFormatted = slots.join('\n');
            console.log('✅ Reconstructed from object entries:', disponibilitesFormatted);
          } else {
            // Objet vide
            disponibilitesFormatted = "Aucune disponibilité sélectionnée";
            console.log('⚠️ Empty object, using default');
          }
        }
      } else {
        // ✅ Fallback final - forcer la conversion
        disponibilitesFormatted = String(availability || "Non spécifié");
        console.log('✅ Final fallback conversion:', disponibilitesFormatted);
      }
    } catch (error) {
      console.error('❌ Critical error processing availability:', error);
      console.error('Error stack:', error.stack);
      disponibilitesFormatted = `Erreur critique lors du formatage des disponibilités`;
    }

    // ✅ VÉRIFICATIONS FINALES ET NETTOYAGE
    if (typeof disponibilitesFormatted !== 'string') {
      console.warn('⚠️ disponibilitesFormatted is not a string, emergency conversion...');
      disponibilitesFormatted = String(disponibilitesFormatted);
    }

    // ✅ PROTECTION ABSOLUE CONTRE [object Object]
    if (disponibilitesFormatted === '[object Object]' || disponibilitesFormatted.includes('[object Object]')) {
      console.error('❌ EMERGENCY: Still got [object Object], using emergency fallback');
      disponibilitesFormatted = 'Créneaux sélectionnés (erreur de formatage)';
    }

    // ✅ NETTOYAGE FINAL
    if (disponibilitesFormatted.trim() === '' || disponibilitesFormatted === 'undefined' || disponibilitesFormatted === 'null') {
      disponibilitesFormatted = 'Non spécifié';
    }

    console.log('🎯 FINAL disponibilitesFormatted:', disponibilitesFormatted);
    console.log('🎯 Type:', typeof disponibilitesFormatted);
    console.log('🎯 Length:', disponibilitesFormatted.length);
    console.log('🎯 Contains [object Object]?', disponibilitesFormatted.includes('[object Object]'));

    const sujetsFormatted =
      goalsSubjects.subjects.length > 0
        ? goalsSubjects.subjects.join(", ")
        : "Non précisé";

    const payload = {
      service: selectedService,
      prenom: studentInfo.firstName,
      classe: studentInfo.level || "Non précisé",
      besoins: studentInfo.needs.join(", "),
      particularites: studentInfo.specifics.join(", "),
      objectifs: objectifsFormatted,
      matieres: sujetsFormatted,
      nombreDeCours: courseFrequency.timesPerWeek || "Non précisé",
      dureeSeances: courseFrequency.duration || "Non précisé",
      disponibilites: disponibilitesFormatted, // ✅ 100% garanti d'être une string valide
      civilite: contactData.gender,
      nomParent: contactData.parentName,
      telephoneParent: contactData.phone,
      email: contactData.email,
    };

    // ✅ VÉRIFICATION FINALE DU PAYLOAD
    console.log('📋 FINAL PAYLOAD VERIFICATION:');
    Object.entries(payload).forEach(([key, value]) => {
      const hasObjectIssue = String(value).includes('[object Object]');
      console.log(`  ${key}: "${value}" (${typeof value}) ${hasObjectIssue ? '❌ HAS [object Object]' : '✅'}`);
    });

    try {
      console.log('📤 Sending to Airtable...');
      
      const res = await fetch("http://localhost:4000/api/sendFullDataToAirtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }

      if (!res.ok) throw new Error(result.error || "Erreur webhook 1");

      console.log("✅ Données envoyées à Airtable (webhook 1)");
      console.log("✅ Réponse Airtable:", result);
      return true;
    } catch (err) {
      console.error("❌ Erreur webhook 1 :", err);
      return false;
    }
  };

  // ✅ Webhook 2 – Étape 7 : Envoi final
  const handleFinalSubmit = async (finalFormData) => {
    const payload = {
      email: contactInfo.email,
      ...finalFormData,
    };

    try {
      const res = await fetch("http://localhost:4000/api/sendToAirtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }

      if (!res.ok) throw new Error(result.error || "Erreur webhook 2");

      console.log("✅ Données envoyées à Airtable (webhook 2)", payload);
      alert("Votre demande complète a bien été envoyée !");
      return true;
    } catch (err) {
      console.error("❌ Erreur webhook 2 :", err);
      alert("Erreur lors de la finalisation. Veuillez réessayer.");
      return false;
    }
  };

  return (
    <div className="container py-4">
      <ProgressBar step={step} totalSteps={7} />

      <div className="app-wrapper">
        <div className="main-content">
          {step === 0 && (
            <StepServiceChoice
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              onNext={next}
            />
          )}
          {step === 1 && (
            <StepStudentDescription
              studentInfo={studentInfo}
              setStudentInfo={setStudentInfo}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 2 && (
            <StepObjectiveAndDetails
              selectedService={selectedService}
              goalsSubjects={goalsSubjects}
              setGoalsSubjects={setGoalsSubjects}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <StepCourseFrequency
              selectedService={selectedService}
              courseFrequency={courseFrequency}
              setCourseFrequency={setCourseFrequency}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 4 && (
            <StepAvailability
              availability={availability}
              setAvailability={setAvailability}
              onNext={next}
              onBack={back}
              maxSelections={courseFrequency.timesPerWeek}
            />
          )}
          {step === 5 && (
            <StepContactForm
              setContactInfo={setContactInfo}
              onBack={back}
              onSubmit={async (contactData) => {
                setContactInfo(contactData);
                const success = await handleSendMainData(contactData);
                if (success) {
                  next();
                  return true;
                } else {
                  return false;
                }
              }}
            />
          )}
          {step === 6 && (
            <StepFinalForm
              contactInfo={contactInfo}
              onSubmit={handleFinalSubmit}
              onBack={back}
            />
          )}
        </div>

        {step < 6 && (
          <>
            <div className="mobile-cart-toggle d-md-none text-center mb-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowCartMobile(!showCartMobile)}
              >
                {showCartMobile ? "Masquer le panier" : "Afficher le panier"}
              </button>
            </div>

            <div
              className={`cart-summary-wrapper ${showCartMobile ? "show-mobile" : ""}`}
            >
              <CartSummary
                address={""}
                selectedService={selectedService}
                studentInfo={studentInfo}
                goals={goalsSubjects.goal}
                subjects={goalsSubjects.subjects}
                frequency={{
                  count: courseFrequency.timesPerWeek,
                  duration: courseFrequency.duration,
                }}
                currentStep={step}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;