// netlify/functions/genereer-opgaven.js
// Netlify serverless function — roept de Anthropic API aan om contextrijke rekenopgaven te genereren.
// De API-sleutel staat in een Netlify environment variable (ANTHROPIC_API_KEY), nooit in de frontend.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Beschrijvingen van de vijf functionele rekendomeinen voor in de systeemprompt
const DOMEIN_CONTEXT = {
  'Grootheden en eenheden': 'Het domein grootheden en eenheden omvat: meten met meetinstrumenten, omrekenen van eenheden (metriek stelsel, tijd, temperatuur), werken met samengestelde eenheden (km/u, mg/kg), en het gebruik van woordformules. Niveauverschillen zitten in de gangbaarheid van de eenheden, of samengestelde eenheden voorkomen, en de complexiteit van de formules.',
  'Oriëntatie in de 2D/3D-wereld': 'Dit domein omvat: plattegronden en kaarten lezen, omtrek/oppervlakte/inhoud berekenen, werktekeningen interpreteren, en ruimtelijk redeneren. Niveauverschillen zitten in de complexiteit van de figuren, of formules nodig zijn, en of eenheden omgezet moeten worden.',
  'Verhoudingen': 'Dit domein omvat: recepten schalen, rekenen met per-eenheden (prijs per kg, mg per kg), evenredigheid, verhoudingstabellen, en omzetten tussen breuken/decimalen/procenten. Niveauverschillen zitten in het aantal denkstappen, de bekendheid van de situatie, en de moeilijkheid van de getallen.',
  'Procenten': 'Dit domein omvat: percentage nemen van een bedrag, procentuele toe- en afname berekenen, terugrekenen naar 100%, BTW, kortingen, en begrijpen wat 100% is in een situatie. Niveauverschillen zitten in of de student van deel naar geheel moet terugrekenen, of percentages boven 100% voorkomen, en de complexiteit van de getallen.',
  'Omgaan met kwantitatieve informatie': 'Dit domein omvat: tabellen, grafieken en schema\'s lezen en interpreteren, gegevens combineren uit meerdere bronnen, kritisch beoordelen van informatie, en conclusies trekken. Niveauverschillen zitten in het aantal bronnen, of absolute of relatieve waarden voorkomen, en hoeveel stappen nodig zijn.'
};

// Complexiteit per mbo-niveau — gebaseerd op de rekeneisen 2020
const NIVEAU_COMPLEXITEIT = {
  'entree': 'De situatie is zeer herkenbaar en dicht bij de eigen leefwereld. Getallen zijn eenvoudig (hele getallen, eenvoudige breuken). Slechts één rekenhandeling nodig. Geen afleidende informatie.',
  'niveau 2': 'De situatie is herkenbaar. Getallen zijn eenvoudig. Maximaal twee rekenhandelingen. De context is direct en eenduidig. Geen samengestelde eenheden nodig tenzij gangbaar.',
  'niveau 3': 'De situatie is herkenbaar maar iets complexer. Decimale getallen kunnen voorkomen. Meerdere denkstappen nodig. Student moet soms zelf een aanpak kiezen. Eenheden kunnen omgezet moeten worden.',
  'niveau 4': 'De situatie kan minder vertrouwd zijn. Complexere getallen en bewerkingen. Student structureert het rekenproces zelf. Terugrekenen of meerstapsredenering mogelijk. Kritisch beoordelen van het antwoord verwacht.'
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

  const { crebo, opleidingsnaam, niveau, domein, sector } = body;

  // Validatie
  if (!opleidingsnaam || !niveau || !domein) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Opleiding, niveau en domein zijn verplicht' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API-sleutel niet geconfigureerd' }) };
  }

  // Bouw de systeemprompt op
  const systeemPrompt = `Je bent een expert rekendidacticus voor het Nederlandse mbo. Je maakt contextrijke rekenopgaven die:
- Passen bij een specifieke beroepsopleiding en beroepssituatie
- Functioneel en realistisch zijn — studenten moeten de situatie herkennen
- Voldoen aan de rekeneisen mbo 2020 (Expertgroep Herijking Rekeneisen)
- Precies de juiste complexiteit hebben voor het opgegeven mbo-niveau

BELANGRIJK: Geef altijd precies 3 opgaven terug als JSON-array. Geen andere tekst, geen uitleg buiten de JSON.

Elke opgave heeft:
- "titel": korte beschrijvende titel (max 8 woorden)
- "contextbeschrijving": de situatieschets in 2-4 zinnen, realistisch en herkenbaar voor studenten van deze opleiding
- "vraag": de concrete rekenopgave (1-3 zinnen)
- "tags": array met maximaal 3 labels (domein, niveau, beroep/sector)

Geef de response ALLEEN als geldige JSON-array, startend met [ en eindigend met ].`;

  // Bouw de gebruikersprompt op
  const domeinInfo = DOMEIN_CONTEXT[domein] || domein;
  const niveauInfo = NIVEAU_COMPLEXITEIT[niveau.toLowerCase()] || niveau;
  const creboInfo = crebo ? ` (crebo ${crebo})` : '';

  const gebruikersPrompt = `Maak 3 contextrijke rekenopgaven voor de volgende opleiding:

OPLEIDING: ${opleidingsnaam}${creboInfo}
SECTOR: ${sector || 'onbekend'}
MBO-NIVEAU: ${niveau}
FUNCTIONEEL REKENDOMEIN: ${domein}

INFORMATIE OVER DIT DOMEIN:
${domeinInfo}

COMPLEXITEITSEISEN VOOR DIT NIVEAU:
${niveauInfo}

De opgaven moeten:
1. Starten vanuit een herkenbare beroepssituatie voor ${opleidingsnaam}-studenten
2. Rekenkundig precies passen bij het domein "${domein}"
3. De juiste complexiteit hebben voor ${niveau}
4. Afleidende maar realistische informatie bevatten (zoals in echte beroepssituaties)
5. Onderling van elkaar verschillen in situatie en invalshoek

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
