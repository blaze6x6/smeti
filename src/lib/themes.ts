// GENERIRANO z scripts/gen-themes.py — ne urejaj ročno.
export type ThemeMode = 'light' | 'dark';
export type ThemeInfo = { id: string; name: string; mode: ThemeMode; bg: string; card: string; accent: string; ink: string };

export const THEMES: ThemeInfo[] = [
  {
    "id": "limeta",
    "name": "Limeta",
    "mode": "light",
    "bg": "#faf7ef",
    "card": "#ffffff",
    "accent": "#aede26",
    "ink": "#12281d"
  },
  {
    "id": "gozd",
    "name": "Gozd",
    "mode": "light",
    "bg": "#f5f9f3",
    "card": "#fefefe",
    "accent": "#55f189",
    "ink": "#142419"
  },
  {
    "id": "nebo",
    "name": "Nebo",
    "mode": "light",
    "bg": "#f2f5fb",
    "card": "#fdfefe",
    "accent": "#559ef1",
    "ink": "#141b24"
  },
  {
    "id": "ocean",
    "name": "Ocean",
    "mode": "light",
    "bg": "#f3f8fa",
    "card": "#fefefe",
    "accent": "#55dff1",
    "ink": "#142324"
  },
  {
    "id": "lavanda",
    "name": "Lavanda",
    "mode": "light",
    "bg": "#f6f2fb",
    "card": "#fefdfe",
    "accent": "#9c5ff2",
    "ink": "#1b1424"
  },
  {
    "id": "roza",
    "name": "Roza",
    "mode": "light",
    "bg": "#fbf1f4",
    "card": "#fefdfe",
    "accent": "#f15596",
    "ink": "#24141b"
  },
  {
    "id": "koral",
    "name": "Koral",
    "mode": "light",
    "bg": "#fbf5f2",
    "card": "#fefefd",
    "accent": "#f16f55",
    "ink": "#241614"
  },
  {
    "id": "marelica",
    "name": "Marelica",
    "mode": "light",
    "bg": "#fbf7f1",
    "card": "#fefefd",
    "accent": "#f19e55",
    "ink": "#241b14"
  },
  {
    "id": "sonce",
    "name": "Sončnica",
    "mode": "light",
    "bg": "#fbfaf1",
    "card": "#fefefd",
    "accent": "#f1d255",
    "ink": "#242114"
  },
  {
    "id": "meta",
    "name": "Meta",
    "mode": "light",
    "bg": "#f3f9f6",
    "card": "#fefefe",
    "accent": "#55f1bd",
    "ink": "#14241f"
  },
  {
    "id": "breskev",
    "name": "Breskev",
    "mode": "light",
    "bg": "#fcf7f3",
    "card": "#fefefd",
    "accent": "#f18455",
    "ink": "#241914"
  },
  {
    "id": "jagoda",
    "name": "Jagoda",
    "mode": "light",
    "bg": "#faf2f3",
    "card": "#fefdfe",
    "accent": "#f1556f",
    "ink": "#241416"
  },
  {
    "id": "indigo",
    "name": "Indigo",
    "mode": "light",
    "bg": "#f3f3fa",
    "card": "#fefefe",
    "accent": "#6d6df3",
    "ink": "#141424"
  },
  {
    "id": "mah",
    "name": "Mah",
    "mode": "light",
    "bg": "#f7f9f3",
    "card": "#fefefe",
    "accent": "#96f155",
    "ink": "#1b2414"
  },
  {
    "id": "pesek",
    "name": "Pesek",
    "mode": "light",
    "bg": "#faf7f3",
    "card": "#fefefe",
    "accent": "#e3b063",
    "ink": "#241e14"
  },
  {
    "id": "skrilavec",
    "name": "Skrilavec",
    "mode": "light",
    "bg": "#f5f6f7",
    "card": "#fefefe",
    "accent": "#6c9ada",
    "ink": "#141b24"
  },
  {
    "id": "jadran",
    "name": "Jadran",
    "mode": "light",
    "bg": "#f2f8fb",
    "card": "#fdfefe",
    "accent": "#55caf1",
    "ink": "#142024"
  },
  {
    "id": "visnja",
    "name": "Češnja",
    "mode": "light",
    "bg": "#f9f3f5",
    "card": "#fefefe",
    "accent": "#e85e88",
    "ink": "#241419"
  },
  {
    "id": "turkiz",
    "name": "Turkiz",
    "mode": "light",
    "bg": "#f3faf9",
    "card": "#fefefe",
    "accent": "#55f1d7",
    "ink": "#142422"
  },
  {
    "id": "bela",
    "name": "Čista bela",
    "mode": "light",
    "bg": "#fbfbfc",
    "card": "#ffffff",
    "accent": "#5591f1",
    "ink": "#141a24"
  },
  {
    "id": "polnoc",
    "name": "Polnoč",
    "mode": "dark",
    "bg": "#0e131d",
    "card": "#141a29",
    "accent": "#5596f1",
    "ink": "#eaecf0"
  },
  {
    "id": "nocni-gozd",
    "name": "Nočni gozd",
    "mode": "dark",
    "bg": "#0d1913",
    "card": "#14241c",
    "accent": "#55f189",
    "ink": "#eaf0ed"
  },
  {
    "id": "vijolicna",
    "name": "Vijolična noč",
    "mode": "dark",
    "bg": "#150f1c",
    "card": "#1e1528",
    "accent": "#a65af2",
    "ink": "#edeaf0"
  },
  {
    "id": "grafit",
    "name": "Grafit",
    "mode": "dark",
    "bg": "#151719",
    "card": "#1d1f22",
    "accent": "#6ca3da",
    "ink": "#eaedf0"
  },
  {
    "id": "amoled",
    "name": "AMOLED",
    "mode": "dark",
    "bg": "#000000",
    "card": "#090909",
    "accent": "#b0f155",
    "ink": "#f0eaea"
  },
  {
    "id": "zar",
    "name": "Žar",
    "mode": "dark",
    "bg": "#1b0e0f",
    "card": "#261516",
    "accent": "#f16555",
    "ink": "#f0eaeb"
  },
  {
    "id": "jantar",
    "name": "Jantar",
    "mode": "dark",
    "bg": "#1b140e",
    "card": "#261d15",
    "accent": "#f1a355",
    "ink": "#f0edea"
  },
  {
    "id": "zlato",
    "name": "Zlato",
    "mode": "dark",
    "bg": "#18160e",
    "card": "#232015",
    "accent": "#f1d255",
    "ink": "#f0eeea"
  },
  {
    "id": "globina",
    "name": "Globina",
    "mode": "dark",
    "bg": "#0c161a",
    "card": "#122126",
    "accent": "#55f1f1",
    "ink": "#eaeef0"
  },
  {
    "id": "neon",
    "name": "Neon roza",
    "mode": "dark",
    "bg": "#1c0f18",
    "card": "#281522",
    "accent": "#f155a3",
    "ink": "#f0eaee"
  },
  {
    "id": "indigo-noc",
    "name": "Indigo noč",
    "mode": "dark",
    "bg": "#100f1f",
    "card": "#17152b",
    "accent": "#786df3",
    "ink": "#ebeaf0"
  },
  {
    "id": "mah-noc",
    "name": "Mah ob mraku",
    "mode": "dark",
    "bg": "#12170f",
    "card": "#1b2216",
    "accent": "#8ef155",
    "ink": "#edf0ea"
  },
  {
    "id": "kava",
    "name": "Kava",
    "mode": "dark",
    "bg": "#1b1510",
    "card": "#261d17",
    "accent": "#e39f63",
    "ink": "#f0edea"
  },
  {
    "id": "morje",
    "name": "Morje",
    "mode": "dark",
    "bg": "#0c161d",
    "card": "#121f29",
    "accent": "#55bdf1",
    "ink": "#eaeef0"
  },
  {
    "id": "meta-noc",
    "name": "Meta ob mraku",
    "mode": "dark",
    "bg": "#0d1916",
    "card": "#142420",
    "accent": "#55f1bd",
    "ink": "#eaf0ee"
  },
  {
    "id": "vino",
    "name": "Vino",
    "mode": "dark",
    "bg": "#1a0f12",
    "card": "#261519",
    "accent": "#f1557c",
    "ink": "#f0eaec"
  },
  {
    "id": "kiber",
    "name": "Kiber",
    "mode": "dark",
    "bg": "#0a0c17",
    "card": "#0f1324",
    "accent": "#55d7f1",
    "ink": "#eaebf0"
  },
  {
    "id": "orhideja",
    "name": "Orhideja",
    "mode": "dark",
    "bg": "#19101c",
    "card": "#231627",
    "accent": "#d255f1",
    "ink": "#eeeaf0"
  },
  {
    "id": "jeklo",
    "name": "Jeklo",
    "mode": "dark",
    "bg": "#16181d",
    "card": "#1e2127",
    "accent": "#688fdf",
    "ink": "#eaecf0"
  },
  {
    "id": "mrak",
    "name": "Mrak",
    "mode": "dark",
    "bg": "#110d19",
    "card": "#191424",
    "accent": "#8b68f3",
    "ink": "#eceaf0"
  }
];

export const DEFAULT_THEME = 'limeta';
export const DEFAULT_DARK_THEME = 'polnoc';
export const THEME_STORAGE_KEY = 'odvoz.tema';
