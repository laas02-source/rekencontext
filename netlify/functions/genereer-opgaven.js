// netlify/functions/genereer-opgaven.js
// Netlify serverless function — roept de Anthropic API aan om contextrijke rekenopgaven te genereren.
// De API-sleutel staat in een Netlify environment variable (ANTHROPIC_API_KEY), nooit in de frontend.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ─────────────────────────────────────────────────────────────────
// DOMEINOMSCHRIJVINGEN — gebaseerd op Rekeneisen mbo 2020
// Inclusief wat het domein NIET is, om domeinvermenging te voorkomen
// ─────────────────────────────────────────────────────────────────
const DOMEIN_CONTEXT = {
  'Grootheden en eenheden': `
WAT DIT DOMEIN IS:
Meten en omrekenen van gangbare grootheden (lengte, gewicht, tijd, temperatuur, inhoud).
Kiezen van een passende eenheid en meetinstrument.
Werken met woordformules die het verband tussen twee grootheden beschrijven.
Gebruik van referentiematen ("een pak melk is ongeveer 1 liter").

WAT DIT DOMEIN NIET IS:
Geen oppervlakte- of inhoudsberekeningen van ruimtes (dat is Oriëntatie 2D/3D).
Geen procenten of verhoudingen als hoofdrekenhandeling.
Geen statistische grootheden (gemiddelde, mediaan).

GOEDE VOORBEELDEN PER NIVEAU:
- Entree/2: Hoeveel milliliter zit er in 3 flesjes van elk 330 ml? Welk meetinstrument gebruik je om de temperatuur van een maaltijd te meten?
- Niveau 3: Een recept vraagt 1,5 dl olie. Je hebt alleen een maatbeker in ml. Hoeveel ml meet je af? De rijsnelheid is 80 km/u en de afstand is 52 km. Hoe lang ben je onderweg?
- Niveau 4: De aanbevolen dagdosis paracetamol is 4 gram, verdeeld over maximaal 4 doses. Hoeveel mg per keer is toegestaan? Bereken ook of 3 tabletten van 500 mg per keer veilig is.`,

  'Oriëntatie in de 2D/3D-wereld': `
WAT DIT DOMEIN IS:
Omtrek, oppervlakte en inhoud bepalen van eenvoudige figuren (rechthoek, kubus, balk).
Plattegronden, kaarten en werktekeningen lezen en interpreteren.
Schatten, meten of berekenen van ruimtelijke grootheden in functionele situaties.
Kiezen van de juiste grootheid: wanneer gebruik je omtrek, wanneer oppervlakte, wanneer inhoud?

WAT DIT DOMEIN NIET IS:
Geen complexe samengestelde vormen met meerdere berekeningen achter elkaar (dat is niveau 4).
Geen procenten of verhoudingen als hoofdrekenhandeling.
Geen beroepssituaties die buiten de daadwerkelijke taken van de opleiding vallen.

NIVEAUGRENS NIVEAU 3: maximaal 2 aaneengesloten rekenhandelingen. De situatie is herkenbaar. Figuren zijn rechthoekig of rechthoekig samengesteld. Getallen mogen decimaal zijn maar niet te lastig (bijv. 4,5 × 3,2). Geen procentuele correcties combineren met ruimtelijke berekeningen.

GOEDE VOORBEELDEN PER NIVEAU:
- Entree/2: Een kamer is 4 bij 5 meter. Hoeveel m² vloerbedekking heb je nodig? Hoeveel meter plint gaat er langs de muur?
- Niveau 3: Een bewonerskamer is 3,6 bij 4,2 meter. Het bed (2,0 × 0,9 m) staat tegen de lange wuur. Hoeveel vloeroppervlak blijft er over?
- Niveau 4: Je wilt een kast (1,8 × 0,6 m) en een rolstoel (1,2 × 0,7 m) kwijt in de resterende ruimte. Past dat? Leg uit hoe je dat bepaalt.`,

  'Verhoudingen': `
WAT DIT DOMEIN IS:
Recepten en hoeveelheden opschalen of terugschalen.
Rekenen met per-eenheden: prijs per stuk, mg per kg lichaamsgewicht, liter per persoon.
Evenredigheid herkennen en gebruiken (als je meer personen hebt, heb je meer ingrediënten nodig).
Verhoudingstabellen gebruiken als rekenmodel.
Omzetten tussen verschijningsvormen: "1 op de 5" = breuk = decimaal.

WAT DIT DOMEIN NIET IS:
Geen procenten als hoofdrekenhandeling (dat is Procenten).
Geen oppervlakte- of inhoudsberekeningen.
Geen complexe meerstapsredenering waarbij de student de structuur volledig zelf moet bepalen (dat is niveau 4).

NIVEAUGRENS NIVEAU 2: één verhouding, één rekenhandeling, mooie getallen (bijv. van 4 naar 8 personen).
NIVEAUGRENS NIVEAU 3: één verhouding, maximaal twee stappen, decimale getallen toegestaan, student kiest zelf aanpak.

GOEDE VOORBEELDEN PER NIVEAU:
- Entree/2: Een recept voor 4 personen vraagt 200 gram rijst. Hoeveel gram heb je nodig voor 8 personen?
- Niveau 3: Een bewoner krijgt 10 mg medicijn per kg lichaamsgewicht. De bewoner weegt 68 kg. De tabletten zijn 200 mg per stuk. Hoeveel tabletten geef je?
- Niveau 4: Bij instelling A zijn 3 van de 8 medewerkers deeltijds. Bij instelling B zijn 12 van de 35 medewerkers deeltijds. Welke instelling heeft verhoudingsgewijs meer deeltijdse medewerkers?`,

  'Procenten': `
WAT DIT DOMEIN IS:
Een percentage nemen van een bedrag of hoeveelheid.
Procentuele toe- of afname berekenen (korting, toeslag, groei).
Begrijpen wat 100% is in een situatie — welk getal is het geheel?
Op niveau 3: ook terugrekenen van deel naar geheel met eenvoudige percentages.
Op niveau 4: terugrekenen naar 100%, percentages boven 100%, BTW excl. naar incl.

WAT DIT DOMEIN NIET IS:
Geen verhoudingen of recepten als hoofdinhoud.
Geen gestapelde procentberekeningen op niveau 2 of 3 (bijv. 15% van 40% van...).

NIVEAUGRENS NIVEAU 2: percentage is gegeven, het geheel is gegeven, één berekening. Mooie percentages: 10%, 25%, 50%.
NIVEAUGRENS NIVEAU 3: percentage en geheel zijn gegeven, maximaal twee stappen. Percentage mag onregelmatig zijn (bijv. 15%, 21%).

GOEDE VOORBEELDEN PER NIVEAU:
- Entree/2: Een boodschap kost €24. Je krijgt 25% korting. Hoeveel betaal je?
- Niveau 3: Een zorginstelling heeft 40 medewerkers. 15% werkt in de nachtdienst. Hoeveel medewerkers is dat? Hoeveel werken er dan overdag?
- Niveau 4: De prijs van een zorgproduct is €36,30 inclusief 21% BTW. Wat is de prijs exclusief BTW?`,

  'Omgaan met kwantitatieve informatie': `
WAT DIT DOMEIN IS:
Gegevens aflezen uit tabellen, grafieken, schema's of formulieren.
Informatie interpreteren: wat betekent dit getal in deze situatie?
Conclusies trekken op basis van cijfermatige informatie.
Eenvoudige berekeningen uitvoeren met afgelezen gegevens.
Op niveau 4: meerdere bronnen combineren, informatie kritisch beoordelen.

WAT DIT DOMEIN NIET IS:
Geen berekeningen die buiten het afgelezen materiaal gaan.
Geen statistisch berekenen (gemiddelde uitrekenen is niet vereist — alleen interpreteren).

NIVEAUGRENS NIVEAU 2: eenvoudige tabel of schema, één gegeven aflezen, directe vraag.
NIVEAUGRENS NIVEAU 3: tabel met meerdere kolommen, student combineert twee gegevens, eenvoudige berekening.

GOEDE VOORBEELDEN PER NIVEAU:
- Entree/2: Bekijk het rooster. Hoeveel uur werkt Fatima op dinsdag? Hoeveel uur werkt ze in totaal deze week?
- Niveau 3: Bekijk de voedingswaardentabel. Hoeveel calorieën zitten er in een portie van 150 gram? De aanbevolen dagelijkse hoeveelheid is 2000 kcal. Welk percentage van de dagdosis levert deze portie?
- Niveau 4: Vergelijk de twee zorgplannen in de tabel. Welk plan is gunstiger voor een bewoner die 3 nachten per week extra zorg nodig heeft? Bereken het verschil in kosten per maand.`
};

// ─────────────────────────────────────────────────────────────────
// NIVEAUBESCHRIJVINGEN — gebaseerd op Rekeneisen mbo 2020
// Vier dimensies per niveau: situatie, getallen, stappen, structuur
// ─────────────────────────────────────────────────────────────────
const NIVEAU_COMPLEXITEIT = {
  'entree': `
SITUATIE: Zeer herkenbaar, dicht bij eigen leefwereld. Eén duidelijke vraag.
GETALLEN: Alleen hele getallen. Geen decimalen, geen breuken.
STAPPEN: Maximaal één rekenhandeling. Geen tussenstappen nodig.
STRUCTUUR: De aanpak ligt volledig voor de hand. Student hoeft niets te kiezen.
VOORBEELD GOEDE COMPLEXITEIT: "Je koopt 3 pakken melk van elk €1,20. Wat kost dat in totaal?"
VOORBEELD VERKEERDE COMPLEXITEIT (te moeilijk): alles met decimalen, meerdere stappen, of zelf structureren.`,

  'niveau 2': `
SITUATIE: Herkenbaar en direct. Context is eenduidig. Geen verrassingen.
GETALLEN: Voornamelijk hele getallen. Decimalen alleen als ze gangbaar zijn (bijv. €12,50 of 1,5 liter).
STAPPEN: Maximaal twee rekenhandelingen. Elke stap is duidelijk.
STRUCTUUR: De aanpak is voor de hand liggend. Student hoeft niet te kiezen tussen aanpakken.
VOORBEELD GOEDE COMPLEXITEIT: "Een zak aardappelen weegt 2,5 kg en kost €1,80 per kg. Wat kost de zak?"
VOORBEELD VERKEERDE COMPLEXITEIT (te moeilijk voor niveau 2): terugrekenen, zelf structureren, drie of meer stappen.`,

  'niveau 3': `
SITUATIE: Herkenbaar maar iets complexer. Context bevat relevante én niet direct relevante informatie.
GETALLEN: Decimale getallen zijn normaal. Getallen zijn realistisch maar niet te lastig (bijv. 68 kg, 3,6 meter, €24,50).
STAPPEN: Twee tot drie rekenhandelingen. Student kiest zelf een aanpak maar de structuur is nog herkenbaar.
STRUCTUUR: Student moet nadenken over welke stap eerst komt, maar de opgave stuurt dit impliciet.
BELANGRIJK: Combineer NOOIT twee verschillende rekendomeinen in één opgave op dit niveau. Blijf strikt binnen het opgegeven domein.
VOORBEELD GOEDE COMPLEXITEIT: "Een bewoner weegt 68 kg en krijgt 10 mg per kg per dag in 3 doses. Hoeveel mg per dosis?"
VOORBEELD VERKEERDE COMPLEXITEIT (te moeilijk voor niveau 3): student moet zelf de structuur volledig bepalen, vier of meer stappen, domeinen combineren.`,

  'niveau 4': `
SITUATIE: Kan minder vertrouwd zijn. Bevat afleidende informatie die de student zelf moet filteren.
GETALLEN: Complexere getallen en bewerkingen. Decimalen, onregelmatige percentages.
STAPPEN: Drie of meer rekenhandelingen. Student structureert het rekenproces volledig zelf.
STRUCTUUR: Student bepaalt zelf de aanpak. Terugrekenen of meerstapsredenering verwacht. Antwoord terugkoppelen aan situatie.
VOORBEELD GOEDE COMPLEXITEIT: "De prijs inclusief 21% BTW is €48,40. Wat is de prijs exclusief BTW? Hoeveel zou je besparen als je als instelling 8% korting krijgt op de excl. BTW-prijs?"`
};

exports.handler = async function(event, context) {
  // Alleen POST-verzoeken accepteren
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // CORS headers voor lokale ontwikkeling en productie
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ongeldig verzoek' }) };
  }

  const { crebo, opleidingsnaam, niveau, domein, sector, kerntaken } = body;

  // Validatie
  if (!opleidingsnaam || !niveau || !domein) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Opleiding, niveau en domein zijn verplicht' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API-sleutel niet geconfigureerd' }) };
  }

  // Bouw de systeemprompt op
  const systeemPrompt = `Je bent een expert rekendidacticus voor het Nederlandse mbo met diepgaande kennis van de Rekeneisen mbo 2020 (Expertgroep Herijking Rekeneisen, OCW).

JE TAAK:
Maak precies 3 contextrijke rekenopgaven die voldoen aan strikte didactische en vakinhoudelijke eisen.

STRIKTE REGELS — deze gelden altijd:

1. BEROEPSCONTEXT: De situatie moet iets zijn wat een student van deze opleiding daadwerkelijk tegenkomt op de werkvloer. Niet wat iemand anders doet. Niet wat theoretisch mogelijk is. Wat deze student op een gewone werkdag doet.

2. DOMEINZUIVERHEID: Elke opgave gebruikt precies één functioneel rekendomein. Combineer nooit twee domeinen in één opgave. Als het domein "Verhoudingen" is, mag er geen procentberekening in de hoofdvraag zitten. Als het domein "Oriëntatie 2D/3D" is, mag er geen procentuele correctie aan worden toegevoegd.

3. NIVEAUBEWAKING: Pas de complexiteit strikt aan op het opgegeven niveau. Te moeilijk is even fout als te makkelijk. Controleer voor jezelf: hoeveel rekenhandelingen zijn er? Zijn de getallen passend? Kan een student van dit niveau dit begrijpen?

4. BEREKENBAAR EN REALISTISCH: Elk antwoord moet met de hand uitrekenbaar zijn door een mbo-student. Controleer zelf of de getallen kloppen en of het antwoord realistisch is in de beroepspraktijk.

5. DRIE VERSCHILLENDE SITUATIES: De drie opgaven mogen niet op elkaar lijken. Kies drie verschillende situaties, werkhandelingen of contexten binnen hetzelfde beroep.

OUTPUT FORMAAT — geef ALLEEN een JSON-array, geen andere tekst:
[
  {
    "titel": "korte titel max 7 woorden",
    "contextbeschrijving": "2-3 zinnen die de werksituatie schetsen. Realistisch, herkenbaar voor de student.",
    "vraag": "de concrete rekenopgave in 1-2 zinnen. Helder en eenduidig.",
    "tags": ["domeinnaam", "niveau", "beroepsnaam"]
  }
]`;

  // Bouw de gebruikersprompt op
  const domeinInfo = DOMEIN_CONTEXT[domein] || domein;
  const niveauInfo = NIVEAU_COMPLEXITEIT[niveau.toLowerCase()] || niveau;
  const creboInfo = crebo ? ` (crebo ${crebo})` : '';

  // Bouw kerntaken-sectie op als die beschikbaar zijn
  let kerntakenSectie = '';
  if (kerntaken && Array.isArray(kerntaken) && kerntaken.length > 0) {
    const regels = kerntaken.map(kt => {
      const wps = kt.werkprocessen && kt.werkprocessen.length > 0
        ? kt.werkprocessen.map(wp => `    → ${wp}`).join('\n')
        : '';
      return `  • ${kt.titel}${wps ? '\n' + wps : ''}`;
    }).join('\n');
    kerntakenSectie = `
━━━ OFFICIËLE KERNTAKEN UIT HET KWALIFICATIEDOSSIER (SBB) ━━━
Dit zijn de werkelijke taken die een ${opleidingsnaam}-student uitvoert.
Baseer de beroepscontext van je opgaven uitsluitend op deze taken en werkprocessen.

${regels}

BELANGRIJK: Gebruik alleen situaties die direct voortkomen uit bovenstaande kerntaken.
Verzin geen taken die hier niet in staan.`;
  }

  const gebruikersPrompt = `Maak 3 contextrijke rekenopgaven met de volgende specificaties:

━━━ OPLEIDING ━━━
Naam: ${opleidingsnaam}${creboInfo}
Sector: ${sector || 'niet opgegeven'}
Mbo-niveau: ${niveau}
${kerntakenSectie}
━━━ FUNCTIONEEL REKENDOMEIN ━━━
${domein}

${domeinInfo}

━━━ NIVEAUEISEN ━━━
${niveauInfo}

━━━ ZELFTESTS VOOR JE ANTWOORD ━━━
Controleer elke opgave op deze vragen voordat je hem opneemt:
✓ Zou een ${opleidingsnaam}-student deze situatie herkennen van de werkvloer?${kerntaken ? '\n✓ Komt de situatie direct voort uit één van de kerntaken hierboven?' : ''}
✓ Bevat de opgave ALLEEN rekenhandelingen uit het domein "${domein}"?
✓ Past het aantal stappen en de moeilijkheid van de getallen bij ${niveau}?
✓ Is het antwoord realistisch en met de hand berekenbaar?
✓ Verschilt deze situatie duidelijk van de andere twee opgaven?

Geef nu de 3 opgaven als JSON-array.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systeemPrompt,
        messages: [
          { role: 'user', content: gebruikersPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI-service tijdelijk niet beschikbaar' }) };
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    // Parse de JSON uit het antwoord — verwijder eventuele markdown code fences
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let opgaven;
    try {
      opgaven = JSON.parse(clean);
    } catch {
      console.error('JSON parse error, raw:', rawText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Kon de gegenereerde opgaven niet verwerken. Probeer opnieuw.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ opgaven })
    };

  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Verbindingsfout met AI-service' }) };
  }
};
