/** Duotonske ikone za vrste odpadkov (enoten slog, 24×24, currentColor). */

type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const solid = { fill: 'currentColor', fillOpacity: 0.16 };

/** Mešani komunalni odpadki — koš za smeti */
export function IconMesani({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M6 8h12l-.9 11.6A2.4 2.4 0 0 1 14.7 22H9.3a2.4 2.4 0 0 1-2.4-2.4L6 8Z" />
      <path d="M4.2 8h15.6" />
      <path {...solid} d="M10 4.2h4a1 1 0 0 1 1 1V8H9V5.2a1 1 0 0 1 1-1Z" />
      <path d="M10.3 11.7v6.2M13.7 11.7v6.2" />
    </svg>
  );
}

/** Odpadna embalaža — plastenka s pokrovčkom */
export function IconEmbalaza({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M10 2.2h4v2.2h-4z" />
      <path
        {...solid}
        d="M10 4.4h4v1.4l1.3 1.6c.5.6.7 1.3.7 2.1v8.7A2.6 2.6 0 0 1 13.4 21h-2.8A2.6 2.6 0 0 1 8 18.2V9.5c0-.8.2-1.5.7-2.1L10 5.8V4.4Z"
      />
      <path d="M8.1 12.6h7.8M8.1 15.2h7.8" />
    </svg>
  );
}

/** Biološki odpadki — jabolko z listom */
export function IconBio({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path
        {...solid}
        d="M12 8c-.9-1.7-2.7-2.4-4.1-1.5C6.3 7.4 5.7 9.8 6.5 12.5c.8 2.6 2.3 5.5 3.7 6.3.9.5 1.3.2 1.8.2s.9.3 1.8-.2c1.4-.8 2.9-3.7 3.7-6.3.8-2.7.2-5.1-1.4-6c-1.4-.9-3.2-.2-4.1 1.5Z"
      />
      <path d="M12 8V5" />
      <path {...solid} d="M12.3 5.3c.2-1.5 1.6-2.6 3.1-2.5.2 1.5-.9 2.8-2.4 3.1" />
    </svg>
  );
}

/** Papir in karton — časopis */
export function IconPapir({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M4 5.6h10.4a1.8 1.8 0 0 1 1.8 1.8v12.8H5.8A1.8 1.8 0 0 1 4 18.4V5.6Z" />
      <path d="M16.2 9.2h2.6a1.8 1.8 0 0 1 1.8 1.8v7.4a1.8 1.8 0 0 1-1.8 1.8h-2.6" />
      <path d="M6.9 9.2h6.4M6.9 12.3h6.4M6.9 15.4h4.2" />
    </svg>
  );
}

/** Steklo — steklenica in kozarec */
export function IconSteklo({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path
        {...solid}
        d="M8.3 2.6h2.8v2.9c0 .5.1.9.4 1.3l.7 1c.4.5.6 1.1.6 1.7v9.9a2.1 2.1 0 0 1-2.1 2.1H9.1A2.1 2.1 0 0 1 7 19.4V9.5c0-.6.2-1.2.6-1.7l.7-1c.3-.4.4-.8.4-1.3V2.6Z"
      />
      <path d="M7.2 11.8h5.4" />
      <path {...solid} d="M15.1 9.6h5.6l-.6 9.9a2 2 0 0 1-2 1.9h-.4a2 2 0 0 1-2-1.9l-.6-9.9Z" />
      <path d="M14.8 9.6h6.2" />
    </svg>
  );
}

/** Kosovni odpadki — fotelj */
export function IconKosovni({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M6.6 14V8.8a2.4 2.4 0 0 1 2.4-2.4h6a2.4 2.4 0 0 1 2.4 2.4V14" />
      <path
        {...solid}
        d="M2.6 14.6a2 2 0 0 1 4 0v2.2h10.8v-2.2a2 2 0 1 1 4 0V19a1.4 1.4 0 0 1-1.4 1.4H4a1.4 1.4 0 0 1-1.4-1.4v-4.4Z"
      />
      <path d="M5.8 20.4V22M18.2 20.4V22" />
    </svg>
  );
}


/** Kovine — ključ in matica */
export function IconKovine({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M14.8 2.9a4.6 4.6 0 0 0-4 7l-7 7a1.6 1.6 0 0 0 0 2.3l1 1a1.6 1.6 0 0 0 2.3 0l7-7a4.6 4.6 0 0 0 5.6-6.7l-2.5 2.5-2.2-2.2 2.5-2.5a4.6 4.6 0 0 0-2.7-1.4Z" />
    </svg>
  );
}

/** Les — hlod z branikami */
export function IconLes({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M7.5 4.5h9a3.5 3.5 0 0 1 0 7h-9a3.5 3.5 0 0 1 0-7Z" />
      <path d="M7.5 4.5a3.5 3.5 0 0 0 0 7" />
      <path {...solid} d="M7.5 12.5h9a3.5 3.5 0 0 1 0 7h-9a3.5 3.5 0 0 1 0-7Z" />
      <path d="M7.5 12.5a3.5 3.5 0 0 0 0 7M6 8h.01M6 16h.01" />
    </svg>
  );
}

/** Tekstil — majica */
export function IconTekstil({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M9 3.2 6 4.6 3.4 7.4l2.2 2.3 1.6-1.3v9.9c0 .9.7 1.5 1.5 1.5h6.6c.8 0 1.5-.6 1.5-1.5V8.4l1.6 1.3 2.2-2.3L18 4.6l-3-1.4a3 3 0 0 1-6 0Z" />
    </svg>
  );
}

/** Jedilna olja — steklenica s kapljico */
export function IconOlja({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M10 2.6h4" />
      <path {...solid} d="M10.4 2.6h3.2v3l2.1 2.6c.5.6.8 1.4.8 2.2v8a2.3 2.3 0 0 1-2.3 2.3H9.8A2.3 2.3 0 0 1 7.5 18.4v-8c0-.8.3-1.6.8-2.2l2.1-2.6v-3Z" />
      <path d="M12 11.8c-.9 1.2-1.6 2.1-1.6 3a1.6 1.6 0 1 0 3.2 0c0-.9-.7-1.8-1.6-3Z" />
    </svg>
  );
}

/** Nevarni odpadki — opozorilni trikotnik */
export function IconNevarni({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M10.6 3.4 2.9 17.1a1.6 1.6 0 0 0 1.4 2.4h15.4a1.6 1.6 0 0 0 1.4-2.4L13.4 3.4a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9v4.2M12 16.3h.01" />
    </svg>
  );
}

/** Elektronika — monitor z vtičem */
export function IconEeo({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M3.4 4.6h17.2a1 1 0 0 1 1 1v9.2a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1Z" />
      <path d="M8.6 19.6h6.8M12 15.8v3.8" />
      <path d="M9.2 8.1v2.4a2.8 2.8 0 0 0 5.6 0V8.1" />
    </svg>
  );
}

/** Baterije */
export function IconBaterije({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path {...solid} d="M3.4 7.6h13.2a1.4 1.4 0 0 1 1.4 1.4v6a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 15V9a1.4 1.4 0 0 1 1.4-1.4Z" />
      <path d="M20.4 10.6v2.8M9.2 9.6 7.4 12.4h3L8.6 15" />
      <path d="M9.4 4.6h4.6" />
    </svg>
  );
}

/** Zeleni odrez — vejica z listi */
export function IconZeleni({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21.4V9.6" />
      <path {...solid} d="M12 13.4c-3 0-5.4-2-5.4-5.4C9.6 8 12 10 12 13.4Z" />
      <path {...solid} d="M12 11c0-3.2 2.4-5.6 5.6-5.6C17.6 8.6 15.2 11 12 11Z" />
      <path d="M8.4 21.4h7.2" />
    </svg>
  );
}

export const WASTE_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  mesani: IconMesani,
  embalaza: IconEmbalaza,
  bio: IconBio,
  papir: IconPapir,
  steklo: IconSteklo,
  kosovni: IconKosovni,
  kovine: IconKovine,
  les: IconLes,
  tekstil: IconTekstil,
  olja: IconOlja,
  nevarni: IconNevarni,
  eeo: IconEeo,
  baterije: IconBaterije,
  zeleni: IconZeleni,
};

export function WasteIcon({ id, className }: { id: string; className?: string }) {
  const Cmp = WASTE_ICONS[id] ?? IconMesani;
  return <Cmp className={className} />;
}
