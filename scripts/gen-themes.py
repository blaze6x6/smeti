#!/usr/bin/env python3
"""
Generira barvne teme (20 svetlih + 20 temnih):
  src/app/themes.css   — uvozi ga globals.css
  public/themes.css    — za samostojne strani (potrditev, odjava, offline)
  src/lib/themes.ts    — seznam tem za izbirnik

Vsaka tema je podana z nekaj parametri (odtenek podlage/poudarka); vse ostale barve
se izpeljejo, kontrasti (WCAG) pa se preverijo in po potrebi popravijo.
Zagon:  python3 scripts/gen-themes.py
"""
import colorsys, json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def hx(h, s, l):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, max(0, min(1, l)), max(0, min(1, s)))
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))


def lum(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def cr(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def fit(h, s, l, bgs, ratio, step):
    """Premika svetlost, dokler besedilo ne doseže kontrasta na vseh podlagah."""
    for _ in range(80):
        c = hx(h, s, l)
        if all(cr(c, b) >= ratio for b in bgs):
            return c
        l += step
        if l <= 0.01 or l >= 0.99:
            break
    return hx(h, s, max(0.0, min(1.0, l)))


ORIGINAL = {  # izvirna paleta aplikacije (borovec + limeta) za privzeto temo
    'paper-50': '#faf7ef', 'paper-100': '#f4efe0', 'paper-200': '#eae2cb', 'paper-300': '#ddd2b2', 'card': '#ffffff',
    'ink': '#12281d', 'ink-soft': '#55705f', 'ink-faint': '#93a699', 'heading': '#0b281a',
    'on-accent': '#0b281a', 'btn': '#0b281a', 'btn-hover': '#123a27', 'btn-text': '#ffffff',
    'pine-100': '#e3f6e8', 'pine-200': '#c9ecd2', 'pine-300': '#9ad6ab', 'pine-400': '#63b97e', 'pine-500': '#3fa05c',
    'pine-600': '#2f7a4c', 'pine-700': '#1e5c3b', 'pine-800': '#18482f',
    'lime-100': '#f2fbce', 'lime-200': '#e2f59b', 'lime-300': '#c9ec5c', 'lime-400': '#aede26', 'lime-500': '#8fc012', 'lime-600': '#6f9a0f',
    'amber-100': '#fbf0be', 'amber-400': '#f2c516', 'amber-500': '#dfa80b', 'amber-600': '#bd8d08', 'amber-700': '#9a6f05', 'amber-900': '#5c4203',
    'coral-100': '#fce2d5', 'coral-500': '#df5e36', 'coral-600': '#c24e2b', 'coral-700': '#a03c20',
}


def build(t):
    if t['id'] == 'limeta':
        return dict(ORIGINAL)
    dark = t['mode'] == 'dark'
    ha, hs, hb = t['ha'], t.get('hs', 45), t['hb']
    sa = t.get('sa', 0.85)
    sb = t.get('sb', 0.3)
    v = {}
    if dark:
        Lb = t.get('Lb', 0.08)
        v['paper-50'] = hx(hb, sb, Lb)
        v['card'] = hx(hb, sb, Lb + 0.035)
        v['paper-100'] = hx(hb, sb, Lb + 0.065)
        v['paper-200'] = hx(hb, sb, Lb + 0.12)
        v['paper-300'] = hx(hb, sb, Lb + 0.19)
        surf = [v['card'], v['paper-50'], v['paper-100']]
        v['ink'] = hx(hb, 0.15, 0.93)
        v['ink-soft'] = fit(hb, 0.12, 0.70, surf, 4.6, 0.02)
        v['ink-faint'] = fit(hb, 0.10, 0.50, [v['card']], 3.0, 0.02)
        v['heading'] = hx(ha, 0.3, 0.97)
        v['pine-100'] = hx(ha, 0.35, Lb + 0.075)
        v['pine-200'] = hx(ha, 0.35, Lb + 0.14)
        v['pine-300'] = hx(ha, 0.35, Lb + 0.23)
        v['pine-400'] = hx(ha, 0.45, 0.45)
        v['pine-500'] = hx(ha, 0.5, 0.58)
        ps = surf + [v['pine-100'], v['pine-200']]
        v['pine-600'] = fit(ha, 0.55, 0.62, ps, 4.5, 0.02)
        v['pine-700'] = fit(ha, 0.55, 0.68, ps, 5.5, 0.02)
        v['pine-800'] = fit(ha, 0.55, 0.74, ps, 6.5, 0.02)
        v['lime-100'] = hx(ha, 0.4, Lb + 0.075)
        v['lime-200'] = hx(ha, 0.4, Lb + 0.15)
        v['lime-300'] = hx(ha, sa, 0.72)
        v['lime-400'] = hx(ha, sa, 0.64)
        v['lime-500'] = hx(ha, sa, 0.54)
        v['lime-600'] = fit(ha, sa * 0.8, 0.62, surf + [v['lime-100']], 4.5, 0.02)
        v['amber-100'] = hx(hs, 0.45, Lb + 0.075)
        v['amber-400'] = hx(hs, 0.9, 0.64)
        v['amber-500'] = hx(hs, 0.85, 0.56)
        v['amber-600'] = hx(hs, 0.8, 0.5)
        ab = [v['amber-100'], v['card']]
        v['amber-700'] = fit(hs, 0.85, 0.66, ab, 4.5, 0.02)
        v['amber-900'] = fit(hs, 0.85, 0.74, ab, 6.5, 0.02)
        v['coral-100'] = hx(12, 0.45, Lb + 0.075)
        v['coral-500'] = hx(12, 0.75, 0.6)
        v['coral-600'] = hx(12, 0.7, 0.66)
        v['coral-700'] = fit(12, 0.8, 0.7, [v['coral-100'], v['card']], 4.5, 0.02)
        v['on-accent'] = hx(ha, 0.5, 0.07)
        oa = v['on-accent']

        def brighten(h, s_, l):
            for _ in range(60):
                c = hx(h, s_, l)
                if cr(c, oa) >= 4.8:
                    return c
                l += 0.01
            return hx(h, s_, l)
        v['lime-300'] = brighten(ha, sa, 0.72)
        v['lime-400'] = brighten(ha, sa, 0.64)
        v['amber-400'] = brighten(hs, 0.9, 0.64)
        v['btn'] = v['lime-400']
        v['btn-hover'] = v['lime-300']
        v['btn-text'] = v['on-accent']
    else:
        Lb = t.get('Lb', 0.965)
        v['paper-50'] = hx(hb, sb, Lb)
        v['paper-100'] = hx(hb, sb, Lb - 0.035)
        v['paper-200'] = hx(hb, sb, Lb - 0.095)
        v['paper-300'] = hx(hb, sb, Lb - 0.175)
        v['card'] = t.get('card') or hx(hb, sb * 0.4, 0.995)
        surf = [v['card'], v['paper-50'], v['paper-100']]
        v['ink'] = hx(ha, 0.3, 0.11)
        v['ink-soft'] = fit(ha, 0.18, 0.42, surf, 4.6, -0.02)
        v['ink-faint'] = fit(ha, 0.1, 0.66, [v['card']], 3.0, -0.02)
        v['heading'] = hx(ha, 0.45, 0.10)
        v['pine-100'] = hx(ha, 0.45, 0.95)
        v['pine-200'] = hx(ha, 0.4, 0.89)
        v['pine-300'] = hx(ha, 0.35, 0.78)
        v['pine-400'] = hx(ha, 0.4, 0.62)
        v['pine-500'] = hx(ha, 0.45, 0.46)
        ps = surf + [v['pine-100'], v['pine-200']]
        v['pine-600'] = fit(ha, 0.5, 0.40, ps, 4.5, -0.02)
        v['pine-700'] = fit(ha, 0.5, 0.33, ps, 5.5, -0.02)
        v['pine-800'] = fit(ha, 0.5, 0.26, ps, 6.5, -0.02)
        oa = hx(ha, 0.5, 0.07)
        v['on-accent'] = oa
        v['lime-100'] = hx(ha, 0.8, 0.945)
        v['lime-200'] = hx(ha, 0.8, 0.87)
        # svetli poudarki morajo imeti s temnim besedilom kontrast >= 4.8
        def bright(h, s, l):
            for _ in range(60):
                c = hx(h, s, l)
                if cr(c, oa) >= 4.8:
                    return c
                l += 0.01
            return hx(h, s, l)
        v['lime-300'] = bright(ha, sa, 0.74)
        v['lime-400'] = bright(ha, sa, 0.64)
        v['lime-500'] = hx(ha, sa, 0.50)
        v['lime-600'] = fit(ha, sa * 0.85, 0.40, surf + [v['lime-100']], 4.5, -0.02)
        v['amber-100'] = hx(hs, 0.9, 0.90)
        v['amber-400'] = bright(hs, 0.9, 0.60)
        v['amber-500'] = hx(hs, 0.9, 0.48)
        v['amber-600'] = hx(hs, 0.9, 0.40)
        ab = [v['amber-100'], v['card']]
        v['amber-700'] = fit(hs, 0.9, 0.33, ab, 4.5, -0.02)
        v['amber-900'] = fit(hs, 0.9, 0.22, ab, 7.0, -0.02)
        v['coral-100'] = hx(12, 0.85, 0.93)
        v['coral-500'] = hx(12, 0.7, 0.52)
        v['coral-600'] = hx(12, 0.7, 0.45)
        v['coral-700'] = fit(12, 0.75, 0.38, [v['coral-100'], v['card']], 4.5, -0.02)
        v['btn'] = hx(ha, 0.5, 0.14)
        v['btn-hover'] = hx(ha, 0.5, 0.21)
        v['btn-text'] = '#ffffff'
    return v


# id, ime, način, odtenek poudarka, odtenek podlage, [sat. podlage], [sat. poudarka], [odtenek sekundarne], [Lb]
LIGHT = [
    ('limeta', 'Limeta', 75, 43, dict(sb=0.45, hs=45)),
    ('gozd', 'Gozd', 140, 100, dict(sb=0.3, hs=48)),
    ('nebo', 'Nebo', 212, 215, dict(sb=0.5, hs=40)),
    ('ocean', 'Ocean', 187, 190, dict(sb=0.4, hs=35)),
    ('lavanda', 'Lavanda', 265, 270, dict(sb=0.5, hs=42)),
    ('roza', 'Roza', 335, 340, dict(sb=0.55, hs=38)),
    ('koral', 'Koral', 10, 20, dict(sb=0.5, hs=40)),
    ('marelica', 'Marelica', 28, 35, dict(sb=0.55, hs=45)),
    ('sonce', 'Sončnica', 48, 50, dict(sb=0.6, hs=28)),
    ('meta', 'Meta', 160, 150, dict(sb=0.35, hs=45)),
    ('breskev', 'Breskev', 18, 28, dict(sb=0.6, hs=40, Lb=0.97)),
    ('jagoda', 'Jagoda', 350, 355, dict(sb=0.45, hs=40)),
    ('indigo', 'Indigo', 240, 235, dict(sb=0.4, hs=45)),
    ('mah', 'Mah', 95, 85, dict(sb=0.3, hs=48)),
    ('pesek', 'Pesek', 36, 40, dict(sb=0.4, hs=25, sa=0.7)),
    ('skrilavec', 'Skrilavec', 215, 215, dict(sb=0.12, hs=40, sa=0.6)),
    ('jadran', 'Jadran', 195, 200, dict(sb=0.5, hs=30)),
    ('visnja', 'Češnja', 342, 345, dict(sb=0.3, hs=35, sa=0.75)),
    ('turkiz', 'Turkiz', 170, 175, dict(sb=0.4, hs=40)),
    ('bela', 'Čista bela', 217, 220, dict(sb=0.1, hs=40, Lb=0.985, card='#ffffff')),
]
DARK = [
    ('polnoc', 'Polnoč', 215, 222, dict(sb=0.35, hs=40, Lb=0.085)),
    ('nocni-gozd', 'Nočni gozd', 140, 150, dict(sb=0.3, hs=48, Lb=0.075)),
    ('vijolicna', 'Vijolična noč', 270, 268, dict(sb=0.3, hs=40, Lb=0.085)),
    ('grafit', 'Grafit', 210, 215, dict(sb=0.08, hs=40, sa=0.6, Lb=0.09)),
    ('amoled', 'AMOLED', 85, 0, dict(sb=0.0, hs=45, Lb=0.0)),
    ('zar', 'Žar', 6, 355, dict(sb=0.3, hs=35, Lb=0.08)),
    ('jantar', 'Jantar', 30, 28, dict(sb=0.3, hs=45, Lb=0.08)),
    ('zlato', 'Zlato', 48, 45, dict(sb=0.25, hs=30, Lb=0.075)),
    ('globina', 'Globina', 180, 195, dict(sb=0.35, hs=40, Lb=0.075)),
    ('neon', 'Neon roza', 330, 320, dict(sb=0.3, hs=45, Lb=0.085)),
    ('indigo-noc', 'Indigo noč', 245, 245, dict(sb=0.35, hs=45, Lb=0.09)),
    ('mah-noc', 'Mah ob mraku', 98, 95, dict(sb=0.22, hs=48, Lb=0.075)),
    ('kava', 'Kava', 28, 25, dict(sb=0.25, hs=40, sa=0.7, Lb=0.085)),
    ('morje', 'Morje', 200, 205, dict(sb=0.4, hs=40, Lb=0.08)),
    ('meta-noc', 'Meta ob mraku', 160, 165, dict(sb=0.3, hs=45, Lb=0.075)),
    ('vino', 'Vino', 345, 345, dict(sb=0.28, hs=35, Lb=0.08)),
    ('kiber', 'Kiber', 190, 230, dict(sb=0.4, hs=320, Lb=0.065)),
    ('orhideja', 'Orhideja', 288, 285, dict(sb=0.28, hs=42, Lb=0.085)),
    ('jeklo', 'Jeklo', 220, 220, dict(sb=0.14, hs=40, sa=0.65, Lb=0.1)),
    ('mrak', 'Mrak', 255, 258, dict(sb=0.3, hs=45, Lb=0.075)),
]

themes = []
for mode, lst in (('light', LIGHT), ('dark', DARK)):
    for tid, name, ha, hb, kw in lst:
        t = dict(id=tid, name=name, mode=mode, ha=ha, hb=hb, **kw)
        themes.append((t, build(t)))

ORDER = ['paper-50', 'paper-100', 'paper-200', 'paper-300', 'card', 'ink', 'ink-soft', 'ink-faint', 'heading',
         'on-accent', 'btn', 'btn-hover', 'btn-text',
         'pine-100', 'pine-200', 'pine-300', 'pine-400', 'pine-500', 'pine-600', 'pine-700', 'pine-800',
         'lime-100', 'lime-200', 'lime-300', 'lime-400', 'lime-500', 'lime-600',
         'amber-100', 'amber-400', 'amber-500', 'amber-600', 'amber-700', 'amber-900',
         'coral-100', 'coral-500', 'coral-600', 'coral-700']

css = ['/* GENERIRANO z scripts/gen-themes.py — ne urejaj ročno. */']
for i, (t, v) in enumerate(themes):
    sel = f'html[data-theme="{t["id"]}"]'
    if t['id'] == 'limeta':
        sel = ':root,' + sel
    body = ''.join(f'--color-{k}:{v[k]};' for k in ORDER)
    css.append(f'{sel}{{color-scheme:{t["mode"]};{body}}}')
out = '\n'.join(css) + '\n'
open(os.path.join(ROOT, 'src/app/themes.css'), 'w').write(out)
open(os.path.join(ROOT, 'public/themes.css'), 'w').write(out)

meta = [dict(id=t['id'], name=t['name'], mode=t['mode'], bg=v['paper-50'], card=v['card'], accent=v['lime-400'], ink=v['ink']) for t, v in themes]
ts = '// GENERIRANO z scripts/gen-themes.py — ne urejaj ročno.\n'
ts += "export type ThemeMode = 'light' | 'dark';\n"
ts += 'export type ThemeInfo = { id: string; name: string; mode: ThemeMode; bg: string; card: string; accent: string; ink: string };\n\n'
ts += 'export const THEMES: ThemeInfo[] = ' + json.dumps(meta, ensure_ascii=False, indent=2) + ';\n\n'
ts += "export const DEFAULT_THEME = 'limeta';\nexport const DEFAULT_DARK_THEME = 'polnoc';\n"
ts += "export const THEME_STORAGE_KEY = 'odvoz.tema';\n"
open(os.path.join(ROOT, 'src/lib/themes.ts'), 'w').write(ts)

# poročilo o kontrastih
bad = 0
pairs = [('ink', 'card'), ('ink', 'paper-50'), ('ink-soft', 'card'), ('ink-soft', 'paper-100'), ('ink-faint', 'card'),
         ('heading', 'card'), ('pine-600', 'card'), ('pine-700', 'pine-100'), ('pine-800', 'paper-100'), ('lime-600', 'card'),
         ('lime-600', 'lime-100'), ('amber-700', 'amber-100'), ('amber-900', 'amber-100'), ('coral-700', 'coral-100'),
         ('coral-700', 'card'), ('on-accent', 'lime-300'), ('on-accent', 'lime-400'), ('on-accent', 'amber-400'),
         ('btn-text', 'btn'), ('btn-text', 'btn-hover'), ('pine-700', 'pine-200')]
mins = {'ink-faint': 3.0}
for t, v in themes:
    if t['id'] == 'limeta':
        continue  # izvirna paleta, ne preverjamo
    for a, b in pairs:
        need = mins.get(a, 4.5)
        r = cr(v[a], v[b])
        if r < need:
            bad += 1
            print(f'  ! {t["id"]}: {a} na {b} = {r:.2f} (< {need})')
print(f'{len(themes)} tem, {os.path.getsize(os.path.join(ROOT, "src/app/themes.css"))//1024} KB CSS, {bad} kontrastnih opozoril')
