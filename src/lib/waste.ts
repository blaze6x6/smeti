/** Klasifikacija odpadkov (po JEKO Jesenice — občini Žirovnica in Jesenice). */

export type WasteTypeId =
  | 'mesani' | 'embalaza' | 'papir' | 'steklo' | 'bio'
  | 'kovine' | 'les' | 'tekstil' | 'olja' | 'nevarni'
  | 'eeo' | 'baterije' | 'kosovni' | 'zeleni';

export type WasteGroup = 'dom' | 'center' | 'otok';

export type WasteType = {
  id: WasteTypeId;
  label: string;
  short: string;
  color: string; // barva oznake v koledarju
  textOn: string; // barva besedila na oznaki
  deep: string; // temnejši odtenek za ikono/besedilo na svetli podlagi
  bin: string; // kam se odlaga
  group: WasteGroup; // dom = odvoz od vrat do vrat, center = zbirni center, otok = ekološki otok
  collected: boolean; // ali se pojavlja v koledarju odvoza
  desc: string;
  examples: string[];
  notExamples?: string[];
};

export const WASTE_TYPES: Record<WasteTypeId, WasteType> = {
  mesani: {
    id: 'mesani',
    label: 'Mešani komunalni odpadki',
    short: 'Mešani',
    color: '#3ca849', textOn: '#ffffff', deep: '#2b7f36',
    bin: 'zelen ali črn zabojnik',
    group: 'dom', collected: true,
    desc: 'Odpadki, ki jih ni mogoče ločeno zbirati in reciklirati. Odvoz od vrat do vrat po koledarju.',
    examples: [
      'ohlajen pepel', 'ostanki in ovojki žvečilk', 'čajne vrečke in filtri kave',
      'krpe in gobice za pomivanje', 'tkanine, usnje, šiviljski odpadki',
      'kosi stiropora', 'papirnati robčki in vata', 'plenice', 'CD plošče',
    ],
    notExamples: ['embalaža', 'steklo', 'nevarni odpadki', 'elektronika'],
  },
  embalaza: {
    id: 'embalaza',
    label: 'Odpadna embalaža',
    short: 'Embalaža',
    color: '#efc01a', textOn: '#231f20', deep: '#a07c07',
    bin: 'rumen zabojnik ali rumena vreča',
    group: 'dom', collected: true,
    desc: 'Embalaža iz plastike, kovin in sestavljenih materialov (tetrapak). Odvoz od vrat do vrat po koledarju.',
    examples: [
      'plastenke od pijač', 'plastenke od praškov, mehčalcev, kozmetike',
      'kovinski pokrovi kozarcev in zamaški', 'plastični kozarčki in lončki',
      'vrečke in folije', 'tetrapaki od mleka, sokov in omak',
      'pločevinke od pijač in konzerv',
    ],
    notExamples: ['embalaža z ostanki nevarnih snovi', 'stiropor', 'guma'],
  },
  papir: {
    id: 'papir',
    label: 'Papir in karton',
    short: 'Papir',
    color: '#4e8de0', textOn: '#ffffff', deep: '#2f69b8',
    bin: 'moder zabojnik na ekološkem otoku / zbirni center',
    group: 'otok', collected: false,
    desc: 'Oddaja na ekoloških otokih ali v zbirnem centru. Odpadki morajo biti suhi in zloženi.',
    examples: ['časopisi in revije', 'letaki in prospekti', 'pisarniški papir', 'karton in lepenka', 'papirnate vrečke', 'kartonska embalaža'],
    notExamples: ['tetrapak', 'povoščen in plastificiran papir', 'umazan ali masten papir'],
  },
  steklo: {
    id: 'steklo',
    label: 'Steklena embalaža',
    short: 'Steklo',
    color: '#35b3a2', textOn: '#0b2d29', deep: '#1f8577',
    bin: 'zelen zabojnik za steklo na ekološkem otoku',
    group: 'otok', collected: false,
    desc: 'Steklenice in kozarci brez pokrovčkov — oddaja na ekoloških otokih ali v zbirnem centru.',
    examples: ['steklenice pijač', 'kozarci vloženih živil', 'stekleni kozmetični lončki', 'steklena posoda'],
    notExamples: ['okensko in avtomobilsko steklo', 'ogledala', 'keramika in porcelan', 'žarnice'],
  },
  bio: {
    id: 'bio',
    label: 'Biološki odpadki',
    short: 'Bio',
    color: '#9a6b3f', textOn: '#ffffff', deep: '#7d5531',
    bin: 'rjav zabojnik ali domači kompostnik',
    group: 'center', collected: false,
    desc: 'V občini Žirovnica se biološki odpadki od vrat do vrat ne odvažajo — kompostiraj doma ali oddaj v zbirnem centru.',
    examples: ['ostanki sadja in zelenjave', 'kavna usedlina in čajne kaše', 'jajčne lupine', 'ostanki hrane rastlinskega izvora', 'listje in trava'],
    notExamples: ['tekoča olja', 'pepel', 'plenice', 'vrečke iz plastike'],
  },
  kovine: {
    id: 'kovine',
    label: 'Kovinski odpadki',
    short: 'Kovine',
    color: '#8b95a5', textOn: '#ffffff', deep: '#5c6676',
    bin: 'zbirni center',
    group: 'center', collected: false,
    desc: 'Kosi kovin, ki niso embalaža — brezplačna oddaja v zbirnem centru.',
    examples: ['kovinski profili in cevi', 'orodje', 'ponve in lonci', 'kovinski deli pohištva', 'žice in verige'],
    notExamples: ['pločevinke (sodijo med embalažo)', 'akumulatorji', 'avtomobilske karoserije'],
  },
  les: {
    id: 'les',
    label: 'Odpadni les',
    short: 'Les',
    color: '#b5813f', textOn: '#ffffff', deep: '#8c6229',
    bin: 'zbirni center',
    group: 'center', collected: false,
    desc: 'Nenevaren odpadni les brez premazov z nevarnimi snovmi.',
    examples: ['deske in letve', 'lesene palete', 'lesni ostanki obnove', 'leseni deli pohištva'],
    notExamples: ['impregniran les (železniški pragovi, drogovi)', 'iverne plošče z lepili (po dogovoru)'],
  },
  tekstil: {
    id: 'tekstil',
    label: 'Tekstil in obutev',
    short: 'Tekstil',
    color: '#d67ab1', textOn: '#2a1120', deep: '#a8578a',
    bin: 'ulični zabojnik za tekstil / zbirni center',
    group: 'otok', collected: false,
    desc: 'Uporaben tekstil oddaj v ulične zabojnike za tekstil, ostalo v zbirni center.',
    examples: ['oblačila', 'posteljnina in brisače', 'zavese', 'obutev v parih', 'torbe in pasovi'],
    notExamples: ['moker in plesniv tekstil', 'tekstil, onesnažen z oljem ali barvo'],
  },
  olja: {
    id: 'olja',
    label: 'Jedilna olja in maščobe',
    short: 'Olja',
    color: '#e0a93c', textOn: '#2a1c04', deep: '#9a6f05',
    bin: 'zbirni center (v zaprti posodi)',
    group: 'center', collected: false,
    desc: 'Odpadno jedilno olje zberi v zaprti plastenki in oddaj v zbirnem centru — nikoli ga ne zlivaj v odtok.',
    examples: ['olje po cvrtju', 'olje iz konzerv', 'ostanki masti in maščob'],
    notExamples: ['motorno in strojno olje (nevaren odpadek)'],
  },
  nevarni: {
    id: 'nevarni',
    label: 'Nevarni odpadki',
    short: 'Nevarni',
    color: '#df5e36', textOn: '#ffffff', deep: '#a03c20',
    bin: 'zbirni center ali akcija zbiranja (pomlad/jesen)',
    group: 'center', collected: false,
    desc: 'Odpadki, ki vsebujejo nevarne snovi. Oddaj jih v zbirnem centru ali ob vsakoletni akciji zbiranja nevarnih odpadkov.',
    examples: ['barve, laki, lepila, črnila in smole', 'topila in razredčila', 'motorno olje', 'pesticidi in škropiva', 'zdravila', 'detergenti z nevarnimi snovmi', 'embalaža z ostanki nevarnih snovi'],
    notExamples: ['prazna in očiščena embalaža'],
  },
  eeo: {
    id: 'eeo',
    label: 'Električna in elektronska oprema',
    short: 'Elektronika',
    color: '#5b8de8', textOn: '#ffffff', deep: '#2f5fb8',
    bin: 'zbirni center',
    group: 'center', collected: false,
    desc: 'Odslužene naprave oddaj cele (nerazstavljene) v zbirnem centru — brezplačno.',
    examples: ['hladilniki in zamrzovalniki', 'pralni in pomivalni stroji', 'televizorji in monitorji', 'računalniki in telefoni', 'mali gospodinjski aparati', 'sijalke in svetila'],
    notExamples: ['razstavljene naprave brez delov'],
  },
  baterije: {
    id: 'baterije',
    label: 'Baterije in akumulatorji',
    short: 'Baterije',
    color: '#7a6bd8', textOn: '#ffffff', deep: '#5346ad',
    bin: 'zbirni center ali zbiralniki v trgovinah',
    group: 'center', collected: false,
    desc: 'Nikoli med mešane odpadke — vsebujejo težke kovine.',
    examples: ['gospodinjske baterije', 'baterije iz naprav', 'avtomobilski akumulatorji', 'polnilne baterije'],
  },
  kosovni: {
    id: 'kosovni',
    label: 'Kosovni odpadki',
    short: 'Kosovni',
    color: '#8d7bd8', textOn: '#ffffff', deep: '#6354b5',
    bin: 'odvoz po naročilu (dopisnica) ali zbirni center',
    group: 'center', collected: false,
    desc: 'Vsakemu gospodinjstvu pripada ena dopisnica na leto oziroma skupno 4 m³ kosovnih odpadkov. Odvoz naročiš pri JEKO.',
    examples: ['kosi pohištva', 'gospodinjski stroji', 'umivalniki in kadi', 'kolesa', 'preproge in vzmetnice'],
    notExamples: ['gradbeni odpadki', 'nevarni odpadki', 'avtomobilske karoserije', 'zeleni odrez'],
  },
  zeleni: {
    id: 'zeleni',
    label: 'Zeleni odrez',
    short: 'Zeleni odrez',
    color: '#64a83c', textOn: '#ffffff', deep: '#47792a',
    bin: 'zbirni center',
    group: 'center', collected: false,
    desc: 'Vejevje in ostanki z vrta — oddaja v zbirnem centru ali kompostiranje doma.',
    examples: ['veje in vejevje', 'pokošena trava', 'listje', 'odrezki žive meje', 'plevel'],
    notExamples: ['zemlja in kamenje', 'korenine z zemljo', 'panji'],
  },
};

/** Frakcije, ki se pojavljajo v koledarju odvoza (od vrat do vrat). */
export const COLLECTED_TYPES: WasteTypeId[] = (Object.keys(WASTE_TYPES) as WasteTypeId[]).filter(
  (id) => WASTE_TYPES[id].collected,
);

export const WASTE_GROUP_LABEL: Record<WasteGroup, string> = {
  dom: 'Odvoz na domu',
  center: 'Zbirni center',
  otok: 'Ekološki otok',
};

export function wasteLabel(id: string): string {
  return (WASTE_TYPES as Record<string, WasteType>)[id]?.label ?? id;
}
export function wasteColor(id: string): string {
  return (WASTE_TYPES as Record<string, WasteType>)[id]?.color ?? '#94a3b8';
}
export function wasteTextOn(id: string): string {
  return (WASTE_TYPES as Record<string, WasteType>)[id]?.textOn ?? '#ffffff';
}
export function wasteShort(id: string): string {
  return (WASTE_TYPES as Record<string, WasteType>)[id]?.short ?? id;
}
export function wasteDeep(id: string): string {
  return (WASTE_TYPES as Record<string, WasteType>)[id]?.deep ?? '#55705f';
}
