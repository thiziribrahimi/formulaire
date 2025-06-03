const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // Assure-toi d'avoir node-fetch@2 installé

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// ✅ AIRTABLE CONFIG POUR LES CODES PROMO - CORRIGÉ
const AIRTABLE_BASE_ID = "appLAFIAMjHg6ZEuQ"; // ✅ BASE ID CORRECT
const AIRTABLE_TABLE_NAME = "tblZxqrnc80BmO6Dg"; // ✅ NOUVEAU ID DE TABLE CORRIGÉ
const AIRTABLE_API_KEY = "patzYVfCYwQWH3Mng.7ca9bb3a21a7976826e5a395e4ac4c01649307f3638b8f463e6d774a5de5f598"; // Votre jeton personnel

// 🔍 ENDPOINT DE DEBUG : Lister les tables disponibles
app.get("/api/listTables", async (req, res) => {
  try {
    console.log("🔍 Test de connexion à Airtable...");
    console.log("📋 Base ID:", AIRTABLE_BASE_ID);
    console.log("🔑 API Key (premiers caractères):", AIRTABLE_API_KEY.substring(0, 15) + "...");
    
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
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
    
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    
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

// 🔍 ENDPOINT : Vérifier un code promo
app.post("/api/verifyPromoCode", async (req, res) => {
  const { code } = req.body;
  
  console.log("🚀 ENDPOINT APPELÉ !");
  console.log("📨 Body reçu:", req.body);
  console.log("🔍 Tentative de vérification du code:", code);

  if (!code || !code.trim()) {
    console.log("❌ Code promo vide ou manquant");
    return res.status(400).json({ 
      error: "Code promo requis",
      valid: false 
    });
  }

  try {
    // 📡 Appel à l'API Airtable pour chercher le code
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
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

// 🔁 Route 1 : Envoi partiel (formulaire final)
app.post("/api/sendToAirtable", async (req, res) => {
  const payload = req.body;

  console.log("📨 Données reçues (final form) :", payload);

  const webhookUrl =
    "https://hooks.airtable.com/workflows/v1/genericWebhook/appZ5bv5TO84S1PtP/wflTHCMH9L6X2qYAV/wtrFSmrHH8ns2LxSw";

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
      console.warn("⚠️ Airtable (final form) n'a pas renvoyé de JSON.");
      result = { success: true };
    }

    if (!response.ok) {
      throw new Error(result?.error || "Erreur HTTP Airtable (final form)");
    }

    console.log("✅ Réponse Airtable (final form) :", result);
    res.status(200).json({
      message: "Formulaire final envoyé avec succès",
      airtableResponse: result,
    });
  } catch (err) {
    console.error("❌ Erreur (final form) :", err);
    res.status(500).json({ error: "Échec d'envoi vers le webhook final form" });
  }
});

// 🔁 Route 2 : Envoi complet du dossier
app.post("/api/sendFullDataToAirtable", async (req, res) => {
  const payload = req.body;

  console.log("📨 Données reçues (dossier complet) :", payload);

  const fullWebhookUrl =
    "https://hooks.airtable.com/workflows/v1/genericWebhook/appZ5bv5TO84S1PtP/wflHx1Pcgbb3NbCgo/wtrtILucOysyNwbyZ";

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
      console.warn("⚠️ Airtable (dossier complet) n'a pas renvoyé de JSON.");
      result = { success: true };
    }

    if (!response.ok) {
      throw new Error(result?.error || "Erreur HTTP Airtable (dossier complet)");
    }

    console.log("✅ Réponse Airtable (dossier complet) :", result);
    res.status(200).json({
      message: "Dossier complet envoyé avec succès",
      airtableResponse: result,
    });
  } catch (err) {
    console.error("❌ Erreur (dossier complet) :", err);
    res
      .status(500)
      .json({ error: "Échec d'envoi vers le webhook dossier complet" });
  }
});

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`🔍 Endpoint code promo: http://localhost:${PORT}/api/verifyPromoCode`);
  console.log(`🔍 Endpoint debug tables: http://localhost:${PORT}/api/listTables`);
  console.log(`🔍 Endpoint debug table promo: http://localhost:${PORT}/api/debugPromoTable`);
  console.log(`📋 Configuration Airtable:`);
  console.log(`   - Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`   - Table: "${AIRTABLE_TABLE_NAME}"`);
  console.log(`   - API Key: ${AIRTABLE_API_KEY.substring(0, 15)}...`);
});