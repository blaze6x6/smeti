import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';

function drawIcon(size, { maskable = false, rounded = true } = {}) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const pad = maskable ? size * 0.14 : 0;
  const s = size - pad * 2;
  // ozadje
  const r = rounded ? size * 0.22 : 0;
  const grd = ctx.createLinearGradient(0, 0, size, size);
  grd.addColorStop(0, '#123522');
  grd.addColorStop(1, '#0a1f14');
  ctx.fillStyle = grd;
  if (rounded) {
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, r);
    ctx.fill();
  } else { ctx.fillRect(0, 0, size, size); }
  // mreža pik 3 stolpce x 4 vrstice, prvi stolpec = odvozi
  const cols = 3, rows = 4;
  const gx = pad + s * 0.18, gy = pad + s * 0.16;
  const dx = s * 0.32, dy = s * 0.235;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const cx = gx + x * dx, cy = gy + y * dy;
      const rad = s * 0.085;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      if (x === 0) {
        ctx.fillStyle = y % 2 === 0 ? '#49b45a' : '#f2c516'; // izmenično mešani/embalaža
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
      }
      ctx.fill();
    }
  }
  return c.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', drawIcon(192));
writeFileSync('public/icons/icon-512.png', drawIcon(512));
writeFileSync('public/icons/maskable-192.png', drawIcon(192, { maskable: true, rounded: false }));
writeFileSync('public/icons/maskable-512.png', drawIcon(512, { maskable: true, rounded: false }));
writeFileSync('public/icons/apple-touch-icon.png', drawIcon(180, { rounded: false }));
console.log('ikone ustvarjene');
