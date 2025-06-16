const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // Assure-toi d'avoir node-fetch@2 installé

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// ✅ AIRTABLE CONFIG POUR LES CODES PROMO - BASE ANCIENNE (FONCTIONNELLE)
const AIRTABLE_BASE_ID_PROMO = "appLAFIAMjHg6ZEuQ"; // ✅ BASE ANCIENNE POUR CODES PROMO
const AIRTABLE_TABLE_NAME = "tblZxqrnc80BmO6Dg"; // ✅ TABLE CODES PROMO
const AIRTABLE_API_KEY = "patzYVfCYwQWH3Mng.7ca9bb3a21a7976826e5a395e4ac4c01649307f3638b8f463e6d774a5de5f598"; // Votre jeton personnel

// ✅ BASE ID POUR LES WEBHOOKS - NOUVELLE BASE (FONCTIONNELLE)
const AIRTABLE_BASE_ID_WEBHOOKS = "appJ34INj8TdrYu22"; // ✅ NOUVELLE BASE POUR WEBHOOKS

// 🔍 ENDPOINT DE DEBUG : Lister les tables disponibles (CODES PROMO)
app.get("/api/listTables", async (req, res) => {
  try {
    console.log("🔍 Test de connexion à Airtable (CODES PROMO)...");
    console.log("📋 Base ID:", AIRTABLE_BASE_ID_PROMO);
    console.log("🔑 API Key (premiers caractères):", AIRTABLE_API_KEY.substring(0, 15) + "...");
    
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID_PROMO}/tables`, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("📊 Statut de la réponse:", response.status);
    console.log("📊 Réponse complète:", JSON.stringify(data, null, 2));
    
    if (data.tables) {
      console.log("📋 Tables trouvées:");
      data.tables.forEach(table => {
        console.log(`  - "${table.name}" (ID: ${table.id})`);
        if (table.fields) {
          console.log(`    Champs disponibles:`);
          table.fields.forEach(field => {
            console.log(`      - "${field.name}" (Type: ${field.type})`);
          });
        }
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des tables:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔍 NOUVEAU ENDPOINT : Voir le contenu de la table des codes promo
app.get("/api/debugPromoTable", async (req, res) => {
  try {
    console.log("🔍 Debug de la table des codes promo...");
    
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_PROMO}/${AIRTABLE_TABLE_NAME}`;
    
    const response = await fetch(airtableUrl, {
      headers: {
        "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("📊 Statut HTTP de la réponse:", response.status);
    console.log("📊 Réponse complète:", JSON.stringify(data, null, 2));
    
    if (data.records && data.records.length > 0) {
      console.log("📋 Premier enregistrement trouvé:");
      console.log("📋 Champs disponibles:", Object.keys(data.records[0].fields));
      console.log("📋 Données:", JSON.stringify(data.records[0].fields, null, 2));
    }
    
    res.json(data);
  } catch (error) {
    console.error("❌ Erreur lors du debug:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔍 ENDPOINT : Vérifier un code promo (BASE ANCIENNE)
app.post("/api/verifyPromoCode", async (req, res) => {
  const { code } = req.body;
  
  console.log("🚀 ENDPOINT CODES PROMO APPELÉ !");
  console.log("📨 Body reçu:", req.body);
  console.log("🔍 Tentative de vérification du code:", code);
  console.log("🔍 Base utilisée pour codes promo:", AIRTABLE_BASE_ID_PROMO);

  if (!code || !code.trim()) {
    console.log("❌ Code promo vide ou manquant");
    return res.status(400).json({ 
      error: "Code promo requis",
      valid: false 
    });
  }

  try {
    // 📡 Appel à l'API Airtable pour chercher le code (BASE ANCIENNE)
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_PROMO}/${AIRTABLE_TABLE_NAME}`;
    const searchCode = code.trim().toUpperCase();
    
    // ✅ TESTER DIFFÉRENTS NOMS DE CHAMPS POSSIBLES AVEC ENCODAGE CORRECT
    const possibleFieldNames = [
      "Nom du code",
      "Nom%20du%20code", 
      "Code", 
      "code", 
      "Code promo", 
      "Nom", 
      "Name"
    ];
    
    let foundData = null;
    let workingFieldName = null;
    
    // Essayer chaque nom de champ possible
    for (const fieldName of possibleFieldNames) {
      // Encodage manuel pour les espaces
      const encodedFieldName = fieldName.includes(' ') ? 
        fieldName.replace(/ /g, '%20') : 
        fieldName;
      
      const filterFormula = `{${fieldName}}="${searchCode}"`;
      const encodedFormula = encodeURIComponent(filterFormula);
      const fullUrl = `${airtableUrl}?filterByFormula=${encodedFormula}`;
      
      console.log(`🔍 Tentative avec le champ: "${fieldName}"`);
      console.log("📋 Formule de filtrage:", filterFormula);
      console.log("📋 Formule encodée:", encodedFormula);
      console.log("🌐 URL complète:", fullUrl);
      
      const response = await fetch(fullUrl, {
        headers: {
          "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      console.log(`📊 Statut HTTP pour "${fieldName}":`, response.status);
      
      const data = await response.json();
      console.log(`📊 Réponse pour "${fieldName}":`, JSON.stringify(data, null, 2));
      
      if (response.ok && data.records && data.records.length > 0) {
        console.log(`✅ Code trouvé avec le champ: "${fieldName}"`);
        foundData = data;
        workingFieldName = fieldName;
        break;
      } else if (!response.ok) {
        console.log(`❌ Erreur avec le champ "${fieldName}":`, data.error?.message);
        continue;
      } else {
        console.log(`❌ Aucun résultat avec le champ: "${fieldName}"`);
      }
    }

    if (foundData && foundData.records && foundData.records.length > 0) {
      const promoRecord = foundData.records[0].fields;
      
      console.log("✅ Code promo trouvé dans Airtable!");
      console.log(`✅ Champ qui fonctionne: "${workingFieldName}"`);
      console.log("📋 Données du record:", JSON.stringify(promoRecord, null, 2));
      
      // 📊 Extraire les informations du code promo selon les champs de votre table
      const promoInfo = {
        valid: true,
        code: promoRecord["Nom du code"] || promoRecord["Code"] || promoRecord["code"] || searchCode,
        discountPercentage: promoRecord["Montant économisé"] || 0,
        description: `Code promo ${promoRecord["Nom du code"] || searchCode} - ${promoRecord["Montant économisé"] || 0}% de réduction`,
        // Ajoutez d'autres champs selon votre structure Airtable
        origin: promoRecord["Origine"] || "",
        clientName: promoRecord["Détenteur clients"] || "",
        tutorName: promoRecord["Détenteur tuteurs"] || "",
        workingFieldName: workingFieldName // Pour debug
      };

      console.log("✅ Code promo valide retourné:", JSON.stringify(promoInfo, null, 2));
      res.status(200).json(promoInfo);
    } else {
      // Code non trouvé avec aucun des champs
      console.log("❌ Code promo non trouvé:", searchCode);
      console.log("❌ Aucun des noms de champs testés n'a fonctionné");
      res.status(200).json({ 
        valid: false, 
        error: "Code promo invalide ou inexistant",
        debug: `Champs testés: ${possibleFieldNames.join(", ")}`
      });
    }

  } catch (error) {
    console.error("❌ ERREUR COMPLÈTE lors de la vérification du code promo:");
    console.error("❌ Message:", error.message);
    console.error("❌ Stack:", error.stack);
    res.status(500).json({ 
      valid: false, 
      error: "Erreur lors de la vérification du code promo" 
    });
  }
});

// 🔁 Route 1 : Envoi formulaire vers la NOUVELLE BASE - ✅ WEBHOOKS INVERSÉS
app.post("/api/sendToAirtable", async (req, res) => {
  const receivedData = req.body;

  console.log("📨 Données reçues (formulaire demandes):", receivedData);

  // 🔄 TRANSFORMATION DES NOMS DE CHAMPS POUR AIRTABLE
  const payload = {
    "Email": receivedData.email || "",
    "Commentaire": receivedData.comment || "",
    "Code postal": receivedData.postalCode || "",
    "Profil du tuteur": Array.isArray(receivedData.tutorProfile) 
      ? receivedData.tutorProfile.join(", ") 
      : (receivedData.tutorProfile || "")
  };

  console.log("🔄 Données transformées pour Airtable:", payload);

  // ✅ WEBHOOK INVERSÉ - NOUVELLE BASE appJ34INj8TdrYu22
  const webhookUrl = "https://hooks.airtable.com/workflows/v1/genericWebhook/appJ34INj8TdrYu22/wfl3VVnEmHoBLHT0M/wtrFesxsBUA2Yeew8";

  console.log("🚀 Envoi vers le webhook (demandes - INVERSÉ):", webhookUrl);
  console.log("🚀 Base de destination webhooks:", AIRTABLE_BASE_ID_WEBHOOKS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      console.warn("⚠️ Pas de JSON en retour");
      result = { success: true };
    }

    if (!response.ok) {
      throw new Error(result?.error || "Erreur HTTP Airtable");
    }

    console.log("✅ SUCCESS - Formulaire envoyé vers", AIRTABLE_BASE_ID_WEBHOOKS);
    console.log("✅ Réponse:", result);
    
    res.status(200).json({
      message: "✅ Formulaire envoyé vers la NOUVELLE BASE",
      baseDestination: AIRTABLE_BASE_ID_WEBHOOKS,
      webhook: "wfl3VVnEmHoBLHT0M",
      originalData: receivedData,
      transformedData: payload,
      airtableResponse: result,
    });
  } catch (err) {
    console.error("❌ Erreur formulaire:", err);
    res.status(500).json({ error: "Échec d'envoi formulaire" });
  }
});

// 🔁 Route 2 : Envoi dossier complet vers la NOUVELLE BASE - ✅ WEBHOOKS INVERSÉS
app.post("/api/sendFullDataToAirtable", async (req, res) => {
  const receivedData = req.body;

  console.log("📨 Données reçues (dossier complet):", receivedData);

  // 🔄 TRANSFORMATION AUTOMATIQUE DES NOMS DE CHAMPS POUR AIRTABLE
  // Mapping complet JavaScript → Français Airtable
  const fieldMapping = {
    // Champs principaux
    "service": "Service",
    "prenom": "Prénom de l'élève", 
    "classe": "Classe",
    "besoins": "Besoins",
    "particularites": "Particularités",
    "objectifs": "Objectifs",
    "matieres": "Matières",
    "nombreDeCours": "Nombre de cours / semaine",
    "dureeSeances": "Durée des séances", 
    "disponibilites": "Disponibilités",
    "civilite": "Civilité",
    "nomParent": "Nom du parent",
    "telephoneParent": "Téléphone du parent",
    "email": "Email",
    
    // Alternatives possibles
    "prenomEleve": "Prénom de l'élève",
    "prenomDeLeleve": "Prénom de l'élève",
    "nomDuParent": "Nom du parent",
    "telephoneDuParent": "Téléphone du parent",
    "emailParent": "Email",
    "nombreDeCoursParSemaine": "Nombre de cours / semaine",
    "durееDesSeances": "Durée des séances"
  };

  // Transformation systématique
  const payload = {};
  
  // D'abord, copier les champs qui sont déjà au bon format (français)
  Object.keys(receivedData).forEach(key => {
    if (key.includes('é') || key.includes('è') || key.includes('à') || key.includes(' ')) {
      // C'est probablement déjà un nom français
      payload[key] = receivedData[key];
    }
  });
  
  // Ensuite, transformer les champs JavaScript
  Object.keys(receivedData).forEach(key => {
    if (fieldMapping[key]) {
      payload[fieldMapping[key]] = receivedData[key];
      console.log(`🔄 Transformé: ${key} → ${fieldMapping[key]} = "${receivedData[key]}"`);
    } else if (!payload[key]) {
      // Si pas de mapping et pas déjà ajouté, garder tel quel
      payload[key] = receivedData[key];
    }
  });

  console.log("🔄 Données transformées pour Airtable:", payload);
  console.log("📤 Payload final envoyé:", payload);

  // ✅ WEBHOOK INVERSÉ - NOUVELLE BASE appJ34INj8TdrYu22
  const fullWebhookUrl = "https://hooks.airtable.com/workflows/v1/genericWebhook/appJ34INj8TdrYu22/wflMhRDjXdZdcMx3B/wtroAoN7cqbEpjSzX";

  console.log("🚀 Envoi vers le webhook (dossier complet - INVERSÉ):", fullWebhookUrl);
  console.log("🚀 Base de destination webhooks:", AIRTABLE_BASE_ID_WEBHOOKS);

  try {
    const response = await fetch(fullWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      console.warn("⚠️ Pas de JSON en retour");
      result = { success: true };
    }

    if (!response.ok) {
      throw new Error(result?.error || "Erreur HTTP Airtable");
    }

    console.log("✅ SUCCESS - Dossier complet envoyé vers", AIRTABLE_BASE_ID_WEBHOOKS);
    console.log("✅ Réponse:", result);
    
    res.status(200).json({
      message: "✅ Dossier complet envoyé vers la NOUVELLE BASE",
      baseDestination: AIRTABLE_BASE_ID_WEBHOOKS,
      webhook: "wflMhRDjXdZdcMx3B",
      originalData: receivedData,
      transformedData: payload,
      airtableResponse: result,
    });
  } catch (err) {
    console.error("❌ Erreur dossier complet:", err);
    res.status(500).json({ error: "Échec d'envoi dossier complet" });
  }
});

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log("");
  console.log("📋 CONFIGURATION MULTI-BASES:");
  console.log(`   🔍 Codes promo: ${AIRTABLE_BASE_ID_PROMO} (base ancienne)`);
  console.log(`   📤 Webhooks: ${AIRTABLE_BASE_ID_WEBHOOKS} (base nouvelle)`);
  console.log("");
  console.log("🎯 ENDPOINTS DISPONIBLES:");
  console.log("   📋 CODES PROMO:");
  console.log(`     - POST /api/verifyPromoCode → Vérifier code promo`);
  console.log(`     - GET  /api/listTables → Debug tables`);
  console.log(`     - GET  /api/debugPromoTable → Debug codes promo`);
  console.log("   📤 WEBHOOKS (avec transformation des champs):");
  console.log(`     - POST /api/sendToAirtable → Formulaire demandes`);
  console.log(`     - POST /api/sendFullDataToAirtable → Dossier complet`);
  console.log("");
  console.log("🔄 TRANSFORMATION DES CHAMPS ACTIVÉE:");
  console.log("   - email → Email");
  console.log("   - comment → Commentaire");
  console.log("   - postalCode → Code postal");
  console.log("   - tutorProfile → Profil du tuteur");
  console.log("   - prenom → Prénom de l'élève (etc.)");
  console.log("");
  console.log("🚨 SERVEUR COMPLET ET FONCTIONNEL !");
  console.log("✅ Codes promo: BASE ANCIENNE (appLAFIAMjHg6ZEuQ)");
  console.log("✅ Webhooks: BASE NOUVELLE (appJ34INj8TdrYu22)");
});