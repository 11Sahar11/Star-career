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
  { id: "eng-l2", name: "England Third Division", countryId: "eng", tier: 0, cup: "England National Cup", europe: null },
  { id: "eng-l1", name: "England Second Division", countryId: "eng", tier: 1, cup: "England National Cup", europe: null },
  { id: "eng-ch", name: "England First Division", countryId: "eng", tier: 2, cup: "England National Cup", europe: "Continental Trophy" },
  { id: "eng-pl", name: "England Premier Division", countryId: "eng", tier: 3, cup: "England National Cup", europe: "Continental Elite Cup" },

  { id: "esp-fed", name: "Spain Second Division", countryId: "esp", tier: 0, cup: "Spain National Cup", europe: null },
  { id: "esp-seg", name: "Spain First Division", countryId: "esp", tier: 1, cup: "Spain National Cup", europe: null },
  { id: "esp-ll", name: "Spain Premier Division", countryId: "esp", tier: 3, cup: "Spain National Cup", europe: "Continental Elite Cup" },

  { id: "ita-c", name: "Italy Second Division", countryId: "ita", tier: 0, cup: "Italy National Cup", europe: null },
  { id: "ita-b", name: "Italy First Division", countryId: "ita", tier: 1, cup: "Italy National Cup", europe: null },
  { id: "ita-a", name: "Italy Premier Division", countryId: "ita", tier: 3, cup: "Italy National Cup", europe: "Continental Elite Cup" },

  { id: "ger-3", name: "Germany Second Division", countryId: "ger", tier: 0, cup: "Germany National Cup", europe: null },
  { id: "ger-2", name: "Germany First Division", countryId: "ger", tier: 1, cup: "Germany National Cup", europe: null },
  { id: "ger-bl", name: "Germany Premier Division", countryId: "ger", tier: 3, cup: "Germany National Cup", europe: "Continental Elite Cup" },

  { id: "fra-nat", name: "France Second Division", countryId: "fra", tier: 0, cup: "France National Cup", europe: null },
  { id: "fra-l2", name: "France First Division", countryId: "fra", tier: 1, cup: "France National Cup", europe: null },
  { id: "fra-l1", name: "France Premier Division", countryId: "fra", tier: 3, cup: "France National Cup", europe: "Continental Elite Cup" },

  { id: "ned-eer", name: "Netherlands First Division", countryId: "ned", tier: 0, cup: "Netherlands National Cup", europe: null },
  { id: "ned-ere", name: "Netherlands Premier Division", countryId: "ned", tier: 2, cup: "Netherlands National Cup", europe: "Continental Trophy" },

  { id: "por-l2", name: "Portugal First Division", countryId: "por", tier: 0, cup: "Portugal National Cup", europe: null },
  { id: "por-lp", name: "Portugal Premier Division", countryId: "por", tier: 2, cup: "Portugal National Cup", europe: "Continental Trophy" },

  { id: "isr-leu", name: "Israel First Division", countryId: "isr", tier: 0, cup: "Israel National Cup", europe: null },
  { id: "isr-hal", name: "Israel Premier Division", countryId: "isr", tier: 2, cup: "Israel National Cup", europe: "Continental Trophy" },
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
    ["Nottingham Meteors", "Nottingham M"], ["Chesterfield Knights", "Chesterfield"], ["Crewe Thunder", "Crewe"], ["Walsall Titans", "Walsall"],
    ["Gillingham Royals", "Gillingham"], ["Grimsby Bison", "Grimsby"], ["Accrington Knights", "Accrington"], ["Milton Keynes Orbit", "Milton Keynes"],
    ["Stoke Pioneers", "Stoke P"], ["Salford Griffins", "Salford"], ["Barrow Hawks", "Barrow"], ["Colchester Pilots", "Colchester"],
    ["Birkenhead Vipers", "Birkenhead"], ["Bromley Kestrels", "Bromley"], ["Fleetwood Griffins", "Fleetwood"], ["Harrogate Pilots", "Harrogate"],
    ["Newport Mavericks", "Newport"], ["Swindon Bears", "Swindon"], ["Cheltenham Bears", "Cheltenham"], ["Morecambe Pioneers", "Morecambe"],
    ["Crawley Griffins", "Crawley"], ["Barnet Pioneers", "Barnet"], ["Shrewsbury Thunder", "Shrewsbury"], ["Oldham Storm", "Oldham"],
  ]),
  ...row("eng-l1", [
    ["Bolton Kestrels", "Bolton"], ["Wigan Knights", "Wigan"], ["Barnsley Kestrels", "Barnsley"], ["Peterborough Stags", "Peterborough"],
    ["Stockport Mariners", "Stockport"], ["Huddersfield Stags", "Huddersfield"], ["Cardiff Thunder", "Cardiff"], ["Plymouth Pilots", "Plymouth"],
    ["Reading Royals", "Reading"], ["Leyton Vipers", "Leyton"], ["Lincoln Thunder", "Lincoln"], ["Exeter Mariners", "Exeter"],
    ["Stevenage Titans", "Stevenage"], ["Wycombe Meteors", "Wycombe"], ["Mansfield Stags", "Mansfield"], ["Northampton Pilots", "Northampton"],
    ["Rotherham Vipers", "Rotherham"], ["Burton Mavericks", "Burton"], ["Blackpool Pioneers", "Blackpool"], ["Cambridge Stags", "Cambridge"],
    ["Wimbledon Bears", "Wimbledon"], ["Doncaster Mariners", "Doncaster"], ["Luton Hawks", "Luton"], ["Bradford Comets", "Bradford"],
  ]),
  ...row("eng-ch", [
    ["Leicester Orbit", "Leicester"], ["Southampton Lynx", "Southampton"], ["Ipswich Orbit", "Ipswich"], ["Middlesbrough Titans", "Middlesbrough"],
    ["Norwich Knights", "Norwich"], ["West Bromwich Mavericks", "West Bromwich"], ["Coventry Pioneers", "Coventry"], ["Bristol Mavericks", "Bristol"],
    ["Sheffield Hawks", "Sheffield H"], ["Sheffield Kestrels", "Sheffield K"], ["Hull Griffins", "Hull"], ["Stoke Royals", "Stoke R"],
    ["Swansea Mariners", "Swansea"], ["Bermondsey Orbit", "Bermondsey"], ["West London Pioneers", "West London"], ["Preston Knights", "Preston"],
    ["Blackburn Sparks", "Blackburn"], ["Derby Bears", "Derby"], ["Portsmouth Pilots", "Portsmouth"], ["Watford Mavericks", "Watford"],
    ["Birmingham Stags", "Birmingham S"], ["Wrexham Herons", "Wrexham"], ["Greenwich Pilots", "Greenwich"], ["Oxford Pilots", "Oxford"],
  ]),
  ...row("eng-pl", [
    ["Manchester Herons", "Manchester H"], ["Islington Mariners", "Islington"], ["Liverpool Titans", "Liverpool T"], ["Kensington Storm", "Kensington"],
    ["Manchester Knights", "Manchester K"], ["North London Ravens", "North London"], ["Newcastle Lynx", "Newcastle"], ["Birmingham Vipers", "Birmingham V"],
    ["Brighton Mariners", "Brighton"], ["East London Storm", "East London"], ["Croydon Pioneers", "Croydon"], ["Brentford Royals", "Brentford"],
    ["Fulham Pioneers", "Fulham"], ["Liverpool Bison", "Liverpool B"], ["Bournemouth Lynx", "Bournemouth"], ["Wolverhampton Ravens", "Wolverhampton"],
    ["Nottingham Bison", "Nottingham B"], ["Leeds Thunder", "Leeds"], ["Burnley Comets", "Burnley"], ["Sunderland Comets", "Sunderland"],
  ]),

  ...row("esp-fed", [
    ["A Coruña Kestrels", "A Coruña"], ["Málaga Vipers", "Málaga"], ["Santander Royals", "Santander"], ["Gijón Stags", "Gijón"],
    ["Zaragoza Royals", "Zaragoza"], ["Tenerife Orbit", "Tenerife"], ["Burgos Royals", "Burgos"], ["Cartagena Sparks", "Cartagena"],
    ["Córdoba Phoenix", "Córdoba"], ["Castellón Meteors", "Castellón"], ["Elda Phoenix", "Elda"], ["Ibiza Sparks", "Ibiza"],
    ["Murcia Vipers", "Murcia"], ["Ponferrada Ravens", "Ponferrada"], ["Soria Titans", "Soria"], ["Algeciras Mariners", "Algeciras"],
    ["Alcoy Titans", "Alcoy"], ["Tarragona Pilots", "Tarragona"], ["Salamanca Griffins", "Salamanca"], ["Barakaldo Vipers", "Barakaldo"],
  ]),
  ...row("esp-seg", [
    ["Valencia Falcons", "Valencia F"], ["Elche Griffins", "Elche"], ["Eibar Knights", "Eibar"], ["Albacete Bison", "Albacete"],
    ["Oviedo Pioneers", "Oviedo"], ["Cádiz Royals", "Cádiz"], ["Granada Orbit", "Granada"], ["Huesca Griffins", "Huesca"],
    ["Miranda Comets", "Miranda"], ["Andorra Pilots", "Andorra"], ["Ferrol Royals", "Ferrol"], ["Almería Ravens", "Almería"],
    ["León Storm", "León"], ["Amorebieta Herons", "Amorebieta"], ["Lugo Royals", "Lugo"], ["Compostela Vipers", "Compostela"],
    ["Sabadell Pilots", "Sabadell"], ["Alicante Bison", "Alicante"], ["Alcorcón Comets", "Alcorcón"], ["Fuenlabrada Knights", "Fuenlabrada"],
    ["Logroño Pioneers", "Logroño"], ["Avilés Herons", "Avilés"],
  ]),
  ...row("esp-ll", [
    ["Madrid Royals", "Madrid R"], ["Barcelona Thunder", "Barcelona T"], ["Madrid Hawks", "Madrid H"], ["Bilbao Royals", "Bilbao"],
    ["San Sebastián Herons", "San Sebastián"], ["Villarreal Pilots", "Villarreal"], ["Seville Mariners", "Seville M"], ["Seville Stags", "Seville S"],
    ["Valencia Thunder", "Valencia T"], ["Girona Mariners", "Girona"], ["Pamplona Mariners", "Pamplona"], ["Vigo Phoenix", "Vigo"],
    ["Palma Royals", "Palma"], ["Getafe Vipers", "Getafe"], ["Vallecas Falcons", "Vallecas"], ["Vitoria Hawks", "Vitoria"],
    ["Barcelona Comets", "Barcelona C"], ["Leganés Falcons", "Leganés"], ["Las Palmas Stags", "Las Palmas"], ["Valladolid Knights", "Valladolid"],
  ]),

  ...row("ita-c", [
    ["Cesena Phoenix", "Cesena"], ["Vicenza Phoenix", "Vicenza"], ["Perugia Knights", "Perugia"], ["Crotone Vipers", "Crotone"],
    ["Catania Falcons", "Catania"], ["Bolzano Hawks", "Bolzano"], ["Ferrara Herons", "Ferrara"], ["Trieste Phoenix", "Trieste"],
    ["Padua Stags", "Padua"], ["Pescara Knights", "Pescara"], ["Chiavari Orbit", "Chiavari"], ["Gubbio Storm", "Gubbio"],
    ["Arezzo Vipers", "Arezzo"], ["Lucca Herons", "Lucca"], ["Crema Titans", "Crema"], ["Vercelli Thunder", "Vercelli"],
    ["Rimini Falcons", "Rimini"], ["Pontedera Pilots", "Pontedera"], ["Sassari Mariners", "Sassari"], ["Benevento Knights", "Benevento"],
  ]),
  ...row("ita-b", [
    ["Palermo Ravens", "Palermo"], ["Genoa Phoenix", "Genoa P"], ["Bari Falcons", "Bari"], ["Pisa Storm", "Pisa"],
    ["Cremona Orbit", "Cremona"], ["Brescia Royals", "Brescia"], ["Catanzaro Mavericks", "Catanzaro"], ["Spezia Mariners", "Spezia"],
    ["Modena Ravens", "Modena"], ["Reggio Emilia Vipers", "Reggio Emilia"], ["Mantua Mavericks", "Mantua"], ["Carrara Bison", "Carrara"],
    ["Frosinone Mariners", "Frosinone"], ["Salerno Pilots", "Salerno"], ["Cosenza Titans", "Cosenza"], ["Castellammare Bison", "Castellammare"],
    ["Cittadella Thunder", "Cittadella"], ["Sassuolo Royals", "Sassuolo"], ["Ascoli Titans", "Ascoli"], ["Terni Orbit", "Terni"],
  ]),
  ...row("ita-a", [
    ["Milan Mavericks", "Milan M"], ["Milan Titans", "Milan T"], ["Turin Titans", "Turin T"], ["Naples Sparks", "Naples"],
    ["Rome Meteors", "Rome M"], ["Bergamo Kestrels", "Bergamo"], ["Rome Sparks", "Rome S"], ["Florence Griffins", "Florence"],
    ["Bologna Vipers", "Bologna"], ["Turin Kestrels", "Turin K"], ["Como Kestrels", "Como"], ["Genoa Royals", "Genoa R"],
    ["Cagliari Orbit", "Cagliari"], ["Lecce Bison", "Lecce"], ["Udine Thunder", "Udine"], ["Verona Lynx", "Verona"],
    ["Monza Comets", "Monza"], ["Venice Thunder", "Venice"], ["Parma Bears", "Parma"], ["Empoli Griffins", "Empoli"],
  ]),

  ...row("ger-3", [
    ["Munich Bears", "Munich B"], ["Rostock Stags", "Rostock"], ["Saarbrücken Bears", "Saarbrücken"], ["Aue Vipers", "Aue"],
    ["Mannheim Bears", "Mannheim"], ["Wiesbaden Mariners", "Wiesbaden"], ["Ingolstadt Kestrels", "Ingolstadt"], ["Duisburg Orbit", "Duisburg"],
    ["Verl Royals", "Verl"], ["Essen Ravens", "Essen"], ["Osnabrück Knights", "Osnabrück"], ["Cottbus Sparks", "Cottbus"],
    ["Cologne Comets", "Cologne C"], ["Sandhausen Ravens", "Sandhausen"], ["Halle Comets", "Halle"], ["Lübeck Falcons", "Lübeck"],
    ["Aachen Hawks", "Aachen"], ["Unterhaching Titans", "Unterhaching"], ["Regensburg Vipers", "Regensburg"], ["Frankfurt Lynx", "Frankfurt L"],
  ]),
  ...row("ger-2", [
    ["Gelsenkirchen Sparks", "Gelsenkirchen"], ["Berlin Pilots", "Berlin P"], ["Kaiserslautern Hawks", "Kaiserslaute."], ["Düsseldorf Pioneers", "Düsseldorf"],
    ["Nürnberg Thunder", "Nürnberg"], ["Hannover Hawks", "Hannover"], ["Magdeburg Mavericks", "Magdeburg"], ["Elversberg Titans", "Elversberg"],
    ["Paderborn Griffins", "Paderborn"], ["Karlsruhe Royals", "Karlsruhe"], ["Darmstadt Sparks", "Darmstadt"], ["Fürth Herons", "Fürth"],
    ["Braunschweig Vipers", "Braunschweig"], ["Ulm Pilots", "Ulm"], ["Münster Comets", "Münster"], ["Dresden Lynx", "Dresden"],
    ["Bielefeld Lynx", "Bielefeld"], ["Bochum Mavericks", "Bochum"],
  ]),
  ...row("ger-bl", [
    ["Munich Mavericks", "Munich M"], ["Dortmund Stags", "Dortmund"], ["Leverkusen Mariners", "Leverkusen"], ["Leipzig Vipers", "Leipzig"],
    ["Frankfurt Stags", "Frankfurt S"], ["Stuttgart Meteors", "Stuttgart"], ["Freiburg Comets", "Freiburg"], ["Wolfsburg Ravens", "Wolfsburg"],
    ["Sinsheim Royals", "Sinsheim"], ["Mainz Titans", "Mainz"], ["Augsburg Storm", "Augsburg"], ["Bremen Sparks", "Bremen"],
    ["Berlin Mariners", "Berlin M"], ["Mönchengladbach Meteors", "Mönchengladb."], ["Hamburg Meteors", "Hamburg M"], ["Heidenheim Griffins", "Heidenheim"],
    ["Hamburg Phoenix", "Hamburg P"], ["Cologne Herons", "Cologne H"],
  ]),

  ...row("fra-nat", [
    ["Sochaux Knights", "Sochaux"], ["Valenciennes Kestrels", "Valenciennes"], ["Orléans Meteors", "Orléans"], ["Rouen Ravens", "Rouen R"],
    ["Versailles Kestrels", "Versailles"], ["Dijon Stags", "Dijon"], ["Villefranche Lynx", "Villefranche"], ["Le Mans Titans", "Le Mans"],
    ["Concarneau Stags", "Concarneau"], ["Châteauroux Thunder", "Châteauroux"], ["Nancy Bears", "Nancy"], ["Boulogne Vipers", "Boulogne"],
    ["Nîmes Comets", "Nîmes"], ["Aubagne Pioneers", "Aubagne"], ["Rouen Phoenix", "Rouen P"], ["Cholet Pilots", "Cholet"],
    ["Paris Bears", "Paris B"], ["Paris Kestrels", "Paris K"],
  ]),
  ...row("fra-l2", [
    ["Paris Stags", "Paris S"], ["Caen Phoenix", "Caen"], ["Grenoble Phoenix", "Grenoble"], ["Guingamp Storm", "Guingamp"],
    ["Amiens Meteors", "Amiens"], ["Bastia Mariners", "Bastia"], ["Rodez Royals", "Rodez"], ["Pau Thunder", "Pau"],
    ["Laval Hawks", "Laval"], ["Annecy Stags", "Annecy"], ["Troyes Vipers", "Troyes"], ["Dunkerque Storm", "Dunkerque"],
    ["Saint-Ouen Orbit", "Saint-Ouen"], ["Clermont Bears", "Clermont"], ["Ajaccio Sparks", "Ajaccio"], ["Martigues Mariners", "Martigues"],
    ["Lorient Falcons", "Lorient"], ["Montpellier Herons", "Montpellier"],
  ]),
  ...row("fra-l1", [
    ["Paris Orbit", "Paris O"], ["Marseille Hawks", "Marseille"], ["Lyon Ravens", "Lyon"], ["Monaco Bison", "Monaco"],
    ["Lille Titans", "Lille"], ["Nice Stags", "Nice"], ["Lens Bears", "Lens"], ["Rennes Knights", "Rennes"],
    ["Toulouse Mavericks", "Toulouse"], ["Strasbourg Mariners", "Strasbourg"], ["Reims Bears", "Reims"], ["Brest Phoenix", "Brest"],
    ["Nantes Knights", "Nantes"], ["Auxerre Royals", "Auxerre"], ["Angers Orbit", "Angers"], ["Le Havre Storm", "Le Havre"],
    ["Metz Pioneers", "Metz"], ["Saint-Étienne Titans", "Saint-Étienne"],
  ]),

  ...row("ned-eer", [
    ["Doetinchem Comets", "Doetinchem"], ["Volendam Sparks", "Volendam"], ["Venlo Lynx", "Venlo"], ["Leeuwarden Vipers", "Leeuwarden"],
    ["Kerkrade Titans", "Kerkrade"], ["Helmond Bison", "Helmond"], ["Den Bosch Griffins", "Den Bosch"], ["Emmen Titans", "Emmen"],
    ["Dordrecht Herons", "Dordrecht"], ["Eindhoven Griffins", "Eindhoven G"], ["Velsen Griffins", "Velsen"], ["Oss Sparks", "Oss"],
    ["Waalwijk Thunder", "Waalwijk"], ["The Hague Stags", "The Hague"], ["Arnhem Pilots", "Arnhem"], ["Maastricht Sparks", "Maastricht"],
    ["Amsterdam Sparks II", "Amsterdam II"], ["Eindhoven Pioneers II", "Eindhoven  II"], ["Alkmaar Phoenix II", "Alkmaar II"], ["Utrecht Royals II", "Utrecht II"],
  ]),
  ...row("ned-ere", [
    ["Amsterdam Sparks", "Amsterdam"], ["Eindhoven Pioneers", "Eindhoven P"], ["Rotterdam Orbit", "Rotterdam O"], ["Alkmaar Phoenix", "Alkmaar"],
    ["Enschede Titans", "Enschede"], ["Utrecht Royals", "Utrecht"], ["Heerenveen Griffins", "Heerenveen"], ["Rotterdam Falcons", "Rotterdam F"],
    ["Groningen Titans", "Groningen"], ["Nijmegen Storm", "Nijmegen"], ["Deventer Titans", "Deventer"], ["Sittard Storm", "Sittard"],
    ["Almelo Knights", "Almelo"], ["Zwolle Pioneers", "Zwolle"], ["Breda Hawks", "Breda"], ["Rotterdam Stags", "Rotterdam S"],
    ["Tilburg Bears", "Tilburg"], ["Almere Griffins", "Almere"],
  ]),

  ...row("por-l2", [
    ["Coimbra Vipers", "Coimbra"], ["Matosinhos Pilots", "Matosinhos"], ["Feira Royals", "Feira"], ["Penafiel Griffins", "Penafiel"],
    ["Chaves Ravens", "Chaves"], ["Mafra Ravens", "Mafra"], ["Funchal Herons", "Funchal H"], ["Paços Griffins", "Paços"],
    ["Tondela Pioneers", "Tondela"], ["Vizela Stags", "Vizela"], ["Oliveira Comets", "Oliveira"], ["Torres Vedras Stags", "Torres Vedras"],
    ["Porto Comets II", "Porto C II"], ["Lisbon Herons II", "Lisbon H II"], ["Leiria Stags", "Leiria"], ["Alverca Meteors", "Alverca"],
    ["Felgueiras Kestrels", "Felgueiras"], ["Lourosa Pilots", "Lourosa"],
  ]),
  ...row("por-lp", [
    ["Lisbon Herons", "Lisbon H"], ["Porto Comets", "Porto C"], ["Lisbon Kestrels", "Lisbon K"], ["Braga Sparks", "Braga"],
    ["Guimarães Phoenix", "Guimarães"], ["Famalicão Knights", "Famalicão"], ["Barcelos Pilots", "Barcelos"], ["Lisbon Mavericks", "Lisbon M"],
    ["Estoril Stags", "Estoril"], ["Vila do Conde Royals", "Vila do Conde"], ["Moreira Falcons", "Moreira"], ["Arouca Pilots", "Arouca"],
    ["Azores Bison", "Azores"], ["Amadora Bison", "Amadora"], ["Funchal Lynx", "Funchal L"], ["Faro Titans", "Faro"],
    ["Aves Bears", "Aves"], ["Porto Sparks", "Porto S"],
  ]),

  ...row("isr-leu", [
    ["Rishon LeZion Pioneers", "Rishon LeZion"], ["Ramat Gan Knights", "Ramat Gan"], ["Tel Aviv Vipers", "Tel Aviv V"], ["Acre Falcons", "Acre"],
    ["Jaffa Herons", "Jaffa"], ["Nof HaGalil Titans", "Nof HaGalil"], ["Kfar Saba Mavericks", "Kfar Saba"], ["Afula Thunder", "Afula"],
    ["Ra'anana Stags", "Ra'anana"], ["Kafr Qasim Thunder", "Kafr Qasim"], ["Herzliya Orbit", "Herzliya"], ["Hadera Pioneers", "Hadera"],
    ["Kiryat Shmona Phoenix", "Kiryat Shmona"], ["Ramat HaSharon Kestrels", "Ramat HaShar."], ["Umm al-Fahm Kestrels", "Umm al-Fahm"], ["Ashkelon Titans", "Ashkelon"],
  ]),
  ...row("isr-hal", [
    ["Tel Aviv Griffins", "Tel Aviv G"], ["Haifa Herons", "Haifa H"], ["Be'er Sheva Titans", "Be'er Sheva"], ["Jerusalem Bison", "Jerusalem B"],
    ["Tel Aviv Kestrels", "Tel Aviv K"], ["Netanya Bears", "Netanya"], ["Reineh Titans", "Reineh"], ["Haifa Comets", "Haifa C"],
    ["Jerusalem Mavericks", "Jerusalem M"], ["Sakhnin Kestrels", "Sakhnin"], ["Tiberias Bears", "Tiberias"], ["Ashdod Thunder", "Ashdod"],
    ["Petah Tikva Pilots", "Petah Tikva P"], ["Petah Tikva Bears", "Petah Tikva B"],
  ]),
];

export type Nation = {
  id: string;
  euros: boolean;
  copa: boolean;
  bar: number;
};

export const NATIONS: Nation[] = [
  { id: "eng", euros: true, copa: false, bar: 74 },
  { id: "esp", euros: true, copa: false, bar: 74 },
  { id: "ita", euros: true, copa: false, bar: 74 },
  { id: "ger", euros: true, copa: false, bar: 74 },
  { id: "fra", euros: true, copa: false, bar: 74 },
  { id: "ned", euros: true, copa: false, bar: 68 },
  { id: "por", euros: true, copa: false, bar: 68 },
  { id: "bel", euros: true, copa: false, bar: 72 },
  { id: "cro", euros: true, copa: false, bar: 70 },
  { id: "isr", euros: true, copa: false, bar: 60 },
  { id: "bra", euros: false, copa: true, bar: 76 },
  { id: "arg", euros: false, copa: true, bar: 76 },
  { id: "uru", euros: false, copa: true, bar: 70 },
  { id: "col", euros: false, copa: true, bar: 70 },
];

export function nationById(id: string): Nation {
  return NATIONS.find((item) => item.id === id) ?? NATIONS[0];
}

export function nationPool(kind: "friendly" | "euros" | "world-cup" | "copa", nationId: string): Nation[] {
  const pool = kind === "euros" ? NATIONS.filter((item) => item.euros) : kind === "copa" ? NATIONS.filter((item) => item.copa) : NATIONS;
  return pool.filter((item) => item.id !== nationId);
}

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
