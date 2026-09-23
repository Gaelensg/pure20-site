'use strict';
(() => {
  if (window.PURE20_I18N) return;

  const KEY = 'pure20_language';
  const EN_NL = new Map(Object.entries({"Knowledge":"Kennisbank","Knowledge library":"Kennisbank","Catalogue":"Catalogus","Wholesale":"Groothandel","Business Dashboard":"Bedrijfsdashboard","Retail Admin":"Retailbeheer","Wholesale Admin":"Groothandelbeheer","Retail Shop":"Retailshop","Wholesale Shop":"Groothandelshop","Public":"Openbaar","Private":"Privé","Products":"Producten","Coupons":"Kortingscodes","Settings":"Instellingen","Backup":"Back-up","Orders":"Bestellingen","Customers":"Klanten","Overview":"Overzicht","Order value":"Bestelwaarde","Average order":"Gemiddelde bestelling","Recent orders":"Recente bestellingen","Popular products":"Populaire producten","Channels":"Kanalen","Stock":"Voorraad","Pack size":"Verpakkingsgrootte","Wholesale price":"Groothandelsprijs","Price":"Prijs","Active":"Actief","Inactive":"Inactief","Hidden":"Verborgen","Out of stock":"Niet op voorraad","All":"Alle","All compounds":"Alle stoffen","New":"Nieuw","Processing":"In behandeling","Completed":"Voltooid","Cancelled":"Geannuleerd","Save":"Opslaan","Saved":"Opgeslagen","Edit":"Bewerken","Delete":"Verwijderen","Enable":"Activeren","Disable":"Deactiveren","Show":"Tonen","Hide":"Verbergen","Add product":"Product toevoegen","Add coupon":"Kortingscode toevoegen","Save settings":"Instellingen opslaan","Sign in":"Inloggen","Sign out":"Uitloggen","Signing in…":"Bezig met inloggen…","Admin email":"Admin-e-mail","Email":"E-mail","Password":"Wachtwoord","Full name":"Volledige naam","Company name":"Bedrijfsnaam","Company / note":"Bedrijf / notitie","Street and house number":"Straat en huisnummer","Belgium":"België","Discount code":"Kortingscode","Clear":"Wissen","Clear search":"Zoekopdracht wissen","Close":"Sluiten","Review order":"Bestelling bekijken","Copy order":"Bestelling kopiëren","Order summary":"Besteloverzicht","Business details":"Bedrijfsgegevens","BUSINESS DETAILS":"BEDRIJFSGEGEVENS","Shipping":"Verzending","Subtotal":"Subtotaal","Total":"Totaal","Total vials":"Totaal aantal vials","Boxes":"Dozen","Confirmed separately":"Apart bevestigd","Confirm the notice first.":"Bevestig eerst de melding.","Add at least one box first.":"Voeg eerst minstens één doos toe.","Search product, strength or code":"Zoek product, sterkte of code","Search products…":"Zoek producten…","Search customer, product or email…":"Zoek klant, product of e-mail…","Search name, company or email…":"Zoek naam, bedrijf of e-mail…","Search name, alias or class":"Zoek op naam, alias of klasse","Find a compound":"Zoek een stof","Explore the library":"Ontdek de kennisbank","No matching compounds.":"Geen overeenkomsten.","Try a different name or clear the filters.":"Probeer een andere zoekterm of wis de filters.","Reset search & filters":"Zoekopdracht & filters wissen","Metabolism & growth":"Metabolisme & groei","Repair & immune research":"Herstel & immuunonderzoek","Neuroscience & longevity":"Neurowetenschap & levensduur","PURE20 / THE KNOWLEDGE LIBRARY":"PURE20 / KENNISBANK","Understand.":"Begrijp het.","Then explore.":"Ontdek verder.","COMPOUNDS":"STOFFEN","ONE OPEN LIBRARY":"ÉÉN OPEN KENNISBANK","ABOUT THIS COLLECTION":"OVER DEZE COLLECTIE","Read the evidence.":"Lees het bewijs.","Keep the context.":"Behoud de context.","Knowledge, with context.":"Kennis, met context.","Explore the library ↗":"Ontdek de kennisbank ↗","Skip to content":"Ga naar inhoud","On this page":"Op deze pagina","What it is":"Wat is het?","How it works":"Hoe werkt het?","What the research says":"Wat zegt het onderzoek?","Safety & limitations":"Veiligheid & beperkingen","Understanding product quality":"Productkwaliteit begrijpen","Source & references":"Bronnen & referenties","Continue reading":"Lees verder","In the same collection.":"Binnen dezelfde collectie.","Research catalogue":"Onderzoekscatalogus","Order builder":"Bestelmodule","Wholesale order builder":"Groothandel bestelmodule","RESEARCH CATALOGUE / 2026":"ONDERZOEKSCATALOGUS / 2026","WHOLESALE / PRIVATE ACCESS":"GROOTHANDEL / PRIVÉTOEGANG","Add quantities. Your order updates instantly.":"Voeg aantallen toe. Je bestelling wordt direct bijgewerkt.","Company":"Bedrijf","Customer":"Klant","Notes":"Notities","Unknown customer":"Onbekende klant","Unknown item":"Onbekend product","No item snapshot":"Geen productmomentopname","Item":"Product","Demo / local":"Demo / lokaal","Saved to cloud":"Opgeslagen in de cloud","Saved in demo mode":"Opgeslagen in demomodus","Save failed":"Opslaan mislukt","This account is not approved for wholesale access.":"Dit account is niet goedgekeurd voor groothandelstoegang.","This account is not a PURE20 administrator.":"Dit account is geen PURE20-beheerder.","Sign in failed.":"Inloggen mislukt.","Session not authorised.":"Sessie niet geautoriseerd.","One door. Everything.":"Eén ingang. Alles.","Everything.":"Alles.","One place.":"Eén plek.","PRIVATE COMMAND CENTER":"PRIVÉ COMMANDOCENTRUM","Open the public PURE20 catalogue and retail order builder.":"Open de openbare PURE20-catalogus en retail bestelmodule.","Open the private wholesale catalogue for approved customers.":"Open de privé-groothandelscatalogus voor goedgekeurde klanten.","Edit retail products, prices, stock, coupons and shop settings.":"Beheer retailproducten, prijzen, voorraad, kortingscodes en shopinstellingen.","Manage wholesale pricing, pack sizes and approved customer access.":"Beheer groothandelsprijzen, verpakkingsgroottes en klanttoegang.","View orders, customers, order value, popular products and statuses.":"Bekijk bestellingen, klanten, bestelwaarde, populaire producten en statussen.","Sign in with your existing PURE20 administrator account.":"Log in met je bestaande PURE20-beheerdersaccount.","Calculator modes":"Calculatormodi","Dose to units":"Dosis naar units","Units to amount":"Units naar hoeveelheid","Component A":"Component A","Component B":"Component B","Enter amount":"Vul hoeveelheid in","Enter units":"Vul units in","This result exceeds 100 U (1.00 mL) on a U-100 scale.":"Dit resultaat is hoger dan 100 U (1,00 mL) op een U-100-schaal.","A modified growth hormone fragment with metabolic effects in rodents. Human oral development failed to establish useful weight loss, and subcutaneous efficacy remains unproven.":"Een gemodificeerd groeihormoonfragment met metabole effecten in dieronderzoek. De humane ontwikkeling via orale toediening toonde geen overtuigend gewichtsverlies aan en de werkzaamheid via subcutane toediening blijft onbewezen.","An investigational, nonerythropoietic EPO-derived peptide with preliminary human neuropathy findings, uncertain clinical benefit, and no established application to exercise recovery.":"Een experimenteel, niet-erytropoëtisch EPO-afgeleid peptide met voorlopige humane bevindingen bij neuropathie, maar zonder gevestigde toepassing voor sportherstel.","A topical SNAP-25 mimetic cosmetic peptide with limited, inconsistent human evidence for improving the appearance of expression lines.":"Een topisch cosmetisch peptide met beperkt en wisselend humaan bewijs voor het verminderen van de zichtbaarheid van expressielijnen.","An investigational synthetic pentadecapeptide with extensive preclinical healing research, limited human studies, and no established clinical regimen for injury recovery.":"Een experimenteel synthetisch pentadecapeptide met veel preklinisch onderzoek naar herstel, maar slechts beperkte humane gegevens en geen gevestigde klinische herstelbehandeling.","A long-acting, lipidated amylin analogue studied for weight management, alone and with semaglutide. Multiple randomized trials support weight reduction; it remains investigational.":"Een langwerkend amylin-analoog dat wordt onderzocht voor gewichtsmanagement, alleen en in combinatie met semaglutide. Meerdere gerandomiseerde studies tonen gewichtsreductie, maar het middel blijft experimenteel.","A porcine brain hydrolysate with substantial but mixed neurological trial evidence, limited exploratory healthy-volunteer data, and no established cognitive enhancement protocol for healthy adults who train.":"Een hydrolysaat uit varkenshersenen met veel maar gemengd neurologisch onderzoek en slechts beperkte gegevens bij gezonde personen.","An albumin-binding GHRH analog that prolonged GH and IGF-1 elevation in small human studies. Muscle gain, recovery and sleep benefits remain unproven.":"Een GHRH-analoog dat in kleine humane studies de GH- en IGF-1-spiegels langduriger verhoogde. Voordelen voor spiergroei, herstel en slaap zijn niet overtuigend aangetoond.","An experimental angiotensin IV-derived peptidomimetic with mixed animal findings, no established human dosing, and major integrity concerns affecting its foundational research.":"Een experimenteel peptidomimeticum met gemengde dierbevindingen, geen gevestigde humane dosering en belangrijke onzekerheden rond het fundamentele onderzoek.","A nonapeptide from early sleep research with inconsistent human insomnia findings, an unresolved biological target, and no established regimen for sleep or recovery.":"Een nonapeptide uit vroeg slaaponderzoek met inconsistente humane resultaten bij slapeloosheid en zonder duidelijk vastgesteld biologisch doelwit.","A synthetic pineal tetrapeptide with experimental telomere and circadian effects, but no established human longevity or sleep benefit.":"Een synthetisch tetrapeptide met experimentele bevindingen rond telomeren en circadiane processen, maar zonder gevestigde humane voordelen voor levensduur of slaap.","An activin and myostatin binding protein with preliminary human gene therapy findings, mixed animal protein data, and no established injectable protein regimen for trained adults.":"Een eiwit dat activine en myostatine kan binden. Er zijn voorlopige humane gegevens uit gentherapie, maar geen gevestigde injecteerbare eiwitbehandeling voor spiergroei.","An experimental senolytic peptide targeting the FOXO4-p53 interaction, with animal evidence and no established human longevity benefit or dosing regimen.":"Een experimenteel senolytisch peptide dat de interactie tussen FOXO4 en p53 probeert te verstoren. Er is dieronderzoek, maar geen bewezen humaan levensduurvoordeel.","A copper-binding tripeptide with substantial preclinical research, mixed topical human results, and no established injectable regimen for recovery, muscle growth or skin rejuvenation.":"Een koperbindend tripeptide met veel preklinisch onderzoek en gemengde humane resultaten bij topisch gebruik. Een injecteerbaar regime voor herstel of huidverjonging is niet gevestigd.","A synthetic ghrelin-receptor agonist with an approved Japanese diagnostic use. Small human studies document increased GH, IGF-I and appetite, but do not establish muscle-building benefits in trained adults.":"Een synthetische ghrelinereceptor-agonist met een diagnostische toepassing in Japan. Kleine humane studies tonen stijgingen van GH, IGF-1 en eetlust, maar geen bewezen spieropbouw bij getrainde volwassenen.","A ghrelin receptor agonist with documented human growth hormone responses, additional endocrine effects, and no established benefit for muscle gain or recomposition.":"Een ghrelinereceptor-agonist met gedocumenteerde GH-responsen bij mensen en bijkomende endocriene effecten, zonder gevestigde voordelen voor spiergroei of recompositie.","A potent growth hormone secretagogue with small human studies, but no established adult muscle benefit. A 16-week study found no significant body-composition improvement.":"Een krachtige groeihormoonsecretagoog met kleine humane studies, maar zonder gevestigd voordeel voor spiermassa bij volwassenen.","A sixteen amino acid growth hormone fragment with limited direct research. Its evidence must be separated from AOD9604 and the shorter fragment hGH 177-191.":"Een fragment van zestien aminozuren uit humaan groeihormoon met beperkt direct onderzoek. Het moet duidelijk worden onderscheiden van AOD-9604 en het kortere hGH 177-191.","A mitochondrial-derived cytoprotective peptide with animal evidence for selected healthspan effects, but no established human treatment dose or demonstrated human longevity benefit.":"Een mitochondriaal afgeleid peptide met dieronderzoek rond cytoprotectie en bepaalde gezondheidsduur-uitkomsten, maar zonder bewezen humaan levensduurvoordeel.","An experimental IGF-1 analog with reduced binding-protein affinity. Animal activity is established; human muscle-building efficacy, dosing, and pharmacokinetics remain unestablished.":"Een experimenteel IGF-1-analoog met aangetoonde biologische activiteit in dieren, maar zonder gevestigde humane werkzaamheid, farmacokinetiek of dosering voor spiergroei.","A ghrelin receptor agonist with documented short-term GH release in humans, animal evidence of endocrine selectivity, and no established benefit for muscle, recovery or sleep.":"Een ghrelinereceptor-agonist met gedocumenteerde kortdurende GH-afgifte bij mensen, maar zonder gevestigde voordelen voor spiergroei, herstel of slaap.","An investigational KISS1R agonist that stimulates reproductive hormone signaling, with human endocrine evidence but no established Kisspeptin-10 treatment benefit for low libido.":"Een experimentele KISS1R-agonist die reproductieve hormoonsignalering kan stimuleren, met humane endocriene gegevens maar zonder gevestigde behandeling voor laag libido.","The three amino acid tail of alpha-MSH, studied for anti-inflammatory effects in cells and animals, with no published human treatment trial identified.":"Het drie-aminozuren-einde van alpha-MSH, onderzocht op ontstekingsremmende effecten in cellen en dieren. Er werd geen gepubliceerde humane behandelingsstudie geïdentificeerd.","A once-daily GLP-1 receptor agonist with strong evidence for weight management in eligible patients, but no established role in lean athletic recomposition.":"Een eenmaal daags gebruikte GLP-1-receptoragonist met sterk bewijs voor gewichtsmanagement bij geschikte patiënten, maar zonder gevestigde rol voor atletische recompositie.","A human cathelicidin peptide with formulation-specific clinical trials, mixed wound-healing results, and no established subcutaneous protocol for immunity, training recovery or performance.":"Een humaan antimicrobieel peptide met formulatiespecifieke klinische studies en gemengde wondhelingsresultaten, zonder gevestigd subcutaan protocol voor algemene immuniteit of sportherstel.","An unapproved, non-selective melanocortin agonist with small human studies showing pigmentation and erectile responses, unresolved long-term safety, and serious adverse-event reports.":"Een niet-goedgekeurde melanocortine-agonist met kleine humane studies naar pigmentatie en erectiele responsen, maar met onduidelijke langetermijnveiligheid en meldingen van ernstige bijwerkingen.","A mitochondrial-derived signaling peptide with metabolic and physical-function findings in mice, but no established human benefit for fat loss or longevity.":"Een mitochondriaal afgeleid signaalpeptide met metabole en fysieke-functioneringsbevindingen in muizen, maar zonder gevestigd humaan voordeel voor vetverlies of levensduur.","An essential metabolic coenzyme with established cellular functions, but unproven longevity benefits from direct supplementation.":"Een essentieel metabool co-enzym met fundamentele cellulaire functies, maar zonder bewezen levensduurvoordeel van directe suppletie.","A neurohypophysial nonapeptide with established obstetric uses, but inconsistent human evidence for improving libido through intranasal administration.":"Een natuurlijk peptidehormoon met gevestigde obstetrische toepassingen, maar inconsistente humane gegevens voor verbetering van libido via intranasale toediening.","An experimental PEG-conjugated MGF E peptide with no identified human administration trials, uncertain pharmacokinetics, and disputed muscle-growth mechanisms.":"Een experimenteel PEG-geconjugeerd MGF-peptide zonder geïdentificeerde humane toedieningsstudies, met onzekere farmacokinetiek en betwiste spiergroeimechanismen.","Bremelanotide is a centrally acting melanocortin agonist with modest demonstrated benefits for sexual desire and related distress in premenopausal women with HSDD.":"Bremelanotide is een centraal werkende melanocortine-agonist met bescheiden aangetoonde voordelen voor seksueel verlangen en gerelateerde distress bij premenopauzale vrouwen met HSDD.","Investigational once-weekly triple GIP, GLP-1 and glucagon receptor agonist with substantial randomized-trial weight and glucose reductions. Long-term clinical outcomes and maintenance after withdrawal remain unresolved.":"Een experimentele eenmaal wekelijkse drievoudige receptoragonist met grote gewichts- en glucosereducties in gerandomiseerde studies. Langetermijnuitkomsten en behoud na stoppen blijven onduidelijk.","A synthetic tuftsin analog registered in Russia as an intranasal anxiolytic. Small human studies report anxiety improvement, but cognitive enhancement, sleep benefits, and long-term safety remain insufficiently established.":"Een synthetisch tuftsin-analoog dat in Rusland als intranasaal anxiolyticum wordt gebruikt. Kleine humane studies melden verbetering van angst, maar cognitieve en slaapvoordelen blijven onvoldoende bewezen.","A GLP-1 receptor agonist with Grade A evidence for weight management and specific cardiometabolic indications. Trade-offs include gastrointestinal effects, loss of some lean mass, and substantial weight regain after withdrawal.":"Een GLP-1-receptoragonist met sterk bewijs voor gewichtsmanagement en specifieke cardiometabole indicaties. Belangrijke aandachtspunten zijn maag-darmklachten, verlies van een deel vetvrije massa en gewichtstoename na stoppen.","A Russian-registered nasal peptide with rodent neurotrophic findings and limited neurological clinical studies. Evidence for improved cognition in healthy adults remains weak.":"Een in Rusland geregistreerd nasaal peptide met preklinische neurotrofe bevindingen en beperkte neurologische klinische studies. Bewijs voor cognitieve verbetering bij gezonde volwassenen is zwak.","A short GHRH fragment with historical diagnostic and pediatric approvals, small adult endocrine studies, unproven physique benefits, and an explicit WADA prohibition.":"Een kort GHRH-fragment met historische diagnostische en pediatrische toepassingen en kleine endocriene studies bij volwassenen, maar zonder bewezen voordelen voor lichaamsbouw of slaap.","A mitochondria-targeted tetrapeptide with a narrow FDA-approved indication in Barth syndrome, while longevity and training-recovery benefits remain unproven.":"Een mitochondriaal gericht tetrapeptide met een smalle goedgekeurde indicatie bij Barth-syndroom, terwijl voordelen voor levensduur en trainingsherstel niet bewezen zijn.","An acetylated thymosin beta-4 fragment with preclinical research, unresolved identity across marketed preparations, and no verified human trial establishing recovery benefits for Ac-LKKTETQ.":"Een commercieel verkocht fragment gerelateerd aan thymosine beta-4 met vooral preklinisch herstelonderzoek en zonder geverifieerde humane studie die herstelvoordelen van het fragment aantoont.","A stabilized GHRH analog approved to reduce excess abdominal fat in adults with HIV-associated lipodystrophy, with clinically important IGF-1 and glucose risks.":"Een gestabiliseerd GHRH-analoog dat is goedgekeurd voor vermindering van overtollig abdominaal vet bij volwassenen met hiv-geassocieerde lipodystrofie, met relevante IGF-1- en glucoserisico’s.","Bovine thymus polypeptide extract with Russian medical approval, limited human immune-marker findings, and insufficient evidence for longevity or training benefits.":"Een uit rundthymus afkomstig polypeptidenmengsel met medische toepassing in Rusland en beperkte humane bevindingen voor immuunmarkers, maar onvoldoende bewijs voor levensduur of training.","An immunomodulatory peptide with substantial clinical research, no demonstrated mortality benefit in the largest verified sepsis trial, and no established training or infection-prevention benefit in healthy athletes.":"Een immunomodulerend peptide met veel klinisch onderzoek, maar zonder aangetoond mortaliteitsvoordeel in de grootste geverifieerde sepsisstudie en zonder gevestigde preventieve rol bij gezonde sporters.","Approved once-weekly GIP/GLP-1 receptor agonist with substantial weight-loss evidence. A body-composition substudy found roughly one quarter of lost mass was lean tissue.":"Een goedgekeurde eenmaal wekelijkse GIP/GLP-1-receptoragonist met sterk bewijs voor gewichtsverlies. Een lichaamssamenstellingssubstudie liet zien dat een deel van het gewichtsverlies uit vetvrije massa bestaat.","Select your preferred products and quantities, review your order, then copy it and send it to us via WhatsApp.":"Selecteer je gewenste producten en aantallen, controleer je bestelling en kopieer ze of stuur ze via WhatsApp.","For research purposes only. Product availability, shipping and payment are confirmed separately. This page does not process payment or automatically submit an order.":"Uitsluitend voor onderzoeksdoeleinden. Beschikbaarheid, verzending en betaling worden afzonderlijk bevestigd. Deze pagina verwerkt geen betaling en verstuurt geen bestelling automatisch.","Shipping confirmed separately":"Verzending wordt afzonderlijk bevestigd","Select products by the box, review your wholesale order and send the order summary to us via WhatsApp.":"Selecteer producten per doos, controleer je groothandelsbestelling en stuur het besteloverzicht via WhatsApp.","Wholesale access is private. Availability, shipping and payment are confirmed separately.":"Groothandelstoegang is privé. Beschikbaarheid, verzending en betaling worden afzonderlijk bevestigd.","Cognitive & Wellbeing":"Cognitie & welzijn","GLP-1 & Metabolic":"GLP-1 & metabolisme","Growth Hormone & Secretagogues":"Groeihormoon & secretagogen","Healing & Recovery":"Herstel & regeneratie","Longevity & Cellular":"Levensduur & cellulair","Supplies & Solvents":"Benodigdheden & oplosmiddelen","Your order":"Je bestelling","Order":"Bestelling","Order details":"Bestelgegevens","Order lines":"Bestelregels","Contact details":"Contactgegevens","Quantity":"Aantal","Units":"Units","Packs":"Dozen","Vials":"Vials","Apply":"Toepassen","Remove":"Verwijderen","Discount":"Korting","Coupon":"Kortingscode","Country":"Land","Phone":"Telefoon","Address":"Adres","Postal code":"Postcode","VAT number":"Btw-nummer","Send via WhatsApp":"Versturen via WhatsApp","Open cart":"Winkelmand openen","Clear cart":"Winkelmand wissen","No products found.":"Geen producten gevonden.","No products match your search.":"Geen producten komen overeen met je zoekopdracht.","Low stock":"Lage voorraad","In stock":"Op voorraad","Product":"Product","Category":"Categorie","Code":"Code","Visibility":"Zichtbaarheid","Badge":"Badge","Note":"Notitie","Fixed":"Vast bedrag","Percent":"Percentage","Import CSV":"CSV importeren","Export CSV":"CSV exporteren","Cloud / live":"Cloud / live","Demo data saved on this browser":"Demogegevens opgeslagen in deze browser","Hiding product…":"Product verbergen…","Showing product…":"Product tonen…","Add customer":"Klant toevoegen","Approved customers":"Goedgekeurde klanten","Access":"Toegang","Pricing":"Prijzen","Retail":"Retail","VIP":"VIP","No orders yet.":"Nog geen bestellingen.","No customers yet.":"Nog geen klanten.","Signed in as admin":"Ingelogd als beheerder","A closer look at peptides and related compounds. Discover what they are, how they work, and what the research can—and cannot—tell us.":"Een heldere blik op peptides en verwante stoffen. Lees wat ze zijn, hoe ze werken en vooral wat onderzoek wél en niet kan aantonen.","Based on the 41 compound profiles in the supplied Prime Peptides library, archived on 22 September 2026. The collection includes peptides and related compounds; inclusion does not imply availability in the PURE20 shop. Each profile retains the source’s distinction between human and preclinical research, limitations and references.":"Gebaseerd op de 41 profielen uit de aangeleverde Prime Peptides-bibliotheek, gearchiveerd op 22 september 2026. De collectie bevat peptides en verwante stoffen; opname in deze kennisbank betekent niet dat een product verkrijgbaar is in de PURE20-shop. Elk profiel bewaart het onderscheid tussen humaan en preklinisch onderzoek, beperkingen en bronnen.","Educational information. Research findings do not establish suitability for personal use.":"Educatieve informatie. Onderzoeksbevindingen tonen niet aan dat een stof geschikt is voor persoonlijk gebruik.","PURE20 / RESEARCH CALCULATOR":"PURE20 / ONDERZOEKSCALCULATOR","Calculate.":"Bereken.","Don't guess.":"Niet gokken.","Convert vial concentration, liquid volume and U-100 syringe units with transparent formulas. Now with an interactive syringe that visually shows the selected or calculated fill level.":"Reken vialconcentratie, vloeistofvolume en U-100-spuitunits om met transparante formules. De interactieve spuit toont visueel het gekozen of berekende vulniveau.","U-100 standard: 100 units = 1.00 mL":"U-100-standaard: 100 units = 1,00 mL","Units.":"Units.","One mL.":"Eén mL.","Clear math.":"Heldere berekening.","Dose → units":"Dosis → units","Units → amount":"Units → hoeveelheid","Dose → syringe units":"Dosis → spuitunits","Syringe units → amount":"Spuitunits → hoeveelheid","Two-component blend":"Blend met twee componenten","Enter the amount in the vial, the total liquid volume after mixing, and the amount you want to convert. The calculator returns the theoretical U-100 syringe marking and visualizes the fill level on the syringe.":"Vul de hoeveelheid in de vial, het totale vloeistofvolume na mengen en de hoeveelheid die je wilt omrekenen in. De calculator geeft de theoretische U-100-markering en toont het vulniveau op de spuit.","Use this mode when you know the vial concentration and syringe marking and want to calculate how much material that volume contains. Here the syringe is fully interactive: drag the slider or type a value.":"Gebruik deze modus wanneer je de vialconcentratie en spuitmarkering kent en wilt berekenen hoeveel stof dat volume bevat. De spuit is hier volledig interactief: versleep de schuifregelaar of voer een waarde in.","Calculate a shared syringe volume when two components are present in the same vial. Choose which component you want to use as the basis; the calculator shows the simultaneous amount of the other component and visualizes the resulting syringe fill.":"Bereken één gedeeld spuitvolume wanneer twee componenten in dezelfde vial zitten. Kies welke component als basis dient; de calculator toont tegelijk de hoeveelheid van de andere component en visualiseert het vulniveau.","Amount in vial":"Hoeveelheid in vial","Total liquid volume":"Totaal vloeistofvolume","Amount to convert":"Om te rekenen hoeveelheid","Syringe marking":"Spuitmarkering","Component A name":"Naam component A","Component B name":"Naam component B","Component A in vial":"Component A in vial","Component B in vial":"Component B in vial","Calculate from":"Berekenen op basis van","Amount":"Hoeveelheid","Theoretical calculation only. It does not account for syringe dead space, transfer loss, measurement error or product-specific instructions.":"Alleen een theoretische berekening. Er wordt geen rekening gehouden met dode ruimte in de spuit, overdrachtsverlies, meetfouten of productspecifieke instructies.","This page assumes a U-100 syringe scale. A marking of 10 units corresponds to 0.10 mL.":"Deze pagina gaat uit van een U-100-spuitschaal. Een markering van 10 units komt overeen met 0,10 mL.","The ratio between both components stays fixed because both occupy the same solution volume.":"De verhouding tussen beide componenten blijft vast omdat beide hetzelfde oplossingsvolume delen.","CALCULATED RESULT":"BEREKEND RESULTAAT","INTERACTIVE SYRINGE":"INTERACTIEVE SPUIT","BLEND RESULT":"BLENDRESULTAAT","U-100 syringe":"U-100-spuit","Visual syringe":"Visuele spuit","Adjust syringe":"Spuit aanpassen","Visual result based on calculated units.":"Visueel resultaat op basis van de berekende units.","Moving the slider updates the units field automatically.":"De schuifregelaar past het unitsveld automatisch aan.","Drag":"Versleep","Volume":"Volume","Concentration":"Concentratie","Amount per 1 unit":"Hoeveelheid per 1 unit","Theoretical portions / vial":"Theoretische porties / vial","Contained amount":"Aanwezige hoeveelheid","Same amount":"Dezelfde hoeveelheid","Blend ratio":"Blendverhouding","Important:":"Belangrijk:","this calculator performs mathematical conversions only. It does not recommend a dose, injection route, frequency, treatment, product, or medical use. Always verify the vial label, final solution volume and syringe calibration. For prescribed or approved medicines, follow the instructions supplied by a licensed healthcare professional or pharmacist.":"deze calculator voert uitsluitend wiskundige omzettingen uit. Hij adviseert geen dosis, injectieroute, frequentie, behandeling, product of medisch gebruik. Controleer altijd het viallabel, het uiteindelijke oplossingsvolume en de kalibratie van de spuit. Volg bij voorgeschreven of goedgekeurde geneesmiddelen de instructies van een bevoegde arts of apotheker.","e.g. 10":"bv. 10","e.g. 2":"bv. 2","The database could not be reached, so the packaged fallback catalogue is shown for now.":"De database kon niet worden bereikt. Daarom wordt voorlopig de ingebouwde reservecatalogus getoond."}));
  const NL_EN = new Map([...EN_NL.entries()].map(([en,nl]) => [nl,en]));

  let knowledgeNlSnapshot = null;
  const isKnowledgeDetail = !!document.querySelector('.reading-layout article');

  function preferred() {
    const saved = localStorage.getItem(KEY);
    if (saved === 'nl' || saved === 'en') return saved;
    return 'nl';
  }

  let lang = preferred();

  function mapped(raw, target) {
    const text = String(raw ?? '');
    const trimmed = text.trim();
    if (!trimmed) return text;

    const map = target === 'nl' ? EN_NL : NL_EN;
    let next = map.get(trimmed);

    if (!next) {
      const patterns = target === 'nl'
        ? [
            [/^(\d+) of (\d+) compounds$/, '$1 van $2 stoffen'],
            [/^(\d+) compounds$/, '$1 stoffen'],
            [/^(\d+) boxes available$/, '$1 dozen beschikbaar'],
            [/^Signed in as (.+)$/, 'Ingelogd als $1']
          ]
        : [
            [/^(\d+) van (\d+) stoffen$/, '$1 of $2 compounds'],
            [/^(\d+) stoffen$/, '$1 compounds'],
            [/^(\d+) dozen beschikbaar$/, '$1 boxes available'],
            [/^Ingelogd als (.+)$/, 'Signed in as $1']
          ];

      for (const [rx,repl] of patterns) {
        if (rx.test(trimmed)) {
          next = trimmed.replace(rx,repl);
          break;
        }
      }
    }

    if (!next || next === trimmed) return text;
    const lead = text.match(/^\s*/)?.[0] || '';
    const tail = text.match(/\s*$/)?.[0] || '';
    return lead + next + tail;
  }

  function textNode(node) {
    if (!node?.parentElement) return;
    if (['SCRIPT','STYLE','TEXTAREA','CODE','PRE'].includes(node.parentElement.tagName)) return;
    node.nodeValue = mapped(node.nodeValue, lang);
  }

  function element(el) {
    if (!(el instanceof Element)) return;
    for (const attr of ['placeholder','aria-label','title']) {
      if (el.hasAttribute(attr)) el.setAttribute(attr, mapped(el.getAttribute(attr), lang));
    }
    if (el.tagName === 'OPTION') el.textContent = mapped(el.textContent, lang);
  }

  function translateTree(root = document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return textNode(root);
    if (root instanceof Element) element(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) textNode(n);

    root.querySelectorAll?.('[placeholder],[aria-label],[title],option').forEach(element);
  }

  function snapshotKnowledgeNl() {
    if (!isKnowledgeDetail || knowledgeNlSnapshot) return;
    const selectors = ['.detail-hero','.reading-layout','.related','footer'];
    knowledgeNlSnapshot = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) knowledgeNlSnapshot[sel] = el.outerHTML;
    }
  }

  async function restoreKnowledgeEnglish() {
    if (!isKnowledgeDetail) return false;
    try {
      const res = await fetch(location.pathname + '?langsource=1', {cache:'no-store'});
      if (!res.ok) return false;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html,'text/html');

      for (const sel of ['.detail-hero','.reading-layout','.related','footer']) {
        const live = document.querySelector(sel);
        const fresh = doc.querySelector(sel);
        if (live && fresh) live.replaceWith(fresh);
      }
      return true;
    } catch {
      return false;
    }
  }

  function restoreKnowledgeNl() {
    if (!isKnowledgeDetail || !knowledgeNlSnapshot) return;
    for (const [sel,markup] of Object.entries(knowledgeNlSnapshot)) {
      const live = document.querySelector(sel);
      if (!live) continue;
      const box = document.createElement('div');
      box.innerHTML = markup;
      const fresh = box.firstElementChild;
      if (fresh) live.replaceWith(fresh);
    }
  }

  function injectSwitcher() {
    if (document.getElementById('pure20LangSwitch')) return;

    const style = document.createElement('style');
    style.textContent = `
      .pure20-lang-switch{
        display:inline-flex;align-items:center;gap:2px;
        border:1px solid currentColor;padding:2px;margin-left:10px;
        vertical-align:middle;white-space:nowrap;background:#f2f1ec;color:#111
      }
      .pure20-lang-switch button{
        appearance:none;border:0;background:transparent;color:inherit;
        font:inherit;font-size:10px;line-height:1;letter-spacing:.08em;
        padding:7px 8px;cursor:pointer
      }
      .pure20-lang-switch button[aria-pressed="true"]{background:#111;color:#fff}
      @media(max-width:640px){
        .pure20-lang-mobile{
          position:absolute;top:0;right:0;z-index:50;margin:0;
          box-shadow:0 1px 8px rgba(0,0,0,.06)
        }
      }
      @media(max-width:600px){
        .pure20-lang-switch button{padding:7px 6px;font-size:9px}
      }
    `;
    document.head.appendChild(style);

    const box = document.createElement('span');
    box.id = 'pure20LangSwitch';
    box.className = 'pure20-lang-switch';
    box.setAttribute('aria-label','Taal / Language');
    box.innerHTML = '<button type="button" data-lang="nl">NL</button><button type="button" data-lang="en">EN</button>';

    const mobileOrderHeader =
      window.matchMedia('(max-width:640px)').matches &&
      document.getElementById('headerCart') &&
      document.querySelector('.site-header .header-inner');

    if (mobileOrderHeader) {
      const host = document.querySelector('.site-header .header-inner');
      host.style.position = 'relative';
      box.classList.add('pure20-lang-mobile');
      host.appendChild(box);
    } else {
      const target =
        document.querySelector('.header-nav') ||
        document.querySelector('header nav') ||
        document.querySelector('.account-nav') ||
        document.querySelector('.admin-header-inner') ||
        document.querySelector('.portal-footer');

      if (target) target.appendChild(box);
      else {
        box.style.cssText += ';position:fixed;right:12px;top:12px;z-index:9999;background:#fff;color:#111';
        document.body.appendChild(box);
      }
    }

    box.addEventListener('click', e => {
      const b = e.target.closest('[data-lang]');
      if (b) setLanguage(b.dataset.lang);
    });
  }

  function updateSwitcher() {
    const box = document.getElementById('pure20LangSwitch');
    if (!box) return;
    box.querySelectorAll('[data-lang]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
  }

  async function apply() {
    document.documentElement.lang = lang;

    if (isKnowledgeDetail) {
      snapshotKnowledgeNl();
      if (lang === 'en') await restoreKnowledgeEnglish();
      else restoreKnowledgeNl();
      injectSwitcher();
    }

    translateTree(document.body);
    updateSwitcher();
  }

  async function setLanguage(next) {
    if (!['nl','en'].includes(next)) return;
    lang = next;
    localStorage.setItem(KEY, lang);
    await apply();
    window.dispatchEvent(new CustomEvent('pure20:languagechange', {detail:{lang}}));
  }

  window.PURE20_I18N = {
    get language() { return lang; },
    setLanguage,
    translateTree,
    mapText: mapped
  };

  async function start() {
    snapshotKnowledgeNl();
    injectSwitcher();
    await apply();

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) textNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        }
      }
    });
    observer.observe(document.body, {childList:true,subtree:true});

    window.dispatchEvent(new CustomEvent('pure20:i18nready', {detail:{lang}}));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
