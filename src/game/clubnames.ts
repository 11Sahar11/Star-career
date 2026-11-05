/**
 * Club names in the player's language. Club data is "<City> <Nickname>" (plus " II" for reserves);
 * the English string stays the id-like key everywhere (crests, saves, lookups) and only the display changes.
 * Hebrew uses the construct form: "חלוצי מורקאמב" (Morecambe Pioneers).
 */
type Lang = "en" | "he" | "es" | "fr";

const NICK: Record<string, { he: string; es: string; fr: string }> = {
  Bears: { he: "דובי", es: "Osos", fr: "Ours" },
  Bison: { he: "ביזוני", es: "Bisontes", fr: "Bisons" },
  Comets: { he: "שביטי", es: "Cometas", fr: "Comètes" },
  Falcons: { he: "בזי", es: "Halcones", fr: "Faucons" },
  Griffins: { he: "גריפוני", es: "Grifos", fr: "Griffons" },
  Hawks: { he: "נצי", es: "Azores", fr: "Éperviers" },
  Herons: { he: "אנפות", es: "Garzas", fr: "Hérons" },
  Kestrels: { he: "בזוני", es: "Cernícalos", fr: "Crécerelles" },
  Knights: { he: "אבירי", es: "Caballeros", fr: "Chevaliers" },
  Lynx: { he: "שונרי", es: "Linces", fr: "Lynx" },
  Mariners: { he: "ימאי", es: "Marineros", fr: "Marins" },
  Mavericks: { he: "מורדי", es: "Rebeldes", fr: "Rebelles" },
  Meteors: { he: "מטאורי", es: "Meteoros", fr: "Météores" },
  Orbit: { he: "מסלול", es: "Órbita", fr: "Orbite" },
  Phoenix: { he: "פניקס", es: "Fénix", fr: "Phénix" },
  Pilots: { he: "טייסי", es: "Pilotos", fr: "Pilotes" },
  Pioneers: { he: "חלוצי", es: "Pioneros", fr: "Pionniers" },
  Ravens: { he: "עורבי", es: "Cuervos", fr: "Corbeaux" },
  Royals: { he: "מלכי", es: "Reales", fr: "Royaux" },
  Sparks: { he: "ניצוצות", es: "Chispas", fr: "Étincelles" },
  Stags: { he: "אילי", es: "Ciervos", fr: "Cerfs" },
  Storm: { he: "סערת", es: "Tormenta", fr: "Tempête" },
  Thunder: { he: "רעם", es: "Trueno", fr: "Tonnerre" },
  Titans: { he: "טיטאני", es: "Titanes", fr: "Titans" },
  Vipers: { he: "צפעוני", es: "Víboras", fr: "Vipères" },
};

const CITY_HE: Record<string, string> = {
  Nottingham: "נוטינגהאם", Chesterfield: "צ'סטרפילד", Crewe: "קרו", Walsall: "וולסול", Gillingham: "גילינגהאם", Grimsby: "גרימסבי",
  Accrington: "אקרינגטון", "Milton Keynes": "מילטון קינס", Stoke: "סטוק", Salford: "סלפורד", Barrow: "בארו", Colchester: "קולצ'סטר",
  Birkenhead: "בירקנהד", Bromley: "ברומלי", Fleetwood: "פליטווד", Harrogate: "הארוגייט", Newport: "ניופורט", Swindon: "סווינדון",
  Cheltenham: "צ'לטנהאם", Morecambe: "מורקאמב", Crawley: "קרולי", Barnet: "בארנט", Shrewsbury: "שרוסברי", Oldham: "אולדהאם",
  Bolton: "בולטון", Wigan: "ויגאן", Barnsley: "בארנסלי", Peterborough: "פיטרבורו", Stockport: "סטוקפורט", Huddersfield: "הדרספילד",
  Cardiff: "קארדיף", Plymouth: "פלימות'", Reading: "רדינג", Leyton: "לייטון", Lincoln: "לינקולן", Exeter: "אקסטר",
  Stevenage: "סטיבנג'", Wycombe: "וויקומב", Mansfield: "מנספילד", Northampton: "נורת'המפטון", Rotherham: "רות'רהאם", Burton: "ברטון",
  Blackpool: "בלקפול", Cambridge: "קיימברידג'", Wimbledon: "ווימבלדון", Doncaster: "דונקסטר", Luton: "לוטון", Bradford: "בראדפורד",
  Leicester: "לסטר", Southampton: "סאות'המפטון", Ipswich: "איפסוויץ'", Middlesbrough: "מידלסברו", Norwich: "נוריץ'",
  "West Bromwich": "ווסט ברומיץ'", Coventry: "קובנטרי", Bristol: "בריסטול", Sheffield: "שפילד", Hull: "האל", Swansea: "סוונסי",
  Bermondsey: "ברמונדזי", "West London": "מערב לונדון", Preston: "פרסטון", Blackburn: "בלקברן", Derby: "דרבי", Portsmouth: "פורטסמות'",
  Watford: "ווטפורד", Birmingham: "ברמינגהאם", Wrexham: "רקסהאם", Greenwich: "גריניץ'", Oxford: "אוקספורד", Manchester: "מנצ'סטר",
  Islington: "איזלינגטון", Liverpool: "ליברפול", Kensington: "קנזינגטון", "North London": "צפון לונדון", Newcastle: "ניוקאסל",
  Brighton: "ברייטון", "East London": "מזרח לונדון", Croydon: "קרוידון", Brentford: "ברנטפורד", Fulham: "פולהאם", Bournemouth: "בורנמות'",
  Wolverhampton: "וולברהמפטון", Leeds: "לידס", Burnley: "ברנלי", Sunderland: "סנדרלנד",
  "A Coruña": "לה קורוניה", Málaga: "מלגה", Santander: "סנטנדר", Gijón: "חיחון", Zaragoza: "סרגוסה", Tenerife: "טנריפה", Burgos: "בורגוס",
  Cartagena: "קרטחנה", Córdoba: "קורדובה", Castellón: "קסטיון", Elda: "אלדה", Ibiza: "איביסה", Murcia: "מורסיה", Ponferrada: "פונפרדה",
  Soria: "סוריה", Algeciras: "אלחסירס", Alcoy: "אלקוי", Tarragona: "טרגונה", Salamanca: "סלמנקה", Barakaldo: "ברקלדו", Valencia: "ולנסיה",
  Elche: "אלצ'ה", Eibar: "אייבר", Albacete: "אלבסטה", Oviedo: "אוביידו", Cádiz: "קדיס", Granada: "גרנדה", Huesca: "ואסקה", Miranda: "מירנדה",
  Andorra: "אנדורה", Ferrol: "פרול", Almería: "אלמריה", León: "לאון", Amorebieta: "אמורביאטה", Lugo: "לוגו", Compostela: "קומפוסטלה",
  Sabadell: "סבדל", Alicante: "אליקנטה", Alcorcón: "אלקורקון", Fuenlabrada: "פואנלברדה", Logroño: "לוגרוניו", Avilés: "אבילס",
  Madrid: "מדריד", Barcelona: "ברצלונה", Bilbao: "בילבאו", "San Sebastián": "סן סבסטיאן", Villarreal: "ויאריאל", Seville: "סביליה",
  Girona: "ג'ירונה", Pamplona: "פמפלונה", Vigo: "ויגו", Palma: "פלמה", Getafe: "חטאפה", Vallecas: "ויאקס", Vitoria: "ויטוריה",
  Leganés: "לגאנס", "Las Palmas": "לאס פלמאס", Valladolid: "ויאדוליד",
  Cesena: "צ'זנה", Vicenza: "ויצ'נצה", Perugia: "פרוג'ה", Crotone: "קרוטונה", Catania: "קטניה", Bolzano: "בולצאנו", Ferrara: "פרארה",
  Trieste: "טריאסטה", Padua: "פדובה", Pescara: "פסקרה", Chiavari: "קיאוורי", Gubbio: "גוביו", Arezzo: "ארצו", Lucca: "לוקה", Crema: "קרמה",
  Vercelli: "ורצ'לי", Rimini: "רימיני", Pontedera: "פונטדרה", Sassari: "סאסארי", Benevento: "בנבנטו", Palermo: "פלרמו", Genoa: "גנואה",
  Bari: "בארי", Pisa: "פיזה", Cremona: "קרמונה", Brescia: "ברשה", Catanzaro: "קטנצרו", Spezia: "ספציה", Modena: "מודנה",
  "Reggio Emilia": "רג'ו אמיליה", Mantua: "מנטובה", Carrara: "קרארה", Frosinone: "פרוזינונה", Salerno: "סלרנו", Cosenza: "קוזנצה",
  Castellammare: "קסטלמארה", Cittadella: "צ'יטדלה", Sassuolo: "סאסואולו", Ascoli: "אסקולי", Terni: "טרני", Milan: "מילאנו", Turin: "טורינו",
  Naples: "נאפולי", Rome: "רומא", Bergamo: "ברגמו", Florence: "פירנצה", Bologna: "בולוניה", Como: "קומו", Cagliari: "קליארי", Lecce: "לצ'ה",
  Udine: "אודינה", Verona: "ורונה", Monza: "מונצה", Venice: "ונציה", Parma: "פארמה", Empoli: "אמפולי",
  Munich: "מינכן", Rostock: "רוסטוק", Saarbrücken: "זארבריקן", Aue: "אואה", Mannheim: "מנהיים", Wiesbaden: "ויסבאדן", Ingolstadt: "אינגולשטאט",
  Duisburg: "דויסבורג", Verl: "פרל", Essen: "אסן", Osnabrück: "אוסנבריק", Cottbus: "קוטבוס", Cologne: "קלן", Sandhausen: "זנדהאוזן",
  Halle: "האלה", Lübeck: "ליבק", Aachen: "אאכן", Unterhaching: "אונטרהאכינג", Regensburg: "רגנסבורג", Frankfurt: "פרנקפורט",
  Gelsenkirchen: "גלזנקירכן", Berlin: "ברלין", Kaiserslautern: "קייזרסלאוטרן", Düsseldorf: "דיסלדורף", Nürnberg: "נירנברג", Hannover: "הנובר",
  Magdeburg: "מגדבורג", Elversberg: "אלברסברג", Paderborn: "פאדרבורן", Karlsruhe: "קרלסרוהה", Darmstadt: "דרמשטאט", Fürth: "פירת'",
  Braunschweig: "בראונשווייג", Ulm: "אולם", Münster: "מינסטר", Dresden: "דרזדן", Bielefeld: "בילפלד", Bochum: "בוכום", Dortmund: "דורטמונד",
  Leverkusen: "לברקוזן", Leipzig: "לייפציג", Stuttgart: "שטוטגרט", Freiburg: "פרייבורג", Wolfsburg: "וולפסבורג", Sinsheim: "זינסהיים",
  Mainz: "מיינץ", Augsburg: "אאוגסבורג", Bremen: "ברמן", Mönchengladbach: "מנשנגלדבאך", Hamburg: "המבורג", Heidenheim: "היידנהיים",
  Sochaux: "סושו", Valenciennes: "ולנסיין", Orléans: "אורליאן", Rouen: "רואן", Versailles: "ורסאי", Dijon: "דיז'ון", Villefranche: "וילפרנש",
  "Le Mans": "לה מאן", Concarneau: "קונקרנו", Châteauroux: "שאטורו", Nancy: "נאנסי", Boulogne: "בולון", Nîmes: "נים", Aubagne: "אובן",
  Cholet: "שולה", Paris: "פריז", Caen: "קאן", Grenoble: "גרנובל", Guingamp: "גנגאן", Amiens: "אמיין", Bastia: "בסטיה", Rodez: "רודז",
  Pau: "פו", Laval: "לאוואל", Annecy: "אנסי", Troyes: "טרואה", Dunkerque: "דנקרק", "Saint-Ouen": "סן-אואן", Clermont: "קלרמון",
  Ajaccio: "אז'קסיו", Martigues: "מרטיג", Lorient: "לוריין", Montpellier: "מונפלייה", Marseille: "מרסיי", Lyon: "ליון", Monaco: "מונקו",
  Lille: "ליל", Nice: "ניס", Lens: "לאנס", Rennes: "רן", Toulouse: "טולוז", Strasbourg: "שטרסבורג", Reims: "ריימס", Brest: "ברסט",
  Nantes: "נאנט", Auxerre: "אוקסר", Angers: "אנז'ה", "Le Havre": "לה האבר", Metz: "מץ", "Saint-Étienne": "סנט אטיין",
  Doetinchem: "דוטינכם", Volendam: "וולנדם", Venlo: "ונלו", Leeuwarden: "לאוורדן", Kerkrade: "קרקראדה", Helmond: "הלמונד",
  "Den Bosch": "דן בוש", Emmen: "אמן", Dordrecht: "דורדרכט", Eindhoven: "איינדהובן", Velsen: "ולסן", Oss: "אוס", Waalwijk: "ואלוויק",
  "The Hague": "האג", Arnhem: "ארנהם", Maastricht: "מאסטריכט", Amsterdam: "אמסטרדם", Alkmaar: "אלקמאר", Utrecht: "אוטרכט",
  Rotterdam: "רוטרדם", Enschede: "אנסחדה", Heerenveen: "הירנפן", Groningen: "חרונינגן", Nijmegen: "ניימכן", Deventer: "דוונטר",
  Sittard: "סיטארד", Almelo: "אלמלו", Zwolle: "זוולה", Breda: "ברדה", Tilburg: "טילבורג", Almere: "אלמרה",
  Coimbra: "קוימברה", Matosinhos: "מטוזיניוש", Feira: "פיירה", Penafiel: "פנאפייל", Chaves: "שאבש", Mafra: "מפרה", Funchal: "פונשל",
  Paços: "פאסוש", Tondela: "טונדלה", Vizela: "ויזלה", Oliveira: "אוליביירה", "Torres Vedras": "טורש ודרש", Porto: "פורטו", Lisbon: "ליסבון",
  Leiria: "לייריה", Alverca: "אלברקה", Felgueiras: "פלגיירש", Lourosa: "לורוזה", Braga: "בראגה", Guimarães: "גימאראש", Famalicão: "פמאליקאו",
  Barcelos: "ברסלוש", Estoril: "אשטוריל", "Vila do Conde": "וילה דו קונדה", Moreira: "מוריירה", Arouca: "ארוקה", Azores: "האיים האזוריים",
  Amadora: "אמדורה", Faro: "פארו", Aves: "אבש",
  "Rishon LeZion": "ראשון לציון", "Ramat Gan": "רמת גן", "Tel Aviv": "תל אביב", Acre: "עכו", Jaffa: "יפו", "Nof HaGalil": "נוף הגליל",
  "Kfar Saba": "כפר סבא", Afula: "עפולה", "Ra'anana": "רעננה", "Kafr Qasim": "כפר קאסם", Herzliya: "הרצליה", Hadera: "חדרה",
  "Kiryat Shmona": "קריית שמונה", "Ramat HaSharon": "רמת השרון", "Umm al-Fahm": "אום אל-פחם", Ashkelon: "אשקלון", Haifa: "חיפה",
  "Be'er Sheva": "באר שבע", Jerusalem: "ירושלים", Netanya: "נתניה", Reineh: "ריינה", Sakhnin: "סכנין", Tiberias: "טבריה", Ashdod: "אשדוד",
  "Petah Tikva": "פתח תקווה",
};

/** A club's display name in a language; any string that is not a club name comes back unchanged. */
export function localClub(name: string, lang: Lang): string {
  if (lang === "en" || !name) return name;
  const reserve = /\s+II$/.test(name);
  const base = name.replace(/\s+II$/, "");
  const cut = base.lastIndexOf(" ");
  if (cut < 0) return name;
  const city = base.slice(0, cut);
  const nick = NICK[base.slice(cut + 1)];
  if (!nick) return name;
  if (lang === "he") {
    const heCity = CITY_HE[city];
    if (!heCity) return name;
    return `${nick.he} ${heCity}${reserve ? " ב'" : ""}`;
  }
  if (lang === "es") return `${nick.es} de ${city}${reserve ? " II" : ""}`;
  return `${nick.fr} de ${city}${reserve ? " II" : ""}`;
}
