import type { AttrKey, Attrs, Club, Country, League, PositionId } from "./types";

export const ATTR_LABEL: Record<AttrKey, string> = {
  pace: "Pace",
  tackle: "Tackle",
  passing: "Passing",
  dribbling: "Dribbling",
  shooting: "Shooting",
  physical: "Physical",
};

export const ATTR_HINT: Record<AttrKey, string> = {
  pace: "First to the ball. This is what fades after 33.",
  tackle: "Duels, interceptions, and a keeper's claim.",
  passing: "The ball that splits a line, and fewer giveaways.",
  dribbling: "Taking a man on, and keeping the ball under pressure.",
  shooting: "Goals and efforts on target. Almost still for a keeper.",
  physical: "Body contact, headers, and lasting the full ninety.",
};

export const ATTR_DRILL: Record<AttrKey, string> = {
  pace: "Flying starts",
  tackle: "1v1 duels",
  passing: "Double pass",
  dribbling: "Take-ons",
  shooting: "Box finishes",
  physical: "Contact work",
};

export const ATTR_QUESTION: Record<AttrKey, string> = {
  pace: "Pace drill",
  tackle: "Tackle drill",
  passing: "Passing drill",
  dribbling: "Dribbling drill",
  shooting: "Shooting drill",
  physical: "Physical drill",
};

export const POSITIONS: {
  id: PositionId;
  name: string;
  blurb: string;
  shirt: number;
}[] = [
  { id: "GK", name: "Goalkeeper", blurb: "Physical and tackle keep the goal. Passing starts the attack.", shirt: 1 },
  { id: "CB", name: "Centre-back", blurb: "Tackle and physical. You grow from duels, not from shots.", shirt: 4 },
  { id: "FB", name: "Full-back", blurb: "Pace down the line, a tackle, then a pass forward.", shirt: 2 },
  { id: "CDM", name: "Defensive mid", blurb: "The breaker. Tackle, body, and a short pass.", shirt: 6 },
  { id: "CM", name: "Midfielder", blurb: "The engine. Passing, balance, and a touch everywhere.", shirt: 8 },
  { id: "CAM", name: "Attacking mid", blurb: "The key pass, the dribble, and the shot.", shirt: 10 },
  { id: "W", name: "Winger", blurb: "Pace and a dribble down the flank, then the shot.", shirt: 11 },
  { id: "ST", name: "Striker", blurb: "Shooting, physical, pace. The goals are yours.", shirt: 9 },
];

export const WEIGHTS: Record<PositionId, Attrs> = {
  ST: { pace: 0.18, tackle: 0.04, passing: 0.12, dribbling: 0.16, shooting: 0.34, physical: 0.16 },
  W: { pace: 0.24, tackle: 0.05, passing: 0.16, dribbling: 0.23, shooting: 0.22, physical: 0.1 },
  CAM: { pace: 0.12, tackle: 0.06, passing: 0.28, dribbling: 0.24, shooting: 0.2, physical: 0.1 },
  CM: { pace: 0.14, tackle: 0.16, passing: 0.28, dribbling: 0.14, shooting: 0.12, physical: 0.16 },
  CDM: { pace: 0.12, tackle: 0.3, passing: 0.22, dribbling: 0.09, shooting: 0.05, physical: 0.22 },
  CB: { pace: 0.15, tackle: 0.32, passing: 0.1, dribbling: 0.07, shooting: 0.04, physical: 0.32 },
  FB: { pace: 0.24, tackle: 0.22, passing: 0.18, dribbling: 0.16, shooting: 0.06, physical: 0.14 },
  GK: { pace: 0.16, tackle: 0.2, passing: 0.16, dribbling: 0.1, shooting: 0.06, physical: 0.32 },
};

export const RELEVANCE: Record<PositionId, Attrs> = {
  ST: { pace: 1.05, tackle: 0.35, passing: 0.7, dribbling: 1.05, shooting: 1.3, physical: 0.95 },
  W: { pace: 1.3, tackle: 0.4, passing: 0.95, dribbling: 1.35, shooting: 1.1, physical: 0.7 },
  CAM: { pace: 0.85, tackle: 0.4, passing: 1.3, dribbling: 1.2, shooting: 1.05, physical: 0.65 },
  CM: { pace: 0.8, tackle: 0.9, passing: 1.3, dribbling: 0.9, shooting: 0.7, physical: 0.85 },
  CDM: { pace: 0.75, tackle: 1.3, passing: 1.05, dribbling: 0.55, shooting: 0.4, physical: 1.15 },
  CB: { pace: 0.8, tackle: 1.3, passing: 0.6, dribbling: 0.4, shooting: 0.3, physical: 1.3 },
  FB: { pace: 1.2, tackle: 1.1, passing: 0.95, dribbling: 1.05, shooting: 0.45, physical: 0.9 },
  GK: { pace: 0.9, tackle: 1.05, passing: 0.85, dribbling: 0.45, shooting: 0.35, physical: 1.3 },
};

export const BIAS: Record<PositionId, Attrs> = {
  ST: { pace: 4, tackle: -14, passing: 0, dribbling: 4, shooting: 8, physical: 4 },
  W: { pace: 8, tackle: -10, passing: 3, dribbling: 8, shooting: 4, physical: -2 },
  CAM: { pace: 2, tackle: -8, passing: 8, dribbling: 6, shooting: 4, physical: -2 },
  CM: { pace: 0, tackle: 2, passing: 8, dribbling: 2, shooting: -2, physical: 2 },
  CDM: { pace: -2, tackle: 8, passing: 4, dribbling: -4, shooting: -10, physical: 6 },
  CB: { pace: 0, tackle: 8, passing: -4, dribbling: -8, shooting: -12, physical: 8 },
  FB: { pace: 6, tackle: 4, passing: 3, dribbling: 4, shooting: -6, physical: 2 },
  GK: { pace: 2, tackle: 4, passing: 0, dribbling: -6, shooting: -14, physical: 8 },
};

export const TIER_STRENGTH = [58, 66, 74, 84, 90, 93, 96];

export const COUNTRIES: Country[] = [
  { id: "eng", name: "England", national: "England", currency: "£" },
  { id: "esp", name: "Spain", national: "Spain", currency: "€" },
  { id: "ita", name: "Italy", national: "Italy", currency: "€" },
  { id: "ger", name: "Germany", national: "Germany", currency: "€" },
  { id: "fra", name: "France", national: "France", currency: "€" },
  { id: "ned", name: "Netherlands", national: "Netherlands", currency: "€" },
  { id: "por", name: "Portugal", national: "Portugal", currency: "€" },
  { id: "isr", name: "Israel", national: "Israel", currency: "₪" },
];

export const LEAGUES: League[] = [
  { id: "eng-l2", name: "League Two", countryId: "eng", tier: 0, cup: "FA Cup", europe: null },
  { id: "eng-l1", name: "League One", countryId: "eng", tier: 1, cup: "FA Cup", europe: null },
  { id: "eng-ch", name: "Championship", countryId: "eng", tier: 2, cup: "FA Cup", europe: "Europa League" },
  { id: "eng-pl", name: "Premier League", countryId: "eng", tier: 3, cup: "FA Cup", europe: "Champions League" },

  { id: "esp-fed", name: "Primera Federación", countryId: "esp", tier: 0, cup: "Copa del Rey", europe: null },
  { id: "esp-seg", name: "Segunda División", countryId: "esp", tier: 1, cup: "Copa del Rey", europe: null },
  { id: "esp-ll", name: "La Liga", countryId: "esp", tier: 3, cup: "Copa del Rey", europe: "Champions League" },

  { id: "ita-c", name: "Serie C", countryId: "ita", tier: 0, cup: "Coppa Italia", europe: null },
  { id: "ita-b", name: "Serie B", countryId: "ita", tier: 1, cup: "Coppa Italia", europe: null },
  { id: "ita-a", name: "Serie A", countryId: "ita", tier: 3, cup: "Coppa Italia", europe: "Champions League" },

  { id: "ger-3", name: "3. Liga", countryId: "ger", tier: 0, cup: "DFB-Pokal", europe: null },
  { id: "ger-2", name: "2. Bundesliga", countryId: "ger", tier: 1, cup: "DFB-Pokal", europe: null },
  { id: "ger-bl", name: "Bundesliga", countryId: "ger", tier: 3, cup: "DFB-Pokal", europe: "Champions League" },

  { id: "fra-nat", name: "National", countryId: "fra", tier: 0, cup: "Coupe de France", europe: null },
  { id: "fra-l2", name: "Ligue 2", countryId: "fra", tier: 1, cup: "Coupe de France", europe: null },
  { id: "fra-l1", name: "Ligue 1", countryId: "fra", tier: 3, cup: "Coupe de France", europe: "Champions League" },

  { id: "ned-eer", name: "Eerste Divisie", countryId: "ned", tier: 0, cup: "KNVB Cup", europe: null },
  { id: "ned-ere", name: "Eredivisie", countryId: "ned", tier: 2, cup: "KNVB Cup", europe: "Europa League" },

  { id: "por-l2", name: "Liga Portugal 2", countryId: "por", tier: 0, cup: "Taça de Portugal", europe: null },
  { id: "por-lp", name: "Liga Portugal", countryId: "por", tier: 2, cup: "Taça de Portugal", europe: "Europa League" },

  { id: "isr-leu", name: "Liga Leumit", countryId: "isr", tier: 0, cup: "State Cup", europe: null },
  { id: "isr-hal", name: "Ligat ha'Al", countryId: "isr", tier: 2, cup: "State Cup", europe: "Europa League" },
];

function row(leagueId: string, clubs: [string, string][]): Club[] {
  return clubs.map(([name, short], index) => ({
    id: `${leagueId}-${index}`,
    name,
    short,
    leagueId,
  }));
}

export const CLUBS: Club[] = [
  ...row("eng-l2", [
    ["Notts County", "Notts"], ["Chesterfield", "Chesterfield"], ["Crewe Alexandra", "Crewe"], ["Walsall", "Walsall"],
    ["Gillingham", "Gillingham"], ["Grimsby Town", "Grimsby"], ["Accrington Stanley", "Accrington"], ["MK Dons", "MK Dons"],
    ["Port Vale", "Port Vale"], ["Salford City", "Salford"], ["Barrow", "Barrow"], ["Colchester United", "Colchester"],
    ["Tranmere Rovers", "Tranmere"], ["Bromley", "Bromley"], ["Fleetwood Town", "Fleetwood"], ["Harrogate Town", "Harrogate"],
    ["Newport County", "Newport"], ["Swindon Town", "Swindon"], ["Cheltenham Town", "Cheltenham"], ["Morecambe", "Morecambe"],
    ["Crawley Town", "Crawley"], ["Barnet", "Barnet"], ["Shrewsbury Town", "Shrewsbury"], ["Oldham Athletic", "Oldham"],
  ]),
  ...row("eng-l1", [
    ["Bolton Wanderers", "Bolton"], ["Wigan Athletic", "Wigan"], ["Barnsley", "Barnsley"], ["Peterborough United", "Peterboro"],
    ["Stockport County", "Stockport"], ["Huddersfield Town", "Huddersfield"], ["Cardiff City", "Cardiff"], ["Plymouth Argyle", "Plymouth"],
    ["Reading", "Reading"], ["Leyton Orient", "Orient"], ["Lincoln City", "Lincoln"], ["Exeter City", "Exeter"],
    ["Stevenage", "Stevenage"], ["Wycombe Wanderers", "Wycombe"], ["Mansfield Town", "Mansfield"], ["Northampton Town", "Northampton"],
    ["Rotherham United", "Rotherham"], ["Burton Albion", "Burton"], ["Blackpool", "Blackpool"], ["Cambridge United", "Cambridge"],
    ["AFC Wimbledon", "Wimbledon"], ["Doncaster Rovers", "Doncaster"], ["Luton Town", "Luton"], ["Bradford City", "Bradford"],
  ]),
  ...row("eng-ch", [
    ["Leicester City", "Leicester"], ["Southampton", "Southampton"], ["Ipswich Town", "Ipswich"], ["Middlesbrough", "Boro"],
    ["Norwich City", "Norwich"], ["West Brom", "West Brom"], ["Coventry City", "Coventry"], ["Bristol City", "Bristol C"],
    ["Sheffield United", "Sheff Utd"], ["Sheffield Wednesday", "Sheff Wed"], ["Hull City", "Hull"], ["Stoke City", "Stoke"],
    ["Swansea City", "Swansea"], ["Millwall", "Millwall"], ["Queens Park Rangers", "QPR"], ["Preston North End", "Preston"],
    ["Blackburn Rovers", "Blackburn"], ["Derby County", "Derby"], ["Portsmouth", "Portsmouth"], ["Watford", "Watford"],
    ["Birmingham City", "Birmingham"], ["Wrexham", "Wrexham"], ["Charlton Athletic", "Charlton"], ["Oxford United", "Oxford"],
  ]),
  ...row("eng-pl", [
    ["Manchester City", "Man City"], ["Arsenal", "Arsenal"], ["Liverpool", "Liverpool"], ["Chelsea", "Chelsea"],
    ["Manchester United", "Man Utd"], ["Tottenham", "Spurs"], ["Newcastle United", "Newcastle"], ["Aston Villa", "Villa"],
    ["Brighton", "Brighton"], ["West Ham United", "West Ham"], ["Crystal Palace", "Palace"], ["Brentford", "Brentford"],
    ["Fulham", "Fulham"], ["Everton", "Everton"], ["Bournemouth", "Bournemouth"], ["Wolverhampton", "Wolves"],
    ["Nottingham Forest", "Forest"], ["Leeds United", "Leeds"], ["Burnley", "Burnley"], ["Sunderland", "Sunderland"],
  ]),

  ...row("esp-fed", [
    ["Deportivo", "Depor"], ["Málaga", "Málaga"], ["Racing Santander", "Racing"], ["Sporting Gijón", "Sporting"],
    ["Real Zaragoza", "Zaragoza"], ["Tenerife", "Tenerife"], ["Burgos", "Burgos"], ["Cartagena", "Cartagena"],
    ["Córdoba", "Córdoba"], ["Castellón", "Castellón"], ["Eldense", "Eldense"], ["Ibiza", "Ibiza"],
    ["Real Murcia", "Murcia"], ["Ponferradina", "Ponfe"], ["Numancia", "Numancia"], ["Algeciras", "Algeciras"],
    ["Alcoyano", "Alcoyano"], ["Gimnàstic", "Nàstic"], ["Unionistas", "Unionistas"], ["Barakaldo", "Barakaldo"],
  ]),
  ...row("esp-seg", [
    ["Levante", "Levante"], ["Elche", "Elche"], ["Eibar", "Eibar"], ["Albacete", "Albacete"],
    ["Real Oviedo", "Oviedo"], ["Cádiz", "Cádiz"], ["Granada", "Granada"], ["Huesca", "Huesca"],
    ["Mirandés", "Mirandés"], ["Andorra", "Andorra"], ["Racing Ferrol", "Ferrol"], ["Almería", "Almería"],
    ["Cultural Leonesa", "Leonesa"], ["Amorebieta", "Amorebieta"], ["Lugo", "Lugo"], ["Compostela", "Compostela"],
    ["Sabadell", "Sabadell"], ["Hércules", "Hércules"], ["Alcorcón", "Alcorcón"], ["Fuenlabrada", "Fuenlabrada"],
    ["Logroñés", "Logroñés"], ["Avilés", "Avilés"],
  ]),
  ...row("esp-ll", [
    ["Real Madrid", "Madrid"], ["Barcelona", "Barcelona"], ["Atlético Madrid", "Atlético"], ["Athletic Bilbao", "Athletic"],
    ["Real Sociedad", "Sociedad"], ["Villarreal", "Villarreal"], ["Real Betis", "Betis"], ["Sevilla", "Sevilla"],
    ["Valencia", "Valencia"], ["Girona", "Girona"], ["Osasuna", "Osasuna"], ["Celta Vigo", "Celta"],
    ["Mallorca", "Mallorca"], ["Getafe", "Getafe"], ["Rayo Vallecano", "Rayo"], ["Alavés", "Alavés"],
    ["Espanyol", "Espanyol"], ["Leganés", "Leganés"], ["Las Palmas", "Las Palmas"], ["Real Valladolid", "Valladolid"],
  ]),

  ...row("ita-c", [
    ["Cesena", "Cesena"], ["Vicenza", "Vicenza"], ["Perugia", "Perugia"], ["Crotone", "Crotone"],
    ["Catania", "Catania"], ["Südtirol", "Südtirol"], ["SPAL", "SPAL"], ["Triestina", "Triestina"],
    ["Padova", "Padova"], ["Pescara", "Pescara"], ["Virtus Entella", "Entella"], ["Gubbio", "Gubbio"],
    ["Arezzo", "Arezzo"], ["Lucchese", "Lucchese"], ["Pergolettese", "Pergolettese"], ["Pro Vercelli", "Pro Vercelli"],
    ["Rimini", "Rimini"], ["Pontedera", "Pontedera"], ["Torres", "Torres"], ["Benevento", "Benevento"],
  ]),
  ...row("ita-b", [
    ["Palermo", "Palermo"], ["Sampdoria", "Sampdoria"], ["Bari", "Bari"], ["Pisa", "Pisa"],
    ["Cremonese", "Cremonese"], ["Brescia", "Brescia"], ["Catanzaro", "Catanzaro"], ["Spezia", "Spezia"],
    ["Modena", "Modena"], ["Reggiana", "Reggiana"], ["Mantova", "Mantova"], ["Carrarese", "Carrarese"],
    ["Frosinone", "Frosinone"], ["Salernitana", "Salernitana"], ["Cosenza", "Cosenza"], ["Juve Stabia", "Stabia"],
    ["Cittadella", "Cittadella"], ["Sassuolo", "Sassuolo"], ["Ascoli", "Ascoli"], ["Ternana", "Ternana"],
  ]),
  ...row("ita-a", [
    ["Inter", "Inter"], ["Milan", "Milan"], ["Juventus", "Juventus"], ["Napoli", "Napoli"],
    ["Roma", "Roma"], ["Atalanta", "Atalanta"], ["Lazio", "Lazio"], ["Fiorentina", "Fiorentina"],
    ["Bologna", "Bologna"], ["Torino", "Torino"], ["Como", "Como"], ["Genoa", "Genoa"],
    ["Cagliari", "Cagliari"], ["Lecce", "Lecce"], ["Udinese", "Udinese"], ["Hellas Verona", "Verona"],
    ["Monza", "Monza"], ["Venezia", "Venezia"], ["Parma", "Parma"], ["Empoli", "Empoli"],
  ]),

  ...row("ger-3", [
    ["1860 Munich", "1860"], ["Hansa Rostock", "Rostock"], ["Saarbrücken", "Saarbrücken"], ["Erzgebirge Aue", "Aue"],
    ["Waldhof Mannheim", "Waldhof"], ["Wehen Wiesbaden", "Wehen"], ["Ingolstadt", "Ingolstadt"], ["Duisburg", "Duisburg"],
    ["Verl", "Verl"], ["Rot-Weiss Essen", "Essen"], ["Osnabrück", "Osnabrück"], ["Energie Cottbus", "Cottbus"],
    ["Viktoria Köln", "Viktoria"], ["Sandhausen", "Sandhausen"], ["Halle", "Halle"], ["Lübeck", "Lübeck"],
    ["Alemannia Aachen", "Aachen"], ["Unterhaching", "Unterhaching"], ["Jahn Regensburg", "Regensburg"], ["FSV Frankfurt", "FSV"],
  ]),
  ...row("ger-2", [
    ["Schalke 04", "Schalke"], ["Hertha Berlin", "Hertha"], ["Kaiserslautern", "Lautern"], ["Fortuna Düsseldorf", "Fortuna"],
    ["Nürnberg", "Nürnberg"], ["Hannover 96", "Hannover"], ["Magdeburg", "Magdeburg"], ["Elversberg", "Elversberg"],
    ["Paderborn", "Paderborn"], ["Karlsruher", "Karlsruhe"], ["Darmstadt", "Darmstadt"], ["Greuther Fürth", "Fürth"],
    ["Braunschweig", "Braunschweig"], ["Ulm", "Ulm"], ["Preußen Münster", "Münster"], ["Dynamo Dresden", "Dresden"],
    ["Arminia Bielefeld", "Bielefeld"], ["Bochum", "Bochum"],
  ]),
  ...row("ger-bl", [
    ["Bayern Munich", "Bayern"], ["Borussia Dortmund", "Dortmund"], ["Bayer Leverkusen", "Leverkusen"], ["RB Leipzig", "Leipzig"],
    ["Eintracht Frankfurt", "Frankfurt"], ["Stuttgart", "Stuttgart"], ["Freiburg", "Freiburg"], ["Wolfsburg", "Wolfsburg"],
    ["Hoffenheim", "Hoffenheim"], ["Mainz", "Mainz"], ["Augsburg", "Augsburg"], ["Werder Bremen", "Bremen"],
    ["Union Berlin", "Union"], ["Borussia Mönchengladbach", "Gladbach"], ["Hamburger SV", "Hamburg"], ["Heidenheim", "Heidenheim"],
    ["St. Pauli", "St. Pauli"], ["1. FC Köln", "Köln"],
  ]),

  ...row("fra-nat", [
    ["Sochaux", "Sochaux"], ["Valenciennes", "Valenciennes"], ["Orléans", "Orléans"], ["Quevilly", "Quevilly"],
    ["Versailles", "Versailles"], ["Dijon", "Dijon"], ["Villefranche", "Villefranche"], ["Le Mans", "Le Mans"],
    ["Concarneau", "Concarneau"], ["Châteauroux", "Châteauroux"], ["Nancy", "Nancy"], ["Boulogne", "Boulogne"],
    ["Nîmes", "Nîmes"], ["Aubagne", "Aubagne"], ["Rouen", "Rouen"], ["Cholet", "Cholet"],
    ["Gobelins", "Gobelins"], ["Paris 13 Atletico", "Paris 13"],
  ]),
  ...row("fra-l2", [
    ["Paris FC", "Paris FC"], ["Caen", "Caen"], ["Grenoble", "Grenoble"], ["Guingamp", "Guingamp"],
    ["Amiens", "Amiens"], ["Bastia", "Bastia"], ["Rodez", "Rodez"], ["Pau", "Pau"],
    ["Laval", "Laval"], ["Annecy", "Annecy"], ["Troyes", "Troyes"], ["Dunkerque", "Dunkerque"],
    ["Red Star", "Red Star"], ["Clermont", "Clermont"], ["Ajaccio", "Ajaccio"], ["Martigues", "Martigues"],
    ["Lorient", "Lorient"], ["Montpellier", "Montpellier"],
  ]),
  ...row("fra-l1", [
    ["Paris Saint-Germain", "PSG"], ["Marseille", "Marseille"], ["Lyon", "Lyon"], ["Monaco", "Monaco"],
    ["Lille", "Lille"], ["Nice", "Nice"], ["Lens", "Lens"], ["Rennes", "Rennes"],
    ["Toulouse", "Toulouse"], ["Strasbourg", "Strasbourg"], ["Reims", "Reims"], ["Brest", "Brest"],
    ["Nantes", "Nantes"], ["Auxerre", "Auxerre"], ["Angers", "Angers"], ["Le Havre", "Le Havre"],
    ["Metz", "Metz"], ["Saint-Étienne", "Sainté"],
  ]),

  ...row("ned-eer", [
    ["De Graafschap", "Graafschap"], ["Volendam", "Volendam"], ["VVV-Venlo", "Venlo"], ["Cambuur", "Cambuur"],
    ["Roda JC", "Roda"], ["Helmond Sport", "Helmond"], ["Den Bosch", "Den Bosch"], ["Emmen", "Emmen"],
    ["Dordrecht", "Dordrecht"], ["FC Eindhoven", "Eindhoven"], ["Telstar", "Telstar"], ["TOP Oss", "Oss"],
    ["RKC Waalwijk", "Waalwijk"], ["ADO Den Haag", "Den Haag"], ["Vitesse", "Vitesse"], ["MVV", "MVV"],
    ["Jong Ajax", "Jong Ajax"], ["Jong PSV", "Jong PSV"], ["Jong AZ", "Jong AZ"], ["Jong Utrecht", "Jong Utrecht"],
  ]),
  ...row("ned-ere", [
    ["Ajax", "Ajax"], ["PSV", "PSV"], ["Feyenoord", "Feyenoord"], ["AZ", "AZ"],
    ["Twente", "Twente"], ["Utrecht", "Utrecht"], ["Heerenveen", "Heerenveen"], ["Sparta Rotterdam", "Sparta"],
    ["Groningen", "Groningen"], ["NEC", "NEC"], ["Go Ahead Eagles", "Eagles"], ["Fortuna Sittard", "Sittard"],
    ["Heracles", "Heracles"], ["PEC Zwolle", "Zwolle"], ["NAC Breda", "NAC"], ["Excelsior", "Excelsior"],
    ["Willem II", "Willem II"], ["Almere City", "Almere"],
  ]),

  ...row("por-l2", [
    ["Académica", "Académica"], ["Leixões", "Leixões"], ["Feirense", "Feirense"], ["Penafiel", "Penafiel"],
    ["Chaves", "Chaves"], ["Mafra", "Mafra"], ["Marítimo", "Marítimo"], ["Paços de Ferreira", "Paços"],
    ["Tondela", "Tondela"], ["Vizela", "Vizela"], ["Oliveirense", "Oliveirense"], ["Torreense", "Torreense"],
    ["Porto B", "Porto B"], ["Benfica B", "Benfica B"], ["Leiria", "Leiria"], ["Alverca", "Alverca"],
    ["Felgueiras", "Felgueiras"], ["Lusitânia", "Lusitânia"],
  ]),
  ...row("por-lp", [
    ["Benfica", "Benfica"], ["Porto", "Porto"], ["Sporting CP", "Sporting"], ["Braga", "Braga"],
    ["Vitória SC", "Vitória"], ["Famalicão", "Famalicão"], ["Gil Vicente", "Gil Vicente"], ["Casa Pia", "Casa Pia"],
    ["Estoril", "Estoril"], ["Rio Ave", "Rio Ave"], ["Moreirense", "Moreirense"], ["Arouca", "Arouca"],
    ["Santa Clara", "Santa Clara"], ["Estrela da Amadora", "Estrela"], ["Nacional", "Nacional"], ["Farense", "Farense"],
    ["AVS", "AVS"], ["Boavista", "Boavista"],
  ]),

  ...row("isr-leu", [
    ["Hapoel Rishon LeZion", "Rishon"], ["Hapoel Ramat Gan", "Ramat Gan"], ["Bnei Yehuda", "Yehuda"], ["Hapoel Acre", "Acre"],
    ["Maccabi Jaffa", "Jaffa"], ["Hapoel Nof HaGalil", "Nof"], ["Hapoel Kfar Saba", "Kfar Saba"], ["Hapoel Afula", "Afula"],
    ["Hapoel Ra'anana", "Ra'anana"], ["Kafr Qasim", "Kafr Qasim"], ["Maccabi Herzliya", "Herzliya"], ["Hapoel Hadera", "Hadera"],
    ["Ironi Kiryat Shmona", "Kiryat Shmona"], ["Hapoel Ramat HaSharon", "HaSharon"], ["Hapoel Umm al-Fahm", "Umm al-Fahm"], ["Hapoel Ashkelon", "Ashkelon"],
  ]),
  ...row("isr-hal", [
    ["Maccabi Tel Aviv", "Mac TA"], ["Maccabi Haifa", "Mac Haifa"], ["Hapoel Be'er Sheva", "Be'er Sheva"], ["Beitar Jerusalem", "Beitar"],
    ["Hapoel Tel Aviv", "Hap TA"], ["Maccabi Netanya", "Netanya"], ["Maccabi Bnei Raina", "Raina"], ["Hapoel Haifa", "Hap Haifa"],
    ["Hapoel Jerusalem", "Jerusalem"], ["Bnei Sakhnin", "Sakhnin"], ["Ironi Tiberias", "Tiberias"], ["Ashdod", "Ashdod"],
    ["Hapoel Petah Tikva", "Petah Tikva"], ["Maccabi Petah Tikva", "Mac Petah"],
  ]),
];

export const NATIONS = ["England", "Spain", "Italy", "Germany", "France", "Netherlands", "Portugal", "Israel", "Brazil", "Argentina", "Croatia", "Belgium"];

export const DAILY_OPPONENTS = [
  "The final's shadow",
  "The 98 centre-back",
  "The quick winger",
  "The cold striker",
  "The night's midfielder",
  "The scrap-metal keeper",
  "The stubborn full-back",
];

export function getCountry(id: string): Country {
  const country = COUNTRIES.find((item) => item.id === id);
  if (!country) throw new Error(`unknown country ${id}`);
  return country;
}

export function getLeague(id: string): League {
  const league = LEAGUES.find((item) => item.id === id);
  if (!league) throw new Error(`unknown league ${id}`);
  return league;
}

export function getClub(id: string): Club {
  const club = CLUBS.find((item) => item.id === id);
  if (!club) throw new Error(`unknown club ${id}`);
  return club;
}

export function clubsIn(leagueId: string): Club[] {
  return CLUBS.filter((club) => club.leagueId === leagueId);
}

export function leaguesIn(countryId: string): League[] {
  return LEAGUES.filter((league) => league.countryId === countryId).sort((a, b) => a.tier - b.tier);
}

export function entryLeague(countryId: string): League {
  const league = leaguesIn(countryId)[0];
  if (!league) throw new Error(`no league for ${countryId}`);
  return league;
}

export function nextLeague(league: League): League | null {
  return leaguesIn(league.countryId).find((item) => item.tier > league.tier) ?? null;
}

export function prevLeague(league: League): League | null {
  const below = leaguesIn(league.countryId).filter((item) => item.tier < league.tier);
  return below[below.length - 1] ?? null;
}

export function positionMeta(id: PositionId) {
  const meta = POSITIONS.find((item) => item.id === id);
  if (!meta) throw new Error(`unknown position ${id}`);
  return meta;
}

export function clubStrength(clubId: string): number {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const mates = clubsIn(league.id);
  const index = mates.findIndex((item) => item.id === clubId);
  return TIER_STRENGTH[league.tier] + (mates.length / 2 - index) * 1.7;
}
