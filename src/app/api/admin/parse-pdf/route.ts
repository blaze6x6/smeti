export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parseCalendarPdf } from '@/lib/pdf-import';
import { DEFAULT_VILLAGE, VILLAGES, buildVillageSchedule, getVillage, type WeekCell } from '@/lib/villages';

export const maxDuration = 120;

/** POST multipart/form-data: file (PDF), year (int) → predogled uvoženih dogodkov */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const yearHint = parseInt(String(form.get('year') || ''), 10) || null;
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Manjka PDF datoteka.' }, { status: 400 });
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const parsed = await parseCalendarPdf(buf, yearHint);
    const colorMap: Record<string, string> = {};
    for (const c of parsed.colors) {
      if (c === '#3ca849' || c === '#48a848') colorMap[c] = 'mesani';
      else if (c === '#efc01a' || c === '#f8e838') colorMap[c] = 'embalaza';
      else colorMap[c] = '';
    }
    const year = parsed.yearDetected || yearHint || new Date().getFullYear();
    const pad = (n: number) => String(n).padStart(2, '0');
    const cells: WeekCell[] = parsed.cells
      .map((c) => ({ date: `${year}-${pad(c.month)}-${pad(c.day)}`, col: c.col, type: colorMap[c.colorHex] ?? '' }))
      .filter((c) => c.type)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.col - b.col));
    const previewVillage = getVillage(String(form.get('kraj') || DEFAULT_VILLAGE));
    const events = buildVillageSchedule(cells, previewVillage);
    const perVillage = VILLAGES.map((v) => ({ id: v.id, name: v.name, count: buildVillageSchedule(cells, v).length }));
    return NextResponse.json({
      ok: true,
      method: parsed.method,
      yearDetected: parsed.yearDetected,
      year,
      colors: parsed.colors,
      colorMap,
      cellsCount: parsed.cells.length,
      cells,
      events,
      previewVillage: previewVillage.id,
      perVillage,
      filename: file.name,
    });
  } catch (e) {
    console.error('[parse-pdf]', e);
    return NextResponse.json(
      { ok: false, error: `Napaka pri uvozu PDF-ja: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }
}
