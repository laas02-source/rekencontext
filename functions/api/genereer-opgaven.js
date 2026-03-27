// functions/api/genereer-opgaven.js
// Cloudflare Pages Function — roept de Anthropic API aan om contextrijke rekenopgaven te genereren.
// v2: dynamische stappen voor niveau 3-tabel, NT2 als tweede aanroep, Word-export data
// Gemigreerd van Netlify naar Cloudflare Pages Functions.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const DOMEIN_CONTEXT = {
  'Grootheden en eenheden': `
WAT DIT DOMEIN IS:
Meten en omrekenen van gangbare grootheden (lengte, gewicht, tijd, temperatuur, inhoud).
Kiezen van een passende eenheid en meetinstrument.
Werken met woordformules die het verband tussen twee grootheden beschrijven (bijv. snelheid = afstand / tijd).
Omrekenen tussen eenheden van dezelfde grootheid (ml naar dl, gram naar kg, minuten naar uren).

WAT DIT DOMEIN NIET IS:
Geen oppervlakte- of inhoudsberekeningen van ruimtes (dat is Orientatie 2D/3D).
Geen procenten of verhoudingen als hoofdrekenhandeling.
Geen statistische grootheden (gemiddelde, mediaan).
Geen enkelvoudige vermenigvuldiging van hoeveelheden zonder eenheidsomrekening (dat is Verhoudingen).

NIVEAUGRENS NIVEAU 2: een eenheid omrekenen of een woordformule toepassen, eenvoudige getallen.
Voorbeeld niveau 2: Een medicijn moet 15 minuten werken. Hoeveel seconden is dat?

NIVEAUGRENS NIVEAU 3: twee stappen waarbij eenheidsomrekening en berekening worden gecombineerd.
Student kiest zelf welke stap eerst. Voorbeeld niveau 3: Een bewoner mag maximaal 2,4 gram paracetamol
per dag. De tabletten zijn 500 mg per stuk. Hoeveel tabletten mag de bewoner maximaal per dag innemen?

GOEDE NIVEAU 3-VOORBEELDEN:
- Medicatiedosering: gram naar mg omrekenen, dan aantal tabletten bepalen
- Werktijden: uren en minuten omrekenen, dan totale werktijd berekenen
- Voeding: dl naar ml omrekenen, dan hoeveelheid voor aantal porties bepalen

FOUTE NIVEAU 3-VOORBEELDEN:
- Hoeveel m2 is een kamer van 4 bij 5 meter? (dat is Orientatie 2D/3D)
- Bereken hoeveel procent korting je krijgt (dat is Procenten)
- Schaal het recept op van 4 naar 10 personen (dat is Verhoudingen)`,

  'Orientatie in de 2D/3D-wereld': `
WAT DIT DOMEIN IS:
Omtrek, oppervlakte en inhoud bepalen van eenvoudige figuren (rechthoek, kubus, balk).
Plattegronden en werktekeningen lezen en interpreteren.
Ruimtelijke grootheden berekenen in functionele beroepssituaties.
Vergelijken van benodigde ruimte met beschikbare ruimte (past het? hoeveel blijft er over?).

WAT DIT DOMEIN NIET IS:
Geen procenten of verhoudingen als hoofdrekenhandeling.
Geen beroepssituaties buiten de daadwerkelijke taken van de opleiding.
Geen losse volumeberekening van een enkel object als enige handeling (dat is niveau 2).
Geen omtrek van een rechthoek met hele getallen als enige handeling (dat is niveau 2).

NIVEAUGRENS NIVEAU 2: een ruimtelijke berekening, eenvoudige getallen, directe vraag.
Voorbeeld niveau 2: Een kamer is 4 bij 5 meter. Hoeveel m2 vloerbedekking heb je nodig?

NIVEAUGRENS NIVEAU 3: twee tot drie samenhangende stappen. Student bepaalt zelf welke maten relevant zijn.
Getallen zijn decimaal en realistisch. Er is een vergelijking of beslissing nodig (past het? hoeveel blijft over?).
Voorbeeld niveau 3: Kamer 3,8 x 2,4 m. Bed 2,1 x 1,0 m. Aan beide zijden moet 90 cm vrij blijven. Past dat?

GOEDE NIVEAU 3-VOORBEELDEN:
- Bewonerskamer inrichten: kamerafmetingen min meerdere meubels, vergelijken met loopruimtenorm
- Wondmateriaal bepalen: wondmaten plus overlap aan alle zijden, dan benodigde foliegrootte
- Hulpmiddel plaatsen: tillift inclusief werkruimte rondom, past het in de beschikbare ruimte?
- Activiteitenruimte plannen: hoeveel stoelen passen er met voldoende loopruimte?

FOUTE NIVEAU 3-VOORBEELDEN:
- Bereken de inhoud van een doos van 12 x 8 x 6 cm (een berekening, niveau 2)
- Hoeveel meter loopt u om een tuin van 25 x 18 m? (omtrek, niveau 2)
- Bereken het oppervlak van een pad met 5% helling (procenten combineren, domeinvermenging)`,

  'Verhoudingen': `
WAT DIT DOMEIN IS:
Recepten en hoeveelheden opschalen of terugschalen.
Rekenen met per-eenheden: prijs per stuk, mg per kg lichaamsgewicht, liter per persoon.
Evenredigheid herkennen: als je meer personen hebt, heb je meer ingredienten nodig.
Verhoudingstabellen gebruiken als rekenmodel.

WAT DIT DOMEIN NIET IS:
Geen procenten als hoofdrekenhandeling (dat is het domein Procenten).
Geen eenheidsomrekeningen als hoofdhandeling (dat is Grootheden en eenheden).
Geen oppervlakte- of inhoudsberekeningen.

NIVEAUGRENS NIVEAU 2: een verhouding toepassen, mooie getallen (verdubbelen, halveren).
Voorbeeld niveau 2: Een recept voor 4 personen vraagt 200 g rijst. Hoeveel gram voor 8 personen?

NIVEAUGRENS NIVEAU 3: verhoudingsredenering met niet-ronde getallen, of twee stappen.
Voorbeeld niveau 3: Een bewoner weegt 68 kg en krijgt 1,5 mg per kg per dag in 3 doses. Hoeveel mg per dosis?

GOEDE NIVEAU 3-VOORBEELDEN:
- Medicatiedosering per kg: gewicht maal dosering per kg, dan delen door aantal doses
- Maaltijden voor niet-rond aantal gasten: basisrecept opschalen met decimale factor
- Materiaalverbruik: prijs of hoeveelheid per eenheid maal aantal, met decimale getallen

FOUTE NIVEAU 3-VOORBEELDEN:
- Bereken de korting van 15% op een product (dat is Procenten)
- Reken 1,5 dl om naar ml (dat is Grootheden en eenheden)
- Hoeveel m2 is de keuken? (dat is Orientatie 2D/3D)`,

  'Procenten': `
WAT DIT DOMEIN IS:
Een percentage nemen van een bedrag of hoeveelheid.
Procentuele toe- of afname berekenen (korting, toeslag, BTW, salarisverhoging).
Begrijpen wat 100% is in een situatie.
Op niveau 3: een procentuele verandering in twee stappen berekenen.
Op niveau 4: terugrekenen van deel naar geheel, percentages boven 100%.

WAT DIT DOMEIN NIET IS:
Geen verhoudingen of recepten als hoofdinhoud (dat is Verhoudingen).
Geen eenheidsomrekeningen (dat is Grootheden en eenheden).
Geen tabellen of grafieken lezen als hoofdtaak (dat is Omgaan met kwantitatieve informatie).
Geen gestapelde procentberekeningen op niveau 2 of 3.

NIVEAUGRENS NIVEAU 2: een procentberekening, mooie percentages (10%, 25%, 50%).
Voorbeeld niveau 2: Een boodschap kost 40 euro. Je krijgt 25% korting. Wat betaal je?

NIVEAUGRENS NIVEAU 3: twee stappen, onregelmatige percentages (15%, 21%, 8%) toegestaan.
Voorbeeld niveau 3: Een instelling heeft 45 medewerkers. Door ziekte werkt 13% niet.
Hoeveel zijn aanwezig? Is dat genoeg als de norm minimaal 40 medewerkers is?

GOEDE NIVEAU 3-VOORBEELDEN:
- Ziekteverzuim: percentage afwezig berekenen, vergelijken met bezettingsnorm
- Prijsverhoging: nieuw bedrag na procentuele stijging, vergelijken met budget
- Kortingsactie: korting berekenen, nieuwe prijs bepalen en vergelijken

FOUTE NIVEAU 3-VOORBEELDEN:
- Een bewoner weegt 68 kg en krijgt 10 mg per kg. Hoeveel tabletten? (dat is Verhoudingen)
- Reken de prijs exclusief 21% BTW terug (dat is niveau 4, niet 3)`,

  'Omgaan met kwantitatieve informatie': `
WAT DIT DOMEIN IS:
Gegevens aflezen uit tabellen, grafieken, roosters, schema's of formulieren.
Informatie interpreteren: wat betekent dit getal in deze situatie?
Conclusies trekken op basis van cijfermatige informatie.
Eenvoudige berekeningen uitvoeren met de afgelezen gegevens (optellen, aftrekken, vergelijken).
Op niveau 4: meerdere bronnen combineren, informatie kritisch beoordelen.

WAT DIT DOMEIN NIET IS:
Geen berekeningen los van een tabel of grafiek - er MOET altijd een bron zijn om uit te lezen.
Geen gemiddelden berekenen als hoofdtaak.
Geen procentberekeningen als hoofdhandeling (dat is Procenten).
Geen verhoudingsredenering zonder tabel als basis (dat is Verhoudingen).

NIVEAUGRENS NIVEAU 2: eenvoudige tabel of rooster, een waarde aflezen, directe vraag.
Voorbeeld niveau 2: Bekijk het dienstrooster. Hoeveel uur werkt Fatima op dinsdag?

NIVEAUGRENS NIVEAU 3: tabel met meerdere kolommen, student combineert twee afgelezen waarden,
maakt een eenvoudige berekening of vergelijking.
Voorbeeld niveau 3: Bekijk de voedingswaardentabel. Een bewoner mag maximaal 2000 kcal per dag.
Ze eet 180 g yoghurt en 60 g muesli. Hoeveel kcal heeft ze al gehad? Hoeveel mag ze nog?

GOEDE NIVEAU 3-VOORBEELDEN:
- Dienstrooster: totale uren per week berekenen uit afgelezen daguren
- Voedingswaardentabel: totaal calorieeen van meerdere producten optellen en vergelijken met norm
- Medicatieschema: aflezen wanneer welk middel gegeven moet worden, tijdsverschil berekenen

FOUTE NIVEAU 3-VOORBEELDEN:
- Bereken hoeveel procent van de dagdosis dit is (dat is Procenten)
- Schaal de hoeveelheid op naar 12 personen (dat is Verhoudingen)
- Opgave zonder tabel, grafiek of schema (altijd een bron meegeven)`
};

const NIVEAU_COMPLEXITEIT = {
  'entree': `
SITUATIE: Zeer herkenbaar, dicht bij eigen leefwereld. Een duidelijke vraag.
GETALLEN: Alleen hele getallen. Geen decimalen, geen breuken.
STAPPEN: Maximaal een rekenhandeling. Geen tussenstappen nodig.
STRUCTUUR: De aanpak ligt volledig voor de hand. Student hoeft niets te kiezen.`,

  'niveau 2': `
SITUATIE: Herkenbaar en direct. Context is eenduidig. Geen verrassingen.
GETALLEN: Voornamelijk hele getallen. Decimalen alleen als ze gangbaar zijn (bijv. 12,50 euro of 1,5 liter).
STAPPEN: Maximaal twee rekenhandelingen. Elke stap is duidelijk.
STRUCTUUR: De aanpak is voor de hand liggend. Student hoeft niet te kiezen tussen aanpakken.`,

  'niveau 3': `
SITUATIE: Herkenbaar maar iets complexer. Context bevat relevante en niet direct relevante informatie.
GETALLEN: Decimale getallen zijn normaal. Getallen zijn realistisch (bijv. 68 kg, 3,6 meter, 24,50 euro).
STAPPEN: Twee tot drie rekenhandelingen. Student kiest zelf een aanpak maar de structuur is herkenbaar.
STRUCTUUR: Student moet nadenken over welke stap eerst komt.
BELANGRIJK: Combineer NOOIT twee verschillende rekendomeinen in een opgave op dit niveau.`,

  'niveau 4': `
SITUATIE: Kan minder vertrouwd zijn. Bevat afleidende informatie die de student zelf moet filteren.
GETALLEN: Complexere getallen en bewerkingen. Decimalen, onregelmatige percentages.
STAPPEN: Drie of meer rekenhandelingen. Student structureert het rekenproces volledig zelf.
STRUCTUUR: Student bepaalt zelf de aanpak. Terugrekenen of meerstapsredenering verwacht.`
};

// ─── CORS-HEADERS ────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ─── HOOFD-HANDLER (Cloudflare Pages Functions) ──────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders(),
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Ongeldig verzoek' }), { status: 400, headers });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API-sleutel niet geconfigureerd' }), { status: 500, headers });
  }

  // Route: NT2-aanpassing als aparte aanroep
  if (body.mode === 'nt2') {
    return await handleNt2(body, apiKey, headers);
  }

  // Standaard: opgaven genereren
  return await handleOpgaven(body, apiKey, headers);
}

// ─── OPGAVEN GENEREREN ───────────────────────────────────────────────────────

async function handleOpgaven(body, apiKey, headers) {
  const { crebo, opleidingsnaam, niveau, domein, sector, kerntaken } = body;

  if (!opleidingsnaam || !niveau || !domein) {
    return new Response(
      JSON.stringify({ error: 'Opleiding, niveau en domein zijn verplicht' }),
      { status: 400, headers }
    );
  }

  const systeemPrompt = `Je bent een expert rekendidacticus voor het Nederlandse mbo met diepgaande kennis van de Rekeneisen mbo 2020.

JE TAAK: Maak precies 3 contextrijke rekenopgaven die voldoen aan strikte didactische eisen.

STRIKTE REGELS:
1. BEROEPSCONTEXT: De situatie moet iets zijn wat een student van deze opleiding daadwerkelijk doet op de werkvloer.
2. DOMEINZUIVERHEID: Elke opgave gebruikt precies een functioneel rekendomein. Combineer nooit twee domeinen.
3. NIVEAUBEWAKING: Pas de complexiteit strikt aan op het opgegeven niveau.
4. BEREKENBAAR: Elk antwoord moet met de hand uitrekenbaar zijn door een mbo-student.
5. DRIE VERSCHILLENDE SITUATIES: De opgaven mogen niet op elkaar lijken.

OUTPUT FORMAAT - geef ALLEEN een JSON-array, geen andere tekst:
[
  {
    "titel": "korte titel max 7 woorden",
    "contextbeschrijving": "2-3 zinnen die de werksituatie schetsen",
    "vraag": "de concrete rekenopgave in 1-2 zinnen",
    "stappen": [
      {
        "label": "Omschrijving van wat je berekent in deze stap (bijv. 'Gram omrekenen naar milligram')",
        "operator": "x",
        "invoer_omschrijving": "Welke waarden gebruik je? (bijv. '2,4 g × 1000')",
        "eenheid": "mg"
      },
      {
        "label": "Omschrijving stap 2 (bijv. 'Aantal tabletten berekenen')",
        "operator": "/",
        "invoer_omschrijving": "Welke waarden gebruik je? (bijv. '2400 ÷ 500')",
        "eenheid": "tabletten"
      }
    ],
    "antwoord": "het correcte antwoord inclusief eenheid, bijv. \"4 tabletten\"",
    "uitwerking": [
      "Stap 1: 2,4 g × 1000 = 2400 mg",
      "Stap 2: 2400 mg ÷ 500 mg = 4,8 → afgerond 4 tabletten"
    ],
    "tags": ["domeinnaam", "niveau", "beroepsnaam"]
  }
]

Het veld stappen bevat de concrete rekenstappen die ook de ERWD-invultabel (niveau 3) vullen.
Geef 2-3 stappen per opgave. Elke stap heeft:
- label: wat bereken je in mensentaal
- operator: "x", "/", "+" of "-"
- invoer_omschrijving: welke getallen gebruik je en hoe
- eenheid: de eenheid van de uitkomst van deze stap

Het veld uitwerking bevat de volledig uitgeschreven berekening per stap, voor de docent.
Schrijf elke stap als één zin: "Stap N: [wat] × [getal] = [uitkomst] [eenheid]".
Dit is de modeloplossing die de docent kan gebruiken bij nakijken of uitleggen.`;

  // Stuur alleen de tekst van het gekozen domein mee — niet alle vijf.
  // Dit scheelt ~40% aan input-tokens en versnelt de respons merkbaar.
  const domeinInfo = DOMEIN_CONTEXT[domein] || `Domein: ${domein}`;
  const niveauInfo = NIVEAU_COMPLEXITEIT[niveau.toLowerCase()] || niveau;
  const creboInfo = crebo ? ` (crebo ${crebo})` : '';

  let kerntakenSectie = '';
  if (kerntaken && Array.isArray(kerntaken) && kerntaken.length > 0) {
    const regels = kerntaken.map(kt => {
      const wps = kt.werkprocessen && kt.werkprocessen.length > 0
        ? kt.werkprocessen.slice(0, 4).map(wp => `    - ${wp}`).join('\n')
        : '';
      return `  * ${kt.titel}${wps ? '\n' + wps : ''}`;
    }).join('\n');
    kerntakenSectie = `

OFFICIELE KERNTAKEN UIT HET KWALIFICATIEDOSSIER (SBB):
Dit zijn de werkelijke taken die een ${opleidingsnaam}-student uitvoert.
Baseer de beroepscontext uitsluitend op deze taken.

${regels}

BELANGRIJK: Gebruik alleen situaties die direct voortkomen uit deze kerntaken.`;
  }

  const gebruikersPrompt = `Maak 3 contextrijke rekenopgaven:

OPLEIDING: ${opleidingsnaam}${creboInfo}
SECTOR: ${sector || 'niet opgegeven'}
MBO-NIVEAU: ${niveau}
${kerntakenSectie}
FUNCTIONEEL REKENDOMEIN: ${domein}

${domeinInfo}

NIVEAUEISEN:
${niveauInfo}

ZELFTESTS - controleer elke opgave:
- Herkent een ${opleidingsnaam}-student deze werksituatie?${kerntaken ? '\n- Komt de situatie uit een van de kerntaken hierboven?' : ''}
- Bevat de opgave ALLEEN rekenhandelingen uit het domein "${domein}"?
- Passen het aantal stappen en de getallen bij ${niveau}?
- Is het antwoord realistisch en berekenbaar?
- Zijn de stappen in het stappen-veld correct, volledig en geschikt voor een invultabel?
- Is de uitwerking volledig uitgeschreven per stap, zodat een docent het kan gebruiken bij nakijken?

Geef de 3 opgaven als JSON-array.`;

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
        max_tokens: 3000,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI-service tijdelijk niet beschikbaar' }),
        { status: 502, headers }
      );
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let opgaven;
    try {
      opgaven = JSON.parse(clean);
    } catch {
      console.error('JSON parse error, raw:', rawText);
      return new Response(
        JSON.stringify({ error: 'Kon de gegenereerde opgaven niet verwerken. Probeer opnieuw.' }),
        { status: 500, headers }
      );
    }

    return new Response(JSON.stringify({ opgaven }), { status: 200, headers });

  } catch (err) {
    console.error('Fetch error:', err);
    return new Response(
      JSON.stringify({ error: 'Verbindingsfout met AI-service' }),
      { status: 500, headers }
    );
  }
}

// ─── NT2-AANPASSING (tweede aanroep) ─────────────────────────────────────────

async function handleNt2(body, apiKey, headers) {
  const { contextbeschrijving, vraag, titel, opleidingsnaam, niveau } = body;

  if (!contextbeschrijving || !vraag) {
    return new Response(
      JSON.stringify({ error: 'Opgave-inhoud ontbreekt voor NT2-aanpassing' }),
      { status: 400, headers }
    );
  }

  const systeemPrompt = `Je bent een expert in NT2-didactiek (Nederlands als Tweede Taal) voor het mbo.
Je past rekenopgaven aan voor studenten die Nederlands als tweede taal leren.

REGELS VOOR NT2-AANPASSING:
1. TAALVEREENVOUDIGING: Gebruik korte zinnen (max 12 woorden). Geen bijzinnen als het kan.
2. WOORDKEUZE: Vervang moeilijke woorden door eenvoudige alternatieven. Geef bij vaktermen een korte uitleg.
3. CONTEXT BEHOUDEN: De beroepssituatie en de rekeninhoud blijven identiek. Alleen de taal verandert.
4. VISUELE STRUCTUUR: Gebruik opsommingstekens of nummering voor informatie die nu in lopende tekst staat.
5. GETALLEN: Schrijf getallen altijd als cijfers (5 gram, niet: vijf gram).
6. VERGELIJK: Geef NAAST de NT2-versie ook een woordenlijst van max 5 kernwoorden met uitleg.

OUTPUT FORMAAT - geef ALLEEN dit JSON-object, geen andere tekst:
{
  "nt2_contextbeschrijving": "vereenvoudigde contextbeschrijving",
  "nt2_vraag": "vereenvoudigde vraag",
  "woordenlijst": [
    {"woord": "vakterm", "uitleg": "korte uitleg in eenvoudig Nederlands"}
  ],
  "toelichting_docent": "1-2 zinnen voor de docent over wat er veranderd is en waarom"
}`;

  const gebruikersPrompt = `Pas deze rekenopgave aan voor NT2-studenten:

OORSPRONKELIJKE OPGAVE:
Titel: ${titel || 'Opgave'}
Opleiding: ${opleidingsnaam || 'mbo'}
Niveau: ${niveau || ''}

Context: ${contextbeschrijving}

Vraag: ${vraag}

Maak een NT2-versie met vereenvoudigd taalgebruik. Behoud alle rekeninhoud exact.`;

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
        max_tokens: 1200,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }]
      })
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'NT2-aanpassing tijdelijk niet beschikbaar' }),
        { status: 502, headers }
      );
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let nt2;
    try {
      nt2 = JSON.parse(clean);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Kon NT2-aanpassing niet verwerken. Probeer opnieuw.' }),
        { status: 500, headers }
      );
    }

    return new Response(JSON.stringify({ nt2 }), { status: 200, headers });

  } catch (err) {
    console.error('NT2 fetch error:', err);
    return new Response(
      JSON.stringify({ error: 'Verbindingsfout bij NT2-aanpassing' }),
      { status: 500, headers }
    );
  }
}
