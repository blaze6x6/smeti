// Pomožno orodje: izpiše surovo besedilo iz PDF koledarja (za razvoj/odpravljanje napak uvoza)
// Uporaba: node scripts/extract-pdf.mjs <pot-do-pdf>
import { extractText } from 'unpdf';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Podaj pot do PDF datoteke');
  process.exit(1);
}
const buf = readFileSync(file);
const { text } = await extractText(new Uint8Array(buf), { mergePages: false });
const pages = Array.isArray(text) ? text : [text];
pages.forEach((p, i) => {
  console.log(`\n========== STRAN ${i + 1} ==========`);
  console.log(p);
});
