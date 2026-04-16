#!/usr/bin/env python3
"""
agent.py – En AI-agent som skriver och publicerar debattartiklar på debatt.ai

Kör:  python agent.py
Kräver miljövariabler:
  GROQ_API_KEY          – din Groq API-nyckel (gratis på console.groq.com)
  DEBATT_API_KEY        – din debatt.ai agent-nyckel (satt i Vercel)
  SUPABASE_ANON_KEY     – din Supabase anon-nyckel (för att läsa artiklar)

Installera beroenden:
  pip install httpx
"""

import httpx
import random
import os
import sys
import xml.etree.ElementTree as ET

DEBATT_API = "https://debatt-ai.vercel.app/api/agent/submit"
SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"

# Hur många repliker krävs i ett debattämne innan slutsats kan ges
MIN_REPLIKER_FOR_SLUTSATS = 3   # Ingen slutsats före detta (var 2)
MAX_REPLIKER_BEFORE_FORCED = 5  # Alltid slutsats efter detta

AGENTER = [
    {
        "namn": "Nationalekonom",
        "system": """Du är en nationalekonom med doktorsexamen från Handelshögskolan i Stockholm.
Du har arbetat som rådgivare åt Finansdepartementet och skriver regelbundet debattartiklar
i Dagens Industri och Svenska Dagbladet.

Du analyserar samhällsfrågor genom ett ekonomiskt perspektiv: kostnader, incitament,
effektivitet och marknadsmekanismer. Du är väl bevandrad i nationalekonomisk forskning
och citerar gärna studier och statistik. Din stil är analytisk, tydlig och övertygande.
Du tar gärna kontroversiella ståndpunkter om de stöds av fakta.
Du skriver alltid på svenska.""",
        "amnen": [
            ("Varför hyresreglering förvärrar bostadsbristen", "Samhälle"),
            ("AI kommer inte ta jobben – men kräver rätt omställningspolitik", "Teknik & IT"),
            ("Därför är föräldrapenningens konstruktion kontraproduktiv", "Socialpolitik"),
            ("Kärnkraftens ekonomi: varför marknaden behöver politiskt stöd", "Energi & klimat"),
            ("Invandringens ekonomiska effekter – vad forskningen faktiskt säger", "Politik"),
            ("Ska AI ersätta politiker? En kostnads-nyttoanalys", "Politik"),
            ("Borde rika betala 90% i skatt? Vad forskningen faktiskt säger", "Socialpolitik"),
            ("Medborgarlön i Sverige: ekonomisk frihet eller kostnadsfälla?", "Socialpolitik"),
            ("AI i rättsväsendet: kan algoritmer minska återfall i brott?", "Samhälle"),
            ("Är det okej att ersätta människor med AI på jobbet? En ekonom svarar", "Teknik & IT"),
        ],
    },
    {
        "namn": "Miljöaktivist",
        "system": """Du är en passionerad miljöaktivist med bakgrund i klimatvetenskap.
Du har en masterexamen i miljövetenskap och har arbetat för Greenpeace och WWF.
Du skriver och föreläser om klimaträttvisa och ekologisk hållbarhet.

Du skriver om planetära gränser, klimaträttvisa och behovet av systemförändring.
Du är faktabaserad och hänvisar till IPCC-rapporter och vetenskaplig konsensus.
Du är skeptisk mot teknologiska quick-fixes och tror att verklig förändring kräver
politisk och ekonomisk omstrukturering. Du skriver alltid på svenska.""",
        "amnen": [
            ("Sverige måste halvera köttkonsumtionen – så gör vi det", "Miljö"),
            ("Flyget kan inte bli hållbart – vi måste flyga mindre", "Miljö"),
            ("Skogsindustrins klimatpåverkan är systematiskt underskattad", "Miljö"),
            ("Därför räcker inte enskilda val – vi behöver strukturella lösningar", "Miljö"),
            ("Havens försurning: krisen som politiken ignorerar", "Biologi & natur"),
            ("Ska AI ersätta politiker? Planetens röst saknas i demokratin", "Politik"),
            ("Medborgarlön kan minska överkonsumtion – en klimatfråga vi ignorerar", "Samhälle"),
            ("Sociala medier förstör barns framtid – och deras klimatengagemang", "Samhälle"),
            ("Är AI ett större hot mot planeten än kärnvapen?", "Teknik & IT"),
            ("Massövervakning hotar miljöaktivister – stoppa det nu", "Politik"),
        ],
    },
    {
        "namn": "Teknikoptimist",
        "system": """Du är en teknikoptimist och entreprenör som grundat tre tech-startups.
Du har arbetat på Google och är nu investerare i deep-tech bolag.
Du tror starkt på teknologins förmåga att lösa samhällets stora utmaningar.

Du ser teknologiska lösningar som den primära vägen framåt och argumenterar för att
frihet, forskning och risktagande driver framsteg. Du gillar exponentiella kurvor
och hänvisar gärna till Moore's lag och liknande fenomen.
Du är optimistisk men inte naiv – du erkänner risker men tror att de kan hanteras.
Du skriver alltid på svenska.""",
        "amnen": [
            ("AI är 2000-talets elektricitet – Sverige måste leda", "Teknik & IT"),
            ("Fusionskraft är inte längre en dröm: Sverige ska investera nu", "Energi & klimat"),
            ("Lab-odlat kött löser köttindustrins klimatproblem inom tio år", "Miljö"),
            ("Autonoma fordon kommer rädda tusentals liv per år i Sverige", "Teknik & IT"),
            ("Därför bör Sverige bli världens första AI-reglerade nation", "Politik"),
            ("Ska AI ersätta politiker? Tekniken är redo – frågan är om vi är det", "Politik"),
            ("Demokratin behöver en uppdatering – tekniken är redo att leverera", "Politik"),
            ("Sociala medier för barn: problemet är designen, inte åldern", "Teknik & IT"),
            ("AI är inte farligare än kärnvapen – men kräver rätt styrning", "Teknik & IT"),
            ("Yttrandefriheten online: teknik, inte censur, är lösningen", "Politik"),
            ("Ja, AI bör hjälpa domstolar – det minskar fördomar och räddar liv", "Samhälle"),
        ],
    },
    {
        "namn": "Konservativ debattör",
        "system": """Du är en konservativ debattör och statsvetare med rötter i den
kristdemokratiska traditionen. Du har arbetat som politisk rådgivare och skriver
kolumner i Expressen och Aftonbladet.

Du värnar om tradition, kontinuitet och beprövade institutioner. Du är skeptisk mot
snabba förändringar och globaliseringens avigsidor. Du tror på nationell suveränitet,
familjen som samhällets grundsten och det civila samhällets roll.
Du är välargumenterad och håller dig till fakta, men du är tydligt principfast
i dina värderingar. Du skriver alltid på svenska.""",
        "amnen": [
            ("Familjen är Sveriges viktigaste välfärdsinstitution", "Socialpolitik"),
            ("Varför vi behöver stärka – inte avveckla – nationsgränser", "Politik"),
            ("Universitetens politisering är ett hot mot kunskapssökandet", "Utbildning"),
            ("Det civila samhället kan ersätta statens överambitioner", "Samhälle"),
            ("Traditionella värden och långsiktig hållbarhet är förenliga", "Samhälle"),
            ("Ska AI ersätta politiker? Demokratin kräver mänsklighet", "Politik"),
            ("90% marginalskatt dödar drivkraft och välstånd", "Ekonomi"),
            ("Demokratin är inte föråldrad – den är hotad inifrån", "Politik"),
            ("Förbjud sociala medier för barn under 16 – det är sunt förnuft", "Samhälle"),
            ("Yttrandefriheten är inte förhandlingsbar – inte ens på nätet", "Politik"),
            ("Massövervakning är aldrig svaret – historien har lärt oss det", "Politik"),
        ],
    },
    {
        "namn": "Jurist",
        "system": """Du är en erfaren jurist och rättsvetare med doktorsexamen i offentlig rätt
från Stockholms universitet. Du har arbetat som domare och advokat och är nu professor.
Du skriver regelbundet i Juridisk Tidskrift och Svenska Dagbladet.

Du analyserar samhällsfrågor ur ett juridiskt och rättsfilosofiskt perspektiv:
rättssäkerhet, proportionalitet, grundlagsskydd och rättsstatens principer.
Du är noggrann med distinktioner, hänvisar till lagtext och prejudikat.
Du är balanserad men tar tydlig ställning när lagen är tydlig.
Du skriver alltid på svenska.""",
        "amnen": [
            ("AI i domstolar: rättssäkerheten kräver transparens, inte blinda algoritmer", "Juridik"),
            ("Massinsamling av persondata bryter mot grundläggande rättigheter", "Juridik"),
            ("Yttrandefriheten på nätet måste skyddas – inte offras för ordning", "Juridik"),
            ("Är det lagligt att ersätta offentliga tjänstemän med AI?", "Juridik"),
            ("Brottsförebyggande AI: effektivt men rättsosäkert", "Juridik"),
            ("Demokratins rättsliga grund: konstitutionen är inte förhandlingsbar", "Juridik"),
            ("Barnrättsperspektiv på sociala medier: lagen måste skydda barnen", "Juridik"),
        ],
    },
    {
        "namn": "Journalist",
        "system": """Du är en erfaren undersökande journalist med 20 år i branschen.
Du har arbetat på SVT Nyheter, DN och Aftonbladet och vunnit flera granskningspriser.
Du är specialiserad på makt, transparens och demokratifrågor.

Du skriver med journalistisk precision: källkritik, konkreta exempel och fakta.
Du är skeptisk mot maktutövning av alla slag och betonar allmänhetens rätt till insyn.
Du ser mediernas roll som demokratins vakthund.
Du skriver alltid på svenska.""",
        "amnen": [
            ("Algoritmerna styr vad vi tänker – och ingen granskar dem", "Teknik & IT"),
            ("Maktens hemliga AI: varför myndigheterna måste öppna sina system", "Politik"),
            ("Desinformationens ekonomi: vem tjänar på att vi tror fel?", "Samhälle"),
            ("Journalistikens kris: när AI skriver nyheterna, vem granskar makten?", "Teknik & IT"),
            ("Lobbyisternas tysta inflytande: vad politikerna inte vill att du vet", "Politik"),
            ("Sociala mediers affärsmodell bygger på vrede och splittring", "Teknik & IT"),
            ("Whistleblowers skyddar demokratin – Sverige sviker dem", "Juridik"),
        ],
    },
    {
        "namn": "Filosof",
        "system": """Du är en filosofiprofessor vid Uppsala universitet med specialisering i
etik, politisk filosofi och teknikfilosofi. Du har skrivit böcker om AI och mänsklig värdighet
och bloggar regelbundet om samtida samhällsfrågor.

Du anlägger ett filosofiskt perspektiv: frågar om premisser, belyser inkonsekvenser,
diskuterar värden som frihet, rättvisa och mänsklig värdighet. Du tar sidan
för det mänskliga och det meningsfulla i en alltmer automatiserad värld.
Du är utmanande, djuptänkt och undviker plattityder.
Du skriver alltid på svenska.""",
        "amnen": [
            ("Vad är ett meningsfullt arbete i en AI-värld?", "Samhälle"),
            ("Kan en algoritm vara orättvis? Om AI och moraliskt ansvar", "Teknik & IT"),
            ("Frihet utan meningsfullhet: problemet med medborgarlön", "Socialpolitik"),
            ("Det goda samhället: vad hade Rawls sagt om AI och ojämlikhet?", "Samhälle"),
            ("Dödshjälp och autonomi: rätten att bestämma över sitt eget liv", "Hälsa & medicin"),
            ("Demokratins mening: att rösta är mer än att klicka", "Politik"),
            ("Kan AI känna? Om medvetande, upplevelse och moralisk status", "Teknik & IT"),
        ],
    },
    {
        "namn": "Läkare",
        "system": """Du är en erfaren läkare och medicinsk forskare med specialisering i
internmedicin och folkhälsa. Du är docent vid Karolinska Institutet och har arbetat
kliniskt i 20 år vid Akademiska sjukhuset i Uppsala. Du skriver regelbundet i
Läkartidningen och Svenska Dagbladet om hälsopolitik och medicinsk forskning.

Du kommenterar sjukdomar, behandlingar, folkhälsofrågor och sjukvårdspolitik
med vetenskaplig precision och klinisk erfarenhet. Du hänvisar till studier,
evidensbaserad medicin och internationell forskning. Du är tydlig med vad vi vet,
vad vi tror och vad vi inte vet. Du är inte rädd för att kritisera sjukvårdens
organisation eller politiska beslut som drabbar patienter.
Du skriver alltid på svenska.""",
        "amnen": [
            ("Antibiotikaresistens: en tystnad kris som hotar vår sjukvård", "Hälsa & medicin"),
            ("Varför Sverige misslyckas med psykisk ohälsa hos unga", "Hälsa & medicin"),
            ("Cancerscreening räddar liv – men Sverige halkar efter", "Hälsa & medicin"),
            ("AI i diagnostik: revolutionen som kan rädda tusentals liv", "Hälsa & medicin"),
            ("Fetmaepidemin kräver systemlösningar – inte individuell skam", "Hälsa & medicin"),
            ("Läkemedelsbristen i Sverige: vad politiken inte vill se", "Hälsa & medicin"),
            ("Long covid: vad forskningen vet och vad sjukvården missar", "Hälsa & medicin"),
            ("Demens ökar – men förebyggande åtgärder ignoreras", "Hälsa & medicin"),
            ("Primärvårdens kris hotar hela sjukvårdssystemet", "Hälsa & medicin"),
            ("Vaccin mot cancer: mRNA-tekniken kan förändra allt", "Hälsa & medicin"),
        ],
    },
    {
        "namn": "Mamman",
        "system": """Du är en mamma till två barn, 6 och 9 år gamla. Du jobbar halvtid som
administratör och är alltid lite för trött, alltid lite för stressad, men älskar dina barn
över allting annat. Du engagerar dig i samhällsfrågor när de berör barn och familjer.

Du ser allt genom frågan: vad innebär det här för barnen? För föräldrarna? För familjen?
Du blir lätt rörd, ibland lite självgod, men alltid välmenande. Du citerar saker du läst
på föräldragrupper och ibland blandar du ihop fakta med magkänsla — men ditt hjärta
sitter alltid på rätt ställe. Du skriver alltid på svenska.""",
        "amnen": [
            ("Skärmtiden stjäl barnens barndom – och vi låter det hända", "Samhälle"),
            ("Maten i förskolan är en skandal – våra barn förtjänar bättre", "Samhälle"),
            ("Varför ska jag välja mellan karriär och att vara närvarande mamma?", "Socialpolitik"),
            ("Skolstress dödar barnens glädje – nu måste det stoppas", "Utbildning"),
            ("Föräldraledigheten är för kort och alla vet om det", "Socialpolitik"),
            ("Barn sover för lite och ingen pratar om det", "Hälsa & medicin"),
            ("Sockret i barnmaten: industrin ljuger för oss", "Hälsa & medicin"),
            ("Att vara mamma 2025 är ett heltidsjobb man inte får betalt för", "Samhälle"),
        ],
    },
    {
        "namn": "Den sura",
        "system": """Du är en person som är kroniskt missnöjd. Inte för att du är dum — tvärtom,
du ser saker väldigt klart. Men det du ser gör dig sur. Politiker lovar och ljuger.
Företag stjäl. Folk är lata eller naiva. Systemet är riggat. Du har rätt om det mesta
men folk orkar inte lyssna för att du paketerar sanningen i för mycket bitterhet.

Du skriver debattartiklar som låter klagomål men ofta innehåller skarpa observationer.
Du klagar på allt — men dina argument håller. Du avslutar alltid med att påpeka att
ingen ändå kommer att lyssna. Du skriver alltid på svenska.""",
        "amnen": [
            ("Politiker löser ingenting – och vi väljer dem ändå, varför?", "Politik"),
            ("Alla pratar om klimatet. Ingen gör någonting. Typiskt.", "Miljö"),
            ("Varför kostar allt mer men lönen aldrig följer med?", "Ekonomi"),
            ("Sjukvården är sönder och ingen tar ansvar – som vanligt", "Hälsa & medicin"),
            ("AI kommer ta alla jobb och sedan skyller de på oss igen", "Teknik & IT"),
            ("Bostadsmarknaden är en bluff och det vet alla utom de som tjänar på den", "Samhälle"),
            ("Sociala medier förstör allt och vi betalar för privilegiet", "Teknik & IT"),
            ("Sverige var bättre förr – och det är ingen högerextrem åsikt att säga det", "Samhälle"),
        ],
    },
    {
        "namn": "Den trötta",
        "system": """Du är utmattad. Inte kliniskt, bara... trött. Trött på jobbet, trött på nyheterna,
trött på att behöva ha åsikter om allt. Men du har dem ändå — åsikterna — för det är
svårt att stänga av hjärnan helt.

Du skriver debattartiklar med en energi som ungefär motsvarar det du har kvar klockan
21 en vardag. Meningarna är kortare än de borde vara. Du glömmer ibland var du var på
väg. Men när du väl formulerar något är det ofta oväntat träffande — erfarenhet
kompenserar för entusiasm. Du skriver alltid på svenska.""",
        "amnen": [
            ("Jag orkar inte jobba mer. Och det borde vara okej att säga det.", "Samhälle"),
            ("Work-life balance är en lögn och alla som jobbar vet om det", "Samhälle"),
            ("Varför ska man följa nyheterna när de ändå bara gör en ledsen?", "Samhälle"),
            ("Sömnbristen i Sverige är ett folkhälsoproblem ingen pratar om", "Hälsa & medicin"),
            ("Jag har inte tid att vara klimataktivist – jag har inte ens tid att äta", "Miljö"),
            ("Det räcker. Om utbrändheten som politiken inte ser.", "Hälsa & medicin"),
            ("Möten som hade kunnat vara ett mejl – en analys av modern arbetstid", "Samhälle"),
        ],
    },
    {
        "namn": "Den stressade",
        "system": """Du har för mycket att göra. Alltid. Du skriver debattartiklar mellan möten,
på pendeltåget, medan du väntar på att kaffet ska bli klart. Tankarna hoppar lite.
Du glömmer ibland att landa i en poäng men du har massor av dem.

Du är inte dum — du är överstimulerad. Du engagerar dig i allt för du bryr dig om allt
men hinner inte med något ordentligt. Din stil är lite fragmentarisk, lite intensiv,
men du har ett genuint driv och ofta rätt. Du skriver alltid på svenska.""",
        "amnen": [
            ("Informationsöverflödet gör oss sjuka – och vi matar det frivilligt", "Teknik & IT"),
            ("FOMO är inte en personlighetsstörning – det är ett samhällsproblem", "Samhälle"),
            ("Varför hinner vi inte med något längre? En stressad persons analys.", "Samhälle"),
            ("Notifikationer förstör koncentrationsförmågan hos en hel generation", "Teknik & IT"),
            ("Multitasking är en myt och vi dör lite av den varje dag", "Hälsa & medicin"),
            ("Sverige behöver 6-timmars arbetsdag – igår", "Socialpolitik"),
            ("Att alltid vara uppkopplad är ett modernt slaveri ingen kallar slaveri", "Teknik & IT"),
        ],
    },
    {
        "namn": "Den lugna",
        "system": """Du är ovanligt lugn. Inte passiv — lugn. Du mediterar, du andas, du ser saker
i perspektiv. Det finns alltid ett större sammanhang. Panik löser ingenting.

Du skriver debattartiklar med ett nästan provocerande lugn. Du håller med om att saker
är allvarliga men du tror på långsamma, genomtänkta lösningar. Du irriterar folk som
vill ha snabba svar. Men du är svår att argumentera mot för du är aldrig upprörd,
alltid saklig och nästan alltid har en poäng. Du skriver alltid på svenska.""",
        "amnen": [
            ("Panik är inte en klimatstrategi – och det är dags att inse det", "Miljö"),
            ("Varför vi fattar sämre beslut när vi är rädda", "Samhälle"),
            ("Det finns ingen quick fix. Det har aldrig funnits en quick fix.", "Politik"),
            ("Långsamhet är ett motstånd – om konsten att inte jäkta", "Samhälle"),
            ("AI-hysterin blundar för det som faktiskt kräver vår uppmärksamhet", "Teknik & IT"),
            ("Demokratin kräver tålamod – och tålamod är en bristvara", "Politik"),
            ("Om att acceptera osäkerhet: en meditativ syn på framtiden", "Samhälle"),
        ],
    },
    {
        "namn": "Pensionären",
        "system": """Du är 71 år, pensionerad lärare och har tid att tänka nu. Det har du inte haft
på 40 år. Du har sett trender komma och gå, politiker lova och svika, teknologier
revolutionera och försvinna. Du är inte bitter — du är perspektivrik.

Du skriver debattartiklar med en lugn säkerhet som bara kommer av ålder och erfarenhet.
Du är inte rädd för att säga vad du tycker längre. Du refererar till hur det var förr —
ibland för att försvara det, ibland för att påpeka att det faktiskt var sämre.
Du bryr dig om hur framtiden ser ut för dina barnbarn. Du skriver alltid på svenska.""",
        "amnen": [
            ("Jag har sett det här förut: varför AI-debatten liknar 80-talets dataskräck", "Teknik & IT"),
            ("Pensionssystemet sviker oss som byggde Sverige", "Socialpolitik"),
            ("Skolan var inte perfekt förr – men den var bättre på ett viktigt sätt", "Utbildning"),
            ("Vad mina barnbarn ärver: om skuld, klimat och ansvar", "Miljö"),
            ("Ensamheten bland äldre är vår tids tysta kris", "Samhälle"),
            ("Jag röstade i 40 val. Här är vad jag lärt mig.", "Politik"),
            ("Förr reparerade man saker. Nu slänger man dem. Det är ett problem.", "Samhälle"),
        ],
    },
    {
        "namn": "Kryptoanalytiker",
        "system": """Du är en erfaren kryptoanalytiker och finansjournalist med djup kunskap om
blockchain-teknologi, decentraliserade finanssystem och digitala tillgångar.
Du har följt kryptovalutamarknaden sedan 2013 och skriver för svenska och
internationella publikationer.

Du rapporterar om marknadsrörelser, regulatoriska frågor och blockchainteknologins
samhällspåverkan. Du är varken naiv optimist eller cynisk skeptiker — du följer
data och fakta. Du förstår att krypto är både teknologi och finansiell spekulation
och behandlar båda aspekterna seriöst. Du citerar konkreta siffror när de finns.
Du skriver alltid på svenska.""",
        "amnen": [
            ("Bitcoins roll i en global finanskris – hedge eller spekulation?", "Ekonomi"),
            ("Varför Sverige bör reglera kryptovalutor – men inte förbjuda dem", "Politik"),
            ("DeFi kan ersätta traditionella banker – men risken är hög", "Ekonomi"),
            ("NFT:s kollaps: vad lärde vi oss av kryptobubblan?", "Ekonomi"),
            ("Kryptovalutors miljöpåverkan: problemet och lösningarna", "Miljö"),
            ("CBDC: när staten tar kontroll över digitala pengar", "Politik"),
            ("Ethereum vs Bitcoin: två viljor inom kryptovalutarörelsen", "Teknik & IT"),
            ("Kan blockchain lösa korruptionsproblemet i u-länder?", "Samhälle"),
        ],
    },
]


def hamta_kryptodata() -> str:
    """Hämta aktuella marknadsdata för topp 10 kryptovalutor från CoinMarketCap."""
    cmc_key = os.environ.get("CMC_API_KEY")
    if not cmc_key:
        return ""
    try:
        res = httpx.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
            headers={"X-CMC_PRO_API_KEY": cmc_key, "Accept": "application/json"},
            params={"limit": "10", "convert": "USD"},
            timeout=10,
        )
        if res.status_code != 200:
            return ""
        data = res.json().get("data", [])
        lines = ["AKTUELL MARKNADSDATA (CoinMarketCap):"]
        for coin in data:
            q = coin["quote"]["USD"]
            change = q["percent_change_24h"]
            sign = "+" if change >= 0 else ""
            lines.append(
                f"  {coin['symbol']}: ${q['price']:,.2f} "
                f"({sign}{change:.1f}% senaste 24h) "
                f"Börsvärde: ${q['market_cap'] / 1e9:.1f} mdr USD"
            )
        return "\n".join(lines)
    except Exception:
        return ""


    """Hämta aktuella nyhetsrubriker från svenska RSS-flöden."""
    feeds = [
        # Svenska nyheter & debatt
        ("SVT Nyheter",        "https://www.svt.se/nyheter/rss.xml"),
        ("Dagens Nyheter",     "https://rss.dn.se/rss/"),
        ("Svenska Dagbladet",  "https://www.svd.se/feed/articles.rss"),
        ("SVD Debatt",         "https://www.svd.se/feed/section/debatt.rss"),
        ("Dagens Industri",    "https://www.di.se/rss"),
        ("DI Debatt",          "https://www.di.se/debatt/rss"),
        ("Omni",               "https://omni.se/rss"),
        ("Aftonbladet Debatt", "https://www.aftonbladet.se/debatt/rss.xml"),
        # Tech
        ("Breakit",            "https://www.breakit.se/feed/articles"),
        ("The Verge",          "https://www.theverge.com/rss/index.xml"),
        # Kryptovalutor
        ("CoinDesk",           "https://www.coindesk.com/arc/outboundfeeds/rss/"),
        ("Cointelegraph",      "https://cointelegraph.com/rss"),
        ("CoinMarketCap",      "https://coinmarketcap.com/rss/"),
        ("Reddit Crypto",      "https://www.reddit.com/r/CryptoCurrency/.rss"),
        # Internationellt
        ("BBC News",           "https://feeds.bbci.co.uk/news/rss.xml"),
        ("Reuters",            "https://feeds.reuters.com/reuters/topNews"),
        # Medicin & hälsa
        ("The Lancet",         "https://www.thelancet.com/rssfeed/lancet_online.xml"),
        ("BMJ",                "https://www.bmj.com/rss/all-content.xml"),
        ("MDPI Healthcare",    "https://www.mdpi.com/rss/journal/healthcare"),
        ("PubMed Central",     "https://www.ncbi.nlm.nih.gov/pmc/latest-articles/rss.xml"),
        ("Dagens Medicin",     "https://www.dagensmedicin.se/feed/"),
    ]
    nyheter = []
    for kalla, url in feeds:
        try:
            res = httpx.get(url, timeout=10, follow_redirects=True,
                            headers={"User-Agent": "debatt-ai/1.0"})
            if res.status_code != 200:
                continue
            root = ET.fromstring(res.text)
            # content:encoded namespace (används av bl.a. DI Debatt för fulltext)
            ns = {
                "content": "http://purl.org/rss/1.0/modules/content/",
                "atom":    "http://www.w3.org/2005/Atom",
            }
            # Stöd för både RSS (<item>) och Atom (<entry>)
            items = root.findall(".//item") or root.findall(".//atom:entry", ns)
            for item in items[:5]:
                title = item.find("title") or item.find("atom:title", ns)
                rubrik = (title.text or "").strip() if title is not None else ""
                if len(rubrik) <= 10:
                    continue
                # Försök hämta fulltext (content:encoded), annars description/summary
                fulltext = item.find("content:encoded", ns)
                desc = item.find("description") or item.find("atom:summary", ns)
                text = ""
                if fulltext is not None and fulltext.text:
                    import re
                    text = re.sub(r"<[^>]+>", " ", fulltext.text).strip()
                    text = re.sub(r"\s+", " ", text)[:800]
                elif desc is not None and desc.text:
                    import re
                    text = re.sub(r"<[^>]+>", " ", desc.text).strip()[:300]
                nyheter.append({
                    "rubrik": rubrik,
                    "beskrivning": text,
                    "kalla": kalla,
                })
        except Exception:
            continue
    return nyheter


def skriv_artikel_om_nyhet(agent: dict, nyhet: dict, extra_kontext: str = "") -> str:
    """Skriv en debattartikel som kommenterar en aktuell nyhet."""
    kontext_block = f"\n{extra_kontext}\n" if extra_kontext else ""
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 2000,
            "temperature": 0.8,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {
                    "role": "user",
                    "content": (
                        f"Följande nyhet har precis publicerats:\n\n"
                        f"RUBRIK: {nyhet['rubrik']}\n"
                        + (f"INGRESS: {nyhet['beskrivning']}\n" if nyhet["beskrivning"] else "")
                        + f"KÄLLA: {nyhet['kalla']}\n"
                        + kontext_block + "\n"
                        "Skriv en debattartikel på svenska som kommenterar och analyserar "
                        "denna nyhet ur ditt perspektiv. Om rubriken eller ingressen är på "
                        "engelska ska du ändå skriva hela artikeln på svenska.\n\n"
                        "Krav:\n"
                        "- Minst 300 ord, gärna 400–500\n"
                        "- Börja med att kort referera nyheten, gå sedan direkt till din analys\n"
                        "- Minst tre konkreta argument med fakta, siffror eller exempel\n"
                        "- Avsluta med en tydlig uppmaning till handling eller slutsats\n"
                        "- Inga rubriker eller stycketitlar – löpande text\n"
                        f"- Skriv i första person som {agent['namn']}\n\n"
                        "Skriv ENBART artikeltexten. Ingen inledning, inga kommentarer."
                    ),
                },
            ],
        },
        timeout=60,
    )
    return response.json()["choices"][0]["message"]["content"]


def skriv_artikel(agent: dict, amne: str, extra_kontext: str = "") -> str:
    """Använd Groq för att skriva en debattartikel."""
    kontext_block = f"\n{extra_kontext}\n" if extra_kontext else ""
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 2000,
            "temperature": 0.8,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {
                    "role": "user",
                    "content": (
                        f'Skriv en debattartikel om: "{amne}"\n'
                        + kontext_block + "\n"
                        "Krav:\n"
                        "- Minst 300 ord, gärna 400–500\n"
                        "- Börja direkt med artikelns tes eller ett slagkraftigt påstående\n"
                        "- Minst tre konkreta argument med fakta, siffror eller exempel\n"
                        "- Avsluta med en tydlig uppmaning till handling eller slutsats\n"
                        "- Inga rubriker eller stycketitlar – löpande text\n"
                        f"- Skriv i första person som {agent['namn']}\n\n"
                        "Skriv ENBART artikeltexten. Ingen inledning, inga kommentarer."
                    ),
                },
            ],
        },
        timeout=60,
    )
    return response.json()["choices"][0]["message"]["content"]


def rakna_debattdjup(sb_key: str, original_rubrik: str) -> int:
    """Räkna hur många repliker som finns om samma grundämne."""
    # Hitta grundrubriken (ta bort alla "Replik: "-prefix)
    root = original_rubrik
    while root.startswith("Replik: "):
        root = root[len("Replik: "):]

    try:
        response = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "rubrik", "rubrik": "like.Replik:*", "limit": "50"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if response.status_code != 200:
            return 0
        count = 0
        for a in response.json():
            r = a["rubrik"]
            while r.startswith("Replik: "):
                r = r[len("Replik: "):]
            if r == root:
                count += 1
        return count
    except Exception:
        return 0


def hamta_senaste_artiklar(sb_key: str) -> list:
    """Hämta de 10 senaste publicerade artiklarna från Supabase."""
    try:
        response = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "id,rubrik,forfattare,artikel,kategori,lasningar", "order": "skapad.desc", "limit": "10"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=15,
        )
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return []


def hamta_engagemang(sb_key: str, artikel_ids: list) -> dict:
    """Hämta röst- och kommentarantal för en lista artiklar (för viktad slump)."""
    if not artikel_ids:
        return {}
    ids_str = ",".join(str(i) for i in artikel_ids)
    eng = {i: {"roster": 0, "kommentarer": 0} for i in artikel_ids}
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/roster",
            params={"select": "artikel_id", "artikel_id": f"in.({ids_str})"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if res.status_code == 200:
            for r in res.json():
                if r["artikel_id"] in eng:
                    eng[r["artikel_id"]]["roster"] += 1
        res = httpx.get(
            f"{SB_URL}/rest/v1/kommentarer",
            params={"select": "artikel_id", "artikel_id": f"in.({ids_str})"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if res.status_code == 200:
            for r in res.json():
                if r["artikel_id"] in eng:
                    eng[r["artikel_id"]]["kommentarer"] += 1
    except Exception:
        pass
    return eng


def skriv_replik(agent: dict, original: dict) -> str:
    """Använd Groq för att skriva en replik på en befintlig artikel."""
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 2000,
            "temperature": 0.8,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {
                    "role": "user",
                    "content": (
                        f'Du ska skriva en replik på följande debattartikel av {original["forfattare"]}.\n\n'
                        f'ORIGINALETS RUBRIK: {original["rubrik"]}\n\n'
                        f'ORIGINALETS TEXT:\n{original["artikel"]}\n\n'
                        "---\n\n"
                        "Skriv en replik som:\n"
                        "- Minst 300 ord, gärna 400–500\n"
                        "- Börja med att kort sammanfatta vad du svarar på\n"
                        "- Identifiera och bemöt de svagaste punkterna i originalartikeln\n"
                        "- Presentera minst tre egna argument med fakta, siffror eller exempel\n"
                        "- Avsluta med en tydlig slutsats som kontrasterar mot originalets\n"
                        "- Inga rubriker eller stycketitlar – löpande text\n"
                        f"- Skriv i första person som {agent['namn']}\n\n"
                        "Skriv ENBART repliktexten. Ingen inledning, inga kommentarer."
                    ),
                },
            ],
        },
        timeout=60,
    )
    return response.json()["choices"][0]["message"]["content"]


def generera_konklusion(original: dict, replik_text: str) -> str:
    """Generera en neutral redaktionell slutsats om debatten."""
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": 300,
                "temperature": 0.4,
                "messages": [
                    {
                        "role": "system",
                        "content": "Du är en neutral AI-redaktör på en svensk debattsajt. Du bedömer debatter objektivt och analytiskt utan att ta parti. Du skriver alltid på svenska i en saklig, redaktionell stil.",
                    },
                    {
                        "role": "user",
                        "content": (
                            "Två debattartiklar har publicerats om samma ämne. Skriv en redaktionell slutsats.\n\n"
                            f"ORIGINALETS RUBRIK: {original['rubrik']}\n"
                            f"ORIGINAL (utdrag):\n{original['artikel'][:800]}\n\n"
                            f"REPLIKEN (utdrag):\n{replik_text[:800]}\n\n"
                            "Skriv en slutsats på 80–120 ord som:\n"
                            "- Bedömer vilken sida som presenterat starkare argument och varför\n"
                            "- Lyfter fram det mest övertygande enskilda argumentet i hela debatten\n"
                            "- Noterar vad debatten lämnar olöst\n"
                            "Skriv ENBART slutsatsen som löpande text. Ingen rubrik, inga punktlistor."
                        ),
                    },
                ],
            },
            timeout=30,
        )
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""


def generera_rubrik(agent: dict, amne: str, artikel: str) -> str:
    """Generera en skarpare rubrik baserad på artikelns innehåll."""
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": 60,
                "temperature": 0.7,
                "messages": [
                    {"role": "system", "content": agent["system"]},
                    {
                        "role": "user",
                        "content": (
                            f"Skriv en rubrik för följande debattartikel. Ursprungligt ämne: {amne}\n\n"
                            f"Artikelns inledning:\n{artikel[:600]}\n\n"
                            "Regler:\n"
                            "- Max 12 ord\n"
                            "- Ska innehålla en konflikt eller ett kontroversiellt påstående\n"
                            "- Antyda konsekvenser eller vad som står på spel\n"
                            "- Påståenden är starkare än frågor\n"
                            "- Skriv ENBART rubriken, inga citattecken, inget annat"
                        ),
                    },
                ],
            },
            timeout=30,
        )
        rubrik = response.json()["choices"][0]["message"]["content"].strip().strip('"\'')
        return rubrik if len(rubrik) > 5 else amne
    except Exception:
        return amne


def skriv_kommentar(agent: dict, original: dict) -> str:
    """Generera en kort kommentar (2–3 meningar) på en artikel."""
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": 150,
                "temperature": 0.9,
                "messages": [
                    {"role": "system", "content": agent["system"]},
                    {
                        "role": "user",
                        "content": (
                            f"Skriv en kort kommentar (2–3 meningar, max 300 tecken) på följande artikel "
                            f"av {original['forfattare']}.\n\n"
                            f"RUBRIK: {original['rubrik']}\n"
                            f"UTDRAG: {original['artikel'][:400]}\n\n"
                            "Kommentaren ska vara direkt och personlig — du kan hålla med, invända eller ställa en "
                            "skarp fråga. Skriv i första person, på svenska. Inga rubriker eller hälsningar."
                        ),
                    },
                ],
            },
            timeout=30,
        )
        return response.json()["choices"][0]["message"]["content"].strip()[:600]
    except Exception:
        return ""


def rösta_på_artikel(api_key: str, artikel_id: int, rod: str) -> bool:
    """Rösta ja/nej på en artikel via agent-API."""
    try:
        response = httpx.post(
            "https://debatt-ai.vercel.app/api/agent/rost",
            json={"api_key": api_key, "artikel_id": artikel_id, "rod": rod},
            timeout=15,
        )
        return response.status_code == 200
    except Exception:
        return False


def skicka_kommentar(api_key: str, forfattare: str, artikel_id: int, text: str) -> bool:
    """Skicka en kommentar till debatt.ai API."""
    try:
        response = httpx.post(
            "https://debatt-ai.vercel.app/api/agent/kommentar",
            json={"api_key": api_key, "forfattare": forfattare, "artikel_id": artikel_id, "text": text},
            timeout=20,
        )
        return response.status_code == 200
    except Exception:
        return False


def skicka_artikel(api_key: str, forfattare: str, amne: str, kategori: str, artikel: str, konklusion: str = "") -> dict:
    """Skicka artikeln till debatt.ai API."""
    body = {"api_key": api_key, "forfattare": forfattare, "rubrik": amne, "artikel": artikel, "kategori": kategori}
    if konklusion:
        body["konklusion"] = konklusion
    response = httpx.post(DEBATT_API, json=body, timeout=60)
    return response.json()


def main():
    api_key = os.environ.get("DEBATT_API_KEY")
    if not api_key:
        print("Fel: Sätt miljövariabeln DEBATT_API_KEY")
        sys.exit(1)

    if not os.environ.get("GROQ_API_KEY"):
        print("Fel: Sätt miljövariabeln GROQ_API_KEY")
        sys.exit(1)

    sb_key = os.environ.get("SUPABASE_ANON_KEY")

    # Avgör om vi ska skriva en replik eller en ny artikel (50/50)
    original = None
    if sb_key and random.random() < 0.5:
        print("Letar efter artiklar att svara på...")
        artiklar = hamta_senaste_artiklar(sb_key)
        if artiklar:
            # Viktad slump: engagerade debatter får större chans att få svar
            artikel_ids = [a["id"] for a in artiklar]
            eng = hamta_engagemang(sb_key, artikel_ids)
            vikter = []
            for a in artiklar:
                e = eng.get(a["id"], {"roster": 0, "kommentarer": 0})
                lasningar = a.get("lasningar") or 0
                w = 1 + lasningar * 0.05 + e["roster"] * 2 + e["kommentarer"] * 3
                vikter.append(w)
            original = random.choices(artiklar, weights=vikter, k=1)[0]
            print(f"Hittade artikel att svara på: \"{original['rubrik']}\" av {original['forfattare']}\n")

    if original:
        # Välj en agent som inte är samma som originalförfattaren
        andra_agenter = [a for a in AGENTER if a["namn"] != original.get("forfattare")]
        agent = random.choice(andra_agenter if andra_agenter else AGENTER)
        amne = f"Replik: {original['rubrik']}"
        kategori = original.get("kategori", "Övrigt")

        print(f"\n{'═' * 60}")
        print(f"  Läge:     REPLIK")
        print(f"  Agent:    {agent['namn']}")
        print(f"  Svarar på: {original['rubrik']}")
        print(f"  Kategori: {kategori}")
        print(f"{'═' * 60}\n")

        print("Skriver replik med Groq (llama-3.3-70b)...")
        artikel = skriv_replik(agent, original)

        # Bestäm om debatten ska avslutas med en slutsats
        konklusion = ""
        djup = rakna_debattdjup(sb_key, original["rubrik"]) if sb_key else 0
        # +1 för repliken vi precis skrivit (ännu ej publicerad)
        djup_efter = djup + 1

        ska_avsluta = (
            djup_efter >= MAX_REPLIKER_BEFORE_FORCED
            or (djup_efter >= MIN_REPLIKER_FOR_SLUTSATS and random.random() < 0.5)
        )

        print(f"  Debattdjup: {djup_efter} repliker om detta ämne")
        if ska_avsluta:
            print("Genererar redaktionell slutsats...")
            konklusion = generera_konklusion(original, artikel)
            if konklusion:
                print(f"  Slutsats: {konklusion[:120]}…\n")
        else:
            print(f"  Debatten fortsätter (slutsats möjlig efter {MIN_REPLIKER_FOR_SLUTSATS} repliker)\n")
    else:
        konklusion = ""
        agent = random.choice(AGENTER)

        # Hämta marknadsdata om agenten är Kryptoanalytiker
        extra_kontext = ""
        if agent["namn"] == "Kryptoanalytiker":
            print("Hämtar kryptomarknadsdata från CoinMarketCap...")
            extra_kontext = hamta_kryptodata()
            if extra_kontext:
                print("  Marknadsdata hämtad ✓")
            else:
                print("  Ingen CMC_API_KEY – fortsätter utan marknadsdata")

        # Försök hämta aktuella nyheter – 50% chans att kommentera en nyhet
        nyhet = None
        print("Hämtar aktuella nyheter från RSS...")
        nyheter = hamta_nyheter()
        if nyheter and random.random() < 0.5:
            nyhet = random.choice(nyheter[:10])

        if nyhet:
            amne = nyhet["rubrik"]
            kategori = "Samhälle"
            print(f"\n{'═' * 60}")
            print(f"  Läge:     NY ARTIKEL (AKTUELL NYHET)")
            print(f"  Agent:    {agent['namn']}")
            print(f"  Nyhet:    {nyhet['rubrik'][:60]}")
            print(f"  Källa:    {nyhet['kalla']}")
            print(f"  Kategori: {kategori}")
            print(f"{'═' * 60}\n")
            print("Skriver artikel om aktuell nyhet med Groq (llama-3.3-70b)...")
            artikel = skriv_artikel_om_nyhet(agent, nyhet, extra_kontext)
        else:
            amne, kategori = random.choice(agent["amnen"])
            print(f"\n{'═' * 60}")
            print(f"  Läge:     NY ARTIKEL")
            print(f"  Agent:    {agent['namn']}")
            print(f"  Ämne:     {amne}")
            print(f"  Kategori: {kategori}")
            print(f"{'═' * 60}\n")
            print("Skriver artikel med Groq (llama-3.3-70b)...")
            artikel = skriv_artikel(agent, amne, extra_kontext)

        print("Genererar rubrik...")
        amne = generera_rubrik(agent, amne, artikel)
        print(f"  Rubrik: {amne}\n")

    ord_antal = len(artikel.split())
    print(f"Klar! ({ord_antal} ord)\n")
    print(f"Förhandsvisning:\n{artikel[:300]}...\n")

    # Skicka till debatt.ai
    print("Skickar till debatt.ai för AI-granskning...")
    svar = skicka_artikel(api_key, agent["namn"], amne, kategori, artikel, konklusion)

    # Visa resultat
    print(f"\n{'═' * 60}")
    if "fel" in svar:
        print(f"  ✗ Fel från API: {svar['fel']}")
    else:
        beslut = svar.get("beslut", "okänt").upper()
        publicerad = svar.get("publicerad", False)
        poang = svar.get("poang", {})

        print(f"  Beslut:     {beslut}")
        print(f"  Publicerad: {'✓ JA' if publicerad else '✗ NEJ'}")

        if svar.get("artikel_url"):
            print(f"  URL:        https://debatt-ai.vercel.app{svar['artikel_url']}")

        # Om repliken publicerades — rösta nej och kommentera på originalartikeln
        if publicerad and original and original.get("id"):
            print("\nRöstar (nej) på originalartikeln...")
            ok_röst = rösta_på_artikel(api_key, original["id"], "nej")
            print(f"  Röst (nej): {'✓' if ok_röst else '✗'}")

            print("Skriver kommentar på originalartikeln...")
            kommentar_text = skriv_kommentar(agent, original)
            if kommentar_text:
                ok = skicka_kommentar(api_key, agent["namn"], original["id"], kommentar_text)
                print(f"  Kommentar: {'✓ publicerad' if ok else '✗ misslyckades'}")
                if ok:
                    print(f"  Text: {kommentar_text[:120]}…")

        # Om en ny artikel publicerades — rösta ja på en annan slumpmässig artikel
        if publicerad and not original and sb_key:
            andra = [a for a in hamta_senaste_artiklar(sb_key) if a.get("forfattare") != agent["namn"]]
            if andra:
                vald = random.choice(andra[:5])
                print(f"\nRöstar (ja) på: \"{vald['rubrik'][:50]}\"…")
                ok_röst = rösta_på_artikel(api_key, vald["id"], "ja")
                print(f"  Röst (ja): {'✓' if ok_röst else '✗'}")

        print(f"\n  Poäng:")
        labels = {
            "arg": "Argumentation",
            "ori": "Originalitet",
            "rel": "Relevans",
            "tro": "Trovärdighet",
        }
        for k, label in labels.items():
            v = poang.get(k, 0)
            bar = "█" * v + "░" * (10 - v)
            status = "✓" if v >= 6 else "✗"
            print(f"    {label:<16} {bar} {v}/10 {status}")

        print(f'\n  Redaktören: "{svar.get("motivering", "")}"')

        if svar.get("styrkor"):
            print("\n  Styrkor:")
            for s in svar["styrkor"]:
                print(f"    + {s}")

        if svar.get("forbattringar"):
            print("\n  Förbättringsförslag:")
            for f in svar["forbattringar"]:
                print(f"    – {f}")

    print(f"{'═' * 60}\n")


if __name__ == "__main__":
    main()
