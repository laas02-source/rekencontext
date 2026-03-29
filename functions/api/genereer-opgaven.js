// functions/api/genereer-opgaven.js
// Cloudflare Pages Function — roept de Anthropic API aan om contextrijke rekenopgaven te genereren.
// v2: dynamische stappen voor niveau 3-tabel, NT2 als tweede aanroep, Word-export data
// Gemigreerd van Netlify naar Cloudflare Pages Functions.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const DOMEIN_CONTEXT = {
  'Grootheden en eenheden': `
WAT DIT DOMEIN IS:
Meten en omrekenen van gangbare grootheden (lengte, gewicht, tijd, temperatuur, inhoud, snelheid).
Kiezen van een passende eenheid en meetinstrument bij een meetsituatie.
Werken met woordformules die het verband tussen twee of meer grootheden beschrijven
(bijv. snelheid = afstand / tijd; verbruik = liters / 100 km).
Omrekenen tussen eenheden van dezelfde grootheid (ml naar dl, gram naar kg, minuten naar uren).
Op niveau 3 en 4: samengestelde eenheden gebruiken (km/u, kg/m2, euro/liter, liter/100 km).
Op niveau 4: meetresultaat beoordelen en corrigeren; complexere woordformules met lettervariabelen.

WAT DIT DOMEIN NIET IS:
Geen oppervlakte- of inhoudsberekeningen van ruimtes (dat is Orientatie 2D/3D).
Geen procenten of verhoudingen als hoofdrekenhandeling.
Geen statistische grootheden (gemiddelde, mediaan).
Geen enkelvoudige vermenigvuldiging van hoeveelheden zonder eenheidsomrekening (dat is Verhoudingen).

NIVEAUGRENS ENTREE: één grootheid aflezen of één directe omzetting, alleen hele getallen,
context uit de vertrouwde werkomgeving van de richting of het dagelijks leven, geen keuze voor de student.
Voorbeeld entree (Assistent verkoop/retail): Een fles water is 1 liter. Hoeveel flessen passen er in een krat van 6 liter?
Voorbeeld entree (Assistent horeca/voeding): Een pizza moet 20 minuten in de oven. Je zet hem er om 12:00 uur in.
Hoe laat haal je hem eruit?
Voorbeeld entree (Assistent dienstverlening): Een bewoner moet zijn medicijn innemen om 8 uur. Het is nu 7 uur.
Hoeveel minuten moet hij nog wachten?
Voorbeeld entree (Assistent logistiek): Een pakket weegt 5 kg. Je laadt 3 paketten in. Hoeveel kg is dat in totaal?
Voorbeeld entree (Assistent metaal/elektro/installatie): Een buis is 3 meter lang. Je zaagt er 1 meter af.
Hoeveel meter blijft er over?
Voorbeeld entree (Assistent mobiliteitsbranche): Een werkdag begint om 8 uur en duurt 4 uur.
Hoe laat is de werkdag klaar?
Voorbeeld entree (Assistent bouwen/wonen/onderhoud): Een emmer verf weegt 5 kg. Je hebt 2 emmers nodig.
Hoeveel kg verf is dat in totaal?
TE MOEILIJK VOOR ENTREE: een omrekening die twee stappen vraagt, of waarbij de student zelf
moet bedenken welke eenheid passend is. Dat is niveau 2.

NIVEAUGRENS NIVEAU 2: één eenheid omrekenen of één woordformule toepassen, eenvoudige getallen,
de aanpak ligt voor de hand — student hoeft niet te kiezen.
Voorbeeld niveau 2 (zorg): Een bewoner moet 750 ml drinken voor het ontbijt.
Hij heeft al 3 glazen van 200 ml gedronken. Heeft hij genoeg gedronken?
Voorbeeld niveau 2 (horeca): Een gerecht moet 45 minuten in de oven.
Je zet het er om 13:20 uur in. Hoe laat haal je het eruit?
Voorbeeld niveau 2 (economie/admin): Een medewerker werkt 6 uur en 45 minuten.
Hoeveel minuten is dat in totaal?
TE MOEILIJK VOOR NIVEAU 2: een berekening waarbij de student zelf bepaalt welke eenheid passend is,
of waarbij twee omrekeningen achter elkaar nodig zijn. Dat is niveau 3.

NIVEAUGRENS NIVEAU 3: twee stappen waarbij eenheidsomrekening en berekening worden gecombineerd;
student kiest zelf welke stap eerst; samengestelde eenheden zijn toegestaan.
Voorbeeld niveau 3 (zorg): Een bewoner mag maximaal 2,4 gram paracetamol per dag.
De tabletten zijn 500 mg per stuk. Hoeveel tabletten mag de bewoner maximaal per dag innemen?
Voorbeeld niveau 3 (techniek): Een monteur rijdt 182 km in 2 uur. Zijn auto verbruikt 1 liter op 14 km.
Hoeveel liter brandstof heeft hij gebruikt?
Voorbeeld niveau 3 (horeca): De koelkast staat op 6 graden Celsius.
De HACCP-norm voor verse vis is maximaal 2 graden. Hoeveel graden moet de temperatuur omlaag?
Voorbeeld niveau 3 (logistiek): Een vrachtwagen mag maximaal 3.500 kg laden.
Er liggen al 12 pallets van elk 185 kg. Hoeveel kg laadruimte is er nog?
Voorbeeld niveau 3 (economie/admin): Een medewerker werkt maandag 7 uur 30 min, dinsdag 6 uur 45 min
en woensdag 8 uur. Hoeveel uur en minuten heeft hij deze drie dagen gewerkt?
Voorbeeld niveau 3 (ICT): Een downloadbestand is 2,4 GB groot. De internetverbinding haalt 80 MB per seconde.
Hoeveel seconden duurt de download minimaal?

NIVEAUGRENS NIVEAU 4: drie of meer stappen; minder gangbare of samengestelde eenheden;
student structureert zelf de aanpak; meetresultaat beoordelen en corrigeren zonder procentberekening
als hoofdhandeling (corrigeren via optellen/aftrekken van een vaste afwijking, niet via percentage).
Voorbeeld niveau 4 (zorg/medisch): Een thermometer heeft een bekende afwijking van +1,5 graden.
Hij toont 38,2 graden. De alarmgrens voor een bewoner is 37,5 graden werkelijke temperatuur.
Moet de verpleegkundige actie ondernemen? Wat is de werkelijke temperatuur?
Voorbeeld niveau 4 (bouw/installatie): Een zonnepaneel levert gemiddeld 280 Wp.
Een installateur wil een systeem van minimaal 3,5 kWp bouwen.
Hoeveel panelen heeft hij minimaal nodig? Hoeveel Wp levert dat systeem dan in totaal?
Voorbeeld niveau 4 (horeca): Een kok maakt 140 glazen cocktail. Het recept voor 6 glazen vraagt
240 ml perensap. De leverancier levert flessen van 1 liter.
Hoeveel flessen moet de kok bestellen? Hoeveel ml houdt hij over?
Voorbeeld niveau 4 (economie/admin): Een medewerker werkt 36 uur per week en reist
elke dag 47 minuten enkele reis. Hoeveel uur en minuten is hij per werkweek (5 dagen)
onderweg en op het werk samen?
Voorbeeld niveau 4 (beauty/wellness): Een haarstylist mengt haarkleuring in een verhouding van
1 deel kleur op 2 delen waterstofperoxide. Ze heeft een tube van 60 ml kleur.
Hoeveel ml mengsel heeft ze in totaal? Hoeveel ml waterstofperoxide heeft ze nodig?

GOEDE VOORBEELDEN UIT MEERDERE SECTOREN:
- Zorg: medicatiedosering gram naar mg, vochtbalans bijhouden, thermometerafwijking corrigeren
- Techniek/bouw: brandstofverbruik (km/l), rijsnelheid, laadvermogen, stroomverbruik (kWh/kWp)
- Horeca: temperatuurcontrole, ingredienten omrekenen naar juiste eenheid, kooktijden plannen
- Economie/administratie: werktijden optellen en omrekenen, reistijden plannen
- ICT: dataopslag omrekenen (MB/GB/TB), downloadsnelheid en -duur berekenen
- Detailhandel/logistiek: gewichten en volumes, laadcapaciteit, levertijden
- Beauty/wellness: mengverhoudingen voor kleur- of verzorgingsproducten

FOUTE VOORBEELDEN:
- Hoeveel m2 is een kamer van 4 bij 5 meter? (dat is Orientatie 2D/3D)
- Bereken hoeveel procent korting je krijgt (dat is Procenten)
- Schaal het recept op van 4 naar 10 personen (dat is Verhoudingen)
- Een apparaat geeft 8% te lage waarden — wat is de werkelijke waarde? (procentberekening als kern,
  dat hoort in Procenten niveau 4, niet hier)`,

  'Oriëntatie in de 2D/3D-wereld': `
WAT DIT DOMEIN IS:
Omtrek, oppervlakte en inhoud bepalen van eenvoudige figuren (rechthoek, kubus, balk, samengestelde vormen).
Plattegronden, werktekeningen en kaarten lezen en interpreteren.
Ruimtelijke grootheden berekenen in functionele beroepssituaties.
Vergelijken van benodigde ruimte met beschikbare ruimte (past het? hoeveel blijft er over?).
2D-voorstellingen koppelen aan de 3D-werkelijkheid (bijv. werktekening vertalen naar een situatieschets).
Op niveau 4: minder gangbare figuren, samengestelde oppervlakken, meerdere bronnen combineren,
eigenschappen van figuren (symmetrie, loodrechtheid) bewust inzetten.

WAT DIT DOMEIN ABSOLUUT NIET IS — VERBODEN WISKUNDIGE ONDERWERPEN:
NOOIT de stelling van Pythagoras gebruiken (a2 + b2 = c2). Dit is schoolwiskunde, geen functioneel rekenen mbo.
NOOIT coordinaten of coordinatenstelsels gebruiken (x-as, y-as, punten zoals (3,4)). Dit is schoolwiskunde.
NOOIT goniometrie gebruiken (sinus, cosinus, tangens, hoeken berekenen via formules). Dit is schoolwiskunde.
NOOIT abstracte meetkundige bewijzen of redeneringen vragen die losstaan van een beroepssituatie.
Geen procenten of verhoudingen als hoofdrekenhandeling.
Geen losse volumeberekening van een enkel object als enige handeling (dat is niveau 2).
Geen omtrek van een rechthoek met hele getallen als enige handeling (dat is niveau 2).

NOOT OVER SNIJVERLIES OP NIVEAU 4: een procentuele correctiefactor zoals "+10% snijverlies" is op
niveau 4 toegestaan als hulpgetal bij een oppervlakteberekening, omdat dit een functionele praktijknorm is
(dakdekkers, tegelzetters, schilders werken altijd met vaste verliespercentages). De oppervlakteberekening
blijft de hoofdhandeling. Maak geen opgave waarbij het procentuele verlies zelf de kern van de redenering is.

NIVEAUGRENS ENTREE: een afmeting direct aflezen of een enkelvoudige vergelijking maken,
alleen hele getallen, context is heel herkenbaar, geen berekening van oppervlakte of inhoud vereist.
Voorbeeld entree (Assistent dienstverlening): Een bed is 2 meter lang. De kamer is 4 meter lang.
Past het bed in de kamer? Hoeveel meter ruimte blijft er over?
Voorbeeld entree (Assistent verkoop/retail): Een plank is 120 cm breed. Een doos is 40 cm breed.
Hoeveel dozen passen er naast elkaar op de plank?
Voorbeeld entree (Assistent bouwen/wonen/onderhoud): Een tuin is 8 meter lang en 5 meter breed.
Hoe lang is de omheining als je alle vier de zijden omheint?
Voorbeeld entree (Assistent logistiek): Een pallet is 120 cm lang. Een doos is 40 cm lang.
Hoeveel dozen passen er achter elkaar op de pallet?
Voorbeeld entree (Assistent metaal/elektro/installatie): Een buis moet 80 cm lang zijn.
Je hebt een buis van 200 cm. Hoeveel cm houd je over na het afzagen?
Voorbeeld entree (Assistent mobiliteitsbranche): Een auto-onderdeel is 30 cm lang.
De lade is 90 cm lang. Hoeveel onderdelen passen er naast elkaar in de lade?
Voorbeeld entree (Assistent horeca/voeding): Een tafel is 2 meter lang. Een stoel neemt 50 cm in beslag.
Hoeveel stoelen passen er aan één kant van de tafel?
TE MOEILIJK VOOR ENTREE: een oppervlakteberekening (lengte x breedte). Dat is niveau 2.

NIVEAUGRENS NIVEAU 2: één ruimtelijke berekening, eenvoudige getallen, directe vraag,
aanpak ligt voor de hand.
Voorbeeld niveau 2 (zorg): Een bewonerskamer is 4 bij 5 meter. Hoeveel m2 vloerbedekking heb je nodig?
Voorbeeld niveau 2 (bouw): Een muur is 6 meter lang en 2,5 meter hoog. Hoeveel m2 is de muur?
Voorbeeld niveau 2 (economie/admin): Een kantoor is 8 bij 6 meter. Per medewerker is 4 m2 vereist.
Hoeveel medewerkers mogen er maximaal werken?
TE MOEILIJK VOOR NIVEAU 2: een opgave waarbij meerdere maten gecombineerd worden of een beslissing
nodig is (past het? hoeveel blijft er over?). Dat is niveau 3.

NIVEAUGRENS NIVEAU 3: twee tot drie samenhangende stappen; student bepaalt zelf welke maten relevant zijn;
getallen zijn decimaal en realistisch; er is een vergelijking of beslissing nodig.
Voorbeeld niveau 3 (zorg): Een kamer is 3,8 x 2,4 m. Een bed is 2,1 x 1,0 m en een rolstoel
heeft 1,5 m draaicirkel nodig. Past de rolstoel naast het bed nog door de kamer?
Voorbeeld niveau 3 (detailhandel): Een winkelruimte is 8,4 x 5,2 m. Een display is 1,2 x 0,8 m.
De loopgang moet minimaal 1,5 m breed zijn. Hoeveel displays passen er naast elkaar?
Voorbeeld niveau 3 (bouw): Een aannemer legt tegels van 30 x 30 cm op een terras van 4,8 x 3,6 m.
Hoeveel tegels heeft hij nodig? (Geen snijverlies, afgerond naar hele tegels.)
Voorbeeld niveau 3 (horeca): Een koelcel is 2,4 m lang, 1,8 m breed en 2,1 m hoog.
Kratten van 60 x 40 x 30 cm worden gestapeld tot 1,8 m hoogte. Hoeveel kratten passen er?
Voorbeeld niveau 3 (economie/admin): Een vergaderruimte is 7,2 x 4,8 m. Elke deelnemer heeft
minimaal 1,5 m2 nodig. Er zijn tafels van 1,8 x 0,9 m. Passen 6 tafels en 18 stoelen in de ruimte?

NIVEAUGRENS NIVEAU 4: minder vertrouwde situaties; samengestelde figuren (L-vorm, U-vorm);
student combineert informatie uit een werktekening of plattegrond met eigen berekeningen;
student beslist welke grootheden relevant zijn; correctiefactoren (snijverlies) als praktijknorm.
Voorbeeld niveau 4 (bouw/installatie): Op een tekening staat een L-vormig dak met twee rechthoekige vlakken
van 6,2 x 3,8 m en 4,1 x 2,7 m. Dakpannen dekken 0,34 m2 per stuk. Hoeveel pannen zijn er nodig
inclusief 10% snijverlies? (Toelichting: snijverlies is een vaste praktijknorm, geen procentberekening
als hoofdhandeling — de oppervlakteberekening is de kern.)
Voorbeeld niveau 4 (techniek/magazijn): Een magazijn heeft een plattegrond van 18 x 12 m.
Er staat een kantoorblok van 4 x 3 m in de hoek. Stellingkasten zijn 2,4 m breed en 0,9 m diep.
Tussen de stellingen moet 2,5 m rijruimte zijn voor een heftruck. Hoeveel stellingkasten passen er
in rijen van voor naar achter, over de beschikbare breedte?
Voorbeeld niveau 4 (detailhandel): Een winkelier wil een etalage opbouwen op een podium van 3,6 x 1,2 m.
Hij heeft dozen van 40 x 30 x 25 cm. De bovenkant mag maximaal 0,9 m hoog zijn.
Hoeveel dozen passen er in een enkele laag? En hoeveel lagen zijn toegestaan?
Voorbeeld niveau 4 (beauty/wellness): Een salon heeft een L-vormige ruimte: deel A is 4,2 x 3,0 m,
deel B is 2,4 x 2,0 m. Een behandelstoel heeft een werkruimte van 1,5 x 2,0 m nodig.
Hoeveel behandelstoelen passen er, en hoeveel m2 loopruimte blijft er over?

GOEDE VOORBEELDEN UIT MEERDERE SECTOREN:
- Zorg: kamer inrichten met meubels en loopruimtenorm; wondverband bepalen op basis van wondmaten
- Bouw/installatie: tegels berekenen inclusief snijverlies; dakoppervlak bepalen uit werktekening
- Techniek/magazijn: stellingkasten plaatsen met rijstroken; kratten stapelen in een koelcel
- Detailhandel: displayopstelling met verplichte loopgangbreedte; opslagruimte benutten
- Horeca: tafelopstelling plannen met voldoende loopruimte; koelruimte benutten
- Economie/administratie: vergaderzaal inrichten, kantoorvloeroppervlak per medewerker berekenen
- Beauty/wellness: behandelruimte plannen met werkruimte per stoel

FOUTE VOORBEELDEN:
- Bereken de schuine zijde van een driehoek met zijden 3 en 4 (stelling van Pythagoras — VERBODEN)
- Plot de punten (2,3) en (5,7) in een coordinatenstelsel (coordinaten — VERBODEN)
- Bereken de hoek met de tangens (goniometrie — VERBODEN)
- Bereken de inhoud van een doos van 12 x 8 x 6 cm als enige handeling (niveau 2, te eenvoudig voor 3/4)
- Hoeveel meter loopt u om een tuin van 25 x 18 m? (omtrek als enige handeling, niveau 2)`,

  'Verhoudingen': `
WAT DIT DOMEIN IS:
Recepten en hoeveelheden opschalen of terugschalen naar een ander aantal personen of eenheden.
Rekenen met per-eenheden: prijs per stuk, mg per kg lichaamsgewicht, liter per persoon, km per liter.
Evenredigheid herkennen: als je meer personen hebt, heb je meer ingredienten nodig.
Verhoudingstabellen gebruiken als rekenmodel.
Gelijkwaardige verhoudingen maken om te vergelijken (bijv. welke aanbieding is goedkoper per eenheid?).
Op niveau 4: vaste factor bewust benoemen en gebruiken; samengestelde grootheden omzetten
(bijv. snelheid in km/u omzetten naar m/s); vergelijken via verhoudingen.

WAT DIT DOMEIN NIET IS:
Geen procenten als hoofdrekenhandeling (dat is het domein Procenten).
Geen eenheidsomrekeningen als hoofdhandeling (dat is Grootheden en eenheden).
Geen oppervlakte- of inhoudsberekeningen (dat is Orientatie 2D/3D).

NIVEAUGRENS ENTREE: verdubbelen of halveren van een herkenbare hoeveelheid, hele getallen,
de verhouding is zo vanzelfsprekend dat de student hem niet hoeft te benoemen.
Voorbeeld entree (Assistent horeca/voeding): Een recept voor 2 personen vraagt 4 aardappelen.
Hoeveel aardappelen heb je nodig voor 4 personen?
Voorbeeld entree (Assistent dienstverlening): Een bewoner krijgt elke dag 2 glazen sap.
Hoeveel glazen sap krijgt hij in een week (7 dagen)?
Voorbeeld entree (Assistent verkoop/retail): Een pak koffie kost 4 euro. Hoeveel kosten 3 pakken?
Voorbeeld entree (Assistent logistiek): In een doos passen 6 blikken. Je hebt 3 dozen.
Hoeveel blikken is dat in totaal?
Voorbeeld entree (Assistent metaal/elektro/installatie): Voor één lamp heb je 2 schroeven nodig.
Hoeveel schroeven heb je nodig voor 4 lampen?
Voorbeeld entree (Assistent mobiliteitsbranche): Een auto heeft 4 banden. Hoeveel banden heb je nodig voor 3 auto's?
Voorbeeld entree (Assistent bouwen/wonen/onderhoud): Voor 1 m2 vloer heb je 4 tegels nodig.
Hoeveel tegels heb je nodig voor 3 m2?
TE MOEILIJK VOOR ENTREE: een verhouding met een factor die niet 2, 3 of een halve is, of waarbij
de student zelf de verhoudingstabel moet opstellen. Dat is niveau 2.

NIVEAUGRENS NIVEAU 2: een verhouding toepassen met mooie getallen (x2, x3, x4, halveren);
de verhouding is duidelijk zichtbaar in de situatie; student hoeft geen aanpak te kiezen.
Voorbeeld niveau 2 (horeca): Een recept voor 4 personen vraagt 200 g rijst. Hoeveel gram voor 8 personen?
Voorbeeld niveau 2 (zorg): Een bewoner krijgt 1,5 liter vocht per dag verdeeld over 6 glazen.
Hoeveel ml zit er in elk glas?
Voorbeeld niveau 2 (economie/admin): Een printer drukt 12 pagina's per minuut.
Hoeveel pagina's drukt hij in 5 minuten?
TE MOEILIJK VOOR NIVEAU 2: een verhouding waarbij de factor niet mooi is (bijv. van 4 naar 6 personen),
of waarbij de student twee stappen achter elkaar moet zetten. Dat is niveau 3.

NIVEAUGRENS NIVEAU 3: verhoudingsredenering met niet-ronde getallen, of twee stappen;
student kiest zelf een aanpak (via 1, verhoudingstabel of factor).
Voorbeeld niveau 3 (zorg): Een bewoner weegt 68 kg en krijgt 1,5 mg per kg per dag in 3 doses.
Hoeveel mg per dosis?
Voorbeeld niveau 3 (horeca): Een cocktailrecept voor 6 glazen vraagt 240 ml perensap.
Hoeveel ml perensap heb je nodig voor 10 glazen?
Voorbeeld niveau 3 (techniek): Een schilder verbruikt 0,35 liter verf per m2. Hij moet 24 m2 schilderen.
Blikken verf zijn 2,5 liter. Hoeveel blikken moet hij kopen?
Voorbeeld niveau 3 (detailhandel): Supermarkt A verkoopt 1,5 kg appels voor 2,85 euro.
Supermarkt B verkoopt 2 kg voor 3,60 euro. Welke supermarkt is goedkoper per kg?
Voorbeeld niveau 3 (economie/admin): Een medewerker typt gemiddeld 65 woorden per minuut.
Een rapport heeft 1.950 woorden. Hoeveel minuten heeft hij nodig om het te typen?
Voorbeeld niveau 3 (beauty/wellness): Een haarkleuringsproduct wordt gemengd in de verhouding
1 deel kleur op 1,5 deel oxidant. De stylist heeft 45 ml kleur. Hoeveel ml oxidant heeft ze nodig?

NIVEAUGRENS NIVEAU 4: student benoemt en gebruikt de vaste factor expliciet;
samengestelde grootheden omzetten; terugrekenen vanuit uitkomst naar beginwaarde;
complexere situaties waarbij meerdere verhoudingen tegelijk spelen.
Voorbeeld niveau 4 (techniek): Een auto rijdt 400 meter in 31 seconden. Bereken de snelheid in km/u.
Voorbeeld niveau 4 (horeca): Voor een gala worden 140 glazen cocktail gemaakt. Het recept voor 6 glazen
vraagt 225 g honing. De kok heeft nog 1,2 kg honing. Is dat genoeg? Hoeveel gram ontbreekt er eventueel?
Voorbeeld niveau 4 (bouw): Beton wordt gemengd in de verhouding 1 deel cement : 2 delen zand : 3 delen grind.
Een bouwer heeft 150 kg cement. Hoeveel kg zand en grind heeft hij nodig?
Voorbeeld niveau 4 (logistiek): Een bezorger rijdt gemiddeld 45 km/u en bezoekt 6 adressen
die gemiddeld 3,8 km van elkaar liggen. Hoeveel minuten rijdt hij in totaal?
Voorbeeld niveau 4 (economie/admin): Een bedrijf heeft 3 verkopers die samen gemiddeld 126 offertes
per maand sturen. Een nieuwe medewerker werkt op 80% van dat gemiddelde tempo.
Hoeveel offertes stuurt het team dan per maand?
Voorbeeld niveau 4 (ICT): Een server verwerkt 450 verzoeken per minuut. Bij piekbelasting neemt
het aantal verzoeken toe met factor 3,5. Hoeveel verzoeken per seconde is dat?

GOEDE VOORBEELDEN UIT MEERDERE SECTOREN:
- Zorg: medicatiedosering per kg lichaamsgewicht, vochtbalans per dag/dosis
- Horeca: recept opschalen van 6 naar 140 glazen, inkoophoeveelheden bepalen
- Techniek/bouw: verf- of materiaalverbruik per m2, brandstofverbruik per km, betonmenging
- Detailhandel/logistiek: prijs per eenheid vergelijken, rijafstanden en tijden
- Economie/administratie: productiviteit per medewerker, tempo van werken vergelijken
- ICT: serverbelasting, dataverwerking per tijdseenheid
- Beauty/wellness: mengverhouding kleur en oxidant, product per behandeling

FOUTE VOORBEELDEN:
- Bereken de korting van 15% op een product (dat is Procenten)
- Reken 1,5 dl om naar ml als hoofdhandeling (dat is Grootheden en eenheden)
- Hoeveel m2 is de keuken? (dat is Orientatie 2D/3D)`,

  'Procenten': `
WAT DIT DOMEIN IS:
Een percentage nemen van een bedrag of hoeveelheid (deel van het geheel berekenen).
Procentuele toe- of afname berekenen (korting, toeslag, BTW, salarisverhoging, ziekteverzuim).
Begrijpen wat 100% is in een situatie (ten opzichte waarvan wordt het percentage genomen?).
Op niveau 3: een procentuele verandering in twee stappen berekenen; onregelmatige percentages.
Op niveau 4: terugrekenen van deel naar geheel (van inclusief BTW naar exclusief BTW);
percentages boven 100%; de relatie tussen procent, breuk en decimale factor toepassen.

WAT DIT DOMEIN NIET IS:
Geen verhoudingen of recepten als hoofdinhoud (dat is Verhoudingen).
Geen eenheidsomrekeningen (dat is Grootheden en eenheden).
Geen tabellen of grafieken lezen als hoofdtaak (dat is Omgaan met kwantitatieve informatie).
Geen gestapelde procentberekeningen (15% van 40% van ...) op niveau 2 of 3.

NIVEAUGRENS ENTREE: 50% of 10% van een rond, herkenbaar getal, in een alledaagse of vertrouwde
werksituatie, één handeling, geen keuze voor de student.
Voorbeeld entree (Assistent verkoop/retail): Een product kost 10 euro. Je krijgt 50% korting.
Hoeveel moet je betalen?
Voorbeeld entree (Assistent dienstverlening): In een groep van 10 bewoners heeft 10% griep.
Hoeveel bewoners zijn dat?
Voorbeeld entree (Assistent horeca/voeding): Een rekening is 20 euro. Je geeft een fooi van 10%.
Hoeveel fooi is dat?
Voorbeeld entree (Assistent logistiek): Van 20 paketten is 50% al bezorgd.
Hoeveel paketten zijn er nog te bezorgen?
Voorbeeld entree (Assistent metaal/elektro/installatie): Een order heeft 100 schroeven.
10% is afgekeurd. Hoeveel schroeven zijn er nog bruikbaar?
Voorbeeld entree (Assistent mobiliteitsbranche): Een garage heeft 10 afspraken op een dag.
50% zijn al afgerond. Hoeveel afspraken zijn er nog?
Voorbeeld entree (Assistent bouwen/wonen/onderhoud): Je moet 10 m2 schilderen.
Je hebt 50% al gedaan. Hoeveel m2 moet je nog schilderen?
TE MOEILIJK VOOR ENTREE: een percentage dat niet 10%, 25% of 50% is, of waarbij de student
zelf moet bepalen wat 100% is. Dat is niveau 2.

NIVEAUGRENS NIVEAU 2: één procentberekening, mooie percentages (10%, 25%, 50%),
de aanpak ligt voor de hand.
Voorbeeld niveau 2 (detailhandel): Een jas kost 80 euro. Je krijgt 25% korting. Wat betaal je?
Voorbeeld niveau 2 (zorg): Van de 40 bewoners in een instelling heeft 10% koorts.
Hoeveel bewoners zijn dat?
Voorbeeld niveau 2 (economie/admin): Een medewerker krijgt een overwerktoeslag van 25% op zijn uurloon van 16 euro.
Hoeveel euro toeslag krijgt hij per overgewerkt uur?
TE MOEILIJK VOOR NIVEAU 2: een percentage dat onregelmatig is (zoals 13% of 21%), of waarbij
de student twee stappen moet zetten (percentage berekenen én vergelijken met een norm). Dat is niveau 3.

NIVEAUGRENS NIVEAU 3: twee stappen, onregelmatige percentages (15%, 21%, 13%) toegestaan;
student berekent een procentuele verandering en vergelijkt met een norm of budget.
Voorbeeld niveau 3 (zorg): Een instelling heeft 45 medewerkers. Door ziekte werkt 13% niet.
Hoeveel zijn aanwezig? Is dat genoeg als de norm minimaal 40 medewerkers is?
Voorbeeld niveau 3 (techniek): Een onderdeel kost normaal 124 euro. De leverancier rekent 15% toeslag
voor spoedlevering. Wat betaal je in totaal?
Voorbeeld niveau 3 (horeca): Een restaurant haalt in een week een omzet van 8.400 euro.
De voedselkosten zijn 34% van de omzet. Hoeveel euro zijn de voedselkosten?
Voorbeeld niveau 3 (detailhandel): Een winkel verhoogt alle prijzen met 8%. Een artikel kostte 45 euro.
Wat is de nieuwe prijs?
Voorbeeld niveau 3 (economie/admin): Een kantoorgebouw verbruikt dit jaar 12% minder energie dan vorig jaar.
Vorig jaar was het verbruik 84.000 kWh. Hoeveel kWh is het verbruik dit jaar?
Voorbeeld niveau 3 (beauty/wellness): Een behandeling kost normaal 65 euro. Nieuwe klanten krijgen
15% introductiekorting. Hoeveel betaalt een nieuwe klant?

NIVEAUGRENS NIVEAU 4: terugrekenen van deel naar geheel; percentages boven 100%;
de relatie tussen procent, breuk en decimale vermenigvuldigfactor bewust gebruiken;
meer dan twee stappen; student bepaalt zelf wat 100% is.
Voorbeeld niveau 4 (detailhandel/inkoop): Een leverancier rekent 21% BTW. De factuurprijs inclusief BTW
is 302,50 euro. Wat is de prijs exclusief BTW?
Voorbeeld niveau 4 (techniek): Een machine werkt dit jaar 15% sneller dan vorig jaar.
Dit jaar haalt hij 690 stuks per uur. Hoeveel haalde hij vorig jaar?
Voorbeeld niveau 4 (zorg/management): Een instelling heeft haar personeel verhoogd van 38 naar 45 fte.
Met hoeveel procent is het personeelsbestand gestegen?
Voorbeeld niveau 4 (horeca/management): Een horecabedrijf biedt twee aanbiedingen:
Aanbieding A: 20% korting op de totaalprijs van 350 euro.
Aanbieding B: de BTW (21%) wordt terugbetaald.
Welke aanbieding is goedkoper? Bereken het verschil.
Voorbeeld niveau 4 (economie/admin): Een medewerker ontvangt een nettoloon van 2.142 euro.
De loonheffing is 32% van het brutoloon. Wat is het brutoloon?
Voorbeeld niveau 4 (ICT): Een server heeft een uptime van 99,2% over een jaar van 365 dagen.
Hoeveel uur was de server in totaal niet beschikbaar?

GOEDE VOORBEELDEN UIT MEERDERE SECTOREN:
- Zorg: ziekteverzuim als percentage van bezetting, medicatieconcentratie
- Detailhandel: kortingen, BTW-berekeningen, prijsverhogingen
- Horeca: food cost percentage, omzetanalyse, introductiekorting
- Techniek: efficientieverbetering, toeslag spoedlevering, materiaalverlies
- Bouw/installatie: meer- en minderwerk als percentage van aanneemsom
- Economie/administratie: loonheffing, energiebesparing in procenten, budgetvergelijking
- ICT: uptime en downtime als percentage van beschikbare uren
- Beauty/wellness: introductiekorting, productkorting voor vaste klanten

FOUTE VOORBEELDEN:
- Een bewoner weegt 68 kg en krijgt 10 mg per kg. Hoeveel tabletten? (dat is Verhoudingen)
- Reken de prijs exclusief 21% BTW terug op niveau 3 (dat is niveau 4, te complex voor niveau 3)
- Gestapeld procentenprobleem op niveau 2 of 3 (te complex voor die niveaus)`,

  'Omgaan met kwantitatieve informatie': `
WAT DIT DOMEIN IS:
Gegevens aflezen uit tabellen, grafieken, roosters, schema's of formulieren die IN DE OPGAVE STAAN.
Informatie interpreteren: wat betekent dit getal in deze situatie?
Conclusies trekken op basis van cijfermatige informatie.
Eenvoudige berekeningen uitvoeren met de afgelezen gegevens (optellen, aftrekken, vergelijken).
Op niveau 3: gegevens uit meerdere rijen of kolommen combineren.
Op niveau 4: meerdere bronnen combineren, informatie kritisch beoordelen op volledigheid of
betrouwbaarheid, een conclusie onderbouwen of een eigen vraag formuleren op basis van de data.

BRONVEREISTE — DIT IS EEN HARDE REGEL:
Elke opgave in dit domein MOET een concrete, volledig uitgeschreven informatiebron bevatten.
Schrijf de tabel, het rooster of het schema VOLLEDIG UIT in de contextbeschrijving als ASCII-tabel.
Gebruik de volgende opmaak voor een tabel in de contextbeschrijving:

| Kolom 1     | Kolom 2     | Kolom 3     |
|-------------|-------------|-------------|
| waarde      | waarde      | waarde      |
| waarde      | waarde      | waarde      |

De student leest gegevens AF uit deze bron. Zonder de tabel/grafiek/het schema in de opgave
is er niets om af te lezen en is de opgave ongeldig voor dit domein.

WAT DIT DOMEIN NIET IS:
Geen berekeningen die losstaan van een tabel of grafiek — de bron is altijd aanwezig in de opgave.
Geen gemiddelden berekenen als hoofdtaak.
Geen procentberekeningen als hoofdhandeling (dat is Procenten) — vergelijken in absolute getallen
(hoeveel meer? hoeveel tekort?) is wél toegestaan als uitkomst van aflezen.
Geen verhoudingsredenering zonder tabel als basis (dat is Verhoudingen).

NIVEAUGRENS ENTREE: een heel eenvoudige tabel of lijst met twee kolommen;
student leest één waarde direct af zonder berekening; context is vertrouwd en herkenbaar.
Voorbeeld entree (Assistent dienstverlening): Hieronder staat het schoonmaakrooster van deze week.
| Ruimte       | Dag      |
|--------------|----------|
| Keuken       | Maandag  |
| Badkamer     | Woensdag |
| Woonkamer    | Vrijdag  |
Op welke dag wordt de badkamer schoongemaakt?

Voorbeeld entree (Assistent horeca/voeding): Hieronder staat de prijslijst van de kantine.
| Product      | Prijs  |
|--------------|--------|
| Koffie       | 1,50   |
| Thee         | 1,20   |
| Broodje kaas | 2,80   |
| Broodje ham  | 3,10   |
Hoeveel kost een koffie?

Voorbeeld entree (Assistent logistiek): Hieronder staat de leveringslijst van vandaag.
| Adres            | Aantal paketten |
|------------------|-----------------|
| Hoofdstraat 4    |        3        |
| Kerkplein 12     |        2        |
| Industrieweg 7   |        5        |
Hoeveel paketten moeten er naar Kerkplein 12?

Voorbeeld entree (Assistent metaal/elektro/installatie): Hieronder staat de onderdelenlijst.
| Onderdeel    | Aantal op voorraad |
|--------------|--------------------|
| Schroeven    |        200         |
| Moeren       |        150         |
| Bouten       |         80         |
Hoeveel bouten liggen er op voorraad?

Voorbeeld entree (Assistent mobiliteitsbranche): Hieronder staat het afsprakenschema van vandaag.
| Klant     | Tijd  | Werkzaamheid     |
|-----------|-------|------------------|
| De Vries  | 9:00  | Bandenwissel     |
| Jansen    | 10:30 | APK-keuring      |
| Bakker    | 13:00 | Olie verversen   |
Wat doet de monteur om 10:30 uur?

Voorbeeld entree (Assistent verkoop/retail): Hieronder staat de voorraadlijst van de winkel.
| Product      | Aantal |
|--------------|--------|
| Appels       |   40   |
| Peren        |   25   |
| Bananen      |   60   |
Hoeveel peren zijn er in de winkel?

Voorbeeld entree (Assistent bouwen/wonen/onderhoud): Hieronder staat de materialenlijst voor vandaag.
| Materiaal    | Hoeveelheid |
|--------------|-------------|
| Cement       |    10 zak   |
| Zand         |     5 zak   |
| Grind        |     8 zak   |
Hoeveel zakken zand zijn er beschikbaar?
TE MOEILIJK VOOR ENTREE: een tabel waarbij de student twee waarden moet combineren of een berekening
moet maken op basis van afgelezen gegevens. Dat is niveau 2.

NIVEAUGRENS NIVEAU 2: eenvoudige tabel of rooster, een waarde direct aflezen,
eventueel één simpele berekening (optellen of aftrekken van twee afgelezen waarden).
Voorbeeld niveau 2 (zorg): Hieronder staat het dienstrooster van deze week.
| Naam    | Ma  | Di  | Wo  | Do  | Vr  |
|---------|-----|-----|-----|-----|-----|
| Fatima  | 8u  | -   | 6u  | 8u  | -   |
| Roel    | -   | 8u  | 8u  | -   | 6u  |
Hoeveel uur werkt Fatima op woensdag?

Voorbeeld niveau 2 (techniek): Hieronder staat het keuringsschema voor de machines.
| Machine | Laatste keuring | Volgende keuring |
|---------|-----------------|-----------------|
| Pers A  | 3 januari       | 3 april         |
| Pers B  | 15 februari     | 15 mei          |
Wanneer moet Pers B gekeurd worden?

Voorbeeld niveau 2 (economie/admin): Hieronder staat een uittreksel van de reiskostenvergoeding.
| Afstand woon-werk | Vergoeding per dag |
|-------------------|--------------------|
| 0 - 10 km         | 0,00 euro          |
| 11 - 20 km        | 4,50 euro          |
| 21 - 40 km        | 9,00 euro          |
| meer dan 40 km    | 13,50 euro         |
Een medewerker woont 26 km van zijn werk. Hoeveel vergoeding krijgt hij per dag?
TE MOEILIJK VOOR NIVEAU 2: een tabel waarbij de student waarden uit meerdere rijen of kolommen
moet combineren en vervolgens een meerstappenberekening moet uitvoeren. Dat is niveau 3.

NIVEAUGRENS NIVEAU 3: tabel met meerdere rijen of kolommen; student combineert twee of meer
afgelezen waarden en maakt een berekening of vergelijking; vergelijking leidt tot een conclusie.
Voorbeeld niveau 3 (zorg): Hieronder staat de voedingswaardentabel per 100 gram.
| Product    | Kcal | Eiwit (g) | Vet (g) |
|------------|------|-----------|---------|
| Yoghurt    |  61  |    3,5    |   3,2   |
| Muesli     | 362  |    9,0    |   6,3   |
| Banaan     |  89  |    1,1    |   0,3   |
Een bewoner eet 180 g yoghurt en 60 g muesli. Ze mag maximaal 2000 kcal per dag.
Hoeveel kcal heeft ze al gehad? Hoeveel mag ze nog?

Voorbeeld niveau 3 (techniek/logistiek): Hieronder staat de verbruiksregistratie van drie machines.
| Machine | Uren gedraaid | Stroomverbruik (kWh) |
|---------|---------------|---------------------|
| A       |      6        |        18,0         |
| B       |      4        |        10,8         |
| C       |      8        |        20,0         |
Welke machine verbruikt per uur de meeste stroom? Bereken het voor alle drie.

Voorbeeld niveau 3 (horeca): Hieronder staat het bestellingsoverzicht van gisteren.
| Gerecht         | Aantal verkocht | Prijs per stuk |
|-----------------|-----------------|----------------|
| Dagschotel      |       34        |     12,50 euro |
| Soep            |       52        |      4,75 euro |
| Dessert         |       28        |      5,50 euro |
Wat was de totale omzet van de dagschotel en het dessert samen?

Voorbeeld niveau 3 (economie/admin): Hieronder staat het urenregistratieoverzicht van deze week.
| Medewerker | Ma  | Di  | Wo  | Do  | Vr  |
|------------|-----|-----|-----|-----|-----|
| Kim        | 8,0 | 7,5 | 8,0 | 0,0 | 6,0 |
| Daan       | 7,0 | 8,0 | 8,0 | 8,0 | 7,5 |
Hoeveel uur heeft Kim deze week gewerkt? Hoeveel uur meer of minder dan Daan?

NIVEAUGRENS NIVEAU 4: meerdere bronnen combineren; informatie kritisch beoordelen op
volledigheid of logica; vergelijken leidt tot een onderbouwde conclusie in absolute getallen
(NIET als procentberekening — dat is het domein Procenten).
Voorbeeld niveau 4 (zorg/management): Hieronder staan twee tabellen.
Tabel 1 — Bezettingsnorm per afdeling:
| Afdeling    | Minimale bezetting | Maximale bezetting |
|-------------|-------------------|-------------------|
| Wonen A     |         6         |         8         |
| Wonen B     |         5         |         6         |
| Dagbesteding|         4         |         5         |
Tabel 2 — Aanwezige medewerkers vandaag:
| Afdeling    | Aanwezig |
|-------------|---------|
| Wonen A     |    5    |
| Wonen B     |    6    |
| Dagbesteding|    3    |
Welke afdelingen voldoen niet aan de minimale bezetting? Hoeveel medewerkers tekort is dat per afdeling?
Is er een afdeling die tijdelijk kan uithelpen zonder zelf onder de norm te komen?

Voorbeeld niveau 4 (techniek/kwaliteit): Hieronder staat de productieregistratie van vier weken.
| Week | Geproduceerd | Afgekeurd | Doel (max afgekeurd) |
|------|-------------|-----------|----------------------|
|  1   |    1.200    |    24     |         20           |
|  2   |    1.350    |    18     |         20           |
|  3   |    1.100    |    33     |         20           |
|  4   |    1.280    |    26     |         20           |
In welke weken is het doelstelling niet gehaald? Hoeveel stuks te veel afgekeurd in die weken?
Is de kwaliteit over deze vier weken verbeterd of verslechterd? Onderbouw je antwoord.

Voorbeeld niveau 4 (economie/admin): Hieronder staan twee offertes voor kantoorartikelen.
Offerte A — Leverancier De Groot:
| Artikel        | Aantal | Prijs per stuk |
|----------------|--------|----------------|
| Ordners A4     |    50  |      2,40 euro |
| Pennen (doos)  |    10  |      3,80 euro |
| Papier (riem)  |    20  |      4,50 euro |
Offerte B — Leverancier Kantoorhuis:
| Artikel        | Aantal | Prijs per stuk |
|----------------|--------|----------------|
| Ordners A4     |    50  |      2,10 euro |
| Pennen (doos)  |    10  |      4,20 euro |
| Papier (riem)  |    20  |      4,75 euro |
Welke leverancier is goedkoper voor de totale bestelling? Bereken het totaal voor beide offertes.

Voorbeeld niveau 4 (ICT): Hieronder staat het storingenoverzicht van een serverpark over vier maanden.
| Maand      | Aantal storingen | Gemiddelde duur (min) | Maximale duur (min) |
|------------|------------------|-----------------------|---------------------|
| Januari    |        3         |          45           |         120         |
| Februari   |        1         |          20           |          20         |
| Maart      |        5         |          35           |         180         |
| April      |        2         |          60           |         110         |
In welke maand was de totale stilstandtijd het grootst? Bereken de totale stilstandtijd per maand.
Welke maand verdient prioriteit voor onderzoek naar oorzaken?

GOEDE VOORBEELDEN UIT MEERDERE SECTOREN:
- Zorg: dienstrooster, medicatieschema, voedingswaardentabel, bezettingsoverzicht
- Techniek: stroomverbruiksregistratie, keuringsschema, productiefoutenlog
- Horeca: bestellingsoverzicht, omzettabel, inkoopfactuur met meerdere regels
- Detailhandel: verkoopregistratie per product, voorraadoverzicht, prijsvergelijkingstabel
- Economie/administratie: urenregistratie, offertes vergelijken, reiskostenvergoedingstabel
- ICT: storingenoverzicht, serverbelastingstabel, uptime-registratie
- Beauty/wellness: behandelingsplanning, productverbruiksoverzicht per week

FOUTE VOORBEELDEN:
- Bereken hoeveel procent van de dagdosis dit is — zonder tabel (dat is Procenten, en bron ontbreekt)
- Schaal de hoeveelheid op naar 12 personen zonder tabel (dat is Verhoudingen)
- Een opgave waarbij de tabel NIET uitgeschreven staat in de contextbeschrijving (ONGELDIG)
- Niveau 4-vraag waarbij de hoofduitkomst een procentberekening is
  (bijv. "welke afdeling heeft procentueel de grootste onderbezetting") — dat combineert
  ten onrechte twee domeinen; vergelijk altijd in absolute aantallen in dit domein`
};

const NIVEAU_COMPLEXITEIT = {
  'entree': `
SITUATIE: Zeer herkenbaar, dicht bij eigen leefwereld of een heel vertrouwde werksituatie.
Context mag persoonlijk zijn (dagelijks leven) in plaats van strikt beroepsmatig — entreestudenten
hebben vaak nog weinig beroepservaring. De richting mag wel als herkenbare omgeving meespelen,
maar de situatie mag nooit beroepskennis vereisen die de student nog niet heeft.
De gouden regel: de situatie speelt zich af op de werkplek van de richting, maar een buitenstaander
zonder vakkennis begrijpt hem ook volledig.

ZEVEN ENTREERICHTINGEN EN HUN HERKENBARE OMGEVING:
- Assistent bouwen, wonen en onderhoud: materialen tellen en meten, schoonmaken, gereedschap ordenen
- Assistent dienstverlening: schoonmaakproducten doseren, kamers tellen, werktijden aflezen
- Assistent horeca, voeding of voedingsindustrie: producten tellen en wegen, tijden bijhouden, prijzen aflezen
- Assistent logistiek: dozen tellen, gewichten vergelijken, adressen opzoeken op een leverlijst
- Assistent metaal-, elektro- en installatietechniek: bouten en schroeven tellen, lengtes vergelijken, onderdelen sorteren
- Assistent mobiliteitsbranche: banden en olie controleren op min/max, werktijden bijhouden, onderdelen tellen
- Assistent verkoop/retail: producten tellen, prijzen aflezen, wisselgeld berekenen

GETALLEN: Alleen hele getallen. Geen decimalen, geen breuken.
STAPPEN: Maximaal een rekenhandeling. Geen tussenstappen nodig.
STRUCTUUR: De aanpak ligt volledig voor de hand. Student hoeft niets te kiezen.
GRENS NAAR NIVEAU 2: zodra de student zelf een eenheid moet kiezen, twee handelingen moet
combineren, of een beslissing moet nemen op basis van een berekening, is het niveau 2.`,

  'niveau 2': `
SITUATIE: Herkenbaar en direct. Context is eenduidig. Geen verrassingen.
GETALLEN: Voornamelijk hele getallen. Decimalen alleen als ze gangbaar zijn (bijv. 12,50 euro of 1,5 liter).
STAPPEN: Maximaal twee rekenhandelingen. Elke stap is duidelijk.
STRUCTUUR: De aanpak is voor de hand liggend. Student hoeft niet te kiezen tussen aanpakken.
GRENS NAAR NIVEAU 3: zodra de student zelf moet bepalen welke aanpak passend is, welke informatie
relevant is, of meer dan twee stappen moet combineren, is het niveau 3.`,

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

// Geeft de juiste CORS-headers terug als de origin is toegestaan,
// of null als de origin niet is toegestaan (wildcard '*' staat altijd toe).
function corsHeaders(request, env) {
  const toegestaneOrigin = env.ALLOWED_ORIGIN || '*';
  const origin = request ? request.headers.get('Origin') : null;

  // Bij wildcard altijd toestaan; bij specifieke origin alleen als die overeenkomt.
  const originToegestaan =
    toegestaneOrigin === '*' ||
    !origin ||                          // server-to-server request zonder Origin
    origin === toegestaneOrigin;

  if (!originToegestaan) return null;   // null = geblokkeerd

  // Als origin null/leeg is (server-to-server zonder Origin-header),
  // stuur de geconfigureerde origin terug i.p.v. de string "null".
  const allowOrigin = toegestaneOrigin === '*'
    ? '*'
    : (origin || toegestaneOrigin);

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// ─── HOOFD-HANDLER (Cloudflare Pages Functions) ──────────────────────────────

export async function onRequestOptions(context) {
  const cors = corsHeaders(context.request, context.env);
  if (!cors) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = corsHeaders(request, env);
  if (!cors) {
    return new Response(
      JSON.stringify({ error: 'Origin niet toegestaan' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const headers = {
    'Content-Type': 'application/json',
    ...cors,
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
      "Stap 2: 2400 mg ÷ 500 mg = 4,8 → naar beneden afgerond op 4 tabletten (veiligheidsregel: bij medicatie nooit meer dan berekend)"
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
Bij afronden: noteer altijd de richting én de reden (bijv. "→ naar beneden afgerond op 4 tabletten (veiligheidsregel medicatie)" of "→ naar boven afgerond op 5 blikken (volledige hoeveelheid nodig)").
Dit is de modeloplossing die de docent kan gebruiken bij nakijken of uitleggen.`;

  // Stuur alleen de tekst van het gekozen domein mee — niet alle vijf.
  // Dit scheelt ~40% aan input-tokens en versnelt de respons merkbaar.
  const domeinInfo = DOMEIN_CONTEXT[domein] || `Domein: ${domein}`;
  const niveauInfo = NIVEAU_COMPLEXITEIT[niveau.toLowerCase()] || niveau;
  const creboInfo = crebo ? ` (crebo ${crebo})` : '';

  // Bij entree: zoek de bijpassende richting op basis van opleidingsnaam of sector,
  // zodat de AI niet zelf hoeft te raden welke van de zeven richtingen van toepassing is.
  const ENTREE_RICHTING_MAP = [
    { sleutelwoorden: ['bouwen', 'wonen', 'onderhoud', 'schilder', 'timmerman', 'metselaar'], richting: 'Assistent bouwen, wonen en onderhoud' },
    { sleutelwoorden: ['dienstverlening', 'schoonmaak', 'facilitair', 'zorg', 'verzorgend', 'helpende'], richting: 'Assistent dienstverlening' },
    { sleutelwoorden: ['horeca', 'voeding', 'voedingsindustrie', 'kok', 'bediening', 'bakker', 'slager'], richting: 'Assistent horeca, voeding of voedingsindustrie' },
    { sleutelwoorden: ['logistiek', 'magazijn', 'transport', 'bezorger', 'opslag'], richting: 'Assistent logistiek' },
    { sleutelwoorden: ['metaal', 'elektro', 'installatie', 'lasser', 'monteur', 'elektricien'], richting: 'Assistent metaal-, elektro- en installatietechniek' },
    { sleutelwoorden: ['mobiliteit', 'auto', 'voertuig', 'garage', 'band', 'automotive'], richting: 'Assistent mobiliteitsbranche' },
    { sleutelwoorden: ['verkoop', 'retail', 'winkel', 'kassa', 'detailhandel', 'winkelbediende'], richting: 'Assistent verkoop/retail' },
  ];

  let entreeRichtingSectie = '';
  if (niveau.toLowerCase() === 'entree') {
    const zoekterm = (opleidingsnaam + ' ' + (sector || '')).toLowerCase();
    const gevonden = ENTREE_RICHTING_MAP.find(r =>
      r.sleutelwoorden.some(w => zoekterm.includes(w))
    );
    if (gevonden) {
      entreeRichtingSectie = `\nENTREERICHTING: ${gevonden.richting}\nGebruik uitsluitend de context en voorbeelden die bij deze richting horen.\n`;
    }
  }

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

${regels}

CONCRETISERINGSSTAP — doe dit voor elke opgave die je bedenkt:
Vertaal het werkproces eerst naar een concrete handeling op de werkvloer:
  - Wat heeft de student fysiek in handen of voor zich?
  - Welke actie voert hij/zij uit? (meten, invullen, controleren, afwegen, doorgeven…)
  - Met welk instrument, formulier of systeem werkt hij/zij?
Pas als je die handeling helder hebt, bedenk je welk rekenvraagstuk daarbij past.

Dit voorkomt dat abstracte werkprocessen (zoals "bereidt voor" of "verzamelt informatie")
worden ingevuld met taken die bij een aangrenzend beroep horen — een dispatcher,
technicus of leidinggevende — in plaats van bij de ${opleidingsnaam} zelf.

ZELFTEST PER OPGAVE: "Voert een ${opleidingsnaam}-student op de werkvloer deze concrete handeling uit,
of is dit eigenlijk het werk van iemand anders in dezelfde omgeving?"
Alleen als het antwoord voluit "ja" is, gebruik je deze situatie.`;
  }

  const gebruikersPrompt = `Maak 3 contextrijke rekenopgaven:

OPLEIDING: ${opleidingsnaam}${creboInfo}
SECTOR: ${sector || 'niet opgegeven'}
MBO-NIVEAU: ${niveau}
${entreeRichtingSectie}${kerntakenSectie}
FUNCTIONEEL REKENDOMEIN: ${domein}

${domeinInfo}

NIVEAUEISEN:
${niveauInfo}

ZELFTESTS - controleer elke opgave:
- Herkent een ${opleidingsnaam}-student deze werksituatie als iets wat híj/zíj zelf doet?${kerntaken ? `\n- Komt de concrete handeling (niet alleen het thema) uit een van de kerntaken hierboven?\n- Zou een aangrenzend beroep (technicus, dispatcher, leidinggevende) dit eerder doen dan de ${opleidingsnaam} zelf? Zo ja: verwerp en kies opnieuw.` : ''}
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
        max_tokens: 4000,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      let gebruikersfout = 'AI-service tijdelijk niet beschikbaar';
      if (response.status === 429) gebruikersfout = 'Te veel verzoeken — wacht even en probeer opnieuw.';
      else if (response.status === 401) gebruikersfout = 'API-sleutel ongeldig of verlopen.';
      return new Response(
        JSON.stringify({ error: gebruikersfout, statusCode: response.status }),
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
  const { contextbeschrijving, vraag, titel, opleidingsnaam, niveau, sector } = body;

  if (!contextbeschrijving || !vraag) {
    return new Response(
      JSON.stringify({ error: 'Opgave-inhoud ontbreekt voor NT2-aanpassing' }),
      { status: 400, headers }
    );
  }

  const systeemPrompt = `Je bent een expert in NT2-didactiek (Nederlands als Tweede Taal) voor het mbo,
met specifieke kennis van taalgericht vakonderwijs (TVO) bij rekenen.

JE TAAK:
Pas een contextrijke rekenopgave aan zodat een NT2-student de rekeninhoud
volledig kan begrijpen en uitvoeren — zonder dat de rekenkundige uitdaging
verandert.

HET KERNPROBLEEM DAT JE OPLOST:
NT2-studenten falen bij contextopgaven niet omdat ze niet kunnen rekenen,
maar omdat de taalkundige omhulling het rekenproces verbergt. Jouw aanpassing
maakt de rekenstructuur zichtbaar door de taal toegankelijker te maken.

DRIE PRINCIPES VOOR JOUW AANPASSING:

1. VERLAAG DE TAALLAST — niet de rekeninhoud
   - Gebruik directe zinnen met een duidelijke onderwerp-werkwoord-structuur.
   - Vermijd bijzinnen waar mogelijk. Schrijf: "De tablet bevat 500 mg."
     Niet: "Elke tablet die voorgeschreven is, bevat een hoeveelheid van 500 mg."
   - Schrijf getallen altijd als cijfers (5 gram, niet: vijf gram).
   - Vermijd passieve constructies: "De bewoner krijgt 2 tabletten."
     Niet: "Er worden 2 tabletten toegediend."

2. MAAK DE REKENSTRUCTUUR ZICHTBAAR
   - Zet gegevens die nodig zijn voor de berekening elk op een eigen regel.
   - Formuleer de vraag zo dat de rekenhandeling erin doorklinkt:
     niet "Hoeveel tabletten mag de bewoner innemen?"
     maar "Hoeveel tabletten zijn dat per dag? Bereken het."
   - Als er meerdere stappen zijn: benoem ze als aparte vragen of deelvragen.

3. GEBRUIK DE BEROEPSCONTEXT ALS ANKER — niet als decoratie
   - De beroepssituatie blijft herkenbaar en volledig intact.
   - Benoem de rol van de student expliciet als dat helpt
     (bijv. "Jij bent de verzorgende." of "Je werkt in de keuken.").
   - Kies bij de woordenlijst uitsluitend woorden die essentieel zijn
     voor deze beroepssituatie — geen algemeen moeilijke woorden.

REGELS VOOR DE WOORDENLIJST:
- Geef 3 tot 5 woorden die cruciaal zijn voor het begrijpen van de opgave.
- Prioriteit: beroepsvaktermen vóór algemene schooltaal.
- Elke uitleg bestaat uit twee delen in één veld:
    a. Wat betekent het woord? (in max. 10 woorden, eenvoudig Nederlands)
    b. Hoe gebruik je het in deze situatie? (één concrete voorbeeldzin
       uit de beroepspraktijk)
  Voorbeeld: "Een hoeveelheid medicijn per keer. De bewoner krijgt elke ochtend 1 tablet."

OUTPUT FORMAAT — geef ALLEEN dit JSON-object, geen andere tekst:
{
  "nt2_contextbeschrijving": "vereenvoudigde contextbeschrijving",
  "nt2_vraag": "vereenvoudigde vraag, met zichtbare rekenstructuur",
  "woordenlijst": [
    {"woord": "vakterm", "uitleg": "betekenis + voorbeeldzin uit de beroepspraktijk"}
  ],
  "toelichting_docent": "2-3 zinnen: welke taalkeuzes zijn gemaakt en waarom, en welke rekeninhoud ongewijzigd is gebleven"
}`;

  const gebruikersPrompt = `Pas deze rekenopgave aan voor een NT2-student in het mbo.

OPGAVE:
Titel: ${titel || 'Opgave'}
Opleiding: ${opleidingsnaam || 'mbo'}
Sector: ${sector || 'niet opgegeven'}
Mbo-niveau: ${niveau || ''}

Contextbeschrijving:
${contextbeschrijving}

Vraag:
${vraag}

INSTRUCTIE:
- Verlaag de taallast zodat de rekenstructuur zichtbaar wordt.
- Behoud alle getallen, eenheden en rekenhandelingen exact.
- Richt de woordenlijst op beroepsvaktermen uit deze specifieke opleiding.
- De beroepssituatie blijft volledig herkenbaar.`;

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
        messages: [{ role: 'user', content: gebruikersPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NT2 Anthropic API error:', response.status, errorText);
      let gebruikersfout = 'NT2-aanpassing tijdelijk niet beschikbaar';
      if (response.status === 429) gebruikersfout = 'Te veel verzoeken — wacht even en probeer opnieuw.';
      return new Response(
        JSON.stringify({ error: gebruikersfout, statusCode: response.status }),
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
